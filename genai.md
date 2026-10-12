# GenAI Engineering Roadmap (Build-First Edition)

A focused, project-driven path from zero to job-ready AI engineer. Every phase ends with something **deployed and public**. Evals and observability are not an afterthought: they run through every phase.

**Total time:** \~16 weeks at 10-15 hrs/week. **Rule:** if a topic doesn't help you ship that phase's project, park it.

---

## How to use this roadmap

1. **Raw SDK first, framework second.** Learn concepts with the provider SDK (OpenAI / Anthropic / Gemini) before touching LangChain or LangGraph. Frameworks change fast; concepts don't.
2. **Ship every phase.** A deployed URL, a README with architecture diagram, and an eval report per project.
3. **Eval-first habit.** Before you improve anything, write 20-50 test cases. No eval, no claim of improvement.
4. **Keep a build log.** One short post or README section per phase: what broke, what you changed, what the numbers said.
5. **Use current models.** Check provider docs for the latest model names and pricing; never hardcode model names in your notes. Make the model a config value.

---

## Roadmap at a glance

| Phase | Weeks | Theme | Deployed project |
| :-- | :-- | :-- | :-- |
| 0 | 1 | Foundations + raw SDK | CLI chatbot with streaming |
| 1 | 2 | Prompting, structured outputs, first evals | Structured extraction API |
| 2 | 3-5 | RAG done properly | Cited document Q&A (with eval report) |
| 3 | 6-8 | Tools, agents, context engineering | Research / task agent |
| 4 | 9-11 | LangGraph and multi-agent | Supervisor-style multi-agent app |
| 5 | 12-13 | MCP | Custom MCP server |
| 6 | 14-16 | Production, security, capstone | Full-stack AI SaaS |
| Optional | any | Voice / realtime, local models, fine-tuning | Pick one |

---

## Phase 0: Foundations and Raw SDK (Week 1)

**Goal:** Understand what an LLM call actually is, with no framework in the way.

### Learn

- Generative vs. discriminative models. Transformer intuition: tokens, attention, decoder-only models, pre-training vs. post-training (SFT, RLHF/preference tuning).
- Provider landscape: proprietary APIs (OpenAI, Anthropic, Google) and open-weights (Llama, Qwen, Mistral, DeepSeek) via Hugging Face and Ollama.
- Environment: Python 3.11+, `uv` or `poetry`, `.env` secrets, git hygiene (never commit keys), Jupyter + VS Code.
- The raw request/response cycle: messages array, roles, stop reasons, usage metadata, errors, retries with backoff, timeouts.

### Build: CLI chatbot (raw SDK)

- Multi-turn conversation with in-memory history.
- Token streaming to terminal.
- Provider switch via config (one thin adapter, two providers).
- Print token usage and estimated cost after every turn.

**Done when:** you can explain every field in a request and response without looking it up.

---

## Phase 1: Prompting, Structured Outputs and First Evals (Week 2)

**Goal:** Get reliable, parseable, measurable output.

### Learn

- Prompting: clear instructions, role and context, delimiters, few-shot examples, step-by-step reasoning, when reasoning/thinking models make manual chain-of-thought unnecessary.
- Sampling: `temperature`, `top_p`, `max_tokens`, stop sequences. Know that some reasoning models restrict these.
- Tokens and cost: tokenization, context windows, input vs. output pricing, prompt caching basics.
- Structured outputs: JSON schema / Pydantic-validated responses, retries on validation failure.
- **Eval basics:** golden test set, exact-match and schema checks, LLM-as-judge with a rubric, and why you must spot-check the judge itself.

### Build: Structured extraction API

- Input: messy text (emails, invoices, resumes). Output: validated JSON.
- FastAPI endpoint, 30+ test cases, a script that prints accuracy per field.
- Compare two prompt versions using the eval script, not vibes.

**Done when:** you can show a prompt change that measurably improved a score.

---

## Phase 2: RAG Done Properly (Weeks 3-5)

**Goal:** Ground answers in private data, and prove it works.

### Learn

- **Ingestion:** parsing PDFs/HTML/Markdown (tables and scanned docs are where pipelines break), cleaning, metadata.
- **Chunking:** fixed, recursive, structure-aware, semantic; overlap tradeoffs; parent-child chunks.
- **Embeddings:** how to choose a model, dimensions, cosine vs. dot product, multilingual considerations.
- **Vector stores:** pgvector (default choice if you already use Postgres), Qdrant, Chroma for prototypes; FAISS as a library.
- **Retrieval quality:** hybrid search (BM25 + dense), metadata filtering, query rewriting, multi-query, reranking (cross-encoder or hosted reranker), contextual retrieval.
- **Generation:** citations with source IDs, "I don't know" behavior, handling conflicting sources, prompt-injection risk in retrieved text.
- **Evaluation:** separate **retrieval** metrics (recall@k, MRR, hit rate) from **generation** metrics (faithfulness, answer relevance, context precision). Tools: Ragas, TruLens, or your own LLM-as-judge.
- Introduce **LangChain** here only as an optional convenience (loaders, splitters). Know how to do it without it.

### Build: Cited document Q&A

- Ingest at least 50 real pages across mixed formats.
- Hybrid retrieval + reranker, answers with clickable citations.
- A 50-question eval set with a written report: baseline vs. each improvement (chunking, hybrid, rerank) with numbers.
- Deploy with a simple web UI.

**Done when:** your README has a table showing retrieval and faithfulness scores improving across versions.

---

## Phase 3: Tools, Agents and Context Engineering (Weeks 6-8)

**Goal:** Build agents that act, recover from errors, and stay within budget.

### Learn

- **Tool calling:** JSON-schema tool definitions, parallel tool calls, tool result handling, validation and error messages the model can act on.
- **Agent loop from scratch:** build the loop yourself (model, tool call, observation, repeat) with max-step limits and stop conditions.
- **Patterns:** ReAct, plan-then-execute, reflection, router, evaluator-optimizer. Know when a plain workflow beats an agent (usually).
- **Context engineering:** what goes into the window and when. System prompt design, just-in-time retrieval, summarizing old turns, scratchpad/notes files, tool-output trimming, pruning irrelevant tool definitions, prompt caching layout (stable prefix first).
- **Memory:** short-term (thread state) vs. long-term (stored facts, retrieval). Memory writes need rules, otherwise you store junk.
- **Tool ecosystem:** web search APIs, code execution in a sandbox (never raw `exec` on your server), SQL tools with read-only credentials.
- **Agent evals:** task success rate, tool-call accuracy, step count, cost per task, trajectory review. Build a regression set of 20+ tasks and run it on every change.

### Build: Research / task agent

- Web search + page reading + calculation + report writing.
- Hard limits: max steps, max cost per run, timeout.
- Trace every run (see Phase 6 tooling, start with simple JSON logs now).
- Eval report: success rate on your task set, average cost and latency.

**Done when:** you can show failure cases from traces and the fix you made for each.

---

## Phase 4: LangGraph and Multi-Agent Systems (Weeks 9-11)

**Goal:** Orchestrate stateful, long-running, human-supervised workflows.

### Learn

- **LangGraph core:** `StateGraph`, nodes, edges, conditional routing, state reducers, subgraphs.
- **Persistence:** checkpointers (SQLite, Postgres), threads, resuming after failure.
- **Human-in-the-loop:** interrupts, approval steps, editing state, time travel/replay for debugging.
- **Multi-agent patterns:** supervisor, handoffs/swarm, hierarchical teams. Honest rule: start single-agent, split only when context or tool overload forces it.
- **Durability and reliability:** idempotent tools, retries, timeouts, dead-letter handling, background execution.
- **Compare:** at least skim one alternative (OpenAI Agents SDK, Claude Agent SDK, Pydantic AI) so you're not locked into one mental model.

### Build: Multi-agent app with approvals

- Example: support-ticket or sales-ops assistant with a supervisor, 2-3 specialist agents, and a human approval step before any external action.
- Checkpointed state, resumable runs, a regression eval set.
- Compare single-agent vs. multi-agent on the same eval set and report which won and why.

**Done when:** a run can be paused for approval, the server restarted, and the run resumed.

---

## Phase 5: Model Context Protocol (Weeks 12-13)

**Goal:** Expose and consume tools through the open standard.

### Learn

- Architecture: host, client, server. Primitives: **tools, resources, prompts**. Transports: stdio, streamable HTTP.
- Building servers with FastMCP (Python) or the TypeScript SDK.
- **Auth:** OAuth-based authorization for remote servers, scoped permissions, least privilege.
- **Security:** tool poisoning and prompt injection through tool descriptions/results, confirmation for destructive actions, input validation, audit logs.
- Connecting to Claude Desktop, IDE clients, and your own agent from Phase 3 or 4.

### Build: Custom MCP server

- Wrap a real system (Postgres, a SaaS API, or your docs) with 4-6 well-described tools, 1-2 resources, and a prompt template.
- Remote deployment with auth, plus a test suite using an MCP client.
- Write tool descriptions as if for a new teammate; test that an agent picks the right tool from them.

**Done when:** a stranger can connect to your hosted server from their client using your README.

---

## Phase 6: Production, Security and Capstone (Weeks 14-16)

**Goal:** Make it fast, observable, safe, and affordable. Then ship one real product.

### Learn

- **Observability:** tracing with Langfuse, LangSmith, or Arize Phoenix; OpenTelemetry; logging prompts, tool calls, latency, tokens, cost per user.
- **Evals in CI:** run your regression set on every PR; fail the build on score drops; online evals and user feedback loops.
- **Performance:** streaming UX, prompt caching, semantic caching (use carefully), batch APIs for offline work, model routing (small model for easy tasks, large for hard ones), parallel tool calls.
- **Cost control:** per-user budgets, rate limits, usage dashboards, graceful fallback between providers.
- **Security and safety:** prompt injection (direct and indirect), data exfiltration paths, PII redaction, output validation, sandboxing, secrets management, tenant isolation, abuse monitoring. Reference the OWASP Top 10 for LLM Applications.
- **Backend and frontend:** FastAPI or Hono, SSE/WebSocket streaming, auth, background jobs/queues (Celery, BullMQ), Next.js + Vercel AI SDK, stop-generation, markdown/code/citation rendering.
- **Deployment:** Docker, a managed platform (Render, Railway, Fly.io) or cloud (AWS/GCP), env management, health checks, rollbacks.

### Build: Capstone AI SaaS (pick one)

- Code-review assistant for pull requests, **or**
- Knowledge assistant for a team (RAG + tools + MCP), **or**
- Domain agent for a real client or niche you can actually reach.

**Requirements:** auth and multi-tenancy, streaming UI, tracing dashboard, eval suite in CI, per-user token budget, PII handling, a public demo, a 3-minute walkthrough video, and a short write-up on cost per request and latency (p50/p95).

**Done when:** someone other than you has used it and you have their feedback.

---

## Optional Tracks (pick one after Phase 4)

### A. Voice and realtime agents

- Pipeline: STT, LLM, TTS vs. speech-to-speech models. Transport via WebRTC/WebSocket; telephony via SIP/Twilio.
- Latency budget (target under \~800ms end-to-end), interruption/barge-in handling, turn detection, VAD.
- Frameworks: Pipecat, LiveKit Agents.
- Build: a phone agent with a tool call (booking, lookup) and a latency report.

### B. Local models and serving

- Ollama and LM Studio for dev; vLLM or llama.cpp for serving. Quantization (GGUF, AWQ, GPTQ), VRAM math, throughput vs. latency.
- Build: swap a local model into your Phase 2 RAG app and compare quality, cost, and speed on your eval set.

### C. Fine-tuning

- Decision rule: try prompting, then RAG, then fine-tuning. Fine-tune for style, format, or narrow behavior, not for adding knowledge.
- SFT and LoRA/QLoRA with `transformers`, `peft`, `trl`; dataset curation and synthetic data; evaluate against your baseline.
- Build: fine-tune a small model for one narrow task and beat a prompted baseline on your eval set, or honestly report that it didn't.

---

## Core CS and Engineering Skills (run in parallel)

- Async Python (`asyncio`), typing, Pydantic, testing with `pytest`.
- SQL and Postgres fundamentals; Redis for caching/queues.
- HTTP, streaming, webhooks, idempotency, rate limiting.
- Reading logs and traces to debug non-deterministic systems.
- Writing: clear READMEs, architecture diagrams, and decision notes.

---

## Milestone Checklist

| # | Milestone | Proof |
| :-- | :-- | :-- |
| 1 | Raw SDK chatbot with streaming and cost display | Repo + demo GIF |
| 2 | Structured extraction API with eval script | Eval table in README |
| 3 | Cited RAG app with retrieval and faithfulness scores | Deployed URL + report |
| 4 | Tool-using agent with traces and regression set | Trace screenshots + success rate |
| 5 | Multi-agent app with approvals and persistence | Resume-after-restart demo |
| 6 | Hosted MCP server with auth | Public README + client test |
| 7 | Capstone SaaS with CI evals, tracing, budgets | Live product + write-up |

---

## Portfolio and Job-Readiness

- **Pin 5 repos:** RAG app, agent, multi-agent app, MCP server, capstone. Each has a diagram, an eval table, a demo link, and a "what I'd improve" section.
- **Be ready to explain:** why you chose a chunk size, why hybrid search, how you caught a regression, what your agent costs per task, how you defend against prompt injection.
- **Interview themes:** RAG failure modes, agent loop design, context management, eval design, latency/cost tradeoffs, security.
- **Stay current:** read provider changelogs monthly, re-run your eval set when a new model ships, and note what changed. That habit is itself a differentiator.

---

## Quick Rules to Avoid Tutorial Hell

1. One project at a time; don't start the next phase until the current one is deployed.
2. If a video or course has no project output, cap it at 2 hours.
3. Rebuild something from scratch once without the framework.
4. Measure before you optimize; write the test before the tweak.
5. Ship ugly, then improve.
