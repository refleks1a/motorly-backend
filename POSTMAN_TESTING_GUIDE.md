# Motorly Backend API - Postman Testing Guide

## 📋 Overview
This guide provides complete instructions for testing the Motorly Backend API using Postman. The API includes authentication, vehicle management, and AI-powered car diagnosis chat features.

## 🚀 Base URL
```
http://localhost:3001/api
```

## 🔐 Authentication
All endpoints (except registration and login) require a Bearer token in the Authorization header.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

## 📊 API Endpoints

### 1. Health Check
**GET** `/health`
- **Description**: Check if API is running
- **Headers**: None required
- **Response**: 
```json
{
  "status": "healthy",
  "timestamp": "2026-04-03T20:38:48.747Z",
  "service": "Motorly Backend API"
}
```

### 2. Authentication Endpoints

#### 2.1 Register User
**POST** `/auth/register`
- **Description**: Create a new user account
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!",
  "name": "Test User"
}
```
- **Response** (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmnjcvf840000rfhjcoxch9xt",
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2026-04-03T20:32:14.456Z"
  }
}
```

#### 2.2 Login User
**POST** `/auth/login`
- **Description**: Authenticate user and get JWT token
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```
- **Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmnjcvf840000rfhjcoxch9xt",
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2026-04-03T20:32:14.456Z"
  }
}
```

#### 2.3 Get Current User Profile
**GET** `/auth/me`
- **Description**: Get authenticated user's profile
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
```json
{
  "id": "cmnjcvf840000rfhjcoxch9xt",
  "email": "test@example.com",
  "name": "Test User",
  "createdAt": "2026-04-03T20:32:14.456Z"
}
```

#### 2.4 Update User Profile
**PUT** `/auth/profile`
- **Description**: Update user profile information
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "name": "Updated Name"
}
```
- **Response** (200 OK):
```json
{
  "id": "cmnjcvf840000rfhjcoxch9xt",
  "email": "test@example.com",
  "name": "Updated Name",
  "createdAt": "2026-04-03T20:32:14.456Z"
}
```

### 3. Vehicle Management Endpoints

#### 3.1 Create Vehicle
**POST** `/vehicles`
- **Description**: Add a new vehicle for the authenticated user
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "mileage": 45000,
  "licensePlate": "ABC123"
}
```
- **Response** (201 Created):
```json
{
  "id": "cmnjcvf8n0002rfhjjnny7bct",
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "mileage": 45000,
  "licensePlate": "ABC123",
  "userId": "cmnjcvf840000rfhjcoxch9xt",
  "createdAt": "2026-04-03T20:32:14.456Z",
  "updatedAt": "2026-04-03T20:32:14.456Z"
}
```

#### 3.2 Get All Vehicles
**GET** `/vehicles`
- **Description**: Get all vehicles for the authenticated user
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
```json
[
  {
    "id": "cmnjcvf8n0002rfhjjnny7bct",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "mileage": 45000,
    "licensePlate": "ABC123",
    "userId": "cmnjcvf840000rfhjcoxch9xt",
    "createdAt": "2026-04-03T20:32:14.456Z",
    "updatedAt": "2026-04-03T20:32:14.456Z"
  }
]
```

#### 3.3 Get Single Vehicle
**GET** `/vehicles/:id`
- **Description**: Get details of a specific vehicle
- **Headers**: `Authorization: Bearer <token>`
- **URL Params**: `id` - Vehicle ID
- **Response** (200 OK):
```json
{
  "id": "cmnjcvf8n0002rfhjjnny7bct",
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "mileage": 45000,
  "licensePlate": "ABC123",
  "userId": "cmnjcvf840000rfhjcoxch9xt",
  "createdAt": "2026-04-03T20:32:14.456Z",
  "updatedAt": "2026-04-03T20:32:14.456Z"
}
```

#### 3.4 Update Vehicle
**PUT** `/vehicles/:id`
- **Description**: Update vehicle information
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **URL Params**: `id` - Vehicle ID
- **Body**:
```json
{
  "mileage": 46000,
  "licensePlate": "XYZ789"
}
```
- **Response** (200 OK):
```json
{
  "id": "cmnjcvf8n0002rfhjjnny7bct",
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "mileage": 46000,
  "licensePlate": "XYZ789",
  "userId": "cmnjcvf840000rfhjcoxch9xt",
  "createdAt": "2026-04-03T20:32:14.456Z",
  "updatedAt": "2026-04-03T20:32:14.456Z"
}
```

#### 3.5 Delete Vehicle
**DELETE** `/vehicles/:id`
- **Description**: Delete a vehicle
- **Headers**: `Authorization: Bearer <token>`
- **URL Params**: `id` - Vehicle ID
- **Response** (200 OK):
```json
{
  "message": "Vehicle deleted successfully"
}
```

### 4. AI Diagnosis Chat Endpoints

#### 4.1 Create Chat Session
**POST** `/chat/sessions`
- **Description**: Create a new AI diagnosis chat session
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body** (without initial message):
```json
{
  "vehicleId": "cmnjcvf8n0002rfhjjnny7bct"
}
```
- **Body** (with initial message):
```json
{
  "vehicleId": "cmnjcvf8n0002rfhjjnny7bct",
  "initialMessage": "My engine is making a strange noise"
}
```
- **Response** (201 Created):
```json
{
  "id": "cmnjcvf8s0004rfhjayjprsgh",
  "title": "2020 Toyota Camry Diagnosis",
  "vehicleId": "cmnjcvf8n0002rfhjjnny7bct",
  "createdAt": "2026-04-03T20:32:14.456Z",
  "updatedAt": "2026-04-03T20:32:14.456Z",
  "messages": [
    {
      "id": "temp-user",
      "content": "My engine is making a strange noise",
      "role": "user",
      "createdAt": "2026-04-03T20:32:14.456Z"
    },
    {
      "id": "temp-ai",
      "content": "Based on your description of engine noise...",
      "role": "assistant",
      "createdAt": "2026-04-03T20:32:14.456Z",
      "diagnosisResult": {
        "confidence": 0.75,
        "severity": "medium",
        "potentialIssues": [
          {
            "name": "Worn serpentine belt",
            "description": "Belt that drives engine accessories may be worn or loose",
            "estimatedCost": "$100-$300",
            "urgency": "soon"
          }
        ],
        "recommendedActions": [
          "Have a mechanic perform a diagnostic test"
        ]
      }
    }
  ]
}
```

#### 4.2 Get All Chat Sessions
**GET** `/chat/sessions`
- **Description**: Get all chat sessions for the authenticated user
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
```json
[
  {
    "id": "cmnjcvf8s0004rfhjayjprsgh",
    "title": "2020 Toyota Camry Diagnosis",
    "vehicleId": "cmnjcvf8n0002rfhjjnny7bct",
    "createdAt": "2026-04-03T20:32:14.456Z",
    "updatedAt": "2026-04-03T20:32:14.456Z",
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2020
    }
  }
]
```

#### 4.3 Get Single Chat Session
**GET** `/chat/sessions/:id`
- **Description**: Get a specific chat session with all messages
- **Headers**: `Authorization: Bearer <token>`
- **URL Params**: `id` - Session ID
- **Response** (200 OK):
```json
{
  "id": "cmnjcvf8s0004rfhjayjprsgh",
  "title": "2020 Toyota Camry Diagnosis",
  "vehicleId": "cmnjcvf8n0002rfhjjnny7bct",
  "createdAt": "2026-04-03T20:32:14.456Z",
  "updatedAt": "2026-04-03T20:32:14.456Z",
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "mileage": 45000
  },
  "messages": [
    {
      "id": "message-id-1",
      "content": "My engine is making a strange noise",
      "role": "user",
      "createdAt": "2026-04-03T20:32:14.456Z"
    },
    {
      "id": "message-id-2",
      "content": "Based on your description of engine noise...",
      "role": "assistant",
      "createdAt": "2026-04-03T20:32:14.456Z",
      "diagnosisResult": {
        "confidence": 0.75,
        "severity": "medium",
        "potentialIssues": [
          {
            "name": "Worn serpentine belt",
            "description": "Belt that drives engine accessories may be worn or loose",
            "estimatedCost": "$100-$300",
            "urgency": "soon"
          }
        ],
        "recommendedActions": [
          "Have a mechanic perform a diagnostic test"
        ]
      }
    }
  ]
}
```

#### 4.4 Send Message in Chat Session
**POST** `/chat/sessions/:id/messages`
- **Description**: Send a message in an existing chat session and get AI response
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **URL Params**: `id` - Session ID
- **Body**:
```json
{
  "content": "My brakes are squeaking when I stop"
}
```
- **Response** (201 Created):
```json
{
  "userMessage": {
    "id": "message-id-3",
    "content": "My brakes are squeaking when I stop",
    "role": "user",
    "createdAt": "2026-04-03T20:32:14.456Z"
  },
  "aiMessage": {
    "id": "message-id-4",
    "content": "Brake squeaking or grinding is a common issue...",
    "role": "assistant",
    "createdAt": "2026-04-03T20:32:14.456Z",
    "diagnosisResult": {
      "confidence": 0.85,
      "severity": "high",
      "potentialIssues": [
        {
          "name": "Worn brake pads",
          "description": "Brake pads have reached minimum thickness",
          "estimatedCost": "$150-$400 per axle",
          "urgency": "immediate"
        }
      ],
      "recommendedActions": [
        "Have brakes inspected immediately"
      ]
    }
  }
}
```

#### 4.5 Get Vehicle Diagnosis History
**GET** `/chat/vehicles/:vehicleId/diagnosis-history`
- **Description**: Get all diagnosis results for a specific vehicle
- **Headers**: `Authorization: Bearer <token>`
- **URL Params**: `vehicleId` - Vehicle ID
- **Response** (200 OK):
```json
[
  {
    "sessionId": "cmnjcvf8s0004rfhjayjprsgh",
    "sessionTitle": "2020 Toyota Camry Diagnosis",
    "messageId": "message-id-2",
    "content": "Based on your description of engine noise...",
    "createdAt": "2026-04-03T20:32:14.456Z",
    "diagnosisResult": {
      "confidence": 0.75,
      "severity": "medium",
      "potentialIssues": [
        {
          "name": "Worn serpentine belt",
          "description": "Belt that drives engine accessories may be worn or loose",
          "estimatedCost": "$100-$300",
          "urgency": "soon"
        }
      ],
      "recommendedActions": [
        "Have a mechanic perform a diagnostic test"
      ]
    }
  }
]
```

#### 4.6 Delete Chat Session
**DELETE** `/chat/sessions/:id`
- **Description**: Delete a chat session and all its messages
- **Headers**: `Authorization: Bearer <token>`
- **URL Params**: `id` - Session ID
- **Response** (200 OK):
```json
{
  "message": "Chat session deleted successfully"
}
```

## 🧪 Testing Workflow

### Step 1: Health Check
```
GET http://localhost:3001/api/health
```

### Step 2: Register a Test User
```
POST http://localhost:3001/api/auth/register
Body: {
  "email": "test@example.com",
  "password": "TestPassword123!",
  "name": "Test User"
}
```
**Save the token** from the response for subsequent requests.

### Step 3: Create a Vehicle
```
POST http://localhost:3001/api/vehicles
Headers: Authorization: Bearer <your_token>
Body: {
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "mileage": 45000,
  "licensePlate": "ABC123"
}
```
**Save the vehicle ID** from the response.

### Step 4: Create AI Diagnosis Chat Session
```
POST http://localhost:3001/api/chat/sessions
Headers: Authorization: Bearer <your_token>
Body: {
  "vehicleId": "<vehicle_id_from_step_3>",
  "initialMessage": "My engine is making a strange noise"
}
```
**Save the session ID** from the response.

### Step 5: Send Additional Messages
```
POST http://localhost:3001/api/chat/sessions/<session_id>/messages
Headers: Authorization: Bearer <your_token>
Body: {
  "content": "My brakes are squeaking when I stop"
}
```

### Step 6: Get Chat Session with Messages
```
GET http://localhost:3001/api/chat/sessions/<session_id>
Headers: Authorization: Bearer <your_token>
```

### Step 7: Get Vehicle Diagnosis History
```
GET http://localhost:3001/api/chat/vehicles/<vehicle_id>/diagnosis-history
Headers: Authorization: Bearer <your_token>
```

## 🔧 Common Headers
- **Content-Type**: `application/json` (for POST/PUT requests)
- **Authorization**: `Bearer <your_jwt_token>`