# Practice Selection Algorithm Documentation

## Overview
This document describes the algorithm for selecting questions when a user starts a practice session. The algorithm ensures variety, appropriate difficulty, avoids recent repeats, and provides a balanced learning experience.

---

## Goals

1. **Relevance** - Select questions matching user's level and context (lesson/module)
2. **Variety** - Mix question types and topics within a session
3. **Freshness** - Avoid showing recently seen questions
4. **Progressive Difficulty** - Balance easy/medium/hard questions
5. **Performance** - Fast query execution for mobile responsiveness
6. **Fairness** - Questions with low usage get priority

---

## Input Parameters

```javascript
{
  userId: string,              // Current user
  sessionType: string,         // mcq | multi_select | fill_blanks | match | arrange | pronunciation | speaking | mixed
  lessonId?: string,           // Filter by lesson (null = global pool)
  moduleId?: string,           // Filter by module (null = all modules)
  difficulty?: string,         // easy | medium | hard (null = auto-match user level)
  questionCount: number,       // Default: 10, Max: 20
  tags?: string[],             // Filter by tags (e.g., ["grammar", "past_tense"])
  excludeRecentHours?: number  // Don't show questions seen in last N hours (default: 24)
}
```

---

## Algorithm Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. BUILD FILTER CRITERIA                                    │
│     - User level                                             │
│     - Session type                                           │
│     - Lesson/Module context                                  │
│     - Tags                                                   │
│     - Difficulty                                             │
│     - Published status                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. GET RECENT QUESTION IDs (Last 24 hours)                  │
│     - Query question_attempts for this user                  │
│     - Extract questionIds to exclude                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. QUERY AVAILABLE QUESTIONS                                │
│     - Apply all filters                                      │
│     - Exclude recent questions                               │
│     - Sort by: usageCount ASC, random                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CHECK SUFFICIENT QUESTIONS                               │
│     - Need at least `questionCount` questions                │
│     - If insufficient, relax constraints:                    │
│       a) Remove difficulty filter                            │
│       b) Remove recent exclusion                             │
│       c) Expand to adjacent levels                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. SELECT & BALANCE QUESTIONS                               │
│     - If mixed type: distribute types evenly                 │
│     - Balance difficulty (40% easy, 40% medium, 20% hard)    │
│     - Prioritize low usageCount questions                    │
│     - Randomize within each group                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. SHUFFLE & RETURN                                         │
│     - Shuffle final question list                            │
│     - Assign sequence numbers (1, 2, 3...)                   │
│     - Return selected questions                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Algorithm Steps

### STEP 1: Build Filter Criteria

```javascript
function buildFilterCriteria(params) {
  const filter = {
    isPublished: true  // Always filter published questions
  };

  // 1. Session Type Filter
  if (params.sessionType === 'mixed') {
    // For mixed, include multiple types (but not pronunciation/speaking unless explicitly requested)
    filter.type = { 
      $in: ['mcq', 'multi_select', 'fill_blanks', 'match', 'arrange'] 
    };
  } else {
    filter.type = params.sessionType;
  }

  // 2. Lesson/Module Context
  if (params.lessonId) {
    filter.lessonId = params.lessonId;
  } else if (params.moduleId) {
    filter.moduleId = params.moduleId;
  }
  // If neither, questions from all lessons/modules (global pool)

  // 3. User Level Filter
  // User should see questions at their level or below
  const userLevel = params.userLevel; // beginner | intermediate | advanced
  const levelHierarchy = {
    beginner: ['beginner'],
    intermediate: ['beginner', 'intermediate'],
    advanced: ['beginner', 'intermediate', 'advanced']
  };
  filter.level = { $in: levelHierarchy[userLevel] };

  // 4. Difficulty Filter (optional)
  if (params.difficulty) {
    filter.difficulty = params.difficulty;
  }

  // 5. Tags Filter (optional)
  if (params.tags && params.tags.length > 0) {
    filter.tags = { $in: params.tags };
  }

  return filter;
}
```

**Example Filters:**

**Scenario 1: MCQ Quiz from Lesson 01**
```javascript
{
  isPublished: true,
  type: 'mcq',
  lessonId: '65xyz789',
  level: { $in: ['beginner'] }
}
```

**Scenario 2: Mixed Practice (Global, Intermediate)**
```javascript
{
  isPublished: true,
  type: { $in: ['mcq', 'multi_select', 'fill_blanks', 'match', 'arrange'] },
  level: { $in: ['beginner', 'intermediate'] }
}
```

**Scenario 3: Pronunciation Practice with Tags**
```javascript
{
  isPublished: true,
  type: 'pronunciation',
  lessonId: '65xyz789',
  level: { $in: ['beginner'] },
  tags: { $in: ['difficult_words', 'pronunciation'] }
}
```

---

### STEP 2: Get Recent Question IDs

**Purpose:** Avoid showing questions the user answered recently (last 24 hours by default)

```javascript
async function getRecentQuestionIds(userId, excludeRecentHours = 24) {
  const cutoffTime = new Date(Date.now() - excludeRecentHours * 60 * 60 * 1000);
  
  const recentAttempts = await QuestionAttempt.find({
    userId: userId,
    attemptedAt: { $gte: cutoffTime }
  }).distinct('questionId');
  
  return recentAttempts; // Array of ObjectIds
}
```

**Example:**
```javascript
// User answered questions [65q001, 65q002, 65q003] in last 24 hours
recentQuestionIds = ['65q001', '65q002', '65q003']

// Add to filter:
filter._id = { $nin: recentQuestionIds }
```

**Exception:** If the user is practicing a specific lesson with limited questions (e.g., only 5 questions available), we may need to relax this constraint to ensure enough questions.

---

### STEP 3: Query Available Questions

```javascript
async function queryAvailableQuestions(filter, recentQuestionIds, requestedCount) {
  // Add exclusion of recent questions
  filter._id = { $nin: recentQuestionIds };
  
  // Query with priority sorting
  const questions = await Question.find(filter)
    .sort({
      usageCount: 1,      // Priority: least used questions first
      _id: 1              // Tiebreaker: stable sorting
    })
    .limit(requestedCount * 3); // Fetch more than needed for balancing
    
  return questions;
}
```

**Why `limit(requestedCount * 3)`?**
- We fetch 3x the requested count to have enough questions for balancing difficulty
- Example: User wants 10 questions → fetch 30 → balance difficulty → select 10

**Sorting Strategy:**
1. **usageCount ASC** - Questions used less often get priority (fairness)
2. **_id ASC** - Stable sort order (consistent results)

---

### STEP 4: Check Sufficient Questions

```javascript
async function ensureSufficientQuestions(questions, filter, requestedCount) {
  if (questions.length >= requestedCount) {
    return questions; // We have enough
  }
  
  // Insufficient questions - relax constraints progressively
  
  // ATTEMPT 1: Remove difficulty filter
  if (filter.difficulty) {
    delete filter.difficulty;
    questions = await queryAvailableQuestions(filter, [], requestedCount * 3);
    if (questions.length >= requestedCount) return questions;
  }
  
  // ATTEMPT 2: Remove recent exclusion
  if (filter._id && filter._id.$nin) {
    delete filter._id;
    questions = await queryAvailableQuestions(filter, [], requestedCount * 3);
    if (questions.length >= requestedCount) return questions;
  }
  
  // ATTEMPT 3: Expand level range (if user is beginner, include intermediate)
  const currentLevels = filter.level.$in;
  if (!currentLevels.includes('intermediate')) {
    filter.level.$in.push('intermediate');
    questions = await queryAvailableQuestions(filter, [], requestedCount * 3);
    if (questions.length >= requestedCount) return questions;
  }
  
  // ATTEMPT 4: Remove lesson/module filter (expand to global pool)
  if (filter.lessonId || filter.moduleId) {
    delete filter.lessonId;
    delete filter.moduleId;
    questions = await queryAvailableQuestions(filter, [], requestedCount * 3);
    if (questions.length >= requestedCount) return questions;
  }
  
  // If still insufficient, return what we have
  return questions;
}
```

**Relaxation Priority:**
1. Remove difficulty constraint (most flexible)
2. Allow recent repeats (if question pool is small)
3. Expand level range (slightly harder questions)
4. Expand to global pool (lose lesson context)

---

### STEP 5: Select & Balance Questions

#### 5A: Balance by Difficulty

**Target Distribution:**
- **Easy:** 40% (4 out of 10)
- **Medium:** 40% (4 out of 10)
- **Hard:** 20% (2 out of 10)

```javascript
function balanceByDifficulty(questions, requestedCount) {
  // Group questions by difficulty
  const grouped = {
    easy: questions.filter(q => q.difficulty === 'easy'),
    medium: questions.filter(q => q.difficulty === 'medium'),
    hard: questions.filter(q => q.difficulty === 'hard')
  };
  
  // Calculate target counts (40% easy, 40% medium, 20% hard)
  const targets = {
    easy: Math.round(requestedCount * 0.4),
    medium: Math.round(requestedCount * 0.4),
    hard: Math.round(requestedCount * 0.2)
  };
  
  const selected = [];
  
  // Select from each difficulty
  for (const [difficulty, count] of Object.entries(targets)) {
    const available = grouped[difficulty];
    const toSelect = Math.min(count, available.length);
    
    // Shuffle and take first N
    const shuffled = shuffleArray(available);
    selected.push(...shuffled.slice(0, toSelect));
  }
  
  // If we don't have enough, fill from remaining questions
  if (selected.length < requestedCount) {
    const remaining = questions.filter(q => !selected.includes(q));
    const shuffled = shuffleArray(remaining);
    const needed = requestedCount - selected.length;
    selected.push(...shuffled.slice(0, needed));
  }
  
  return selected.slice(0, requestedCount);
}
```

**Example:**
```
Requested: 10 questions
Available: 15 easy, 20 medium, 10 hard

Target:
- 4 easy (40%)
- 4 medium (40%)
- 2 hard (20%)

Selected:
✓ 4 random easy questions
✓ 4 random medium questions
✓ 2 random hard questions
= 10 questions total
```

---

#### 5B: Balance by Question Type (Mixed Sessions)

**For "mixed" sessions, distribute question types evenly:**

```javascript
function balanceByType(questions, requestedCount) {
  // Group by type
  const grouped = {
    mcq: questions.filter(q => q.type === 'mcq'),
    multi_select: questions.filter(q => q.type === 'multi_select'),
    fill_blanks: questions.filter(q => q.type === 'fill_blanks'),
    match: questions.filter(q => q.type === 'match'),
    arrange: questions.filter(q => q.type === 'arrange')
  };
  
  // Remove empty groups
  const availableTypes = Object.keys(grouped).filter(type => grouped[type].length > 0);
  const typesCount = availableTypes.length;
  
  // Distribute evenly
  const perType = Math.floor(requestedCount / typesCount);
  const remainder = requestedCount % typesCount;
  
  const selected = [];
  
  availableTypes.forEach((type, index) => {
    const count = perType + (index < remainder ? 1 : 0);
    const shuffled = shuffleArray(grouped[type]);
    selected.push(...shuffled.slice(0, count));
  });
  
  return selected.slice(0, requestedCount);
}
```

**Example:**
```
Requested: 10 questions (mixed type)
Available types: mcq, multi_select, fill_blanks, match, arrange (5 types)

Distribution:
- 2 mcq
- 2 multi_select
- 2 fill_blanks
- 2 match
- 2 arrange
= 10 questions total
```

---

#### 5C: Complete Selection Function

```javascript
function selectAndBalanceQuestions(questions, params) {
  const { sessionType, questionCount } = params;
  
  let selected = [];
  
  if (sessionType === 'mixed') {
    // First balance by type, then by difficulty within each type
    const typeBalanced = balanceByType(questions, questionCount);
    selected = balanceByDifficulty(typeBalanced, questionCount);
  } else {
    // Single type - just balance by difficulty
    selected = balanceByDifficulty(questions, questionCount);
  }
  
  return selected;
}
```

---

### STEP 6: Shuffle & Return

```javascript
function shuffleAndFinalize(questions) {
  // Fisher-Yates shuffle
  const shuffled = shuffleArray([...questions]);
  
  // Assign sequence numbers
  return shuffled.map((question, index) => ({
    ...question,
    sequenceNumber: index + 1
  }));
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

---

## Complete Algorithm Implementation

```javascript
async function selectPracticeQuestions(params) {
  const {
    userId,
    sessionType,
    lessonId,
    moduleId,
    difficulty,
    questionCount = 10,
    tags,
    excludeRecentHours = 24,
    userLevel
  } = params;
  
  // Validate question count
  const requestedCount = Math.min(questionCount, 20); // Max 20
  
  try {
    // STEP 1: Build filter
    const filter = buildFilterCriteria({
      sessionType,
      lessonId,
      moduleId,
      difficulty,
      tags,
      userLevel
    });
    
    // STEP 2: Get recent question IDs
    const recentQuestionIds = await getRecentQuestionIds(userId, excludeRecentHours);
    
    // STEP 3: Query available questions
    let questions = await queryAvailableQuestions(filter, recentQuestionIds, requestedCount);
    
    // STEP 4: Ensure sufficient questions
    questions = await ensureSufficientQuestions(questions, filter, requestedCount);
    
    // Check if we have ANY questions
    if (questions.length === 0) {
      throw new Error('NO_QUESTIONS_AVAILABLE');
    }
    
    // STEP 5: Select & balance
    const selected = selectAndBalanceQuestions(questions, {
      sessionType,
      questionCount: Math.min(requestedCount, questions.length)
    });
    
    // STEP 6: Shuffle & finalize
    const finalQuestions = shuffleAndFinalize(selected);
    
    return {
      questions: finalQuestions,
      metadata: {
        totalAvailable: questions.length,
        selectedCount: finalQuestions.length,
        filterApplied: {
          lessonId,
          moduleId,
          type: sessionType,
          level: userLevel,
          difficulty,
          tags
        },
        constraintsRelaxed: finalQuestions.length < requestedCount
      }
    };
    
  } catch (error) {
    console.error('Error selecting practice questions:', error);
    throw error;
  }
}
```

---

## Usage Examples

### Example 1: MCQ Quiz from Lesson

```javascript
const result = await selectPracticeQuestions({
  userId: '65user123',
  sessionType: 'mcq',
  lessonId: '65xyz789',
  questionCount: 10,
  userLevel: 'beginner'
});

// Returns 10 MCQ questions from lesson 65xyz789
// Balanced: 4 easy, 4 medium, 2 hard
// Excludes questions answered in last 24 hours
```

---

### Example 2: Mixed Practice (Global)

```javascript
const result = await selectPracticeQuestions({
  userId: '65user123',
  sessionType: 'mixed',
  questionCount: 15,
  userLevel: 'intermediate',
  tags: ['grammar', 'vocabulary']
});

// Returns 15 mixed questions
// Types: 3 mcq, 3 multi_select, 3 fill_blanks, 3 match, 3 arrange
// Each type balanced by difficulty
// Only grammar & vocabulary questions
```

---

### Example 3: Pronunciation Practice

```javascript
const result = await selectPracticeQuestions({
  userId: '65user123',
  sessionType: 'pronunciation',
  lessonId: '65xyz789',
  questionCount: 5,
  difficulty: 'hard',
  userLevel: 'beginner'
});

// Returns 5 pronunciation questions
// All from lesson 65xyz789
// All hard difficulty
// Excludes recent questions
```

---

## Edge Cases & Handling

### Edge Case 1: Insufficient Questions in Lesson

**Scenario:** User requests 10 questions from a lesson that only has 5 questions.

**Handling:**
```javascript
// STEP 4 relaxes constraints:
1. Remove difficulty filter → still only 5 questions
2. Remove recent exclusion → maybe 6 questions
3. Expand to global pool → find 10 questions

// Result: Return 10 questions (some from lesson, some global)
// metadata.constraintsRelaxed = true
```

---

### Edge Case 2: User Completed All Questions Recently

**Scenario:** User answered all 50 available questions in last 24 hours.

**Handling:**
```javascript
// STEP 4 removes recent exclusion
// Return same questions again (inevitable repetition)
// metadata.constraintsRelaxed = true
```

---

### Edge Case 3: No Questions Match Criteria

**Scenario:** User requests "hard pronunciation questions" but none exist.

**Handling:**
```javascript
// STEP 4 relaxes:
1. Remove difficulty → return medium/easy pronunciation
2. If still none → return ANY pronunciation
3. If still none → throw NO_QUESTIONS_AVAILABLE error

// Frontend shows: "No questions available. Try a different practice type."
```

---

### Edge Case 4: Mixed Session with Uneven Types

**Scenario:** User requests 10 mixed questions, but only 2 types available.

**Handling:**
```javascript
// balanceByType() distributes:
- 5 mcq
- 5 fill_blanks
= 10 questions

// If one type has fewer questions:
- 7 mcq (all available)
- 3 fill_blanks
= 10 questions
```

---

## Performance Optimization

### 1. Database Indexes

**Required indexes for fast queries:**
```javascript
// questions collection
db.questions.createIndex({ type: 1, level: 1, isPublished: 1 });
db.questions.createIndex({ lessonId: 1, type: 1 });
db.questions.createIndex({ moduleId: 1, type: 1 });
db.questions.createIndex({ tags: 1 });
db.questions.createIndex({ usageCount: 1 });

// question_attempts collection
db.question_attempts.createIndex({ userId: 1, attemptedAt: -1 });
```

### 2. Query Performance

**Estimated query times:**
- Filter + exclude recent: ~10-20ms
- Balance & shuffle: ~1-5ms
- **Total: ~15-25ms** (sub-100ms response time)

### 3. Caching Strategy (Optional)

**For frequently accessed lessons:**
```javascript
// Cache question pools for popular lessons (TTL: 1 hour)
const cacheKey = `questions:${lessonId}:${type}:${level}`;
const cached = await redis.get(cacheKey);

if (cached) {
  questions = JSON.parse(cached);
} else {
  questions = await queryAvailableQuestions(...);
  await redis.setex(cacheKey, 3600, JSON.stringify(questions));
}
```

---

## Algorithm Tuning Parameters

**Configurable values for fine-tuning:**

```javascript
const CONFIG = {
  // Difficulty distribution
  DIFFICULTY_DISTRIBUTION: {
    easy: 0.40,    // 40%
    medium: 0.40,  // 40%
    hard: 0.20     // 20%
  },
  
  // Recent exclusion window
  EXCLUDE_RECENT_HOURS: 24,
  
  // Fetch multiplier (to have room for balancing)
  FETCH_MULTIPLIER: 3,
  
  // Max questions per session
  MAX_QUESTIONS_PER_SESSION: 20,
  
  // Min questions required (if less, relax constraints)
  MIN_QUESTIONS_THRESHOLD: 5,
  
  // Priority boost for low-usage questions
  USAGE_COUNT_WEIGHT: 0.7  // 70% weight on usageCount, 30% random
};
```

---

## Testing Scenarios

### Test Case 1: Standard MCQ Session
```javascript
Input:
  - userId: test_user_1
  - sessionType: 'mcq'
  - lessonId: 'lesson_01'
  - questionCount: 10
  - userLevel: 'beginner'

Expected:
  ✓ 10 questions returned
  ✓ All type = 'mcq'
  ✓ All level = 'beginner'
  ✓ All lessonId = 'lesson_01'
  ✓ ~4 easy, ~4 medium, ~2 hard
  ✓ No questions from last 24 hours
  ✓ sequenceNumber: 1-10
```

### Test Case 2: Mixed Session (Global)
```javascript
Input:
  - userId: test_user_2
  - sessionType: 'mixed'
  - questionCount: 15
  - userLevel: 'intermediate'

Expected:
  ✓ 15 questions returned
  ✓ Types distributed evenly (3 of each type)
  ✓ Level = 'beginner' or 'intermediate'
  ✓ Balanced difficulty within each type
  ✓ No lesson/module filter applied
```

### Test Case 3: Insufficient Questions
```javascript
Input:
  - userId: test_user_3
  - sessionType: 'pronunciation'
  - lessonId: 'lesson_with_3_questions'
  - questionCount: 10
  - userLevel: 'beginner'

Expected:
  ✓ Constraints relaxed (metadata.constraintsRelaxed = true)
  ✓ Questions from global pool included
  ✓ At least 10 questions returned (or max available)
```

### Test Case 4: All Questions Recent
```javascript
Input:
  - userId: test_user_4 (answered all 20 questions today)
  - sessionType: 'mcq'
  - lessonId: 'lesson_02'
  - questionCount: 10

Expected:
  ✓ Recent exclusion removed
  ✓ 10 questions returned (may include repeats)
  ✓ metadata.constraintsRelaxed = true
```

---

## Monitoring & Analytics

**Track these metrics for algorithm optimization:**

```javascript
const metrics = {
  // Question usage
  avgUsageCount: 12.5,        // Average times each question used
  usageStdDev: 4.2,           // Standard deviation (fairness metric)
  
  // Session quality
  avgQuestionsPerSession: 10.2,
  constraintRelaxationRate: 0.15,  // 15% of sessions needed constraint relaxation
  
  // User satisfaction
  avgSessionCompletionRate: 0.92,  // 92% complete sessions
  avgAccuracy: 0.78,              // 78% average accuracy
  
  // Performance
  avgQueryTimeMs: 18,
  p95QueryTimeMs: 45,
  cacheHitRate: 0.65             // 65% cache hit rate
};
```

---

## Future Enhancements

### 1. Adaptive Difficulty
```javascript
// Adjust difficulty based on user's recent performance
if (userRecentAccuracy > 0.85) {
  // User is doing well - increase difficulty
  DIFFICULTY_DISTRIBUTION = { easy: 0.2, medium: 0.5, hard: 0.3 };
} else if (userRecentAccuracy < 0.60) {
  // User struggling - decrease difficulty
  DIFFICULTY_DISTRIBUTION = { easy: 0.6, medium: 0.3, hard: 0.1 };
}
```

### 2. Spaced Repetition
```javascript
// Integrate spaced repetition for questions user got wrong
const weakQuestions = await getWeakQuestions(userId, lessonId);
// Prioritize these questions in selection
```

### 3. Machine Learning
```javascript
// Train model to predict optimal question selection
// Input: user history, lesson progress, time of day
// Output: question IDs with predicted engagement score
```

### 4. Collaborative Filtering
```javascript
// Recommend questions based on similar users
// "Users like you found these questions helpful"
```

---

## Summary

**Key Algorithm Features:**
✅ Filters by level, type, lesson, tags  
✅ Excludes recently seen questions (24h)  
✅ Balances difficulty (40/40/20)  
✅ Distributes types evenly (mixed sessions)  
✅ Prioritizes low-usage questions (fairness)  
✅ Gracefully relaxes constraints when needed  
✅ Fast queries (<25ms average)  
✅ Highly configurable for tuning  

**Next Steps:**
1. ✅ Algorithm Complete

---

**Document Version:** 1.0  
**Last Updated:** February 20, 2026  
**Status:** Ready for Implementation
