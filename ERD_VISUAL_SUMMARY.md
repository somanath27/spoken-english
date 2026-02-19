# English Learning App - ERD Visual Summary

## 📊 Collection Groups & Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER & AUTHENTICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                                                   │
│  │  users   │──1:1──> user_profiles                            │
│  └────┬─────┘          (name, level, points, streak)           │
│       │                                                          │
│       ├──1:1──> streaks (daily streak tracking)                │
│       │                                                          │
│       ├──1:N──> reminders (notification settings)              │
│       │                                                          │
│       ├──1:N──> audio_recordings (voice practice)              │
│       │                                                          │
│       └──1:N──> [all progress collections]                     │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  LEARNING CONTENT HIERARCHY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  modules                                                         │
│  (Business English, Travel)                                      │
│      │                                                           │
│      ├──1:N──> lessons                                          │
│      │         (Lesson 01: Greetings)                           │
│      │             │                                             │
│      │             ├──1:N──> sections                           │
│      │             │         (video, practice, quiz)            │
│      │             │                                             │
│      │             └──1:N──> questions ⭐ NEW                   │
│      │                       (MCQ, pronunciation, etc.)         │
│      │                                                           │
│      └──1:N──> flashcard_decks                                  │
│                      │                                           │
│                      └──1:N──> flashcards                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              PRACTICE & QUESTION BANK SYSTEM ⭐ NEW             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users                                                           │
│    │                                                             │
│    ├──1:N──> practice_sessions                                  │
│    │           (session tracking)                               │
│    │               │                                             │
│    │               ├──N:M──> questions                          │
│    │               │         (via practice_session_questions)   │
│    │               │                                             │
│    │               └──1:N──> question_attempts                  │
│    │                         (user answers)                     │
│    │                                                             │
│    └──1:N──> question_attempts                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                     PROGRESS TRACKING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users                                                           │
│    │                                                             │
│    ├──1:N──> module_progress                                    │
│    │         (3/5 lessons complete)                             │
│    │                                                             │
│    ├──1:N──> lesson_progress                                    │
│    │         (video position, 75% done)                         │
│    │                                                             │
│    ├──1:N──> section_progress                                   │
│    │         (section completed)                                │
│    │                                                             │
│    ├──1:N──> quiz_attempts (legacy)                            │
│    │                                                             │
│    └──1:N──> flashcard_reviews                                  │
│              (spaced repetition)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Design Patterns

### 1. Content Hierarchy
```
modules (chapter)
  └─> lessons (unit)
      └─> sections (content blocks: video, practice, quiz)
          └─> questions (practice items)
```

### 2. Practice Flow
```
User starts practice
  ↓
practice_sessions created
  ↓
10-15 questions selected (filtered by lesson/type/difficulty)
  ↓
practice_session_questions created (junction table)
  ↓
User answers each question
  ↓
question_attempts recorded
  ↓
Session completed
  ↓
Points & streak updated
```

### 3. Progress Tracking
```
User starts module
  ↓
module_progress created (status: in_progress)
  ↓
User starts lesson
  ↓
lesson_progress created
  ↓
User watches video
  ↓
section_progress updated (videoWatchedSeconds)
  ↓
User completes practice
  ↓
practice_sessions completed
  ↓
Lesson marked complete
  ↓
Module progress updated (3/5 lessons done)
```

---

## 📈 Question Bank Architecture

### Question Types Supported
1. **MCQ** (Multiple Choice) - Single correct answer
2. **Multi-Select** - Multiple correct answers
3. **Fill-in-the-Blanks** - Drag words into sentence gaps
4. **Match** - Connect words with meanings
5. **Arrange** - Build sentences from scrambled words
6. **Pronunciation** - Say a word, get accuracy score
7. **Speaking** - Read a sentence, get accuracy score

### Question Organization
```
questions
  ├─ Lesson-specific (lessonId set)
  │   └─> Used when user practices from lesson context
  │
  └─ Global (lessonId null)
      └─> Can be used in any practice session
          └─> Filtered by tags, difficulty, level
```

### Practice Session Selection Logic
```
When user starts "Multiple Choice Quiz":
  1. Filter questions by:
     - type = 'mcq'
     - level = user.level (or ≤ user.level)
     - lessonId (if in lesson context) OR tags
     - isPublished = true
  
  2. Randomize filtered questions
  
  3. Select first 10-15 questions
  
  4. Create practice_session
  
  5. Link questions via practice_session_questions
  
  6. Return questions to mobile app
```

---

## 🎯 Key Relationships

### Many-to-One
- lessons → modules (one lesson belongs to one module)
- sections → lessons (one section belongs to one lesson)
- questions → lessons (nullable - can be global)
- flashcards → flashcard_decks
- All progress collections → users

### One-to-One
- users ↔ user_profiles
- users ↔ streaks

### Many-to-Many
- practice_sessions ↔ questions (via practice_session_questions)
  - Same question can appear in multiple sessions
  - Same session contains multiple questions

---

## 📊 Data Flow Examples

### Example 1: User Completes MCQ Quiz
```
1. POST /api/practice/start
   Body: { type: 'mcq', lessonId: '123', count: 10 }
   ↓
2. Backend creates practice_session (status: in_progress)
   ↓
3. Backend selects 10 random MCQ questions
   ↓
4. Backend creates practice_session_questions entries
   ↓
5. Backend returns questions to app
   ↓
6. User answers each question
   ↓
7. POST /api/practice/submit
   Body: { sessionId: '456', answers: [...] }
   ↓
8. Backend creates question_attempts entries
   ↓
9. Backend calculates score (8/10 correct)
   ↓
10. Backend updates practice_session (status: completed, score: 80%)
    ↓
11. Backend updates user_profiles (totalPoints += 80)
    ↓
12. Backend updates streaks (if first completion today)
    ↓
13. Backend returns results to app
```

### Example 2: User Does Pronunciation Practice
```
1. User taps "Pronunciation Practice" from lesson
   ↓
2. POST /api/practice/start
   Body: { type: 'pronunciation', lessonId: '123', count: 5 }
   ↓
3. Backend selects 5 pronunciation questions from lesson
   ↓
4. App receives questions with audioUrl, phonetic
   ↓
5. User taps mic → records "through"
   ↓
6. App sends audio to speech-to-text API
   ↓
7. API returns recognized text: "through"
   ↓
8. App calculates accuracy: 95%
   ↓
9. POST /api/practice/submit
   Body: { 
     sessionId: '789',
     answers: [{
       questionId: 'q1',
       userAnswer: 'through',
       recognizedText: 'through',
       accuracyScore: 95
     }]
   }
   ↓
10. Backend creates question_attempts
    ↓
11. Backend creates audio_recordings (optional)
    ↓
12. Backend updates session and awards points
```

---

## 🔍 Index Strategy

### Query Patterns to Optimize

**1. "Get all lessons for a module"**
```
db.lessons.find({ moduleId: '123', isPublished: true })
Index: lessons.moduleId + lessons.isPublished
```

**2. "Get 10 MCQ questions for beginner level"**
```
db.questions.find({ 
  type: 'mcq', 
  level: 'beginner', 
  isPublished: true 
}).limit(10)
Index: questions.type + questions.level + questions.isPublished
```

**3. "Get user's in-progress practice sessions"**
```
db.practice_sessions.find({ 
  userId: '123', 
  status: 'in_progress' 
})
Index: practice_sessions.userId + practice_sessions.status
```

**4. "Get flashcards due for review today"**
```
db.flashcard_reviews.find({
  userId: '123',
  nextReviewAt: { $lte: ISODate('2026-02-20') }
})
Index: flashcard_reviews.userId + flashcard_reviews.nextReviewAt (compound)
```

---

## 🎨 Collection Color Coding (for Diagrams)

- 🟦 **Blue**: User & Auth collections
- 🟩 **Green**: Content collections (modules, lessons, sections)
- 🟨 **Yellow**: Practice & Question Bank (NEW)
- 🟧 **Orange**: Progress tracking
- 🟪 **Purple**: Flashcards
- 🟥 **Red**: Audio/Media

---

## ✅ ERD Completion Checklist

- [x] User & Authentication collections defined
- [x] Content hierarchy (modules → lessons → sections)
- [x] Question bank system designed
- [x] Practice session tracking
- [x] Progress tracking (module, lesson, section)
- [x] Flashcard system with spaced repetition
- [x] Audio recording storage
- [x] All relationships mapped
- [x] Indexes identified
- [x] Data flow examples provided

---

