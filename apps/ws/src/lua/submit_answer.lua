-- Lua script for atomic answer grading and scoring in QuizMaster Turbo
-- KEYS:
--   KEYS[1]: state key (e.g. room:{roomId}:state or state:{roomId})
--   KEYS[2]: scores key (e.g. room:{roomId}:scores or scores:{roomId})
--   KEYS[3]: answers key (e.g. room:{roomId}:answers:{qIndex} or answers:{roomId}:{qIndex})
--   KEYS[4]: meta key (e.g. room:{roomId}:answers_meta:{qIndex} or meta:{roomId}:{qIndex})
--
-- ARGV:
--   ARGV[1]: userId (string)
--   ARGV[2]: submittedAnswer (string)
--   ARGV[3]: correctAnswer (string)
--   ARGV[4]: timeTaken (number / string in ms)
--   ARGV[5]: correctPoints (+4)
--   ARGV[6]: incorrectPoints (-1)
--   ARGV[7]: expectedQuestionIndex (number / string)

local stateKey = KEYS[1]
local scoresKey = KEYS[2]
local answersKey = KEYS[3]
local metaKey = KEYS[4]

local userId = ARGV[1]
local submittedAnswer = ARGV[2]
local correctAnswer = ARGV[3]
local timeTaken = ARGV[4]
local correctPoints = tonumber(ARGV[5]) or 4
local incorrectPoints = tonumber(ARGV[6]) or -1
local expectedQIndex = ARGV[7]

-- 1. Check if room exists and state is PLAYING
local status = redis.call('HGET', stateKey, 'status')
if not status or status ~= 'PLAYING' then
    return cjson.encode({ error = 'NOT_PLAYING', message = 'Game is not in PLAYING state' })
end

-- 2. Verify current question index if provided
if expectedQIndex and expectedQIndex ~= '' then
    local currentQIndex = redis.call('HGET', stateKey, 'currentQuestionIndex')
    if currentQIndex and tostring(currentQIndex) ~= tostring(expectedQIndex) then
        return cjson.encode({ error = 'QUESTION_CLOSED', message = 'Question has already concluded' })
    end
end

-- 3. Check if user already submitted answer for this question
local alreadyAnswered = redis.call('HEXISTS', answersKey, userId)
if alreadyAnswered == 1 then
    return cjson.encode({ error = 'ALREADY_ANSWERED', message = 'Answer already submitted for this question' })
end

-- 4. Grade the submitted answer
local isCorrect = (submittedAnswer == correctAnswer)
local pointsToAdd = isCorrect and correctPoints or incorrectPoints

-- 5. Atomic score update and answer persistence
redis.call('HINCRBY', scoresKey, userId, pointsToAdd)
redis.call('HSET', answersKey, userId, submittedAnswer)
if metaKey and metaKey ~= '' then
    redis.call('HSET', metaKey, userId, tostring(timeTaken))
end

-- 6. Retrieve new score
local newScore = redis.call('HGET', scoresKey, userId)

return cjson.encode({
    success = true,
    isCorrect = isCorrect,
    correctAnswer = correctAnswer,
    points = pointsToAdd,
    newScore = tonumber(newScore) or 0
})
