# English Learning App - Complete ERD Documentation

## Overview
This document describes the complete MongoDB database schema for the English Learning mobile app, including the existing collections from the MVP schema and new collections for the practice/question bank system.

---

## Collection Groups

### 1. User & Authentication (5 collections)
- `users` - Authentication identity
- `user_profiles` - User preferences and settings
- `streaks` - Daily learning streak tracking
- `reminders` - Notification configuration
- `audio_recordings` - Voice practice recordings

### 2. Learning Content Hierarchy (3 collections)
- `modules` - Top-level learning chapters
- `lessons` - Individual lessons within modules
- `sections` - Content blocks within lessons (video, audio, quiz, flashcards)

### 3. Question Bank & Practice System (4 collections) ⭐ NEW
- `questions` - Reusable question bank
- `practice_sessions` - Practice session tracking
- `practice_session_questions` - Questions used in each session
- `question_attempts` - User answers and results

### 4. Quiz & Assessment (1 collection)
- `quiz_attempts` - Legacy quiz system (can be merged with practice_sessions)

### 5. Flashcards (3 collections)
- `flashcard_decks` - Flashcard deck metadata
- `flashcards` - Individual flashcard content
- `flashcard_reviews` - Spaced repetition tracking (SM-2 algorithm)

### 6. Progress Tracking (3 collections)
- `module_progress` - Module completion tracking
- `lesson_progress` - Lesson completion and video position
- `section_progress` - Section completion tracking

---

## Detailed Collection Specifications

### 1. USERS & AUTHENTICATION

#### users
**Purpose:** Core authentication identity

```json
{
  "_id": ObjectId("..."),
  "phone": "+1234567890",           // unique, required
  "email": "maria@example.com",     // optional, unique if provided
  "passwordHash": "bcrypt_hash",    // required
  "role": "learner",                // learner | admin | instructor
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `phone` (unique)
- `email` (unique, sparse)

**Business Rules:**
- Phone is primary identifier
- Email is optional but must be unique if provided
- Password must be hashed (bcrypt)

---

#### user_profiles
**Purpose:** User preferences, progress stats, and settings

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "name": "Maria Garcia",                 // required
  "nativeLanguage": "Spanish",            // e.g., Spanish, Hindi, Japanese
  "level": "beginner",                    // beginner | intermediate | advanced
  "learningGoals": ["business", "travel"], // array of strings
  "totalPoints": 450,                     // accumulated points
  "currentStreak": 7,                     // days
  "longestStreak": 15,                    // days
  "lastActiveDate": ISODate("..."),       // for streak calculation
  "preferredTheme": "dark",               // light | dark
  "appLanguage": "en",                    // en | hi | id | es | ar
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId` (unique)

**Business Rules:**
- One profile per user
- Level determines content visibility (beginner sees beginner lessons)
- Points earned from completed exercises and quizzes
- Streak updated when user completes daily goal

---

#### streaks
**Purpose:** Track daily learning streaks and goals

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "currentStreak": 7,                     // consecutive days
  "longestStreak": 15,                    // all-time record
  "lastCompletedDate": ISODate("2026-02-20"), // YYYY-MM-DD
  "dailyGoalMinutes": 15,                 // user's daily goal
  "goalMetToday": true,                   // boolean flag
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId` (unique)
- `lastCompletedDate`

**Business Rules:**
- Streak breaks if user doesn't complete goal for 1+ days
- Daily goal: Complete 1 lesson OR 15 minutes of practice
- Streak increments on first completion each day

---

#### reminders
**Purpose:** Store user notification preferences

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "time": "19:00",                        // HH:MM format (24-hour)
  "daysOfWeek": [1, 2, 3, 4, 5],         // 0=Sunday, 6=Saturday
  "isEnabled": true,                      // on/off toggle
  "message": "Time to practice English!",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId`

**Business Rules:**
- User can have multiple reminders
- Reminders trigger push notifications
- Empty daysOfWeek = daily reminder

---

### 2. LEARNING CONTENT HIERARCHY

#### modules
**Purpose:** Top-level learning chapters (e.g., "Business English", "Travel Conversations")

```json
{
  "_id": ObjectId("..."),
  "title": "Business English Basics",
  "description": "Essential English for workplace communication",
  "difficulty": "intermediate",           // beginner | intermediate | advanced
  "category": "business",                 // business | travel | daily_life | academic
  "thumbnailUrl": "https://cdn.../module-thumbnail.jpg",
  "sequenceNumber": 1,                    // display order
  "isPublished": true,                    // visibility flag
  "estimatedDurationMins": 180,           // total module duration
  "topics": ["introductions", "emails", "meetings"],
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `isPublished`
- `difficulty`
- `sequenceNumber`

**Business Rules:**
- Modules group related lessons
- Users see modules matching their level (or lower)
- Unpublished modules hidden from learners

---

#### lessons
**Purpose:** Individual lessons within a module

```json
{
  "_id": ObjectId("..."),
  "moduleId": ObjectId("..."),            // ref: modules
  "title": "Basic Greetings",
  "description": "Learn common English greetings and introductions",
  "shortDescription": "Common greetings",  // for lesson cards
  "level": "beginner",
  "category": "conversation",
  "thumbnailUrl": "https://cdn.../lesson-thumb.jpg",
  "sequenceNumber": 1,                    // order within module
  "estimatedDurationMins": 15,
  "isPublished": true,
  "topics": ["greetings", "introductions"],
  "vocabulary": [
    {
      "word": "Hello",
      "definition": "A greeting",
      "pronunciation": "/həˈloʊ/",
      "exampleSentence": "Hello, how are you?"
    }
  ],
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `moduleId`
- `isPublished`
- `level`
- `sequenceNumber`

**Business Rules:**
- Lessons belong to exactly one module
- Vocabulary shown in Lesson Overview tab
- Lessons have 4 tabs: Overview, Video, Practice, Quiz

---

#### sections
**Purpose:** Content blocks within lessons (video, audio, practice, quiz, flashcards)

```json
{
  "_id": ObjectId("..."),
  "lessonId": ObjectId("..."),            // ref: lessons
  "type": "video",                        // video | audio | quiz | flashcards | practice
  "title": "Introduction Video",
  "content": "Watch this video to learn...",
  "videoUrl": "https://cdn.../lesson-01-video.mp4",
  "audioUrl": null,                       // for audio type
  "transcript": {                         // time-synced transcript
    "phrases": [
      {
        "startTime": 0,
        "endTime": 5,
        "text": "Hello and welcome..."
      }
    ]
  },
  "sequenceNumber": 1,                    // order within lesson
  "estimatedDurationMins": 5,
  "isRequired": true,                     // must complete to finish lesson
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `lessonId`
- `type`
- `sequenceNumber`

**Business Rules:**
- Sections define lesson structure
- Common types: video (watch), practice (activities), quiz (assessment)
- Transcript enables podcast-style synchronized text

---

### 3. QUESTION BANK & PRACTICE SYSTEM ⭐ NEW

#### questions
**Purpose:** Unified question bank for all practice types

```json
{
  "_id": ObjectId("..."),
  "lessonId": ObjectId("..."),            // ref: lessons (nullable for global questions)
  "moduleId": ObjectId("..."),            // ref: modules (nullable)
  "type": "mcq",                          // mcq | multi_select | fill_blanks | match | arrange | pronunciation | speaking
  "difficulty": "easy",                   // easy | medium | hard
  "level": "beginner",                    // beginner | intermediate | advanced
  "questionText": "What is the past tense of 'go'?",
  "instruction": "Choose the correct answer",
  "audioUrl": null,                       // for pronunciation/speaking questions
  "phonetic": null,                       // e.g., "/θruː/" for pronunciation
  "options": ["go", "went", "gone", "going"], // for mcq, multi_select, fill_blanks word bank
  "correctAnswer": 1,                     // index for mcq; array for multi_select; varies by type
  "matchPairs": null,                     // for match type: [{ left: "Happy", right: "Joyful" }]
  "correctOrder": null,                   // for arrange type: [0, 2, 1, 3] indices
  "explanation": "The past tense of 'go' is 'went'",
  "translationContext": null,             // for speaking questions (e.g., Spanish translation)
  "tags": ["grammar", "past_tense", "irregular_verbs"],
  "pointsValue": 10,                      // points for correct answer
  "isPublished": true,
  "usageCount": 45,                       // times used in practice
  "averageAccuracy": 78.5,                // 0-100
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Type-Specific Field Usage:**

**MCQ (Multiple Choice):**
```json
{
  "type": "mcq",
  "questionText": "What is the past tense of 'go'?",
  "options": ["go", "went", "gone", "going"],
  "correctAnswer": 1  // index of "went"
}
```

**Multi-Select:**
```json
{
  "type": "multi_select",
  "questionText": "Which are vowels?",
  "options": ["A", "B", "E", "F", "I", "K"],
  "correctAnswer": [0, 2, 4]  // indices of A, E, I
}
```

**Fill-in-the-Blanks:**
```json
{
  "type": "fill_blanks",
  "questionText": "I _____ to the store yesterday.",
  "options": ["go", "went", "gone", "going"],  // word bank
  "correctAnswer": "went"  // or could be index 1
}
```

**Match:**
```json
{
  "type": "match",
  "questionText": "Match words with their meanings",
  "matchPairs": [
    { "left": "Happy", "right": "Joyful" },
    { "left": "Sad", "right": "Unhappy" },
    { "left": "Fast", "right": "Quick" }
  ],
  "correctAnswer": null  // pairs define correctness
}
```

**Arrange:**
```json
{
  "type": "arrange",
  "questionText": "Arrange these words to make a sentence",
  "options": ["the", "to", "store", "went", "I"],  // shuffled
  "correctOrder": [4, 3, 1, 2, 0]  // "I went to the store"
}
```

**Pronunciation:**
```json
{
  "type": "pronunciation",
  "questionText": "Pronounce this word",
  "options": ["Through"],  // the target word
  "phonetic": "/θruː/",
  "audioUrl": "https://cdn.../through.mp3",  // reference pronunciation
  "correctAnswer": "through"  // expected text for comparison
}
```

**Speaking:**
```json
{
  "type": "speaking",
  "questionText": "Read this sentence aloud",
  "options": ["I would like to make a reservation for two people"],
  "translationContext": "Me gustaría hacer una reserva para dos personas",
  "correctAnswer": "I would like to make a reservation for two people"
}
```

**Indexes:**
- `lessonId`
- `moduleId`
- `type`
- `difficulty`
- `level`
- `tags`
- `isPublished`

**Business Rules:**
- Questions can be lesson-specific (lessonId set) or global (lessonId null)
- Global questions can be reused across lessons
- `correctAnswer` format varies by question type
- Tags enable flexible filtering (e.g., "grammar", "past_tense")
- `usageCount` and `averageAccuracy` updated after each attempt

---

#### practice_sessions
**Purpose:** Track a single practice session (e.g., 10-question MCQ quiz)

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "lessonId": ObjectId("..."),            // ref: lessons (nullable for global practice)
  "moduleId": ObjectId("..."),            // ref: modules (nullable)
  "sessionType": "mcq",                   // mcq | pronunciation | speaking | mixed
  "status": "completed",                  // in_progress | completed | abandoned
  "totalQuestions": 10,
  "questionsAnswered": 10,
  "correctAnswers": 8,
  "totalPoints": 80,                      // points earned
  "accuracyPercentage": 80.0,             // 0-100
  "startedAt": ISODate("2026-02-20T10:00:00Z"),
  "completedAt": ISODate("2026-02-20T10:05:30Z"),
  "durationSeconds": 330,                 // 5 min 30 sec
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId`
- `lessonId`
- `moduleId`
- `status`
- `completedAt`

**Business Rules:**
- Created when user starts practice
- Status changes: `in_progress` → `completed` or `abandoned`
- Points added to user's totalPoints on completion
- Duration tracked for streak/progress calculations

---

#### practice_session_questions
**Purpose:** Junction table linking questions to sessions (allows deduplication)

```json
{
  "_id": ObjectId("..."),
  "sessionId": ObjectId("..."),           // ref: practice_sessions
  "questionId": ObjectId("..."),          // ref: questions
  "sequenceNumber": 1,                    // order in session (1-10)
  "createdAt": ISODate("...")
}
```

**Indexes:**
- `sessionId`
- `questionId`

**Business Rules:**
- Many-to-many relationship (same question can appear in multiple sessions)
- Sequence number determines order shown to user
- Enables analytics (which questions are most used)

---

#### question_attempts
**Purpose:** Record user's answer and result for each question

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "sessionId": ObjectId("..."),           // ref: practice_sessions
  "questionId": ObjectId("..."),          // ref: questions
  "userAnswer": 1,                        // format depends on question type
  "isCorrect": true,
  "accuracyScore": 95.0,                  // 0-100 (for pronunciation/speaking)
  "recognizedText": "through",            // for voice questions
  "pointsEarned": 10,
  "attemptNumber": 1,                     // 1st, 2nd try (if allowed)
  "attemptedAt": ISODate("..."),
  "createdAt": ISODate("...")
}
```

**userAnswer by Type:**
- MCQ: `1` (index)
- Multi-select: `[0, 2, 4]` (array of indices)
- Fill-blanks: `"went"` (string)
- Match: `{ 0: 0, 1: 1, 2: 2 }` (object mapping left index to right index)
- Arrange: `[4, 3, 1, 2, 0]` (array of indices)
- Pronunciation: `"through"` (recognized text)
- Speaking: `"I would like to make a reservation for two people"` (recognized text)

**Indexes:**
- `userId`
- `sessionId`
- `questionId`
- `attemptedAt`

**Business Rules:**
- One attempt per question per session (or multiple if retries allowed)
- `isCorrect` determined by comparing userAnswer to correctAnswer
- `accuracyScore` used for pronunciation/speaking (0-100)
- Points earned only if correct (or scaled by accuracy for voice)

---

### 4. QUIZ & ASSESSMENT (Legacy)

#### quiz_attempts
**Purpose:** Legacy quiz system (can be merged with practice_sessions later)

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "lessonId": ObjectId("..."),            // ref: lessons (nullable)
  "sectionId": ObjectId("..."),           // ref: sections (nullable)
  "quizType": "lesson_quiz",              // lesson_quiz | practice_quiz
  "score": 8,                             // correct answers
  "totalQuestions": 10,
  "percentage": 80.0,
  "answers": {                            // question-answer pairs
    "q1": "went",
    "q2": "have been"
  },
  "attemptedAt": ISODate("..."),
  "createdAt": ISODate("...")
}
```

**Indexes:**
- `userId`
- `lessonId`

**Business Rules:**
- Can be migrated to `practice_sessions` + `question_attempts`
- Kept for backward compatibility

---

### 5. FLASHCARDS

#### flashcard_decks
**Purpose:** Group flashcards into decks

```json
{
  "_id": ObjectId("..."),
  "moduleId": ObjectId("..."),            // ref: modules (nullable)
  "lessonId": ObjectId("..."),            // ref: lessons (nullable)
  "title": "Business Vocabulary - Week 1",
  "description": "Essential business terms",
  "cardCount": 20,
  "difficulty": "intermediate",
  "isPublished": true,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `moduleId`
- `lessonId`
- `isPublished`

---

#### flashcards
**Purpose:** Individual flashcard content

```json
{
  "_id": ObjectId("..."),
  "deckId": ObjectId("..."),              // ref: flashcard_decks
  "frontText": "Entrepreneur",            // word or question
  "backText": "A person who starts a business", // meaning or answer
  "frontAudioUrl": "https://cdn.../entrepreneur.mp3",
  "backAudioUrl": null,
  "exampleSentence": "She is a successful entrepreneur.",
  "difficulty": "medium",
  "sequenceNumber": 1,
  "tags": ["business", "vocabulary"],
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `deckId`
- `sequenceNumber`

---

#### flashcard_reviews
**Purpose:** Spaced repetition tracking (SM-2 algorithm)

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "cardId": ObjectId("..."),              // ref: flashcards
  "easeFactor": 2.5,                      // SM-2: 1.3-2.5
  "interval": 3,                          // days until next review
  "repetitions": 2,                       // successful reviews
  "nextReviewAt": ISODate("2026-02-23"),  // next scheduled date
  "lastReviewQuality": "good",            // again | hard | good | easy
  "lastReviewedAt": ISODate("..."),
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId + nextReviewAt` (compound, for due card queries)
- `cardId`

**Business Rules:**
- SM-2 algorithm: adjust interval based on user's self-rating
- "again" (0): reset interval to 1 day
- "easy" (5): multiply interval by easeFactor × 1.3

---

### 6. PROGRESS TRACKING

#### module_progress
**Purpose:** Track user's progress through modules

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "moduleId": ObjectId("..."),            // ref: modules
  "status": "in_progress",                // not_started | in_progress | completed
  "percentComplete": 60,                  // 0-100
  "completedLessons": 3,
  "totalLessons": 5,
  "startedAt": ISODate("..."),
  "completedAt": null,
  "lastAccessedAt": ISODate("..."),
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId + moduleId` (compound, unique)

**Business Rules:**
- Created when user starts first lesson in module
- `percentComplete` = (completedLessons / totalLessons) × 100
- Status changes to `completed` when all lessons done

---

#### lesson_progress
**Purpose:** Track lesson completion and video position

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "lessonId": ObjectId("..."),            // ref: lessons
  "status": "in_progress",                // not_started | in_progress | completed
  "percentComplete": 75,                  // 0-100
  "videoWatchedSeconds": 180,             // current video position
  "videoDurationSeconds": 300,            // total video length
  "videoCompleted": false,
  "completedSections": 3,                 // sections finished
  "totalSections": 4,                     // total sections in lesson
  "lastSection": "practice",              // last accessed section type
  "startedAt": ISODate("..."),
  "completedAt": null,
  "lastAccessedAt": ISODate("..."),
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId + lessonId` (compound, unique)

**Business Rules:**
- Video position enables "resume where you left off"
- `percentComplete` = (completedSections / totalSections) × 100
- Lesson marked complete when all required sections done

---

#### section_progress
**Purpose:** Track individual section completion

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "lessonId": ObjectId("..."),            // ref: lessons
  "sectionId": ObjectId("..."),           // ref: sections
  "isCompleted": true,
  "timeSpentSeconds": 120,                // time spent in section
  "completedAt": ISODate("..."),
  "lastAccessedAt": ISODate("..."),
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

**Indexes:**
- `userId + lessonId + sectionId` (compound, unique)

**Business Rules:**
- Created when user enters section
- Updated when user finishes section
- `timeSpentSeconds` contributes to daily goal calculation

---

### 7. AUDIO RECORDINGS

#### audio_recordings
**Purpose:** Store user voice recordings for pronunciation/speaking practice

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),              // ref: users
  "questionId": ObjectId("..."),          // ref: questions (nullable)
  "lessonId": ObjectId("..."),            // ref: lessons (nullable)
  "recordingUrl": "https://s3.../recordings/user123_rec456.mp3",
  "transcription": "through",             // recognized text
  "accuracyScore": 95.0,                  // 0-100
  "targetText": "through",                // what user should say
  "durationSeconds": 2,
  "recordingType": "pronunciation",       // pronunciation | speaking
  "recordedAt": ISODate("..."),
  "createdAt": ISODate("...")
}
```

**Indexes:**
- `userId`
- `questionId`
- `recordedAt`

**Business Rules:**
- Recordings stored in S3 or CDN
- Transcription from speech-to-text API
- Accuracy calculated by comparing transcription to targetText
- Optional: Keep recordings for user review or AI feedback

---

## Key Relationships Summary

### One-to-One
- `users` ←→ `user_profiles`
- `users` ←→ `streaks`

### One-to-Many
- `users` → `reminders`
- `users` → `module_progress`
- `users` → `lesson_progress`
- `users` → `section_progress`
- `users` → `practice_sessions`
- `users` → `question_attempts`
- `users` → `quiz_attempts`
- `users` → `audio_recordings`
- `users` → `flashcard_reviews`
- `modules` → `lessons`
- `modules` → `flashcard_decks`
- `lessons` → `sections`
- `lessons` → `questions` (nullable)
- `flashcard_decks` → `flashcards`

### Many-to-Many
- `practice_sessions` ←→ `questions` (via `practice_session_questions`)

---

## Question Bank Design Decisions

### Why Unified `questions` Collection?
✅ **Single source of truth** for all question types  
✅ **Flexible tagging** enables cross-lesson question reuse  
✅ **Easy analytics** (usage count, average accuracy)  
✅ **Consistent API** (`GET /api/questions?type=mcq&lessonId=...`)

### Why Separate `practice_sessions` & `question_attempts`?
✅ **Session tracking** separate from individual answers  
✅ **Retry support** (multiple attempts per question)  
✅ **Analytics** (session duration, abandonment rate)  
✅ **Clean data model** (one session has many attempts)

### Why Keep `lessonId` Nullable in `questions`?
✅ **Global questions** can be used across any lesson  
✅ **Lesson-specific questions** still linked to context  
✅ **Flexible practice** (user can practice all grammar questions regardless of lesson)

---

## Required Indexes (Complete List)

### Primary Keys
All collections have `_id` as primary key (automatic MongoDB index)

### Unique Indexes
- `users.phone`
- `users.email` (sparse)
- `user_profiles.userId`
- `streaks.userId`
- `module_progress.userId + moduleId` (compound)
- `lesson_progress.userId + lessonId` (compound)
- `section_progress.userId + lessonId + sectionId` (compound)

### Query Optimization Indexes
- `modules.isPublished`
- `lessons.moduleId`
- `lessons.isPublished`
- `sections.lessonId`
- `sections.type`
- `questions.lessonId`
- `questions.type`
- `questions.difficulty`
- `questions.level`
- `questions.tags`
- `practice_sessions.userId`
- `practice_sessions.status`
- `question_attempts.userId`
- `question_attempts.sessionId`
- `flashcard_reviews.userId + nextReviewAt` (compound)
- `quiz_attempts.userId`

---

---

## Design Principles Applied

✅ **Normalize where it matters** (questions, users, lessons)  
✅ **Denormalize for performance** (vocabulary in lessons, stats in user_profiles)  
✅ **Flexible question bank** (reusable, taggable, analytics-ready)  
✅ **Separate concerns** (sessions ≠ attempts, progress ≠ content)  
✅ **Scale-ready** (indexes on query-heavy fields)  
✅ **Mobile-first** (minimize API round trips, pre-computed stats)

---

**Document Version:** 1.0  
**Last Updated:** February 20, 2026  
**Status:** Ready for Implementation
