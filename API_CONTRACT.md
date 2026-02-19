# English Learning App - API Contract Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.englishlearning.com/api
```

## Authentication
All endpoints except `/auth/login` and `/auth/register` require authentication.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Token Format:**
```javascript
{
  userId: ObjectId,
  email: string,
  iat: timestamp,
  exp: timestamp
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "NO_TOKEN" | "INVALID_TOKEN" | "TOKEN_EXPIRED"
}
```

---

## API Endpoints Overview

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout (optional, client clears token)

### Home Dashboard
- `GET /home` - Get dashboard data (greeting, streak, next lesson, stats)

### Modules
- `GET /modules` - List all modules
- `GET /modules/:id` - Get module detail

### Lessons
- `GET /lessons` - List lessons (with optional filters)
- `GET /lessons/:id` - Get lesson detail (overview, vocabulary, sections)

### Practice & Questions
- `POST /practice/start` - Start a practice session (returns questions)
- `POST /practice/submit` - Submit answers and complete session
- `GET /practice/session/:sessionId` - Get session details

### Progress
- `GET /users/progress` - Get user stats and recent activity
- `POST /lessons/:id/progress` - Update lesson progress
- `POST /sections/:id/progress` - Update section progress

### Streaks
- `GET /streaks` - Get current streak info
- `POST /streaks/check-in` - Manual check-in (if needed)

---

# DETAILED ENDPOINT SPECIFICATIONS

---

## 1. LESSONS

### GET /lessons
**Purpose:** List all lessons with optional filtering

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `moduleId` | string | No | Filter by module |
| `level` | string | No | Filter by level (beginner/intermediate/advanced) |
| `category` | string | No | Filter by category |
| `isPublished` | boolean | No | Filter published/unpublished (default: true) |
| `limit` | number | No | Max results (default: 50) |
| `skip` | number | No | Pagination offset (default: 0) |

**Request Example:**
```http
GET /api/lessons?moduleId=65abc123&level=beginner&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "65xyz789",
        "moduleId": "65abc123",
        "title": "Basic Greetings",
        "description": "Learn common English greetings and how to introduce yourself",
        "shortDescription": "Common greetings",
        "level": "beginner",
        "category": "conversation",
        "thumbnailUrl": "https://cdn.englishlearning.com/lessons/greetings-thumb.jpg",
        "sequenceNumber": 1,
        "estimatedDurationMins": 15,
        "topics": ["greetings", "introductions"],
        "vocabularyCount": 8,
        "sectionsCount": 4,
        "userProgress": {
          "status": "in_progress",
          "percentComplete": 50,
          "lastAccessedAt": "2026-02-20T10:30:00Z"
        },
        "isPublished": true,
        "createdAt": "2026-01-15T08:00:00Z"
      },
      {
        "id": "65xyz790",
        "moduleId": "65abc123",
        "title": "Asking for Directions",
        "description": "Learn how to ask for and give directions in English",
        "shortDescription": "Directions and navigation",
        "level": "beginner",
        "category": "conversation",
        "thumbnailUrl": "https://cdn.englishlearning.com/lessons/directions-thumb.jpg",
        "sequenceNumber": 2,
        "estimatedDurationMins": 20,
        "topics": ["directions", "navigation", "places"],
        "vocabularyCount": 12,
        "sectionsCount": 4,
        "userProgress": {
          "status": "not_started",
          "percentComplete": 0,
          "lastAccessedAt": null
        },
        "isPublished": true,
        "createdAt": "2026-01-16T08:00:00Z"
      }
    ],
    "total": 25,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

**Error Responses:**

**400 Bad Request** (Invalid parameters):
```json
{
  "success": false,
  "message": "Invalid level parameter",
  "error": "INVALID_PARAMETER",
  "details": {
    "parameter": "level",
    "allowedValues": ["beginner", "intermediate", "advanced"]
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to fetch lessons",
  "error": "DATABASE_ERROR"
}
```

---

### GET /lessons/:id
**Purpose:** Get detailed information about a specific lesson

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Lesson ID |

**Request Example:**
```http
GET /api/lessons/65xyz789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": "65xyz789",
      "moduleId": "65abc123",
      "moduleName": "Beginner Conversations",
      "title": "Basic Greetings",
      "description": "Learn common English greetings and how to introduce yourself. This lesson covers formal and informal greetings, self-introductions, and common responses.",
      "shortDescription": "Common greetings",
      "level": "beginner",
      "category": "conversation",
      "thumbnailUrl": "https://cdn.englishlearning.com/lessons/greetings-thumb.jpg",
      "sequenceNumber": 1,
      "estimatedDurationMins": 15,
      "topics": ["greetings", "introductions", "small_talk"],
      "vocabulary": [
        {
          "word": "Hello",
          "definition": "A greeting used when meeting someone",
          "pronunciation": "/həˈloʊ/",
          "exampleSentence": "Hello! How are you today?",
          "audioUrl": "https://cdn.englishlearning.com/audio/hello.mp3"
        },
        {
          "word": "Good morning",
          "definition": "A greeting used before noon",
          "pronunciation": "/ɡʊd ˈmɔːrnɪŋ/",
          "exampleSentence": "Good morning! Did you sleep well?",
          "audioUrl": "https://cdn.englishlearning.com/audio/good-morning.mp3"
        },
        {
          "word": "Nice to meet you",
          "definition": "A polite phrase when meeting someone for the first time",
          "pronunciation": "/naɪs tuː miːt juː/",
          "exampleSentence": "Nice to meet you, Sarah!",
          "audioUrl": "https://cdn.englishlearning.com/audio/nice-to-meet-you.mp3"
        }
      ],
      "sections": [
        {
          "id": "65sec001",
          "type": "video",
          "title": "Introduction to Greetings",
          "sequenceNumber": 1,
          "estimatedDurationMins": 5,
          "videoUrl": "https://cdn.englishlearning.com/videos/lesson-01-intro.mp4",
          "videoDurationSeconds": 300,
          "thumbnail": "https://cdn.englishlearning.com/videos/lesson-01-intro-thumb.jpg",
          "transcript": {
            "available": true,
            "url": "https://cdn.englishlearning.com/transcripts/lesson-01-intro.json"
          },
          "isRequired": true,
          "userProgress": {
            "isCompleted": true,
            "watchedSeconds": 300,
            "completedAt": "2026-02-20T09:45:00Z"
          }
        },
        {
          "id": "65sec002",
          "type": "practice",
          "title": "Practice Activities",
          "sequenceNumber": 2,
          "estimatedDurationMins": 5,
          "description": "Interactive practice with pronunciation and conversation roleplay",
          "activities": [
            {
              "type": "pronunciation",
              "title": "Pronunciation Practice",
              "description": "Practice saying greeting phrases",
              "questionCount": 5
            },
            {
              "type": "speaking",
              "title": "Conversation Roleplay",
              "description": "Practice a greeting conversation",
              "questionCount": 3
            }
          ],
          "isRequired": true,
          "userProgress": {
            "isCompleted": false,
            "completedAt": null
          }
        },
        {
          "id": "65sec003",
          "type": "quiz",
          "title": "Knowledge Check",
          "sequenceNumber": 3,
          "estimatedDurationMins": 3,
          "description": "Test your understanding of greetings",
          "questionCount": 5,
          "passingScore": 60,
          "isRequired": true,
          "userProgress": {
            "isCompleted": false,
            "completedAt": null
          }
        },
        {
          "id": "65sec004",
          "type": "flashcards",
          "title": "Vocabulary Review",
          "sequenceNumber": 4,
          "estimatedDurationMins": 2,
          "description": "Review key vocabulary with flashcards",
          "cardCount": 8,
          "isRequired": false,
          "userProgress": {
            "isCompleted": false,
            "completedAt": null
          }
        }
      ],
      "userProgress": {
        "status": "in_progress",
        "percentComplete": 25,
        "completedSections": 1,
        "totalSections": 4,
        "lastSection": "video",
        "startedAt": "2026-02-20T09:30:00Z",
        "lastAccessedAt": "2026-02-20T09:45:00Z"
      },
      "nextLesson": {
        "id": "65xyz790",
        "title": "Asking for Directions",
        "sequenceNumber": 2
      },
      "previousLesson": null,
      "isPublished": true,
      "createdAt": "2026-01-15T08:00:00Z",
      "updatedAt": "2026-02-10T12:00:00Z"
    }
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Lesson not found",
  "error": "LESSON_NOT_FOUND",
  "details": {
    "lessonId": "65xyz789"
  }
}
```

**403 Forbidden** (Lesson not published or user level insufficient):
```json
{
  "success": false,
  "message": "You don't have access to this lesson",
  "error": "ACCESS_DENIED",
  "details": {
    "reason": "LEVEL_REQUIRED",
    "requiredLevel": "intermediate",
    "userLevel": "beginner"
  }
}
```

---

## 2. PRACTICE SESSIONS

### POST /practice/start
**Purpose:** Start a new practice session and get questions

**Request Body:**
```json
{
  "sessionType": "mcq",
  "lessonId": "65xyz789",
  "moduleId": "65abc123",
  "difficulty": "medium",
  "questionCount": 10,
  "tags": ["grammar", "past_tense"]
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionType` | string | Yes | Type: mcq, multi_select, fill_blanks, match, arrange, pronunciation, speaking, mixed |
| `lessonId` | string | No | Filter questions by lesson (null = global questions) |
| `moduleId` | string | No | Filter questions by module |
| `difficulty` | string | No | easy, medium, hard (default: matches user level) |
| `questionCount` | number | No | Number of questions (default: 10, max: 20) |
| `tags` | array | No | Filter by tags (e.g., ["grammar", "vocabulary"]) |

**Request Examples:**

**Example 1: MCQ Quiz from Specific Lesson**
```http
POST /api/practice/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sessionType": "mcq",
  "lessonId": "65xyz789",
  "questionCount": 10
}
```

**Example 2: Mixed Practice (Global Questions)**
```http
POST /api/practice/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sessionType": "mixed",
  "difficulty": "medium",
  "questionCount": 15,
  "tags": ["grammar", "vocabulary"]
}
```

**Example 3: Pronunciation Practice from Lesson**
```http
POST /api/practice/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sessionType": "pronunciation",
  "lessonId": "65xyz789",
  "questionCount": 5
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess001",
      "userId": "65user123",
      "sessionType": "mcq",
      "lessonId": "65xyz789",
      "lessonTitle": "Basic Greetings",
      "status": "in_progress",
      "totalQuestions": 10,
      "questionsAnswered": 0,
      "startedAt": "2026-02-20T11:00:00Z",
      "expiresAt": "2026-02-20T13:00:00Z"
    },
    "questions": [
      {
        "questionId": "65q001",
        "sequenceNumber": 1,
        "type": "mcq",
        "difficulty": "easy",
        "questionText": "What is the past tense of 'go'?",
        "instruction": "Choose the correct answer",
        "options": [
          "go",
          "went",
          "gone",
          "going"
        ],
        "pointsValue": 10,
        "audioUrl": null,
        "imageUrl": null,
        "tags": ["grammar", "past_tense", "irregular_verbs"]
      },
      {
        "questionId": "65q002",
        "sequenceNumber": 2,
        "type": "mcq",
        "difficulty": "easy",
        "questionText": "Which article should be used: '__ apple'?",
        "instruction": "Select the correct article",
        "options": [
          "a",
          "an",
          "the",
          "no article"
        ],
        "pointsValue": 10,
        "audioUrl": null,
        "imageUrl": null,
        "tags": ["grammar", "articles"]
      },
      {
        "questionId": "65q003",
        "sequenceNumber": 3,
        "type": "multi_select",
        "difficulty": "medium",
        "questionText": "Which of these are vowels?",
        "instruction": "Select all that apply",
        "options": [
          "A",
          "B",
          "E",
          "F",
          "I",
          "K"
        ],
        "pointsValue": 15,
        "audioUrl": null,
        "imageUrl": null,
        "tags": ["vocabulary", "alphabet"]
      }
    ],
    "metadata": {
      "totalAvailableQuestions": 45,
      "selectedCount": 10,
      "filterApplied": {
        "lessonId": "65xyz789",
        "type": "mcq",
        "level": "beginner"
      }
    }
  }
}
```

**Response for Pronunciation Questions:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess002",
      "userId": "65user123",
      "sessionType": "pronunciation",
      "lessonId": "65xyz789",
      "status": "in_progress",
      "totalQuestions": 5,
      "startedAt": "2026-02-20T11:05:00Z"
    },
    "questions": [
      {
        "questionId": "65q101",
        "sequenceNumber": 1,
        "type": "pronunciation",
        "difficulty": "hard",
        "questionText": "Pronounce this word",
        "targetWord": "Through",
        "phonetic": "/θruː/",
        "audioUrl": "https://cdn.englishlearning.com/audio/through.mp3",
        "definition": "From one side to the other",
        "exampleSentence": "The train goes through the tunnel",
        "pointsValue": 15,
        "tags": ["pronunciation", "difficult_words"]
      },
      {
        "questionId": "65q102",
        "sequenceNumber": 2,
        "type": "pronunciation",
        "difficulty": "hard",
        "questionText": "Pronounce this word",
        "targetWord": "Entrepreneur",
        "phonetic": "/ˌɑːntrəprəˈnɜːr/",
        "audioUrl": "https://cdn.englishlearning.com/audio/entrepreneur.mp3",
        "definition": "A person who starts a business",
        "exampleSentence": "She is a successful entrepreneur",
        "pointsValue": 15,
        "tags": ["pronunciation", "business"]
      }
    ]
  }
}
```

**Response for Speaking Questions:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess003",
      "sessionType": "speaking",
      "totalQuestions": 3
    },
    "questions": [
      {
        "questionId": "65q201",
        "sequenceNumber": 1,
        "type": "speaking",
        "difficulty": "medium",
        "questionText": "Read this sentence aloud",
        "targetSentence": "I would like to make a reservation for two people",
        "translationContext": "Me gustaría hacer una reserva para dos personas",
        "audioUrl": "https://cdn.englishlearning.com/audio/reservation-sentence.mp3",
        "pointsValue": 20,
        "tags": ["speaking", "restaurant", "reservations"]
      }
    ]
  }
}
```

**Response for Fill-in-the-Blanks:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess004",
      "sessionType": "fill_blanks",
      "totalQuestions": 5
    },
    "questions": [
      {
        "questionId": "65q301",
        "sequenceNumber": 1,
        "type": "fill_blanks",
        "difficulty": "easy",
        "questionText": "I _____ to the store yesterday.",
        "instruction": "Drag the correct word into the blank",
        "wordBank": ["go", "went", "gone", "going"],
        "blanksCount": 1,
        "pointsValue": 10,
        "tags": ["grammar", "past_tense"]
      }
    ]
  }
}
```

**Response for Match Questions:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess005",
      "sessionType": "match",
      "totalQuestions": 3
    },
    "questions": [
      {
        "questionId": "65q401",
        "sequenceNumber": 1,
        "type": "match",
        "difficulty": "medium",
        "questionText": "Match each word with its meaning",
        "instruction": "Connect words with their definitions",
        "leftColumn": [
          "Happy",
          "Sad",
          "Fast",
          "Slow"
        ],
        "rightColumn": [
          "Quick",
          "Unhappy",
          "Not fast",
          "Joyful"
        ],
        "pointsValue": 20,
        "tags": ["vocabulary", "synonyms"]
      }
    ]
  }
}
```

**Response for Arrange Questions:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess006",
      "sessionType": "arrange",
      "totalQuestions": 5
    },
    "questions": [
      {
        "questionId": "65q501",
        "sequenceNumber": 1,
        "type": "arrange",
        "difficulty": "medium",
        "questionText": "Arrange these words to form a correct sentence",
        "instruction": "Tap the words in the correct order",
        "words": ["the", "to", "store", "went", "I"],
        "pointsValue": 15,
        "tags": ["grammar", "sentence_structure"]
      }
    ]
  }
}
```

**Error Responses:**

**400 Bad Request** (Invalid parameters):
```json
{
  "success": false,
  "message": "Invalid session type",
  "error": "INVALID_PARAMETER",
  "details": {
    "parameter": "sessionType",
    "allowedValues": ["mcq", "multi_select", "fill_blanks", "match", "arrange", "pronunciation", "speaking", "mixed"]
  }
}
```

**404 Not Found** (No questions available):
```json
{
  "success": false,
  "message": "No questions found matching your criteria",
  "error": "NO_QUESTIONS_AVAILABLE",
  "details": {
    "filter": {
      "lessonId": "65xyz789",
      "type": "mcq",
      "difficulty": "hard"
    },
    "availableCount": 0
  }
}
```

**429 Too Many Requests** (Rate limiting):
```json
{
  "success": false,
  "message": "Too many practice sessions started. Please complete your current session first.",
  "error": "RATE_LIMIT_EXCEEDED",
  "details": {
    "currentActiveSessions": 3,
    "maxAllowed": 3
  }
}
```

---

### POST /practice/submit
**Purpose:** Submit answers for a practice session and get results

**Request Body:**
```json
{
  "sessionId": "65sess001",
  "answers": [
    {
      "questionId": "65q001",
      "userAnswer": 1,
      "timeSpentSeconds": 5
    },
    {
      "questionId": "65q002",
      "userAnswer": 1,
      "timeSpentSeconds": 3
    },
    {
      "questionId": "65q003",
      "userAnswer": [0, 2, 4],
      "timeSpentSeconds": 8
    }
  ]
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Practice session ID |
| `answers` | array | Yes | Array of answer objects |
| `answers[].questionId` | string | Yes | Question ID |
| `answers[].userAnswer` | mixed | Yes | User's answer (format varies by question type) |
| `answers[].timeSpentSeconds` | number | No | Time spent on question |
| `answers[].recognizedText` | string | No | For pronunciation/speaking: recognized text |
| `answers[].accuracyScore` | number | No | For pronunciation/speaking: 0-100 score |

**Answer Format by Question Type:**
| Type | userAnswer Format | Example |
|------|------------------|---------|
| mcq | number (index) | `1` |
| multi_select | array of numbers | `[0, 2, 4]` |
| fill_blanks | string | `"went"` |
| match | object (left→right indices) | `{"0": 3, "1": 1, "2": 0, "3": 2}` |
| arrange | array of numbers (word indices) | `[4, 3, 1, 2, 0]` |
| pronunciation | string (recognized text) | `"through"` |
| speaking | string (recognized text) | `"I would like to make a reservation"` |

**Request Examples:**

**Example 1: MCQ Quiz Submission**
```http
POST /api/practice/submit
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sessionId": "65sess001",
  "answers": [
    {
      "questionId": "65q001",
      "userAnswer": 1,
      "timeSpentSeconds": 5
    },
    {
      "questionId": "65q002",
      "userAnswer": 1,
      "timeSpentSeconds": 3
    },
    {
      "questionId": "65q003",
      "userAnswer": [0, 2, 4],
      "timeSpentSeconds": 8
    }
  ]
}
```

**Example 2: Pronunciation Practice Submission**
```http
POST /api/practice/submit
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sessionId": "65sess002",
  "answers": [
    {
      "questionId": "65q101",
      "userAnswer": "through",
      "recognizedText": "through",
      "accuracyScore": 95,
      "timeSpentSeconds": 8
    },
    {
      "questionId": "65q102",
      "userAnswer": "entrepreneur",
      "recognizedText": "entre border",
      "accuracyScore": 45,
      "timeSpentSeconds": 12
    }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess001",
      "userId": "65user123",
      "sessionType": "mcq",
      "status": "completed",
      "totalQuestions": 10,
      "questionsAnswered": 10,
      "correctAnswers": 8,
      "totalPoints": 80,
      "pointsEarned": 80,
      "accuracyPercentage": 80.0,
      "startedAt": "2026-02-20T11:00:00Z",
      "completedAt": "2026-02-20T11:05:30Z",
      "durationSeconds": 330
    },
    "results": [
      {
        "questionId": "65q001",
        "sequenceNumber": 1,
        "questionText": "What is the past tense of 'go'?",
        "userAnswer": 1,
        "correctAnswer": 1,
        "isCorrect": true,
        "pointsEarned": 10,
        "explanation": "The past tense of 'go' is 'went'. This is an irregular verb.",
        "userAnswerText": "went",
        "correctAnswerText": "went"
      },
      {
        "questionId": "65q002",
        "sequenceNumber": 2,
        "questionText": "Which article should be used: '__ apple'?",
        "userAnswer": 1,
        "correctAnswer": 1,
        "isCorrect": true,
        "pointsEarned": 10,
        "explanation": "Use 'an' before words starting with a vowel sound.",
        "userAnswerText": "an",
        "correctAnswerText": "an"
      },
      {
        "questionId": "65q003",
        "sequenceNumber": 3,
        "questionText": "Which of these are vowels?",
        "userAnswer": [0, 2, 4],
        "correctAnswer": [0, 2, 4],
        "isCorrect": true,
        "pointsEarned": 15,
        "explanation": "The vowels in English are A, E, I, O, U.",
        "userAnswerText": ["A", "E", "I"],
        "correctAnswerText": ["A", "E", "I"]
      },
      {
        "questionId": "65q004",
        "sequenceNumber": 4,
        "questionText": "He ___ a teacher.",
        "userAnswer": 0,
        "correctAnswer": 1,
        "isCorrect": false,
        "pointsEarned": 0,
        "explanation": "Use 'is' with singular subjects (he, she, it).",
        "userAnswerText": "are",
        "correctAnswerText": "is"
      }
    ],
    "summary": {
      "grade": "B",
      "message": "Great job! You got 8 out of 10 correct.",
      "encouragement": "Keep practicing and you'll improve even more!",
      "strengths": ["past_tense", "articles"],
      "weaknesses": ["verb_conjugation"],
      "nextSteps": [
        "Review verb conjugation rules",
        "Practice more with 'to be' verb forms"
      ]
    },
    "streakUpdated": true,
    "newStreak": 8,
    "pointsAwarded": 80,
    "newTotalPoints": 530,
    "achievements": [
      {
        "id": "first_quiz_complete",
        "title": "Quiz Master",
        "description": "Completed your first quiz!",
        "icon": "🎯"
      }
    ]
  }
}
```

**Response for Pronunciation Practice:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess002",
      "sessionType": "pronunciation",
      "status": "completed",
      "totalQuestions": 5,
      "averageAccuracy": 76.0,
      "totalPoints": 62,
      "durationSeconds": 180
    },
    "results": [
      {
        "questionId": "65q101",
        "targetWord": "Through",
        "userAnswer": "through",
        "recognizedText": "through",
        "accuracyScore": 95,
        "isCorrect": true,
        "pointsEarned": 15,
        "feedback": "Excellent pronunciation!",
        "phonetic": "/θruː/",
        "tips": ["Pay attention to the 'th' sound at the beginning"]
      },
      {
        "questionId": "65q102",
        "targetWord": "Entrepreneur",
        "userAnswer": "entrepreneur",
        "recognizedText": "entre border",
        "accuracyScore": 45,
        "isCorrect": false,
        "pointsEarned": 7,
        "feedback": "Keep practicing! Focus on the French pronunciation.",
        "phonetic": "/ˌɑːntrəprəˈnɜːr/",
        "tips": [
          "Break it into syllables: on-tre-pre-neur",
          "Listen to the audio reference multiple times",
          "Practice in a quiet environment"
        ]
      }
    ],
    "summary": {
      "averageAccuracy": 76.0,
      "message": "Good effort! Your pronunciation is improving.",
      "wordsToReview": ["Entrepreneur", "Colonel"],
      "nextSteps": [
        "Practice difficult words in the vocabulary section",
        "Listen to native speakers on the podcast tab"
      ]
    }
  }
}
```

**Error Responses:**

**400 Bad Request** (Invalid submission):
```json
{
  "success": false,
  "message": "Invalid answer format for question type",
  "error": "INVALID_ANSWER_FORMAT",
  "details": {
    "questionId": "65q003",
    "expectedType": "array",
    "receivedType": "number"
  }
}
```

**404 Not Found** (Session not found):
```json
{
  "success": false,
  "message": "Practice session not found",
  "error": "SESSION_NOT_FOUND",
  "details": {
    "sessionId": "65sess001"
  }
}
```

**409 Conflict** (Session already completed):
```json
{
  "success": false,
  "message": "This practice session has already been completed",
  "error": "SESSION_ALREADY_COMPLETED",
  "details": {
    "sessionId": "65sess001",
    "completedAt": "2026-02-20T11:05:30Z"
  }
}
```

**422 Unprocessable Entity** (Incomplete answers):
```json
{
  "success": false,
  "message": "Not all questions have been answered",
  "error": "INCOMPLETE_ANSWERS",
  "details": {
    "totalQuestions": 10,
    "answersReceived": 7,
    "missingQuestionIds": ["65q008", "65q009", "65q010"]
  }
}
```

---

### GET /practice/session/:sessionId
**Purpose:** Get details of a practice session (for resume or review)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Practice session ID |

**Request Example:**
```http
GET /api/practice/session/65sess001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "65sess001",
      "userId": "65user123",
      "sessionType": "mcq",
      "lessonId": "65xyz789",
      "lessonTitle": "Basic Greetings",
      "status": "completed",
      "totalQuestions": 10,
      "questionsAnswered": 10,
      "correctAnswers": 8,
      "totalPoints": 80,
      "accuracyPercentage": 80.0,
      "startedAt": "2026-02-20T11:00:00Z",
      "completedAt": "2026-02-20T11:05:30Z",
      "durationSeconds": 330
    },
    "canRetry": true,
    "attemptsUsed": 1,
    "maxAttempts": 3
  }
}
```

---

## 3. PROGRESS & STATS

### GET /users/progress
**Purpose:** Get user's overall progress statistics and recent activity

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeRecent` | boolean | No | Include recent activity (default: true) |
| `recentLimit` | number | No | Max recent items (default: 5) |

**Request Example:**
```http
GET /api/users/progress
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalPoints": 530,
      "currentStreak": 8,
      "longestStreak": 15,
      "completedLessons": 12,
      "totalLessons": 25,
      "completedExercises": 45,
      "totalExercises": 120,
      "averageScore": 82.5,
      "totalPracticeMinutes": 340,
      "level": "beginner",
      "nextLevelPoints": 1000,
      "progressToNextLevel": 53.0
    },
    "recentProgress": [
      {
        "id": "65prog001",
        "type": "lesson",
        "lesson": {
          "id": "65xyz789",
          "title": "Basic Greetings"
        },
        "completed": true,
        "score": null,
        "pointsEarned": 50,
        "completedAt": "2026-02-20T11:05:30Z"
      },
      {
        "id": "65prog002",
        "type": "practice",
        "lesson": {
          "id": "65xyz789",
          "title": "Basic Greetings"
        },
        "exercise": {
          "type": "mcq",
          "title": "Multiple Choice Quiz"
        },
        "completed": true,
        "score": 80,
        "pointsEarned": 80,
        "completedAt": "2026-02-20T11:05:30Z"
      },
      {
        "id": "65prog003",
        "type": "practice",
        "lesson": {
          "id": "65xyz788",
          "title": "Introducing Yourself"
        },
        "exercise": {
          "type": "pronunciation",
          "title": "Pronunciation Practice"
        },
        "completed": true,
        "score": 95,
        "pointsEarned": 75,
        "completedAt": "2026-02-19T14:20:00Z"
      }
    ],
    "streakInfo": {
      "currentStreak": 8,
      "todayCompleted": true,
      "nextCheckIn": "2026-02-21T00:00:00Z",
      "message": "You're on fire! Keep your streak going!"
    },
    "upcomingGoals": [
      {
        "goal": "Complete 3 more lessons to reach Intermediate level",
        "progress": 12,
        "target": 15,
        "percentage": 80.0
      },
      {
        "goal": "Practice for 60 more minutes this week",
        "progress": 180,
        "target": 240,
        "percentage": 75.0
      }
    ]
  }
}
```

**Error Response:**

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to fetch user progress",
  "error": "DATABASE_ERROR"
}
```

---

### POST /lessons/:id/progress
**Purpose:** Update lesson progress (mark section complete, update video position)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Lesson ID |

**Request Body:**
```json
{
  "sectionId": "65sec001",
  "action": "complete",
  "videoWatchedSeconds": 300,
  "videoDurationSeconds": 300
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sectionId` | string | No | Section being updated |
| `action` | string | Yes | Action: "start", "complete", "update_video" |
| `videoWatchedSeconds` | number | No | Current video position (for video sections) |
| `videoDurationSeconds` | number | No | Total video duration |
| `timeSpentSeconds` | number | No | Time spent in section |

**Request Examples:**

**Example 1: Start Lesson**
```http
POST /api/lessons/65xyz789/progress
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "start"
}
```

**Example 2: Complete Video Section**
```http
POST /api/lessons/65xyz789/progress
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sectionId": "65sec001",
  "action": "complete",
  "videoWatchedSeconds": 300,
  "videoDurationSeconds": 300,
  "timeSpentSeconds": 320
}
```

**Example 3: Update Video Position (Resume)**
```http
POST /api/lessons/65xyz789/progress
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "sectionId": "65sec001",
  "action": "update_video",
  "videoWatchedSeconds": 145,
  "videoDurationSeconds": 300
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "lessonProgress": {
      "lessonId": "65xyz789",
      "status": "in_progress",
      "percentComplete": 50,
      "completedSections": 2,
      "totalSections": 4,
      "videoWatchedSeconds": 300,
      "videoCompleted": true,
      "lastSection": "video",
      "lastAccessedAt": "2026-02-20T11:05:30Z"
    },
    "sectionProgress": {
      "sectionId": "65sec001",
      "isCompleted": true,
      "timeSpentSeconds": 320,
      "completedAt": "2026-02-20T11:05:30Z"
    },
    "pointsAwarded": 25,
    "newTotalPoints": 555,
    "streakUpdated": false,
    "message": "Great job! You completed the video section."
  }
}
```

**Success Response (Lesson Complete):**
```json
{
  "success": true,
  "data": {
    "lessonProgress": {
      "lessonId": "65xyz789",
      "status": "completed",
      "percentComplete": 100,
      "completedSections": 4,
      "totalSections": 4,
      "completedAt": "2026-02-20T11:30:00Z"
    },
    "moduleProgress": {
      "moduleId": "65abc123",
      "completedLessons": 5,
      "totalLessons": 8,
      "percentComplete": 62.5
    },
    "pointsAwarded": 50,
    "newTotalPoints": 605,
    "streakUpdated": true,
    "newStreak": 9,
    "achievements": [
      {
        "id": "lesson_complete_5",
        "title": "Rising Star",
        "description": "Completed 5 lessons!",
        "icon": "⭐"
      }
    ],
    "message": "Congratulations! You completed the lesson!",
    "nextLesson": {
      "id": "65xyz790",
      "title": "Asking for Directions",
      "thumbnailUrl": "https://cdn.englishlearning.com/lessons/directions-thumb.jpg"
    }
  }
}
```

---

### POST /sections/:id/progress
**Purpose:** Update section progress independently

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Section ID |

**Request Body:**
```json
{
  "isCompleted": true,
  "timeSpentSeconds": 120
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sectionProgress": {
      "sectionId": "65sec002",
      "isCompleted": true,
      "timeSpentSeconds": 120,
      "completedAt": "2026-02-20T11:10:00Z"
    },
    "lessonProgress": {
      "lessonId": "65xyz789",
      "percentComplete": 75,
      "completedSections": 3,
      "totalSections": 4
    }
  }
}
```

---

## 4. STREAKS

### GET /streaks
**Purpose:** Get current streak information and daily goal status

**Request Example:**
```http
GET /api/streaks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "streak": {
      "currentStreak": 8,
      "longestStreak": 15,
      "lastCompletedDate": "2026-02-20",
      "dailyGoalMinutes": 15,
      "goalMetToday": true,
      "minutesPracticedToday": 22,
      "message": "You're on fire! 🔥 Keep your 8-day streak going!",
      "nextCheckIn": "2026-02-21T00:00:00Z",
      "streakEndRisk": false
    },
    "todayActivity": {
      "lessonsCompleted": 1,
      "practiceSessionsCompleted": 2,
      "totalMinutes": 22,
      "pointsEarned": 130
    },
    "encouragement": {
      "message": "Amazing work today! Come back tomorrow to keep your streak alive.",
      "nextMilestone": {
        "days": 10,
        "reward": "Unlock special streak badge"
      }
    }
  }
}
```

**Response When Goal Not Met Today:**
```json
{
  "success": true,
  "data": {
    "streak": {
      "currentStreak": 8,
      "longestStreak": 15,
      "lastCompletedDate": "2026-02-19",
      "dailyGoalMinutes": 15,
      "goalMetToday": false,
      "minutesPracticedToday": 5,
      "message": "Practice for 10 more minutes to keep your streak!",
      "nextCheckIn": "2026-02-21T00:00:00Z",
      "streakEndRisk": true,
      "hoursRemaining": 8
    },
    "todayActivity": {
      "lessonsCompleted": 0,
      "practiceSessionsCompleted": 0,
      "totalMinutes": 5,
      "pointsEarned": 0
    },
    "encouragement": {
      "message": "Don't break your streak! Complete one quick practice session.",
      "quickActions": [
        {
          "action": "5-minute pronunciation practice",
          "estimatedMinutes": 5,
          "url": "/practice/start?type=pronunciation&count=5"
        },
        {
          "action": "10-question quiz",
          "estimatedMinutes": 3,
          "url": "/practice/start?type=mcq&count=10"
        }
      ]
    }
  }
}
```

---

## 5. HOME DASHBOARD

### GET /home
**Purpose:** Get all data needed for home screen (greeting, stats, next lesson, tip)

**Request Example:**
```http
GET /api/home
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "name": "Maria",
      "firstName": "Maria",
      "level": "beginner",
      "levelDisplay": "Beginner"
    },
    "greeting": {
      "message": "Good morning",
      "timeOfDay": "morning",
      "emoji": "👋"
    },
    "streak": {
      "currentStreak": 8,
      "streakDisplay": "8 days",
      "icon": "🔥",
      "goalMetToday": true
    },
    "stats": {
      "totalPoints": 530,
      "completedLessons": 12,
      "totalLessons": 25
    },
    "todayGoal": {
      "title": "Today's goal",
      "description": "Complete one lesson or 15 minutes of practice to keep your streak",
      "progress": 100,
      "isComplete": true
    },
    "nextLesson": {
      "id": "65xyz790",
      "title": "Asking for Directions",
      "moduleTitle": "Beginner Conversations",
      "sequenceNumber": 2,
      "thumbnailUrl": "https://cdn.englishlearning.com/lessons/directions-thumb.jpg",
      "estimatedDurationMins": 20,
      "status": "not_started",
      "percentComplete": 0
    },
    "continueLesson": {
      "id": "65xyz789",
      "title": "Basic Greetings",
      "percentComplete": 75,
      "lastSection": "quiz",
      "thumbnailUrl": "https://cdn.englishlearning.com/lessons/greetings-thumb.jpg"
    },
    "tip": {
      "title": "Tip",
      "message": "Practice pronunciation for 5 minutes daily for best results. Consistent practice builds muscle memory!",
      "icon": "💡"
    },
    "features": [
      {
        "id": "pronunciation",
        "title": "Pronunciation",
        "icon": "🎤",
        "description": "Practice speaking"
      },
      {
        "id": "conversation",
        "title": "Conversation",
        "icon": "💬",
        "description": "Real-world dialogues"
      },
      {
        "id": "quizzes",
        "title": "Quizzes",
        "icon": "📝",
        "description": "Test your knowledge"
      },
      {
        "id": "vocabulary",
        "title": "Vocabulary",
        "icon": "📚",
        "description": "Expand your words"
      },
      {
        "id": "podcast",
        "title": "Podcast",
        "icon": "🎧",
        "description": "Listen & learn"
      }
    ],
    "motivationalMessage": {
      "quote": "The journey of a thousand miles begins with a single step",
      "author": "Lao Tzu",
      "hint": "Every lesson brings you closer to fluency!"
    }
  }
}
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "NO_TOKEN"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to access this resource",
  "error": "FORBIDDEN"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An unexpected error occurred",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## Rate Limiting

All endpoints are rate limited to prevent abuse:

- **Practice sessions:** Max 10 starts per hour
- **Submit answers:** Max 20 submissions per hour
- **Progress updates:** Max 100 updates per hour
- **General API:** Max 1000 requests per hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1645459200
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `limit` - Items per page (max: 100, default: 20)
- `skip` - Offset (default: 0)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

---

---

**Document Version:** 1.0  
**Last Updated:** February 20, 2026  
**Status:** Ready for Implementation
