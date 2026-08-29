# QuizMaster Turbo — WS Engine: Build-It-Yourself Guide

> Purpose of this file: not a spec to copy-paste, but a guide to actually **understand** why `apps/ws` is built the way it is — so you can write it yourself, explain it in your viva, and recognize *why* each piece exists instead of just knowing *that* it exists.

---

## 1. The problem, in plain words

You have a live quiz game. Many players are connected over WebSocket at once. The server has to:

1. Know what question is currently active, for how much longer, and what the correct answer is.
2. Grade answers as they come in — fast, and without letting two answers corrupt each other's scoring.
3. Move the game forward automatically — question → reveal → next question — without anyone clicking a button.
4. Not lose all of this if the server process restarts (crash, deploy, whatever).

Every design decision in this system is an answer to one of those four things. If you can explain *which* problem a piece of code solves, you understand the architecture — you don't need to memorize the code.

---

## 2. The core insight: memory is temporary, Redis is not

This is the single most important idea in the whole system.

Your Node process has variables in memory — `let currentQuestion = 0`, a `setTimeout` handle, whatever. That's fast, but it **evaporates** the moment the process restarts. Redis, on the other hand, survives a restart (it's a separate process/service).

So the rule you build everything else around is:

> **Anything that must survive a restart lives in Redis. Anything that's just "how do I get from now to the next event" can live in memory, as long as you can *rebuild* it from Redis after a restart.**

That single rule explains:
- why `currentQuestionIndex`, `questionStartTime`, `status` are all Redis hash fields, not JS variables
- why the timer itself (`setTimeout`) can still live in memory — because on restart, you don't need the *old* timer, you need to **compute a new one** from what's in Redis

Keep this in your head. Everything below is just this idea, applied to a specific piece.

---

## 3. The four building blocks — what each one owns

Don't think of these as "classes you must write." Think of them as **four separate jobs**, and each class is just "whoever owns that job."

### 3.1 RedisManager — owns the connection

Job: be the only thing in the codebase that talks to Redis directly, and load the one Lua script this app needs.

Why a singleton: if every file created its own `new Redis(...)`, you'd leak connections and have no single place to say "did the Lua script load OK." One class, one connection, one `getInstance()`.

### 3.2 SocketServer — owns who's allowed to connect, and how events reach the game

Job: accept WebSocket connections, verify a JWT before trusting `socket.data.userId`, and hand each connected socket off to its event handlers.

Why auth lives *here* and not per-handler: if you checked the JWT inside every individual event handler, you'd eventually forget one, and that's an unauthenticated hole. Doing it once in `io.use(...)` middleware means **every** connection is checked before a single event handler runs. This is the same reasoning as "check auth at the front door, not at every room."

### 3.3 GameEngine — owns the actual game loop

This is the one with real logic in it, so it deserves the most attention. Job: know what phase every room is in, and move it to the next phase at the right time.

Its two building blocks are `setTimeout` (I'll do this next, in N seconds) and a Redis read/write per phase (I need to remember what phase I'm in). It never trusts memory alone for "what phase is this room in" — it always writes that to Redis *before* scheduling the next timer. That's what makes recovery possible later (§6).

### 3.4 QueueManager — owns exactly one job: telling the DB worker "this game is done"

Job: at the very end of a game, fire a single job so a separate process (`apps/worker`) can persist the final result to Postgres.

Why this is **not** used for the game loop itself: BullMQ is built for "a job needs to run, possibly on any available worker, possibly retried." That's overkill for "the next question starts in 15 seconds on *this same process*" — you don't need a distributed job queue to schedule something on yourself. You only need BullMQ for the one thing that genuinely must survive even if this WS process disappears forever: telling the DB the game happened. That's a one-time handoff, not a repeating schedule.

---

## 4. The state machine — walk it in your own words, not code

Before writing a single line, be able to say this out loud:

```
LOBBY        players are joining, nothing is timed yet
  |  host clicks "let's start"
STARTING     a 5s countdown, purely cosmetic, gives players time to look at the screen
  |  countdown ends
PLAYING      one question is live, players can answer, a 15s clock is running
  |  15s timer fires  (or... the recovery routine decides it should have already fired)
BREAK        reveal correct answer + leaderboard, a 5s pause
  |  5s timer fires
PLAYING      (next question)   -- repeats until questions run out
  |  no questions left
FINISHED     final leaderboard shown, one job dispatched to persist it, then Redis keys expire
```

Every arrow above is a `setTimeout` firing and calling the next function. That's the entire "engine" — there's no clever scheduler, it's just each phase calling the next phase after a delay.

**Write this state machine as a comment at the top of your `GameEngine.ts` before you write any method.** If you can't describe a phase transition in one sentence, you don't understand it well enough to code it yet.

---

## 5. The hardest part: grading answers without a race condition

This is the part most people get wrong the first time, so build your understanding of it slowly.

### 5.1 What goes wrong with the naive approach

Imagine you wrote grading like this (don't — this is the broken version):

```
1. Check: has this user already answered? (read from Redis)
2. If no: is the answer correct? add points (write to Redis)
```

Now imagine **two** requests from the same fast-clicking player, or a client retry, arrive almost simultaneously. Both requests do step 1 *before either has finished step 2*. Both see "not answered yet" — because neither has written the answer yet. Both then proceed to add points. The player gets double-scored.

This isn't a hypothetical — it's a normal outcome of two separate network round-trips racing each other. **Any time you do "check, then act" as two separate Redis calls, you have this bug.**

### 5.2 Why Lua fixes it

A Lua script sent to Redis with `EVALSHA` runs as **one atomic unit** — Redis will not run any other command while your script executes. So "check if already answered, then write the answer" happens as a single indivisible step. There's no gap for a second request to sneak in between the check and the write, because there *is* no gap — it's all one round trip to Redis.

This is the one and only reason Lua exists in this system. It's not "Lua is fancy," it's "grading requires an atomic check-then-write, and Lua is how you get that from Redis."

### 5.3 Why the question index matters too

Second bug this fixes: what if a player's answer arrives *after* the question already ended (network lag, slow client)? Without checking, you'd grade an answer against a question that's no longer active — scoring it correct or incorrect for the *wrong* round. The fix: pass the question index the client believes is active as an argument, and have the Lua script compare it against Redis's `currentQuestionIndex`. If they don't match, reject with `QUESTION_ALREADY_CLOSED`. This is "pinning" the submission to the exact round it was meant for.

**Build order for this part:** write the naive (broken) JS version first, intentionally, and try to break it with two rapid submissions from a test script. Watching it actually double-score is worth more than reading about it — then replace it with the Lua version and watch the bug disappear.

---

## 6. The second hardest part: surviving a restart

### 6.1 Why this is a real problem

`setTimeout` handles live in process memory. If you `kill` the Node process (or it crashes, or you deploy a new version), every scheduled timer is gone. Any room that was mid-question is now frozen — nobody's coming to fire that timer, ever, until a human notices and restarts the game manually.

### 6.2 The fix: don't try to save the timer — rebuild it

You cannot serialize a `setTimeout` handle and restore it. So don't try. Instead, make sure Redis always has enough information to **recompute** "how much time is left," and rebuild the timer fresh at boot.

That's why `advanceToQuestion` writes `questionStartTime` to Redis *before* arming the 15s timer. At boot, `recoverActiveRooms()` does this:

```
for every room whose status is PLAYING or BREAK:
    if PLAYING:
        elapsed = now - questionStartTime      (both are just numbers, no special recovery magic)
        remaining = 15s - elapsed
        if remaining <= 0: the question should already have ended — conclude it right now
        else: setTimeout(remaining, concludeQuestion)   -- a NEW timer, correctly shortened
    if BREAK:
        we didn't persist exactly when BREAK started, so just give it a fresh 5s window
        (a few extra seconds of "reveal" screen is harmless — nobody notices)
```

Notice this only works because `questionStartTime` was **always** being written to Redis, even before you cared about recovery. That's the pattern: persist the *inputs* to a calculation, not the calculation's *output* (a timer object can't be persisted; the timestamp it was derived from can).

### 6.3 Why this must run before `httpServer.listen()`

If you accept traffic before recovery runs, a player could reconnect to a room that *looks* alive in Redis but has no timer armed yet — it would sit frozen until recovery happens to get to it. Running recovery first means: by the time anyone can connect, every in-flight room already has its timer re-armed.

**Build order for this part:** get the game loop working first without ever testing a restart. Once one full game runs end-to-end, *then* deliberately kill the process mid-question and try to make it recover. That's the real test — not just "does it run," but "does it survive being killed."

---

## 7. Suggested build order, from an empty folder

Build in this order — each step is independently testable before you move to the next, so you're never debugging two new things at once.

1. **RedisManager only.** Connect, confirm `redis-cli ping` works from your app, load a trivial Lua script (even `return 1`) just to prove `loadLuaScripts()` works.
2. **A hardcoded single-room game loop, in memory only, no Redis state.** Just prove `setTimeout` chaining works: LOBBY → PLAYING → BREAK → PLAYING → ... → FINISHED, logged to console, no sockets yet. This is where you build your intuition for the state machine before adding any networking complexity.
3. **Move that state into Redis.** Same loop, but `status`/`currentQuestionIndex`/`questionStartTime` now live in a Redis hash instead of local variables. Nothing user-facing changes yet — you're just relocating the source of truth.
4. **Add Socket.IO, no auth yet.** Get `lobby:join`, `lobby:letsstart`, `game:questionStart` flowing to a real client (or your test script). Prove the loop is visible over the wire.
5. **Add the naive (broken) answer submission**, and prove to yourself it double-scores under rapid submission — see §5.1. This step is optional but genuinely useful for understanding *why* the next step matters.
6. **Replace it with the Lua script.** Confirm the race is gone; confirm a stale-question submission gets rejected.
7. **Add `recoverActiveRooms()`.** Kill the process mid-question, restart it, confirm the game keeps going. This is the step that makes the "single server" design decision actually hold up — don't skip testing it.
8. **Add JWT auth middleware.** Only now, once the game itself works, lock down who can connect.
9. **Add the ZSET leaderboard, rate limiting, disconnect handling, and the BullMQ persistence job** — these are all independent of each other and of the core loop, so add them in whatever order suits you.

---

## 8. Redis key schema — quick reference

| Key | Type | What it remembers |
|---|---|---|
| `room:{id}:state` | HASH | phase, current question index, when the current question started, total question count |
| `room:{id}:questions` | LIST | the question data itself, one JSON blob per question |
| `room:{id}:scores` | ZSET | userId → score, always sorted, no app-side sorting needed |
| `room:{id}:answers:{qIdx}` | HASH | who has already answered *this specific question* (this is what the Lua script checks for duplicates) |
| `room:{id}:question:{qIdx}:order` | STRING | the shuffled option order, cached so a reconnecting player sees the same order, not a re-shuffle |
| `room:{id}:start_lock` | STRING, 15s TTL | only exists to stop a double-click on "let's start" — nothing more |

If you're ever unsure why a piece of state is in Redis, ask: "would losing this on restart break something?" If yes, it belongs here.

---

## 9. Viva-ready one-liners

Keep these in your back pocket — each answers a "why did you do X" question in one breath.

- **"Why Lua and not just JS?"** — Because grading needs an atomic check-then-write, and Lua scripts run as one indivisible unit inside Redis; two separate Redis calls from JS leave a race-condition gap in between.
- **"Why setTimeout and not a job queue?"** — Because this runs on a single server; a job queue solves "which of several workers should run this," which isn't a problem I have. I only need to survive *my own* restart, which a boot-time recovery routine does more simply.
- **"What happens if the server crashes mid-question?"** — The timer is lost, but `questionStartTime` was already in Redis. On restart, before accepting traffic, I recompute the remaining time from that timestamp and re-arm a fresh timer for exactly what's left.
- **"Why is BullMQ still in the picture at all?"** — For exactly one thing: telling a separate worker process that a game finished, so it can persist to Postgres. That's a one-time fire-and-forget handoff, not a repeating schedule, so it doesn't carry the complexity of a full job-scheduled game loop.
- **"What's the one thing that would break if you added a second server?"** — Two things, actually: Socket.IO broadcasts become per-process (a player on node 2 won't see events from node 1, needs the Redis adapter), and recovery only protects the node that owns the crashed timer (a *different* node has no way to know that room needs reviving — that's what BullMQ delayed jobs would solve instead).

---

## 10. What to actually build first, tomorrow

If you're staring at an empty repo and not sure where to start: do step 2 from §7 today. No Redis, no sockets, just a `setTimeout` chain logging phase transitions to your console. Get that feeling of "oh, it just calls the next function after a delay" in your hands before anything else gets added on top. Everything else in this document is that same idea, with one new concern layered in at a time.