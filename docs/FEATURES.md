# Accommodation Platform with AI Chatbot and User Interaction

## Overview
This system is an accommodation platform that integrates:
- Real-time user presence
- User-to-user interaction
- AI chatbot (RAG-based)
- Personalized recommendations

The goal is to allow users to better evaluate accommodations through AI-generated insights, user experiences, and recommendation-driven discovery.

---

## Core Features

### 1. Real-Time Occupancy Display
- Each accommodation shows how many users are currently staying there
- This helps users understand the current level of activity at that location

---

### 2. Q&A per Accommodation
- Each accommodation has its own question system
- Users can:
  - Ask questions about a specific place
  - Receive answers from other users who are currently staying there

---

### 3. Chatbot for Each Accommodation (RAG)
- Each accommodation has a dedicated chatbot
- The chatbot uses RAG (Retrieval-Augmented Generation)
- It answers user questions based on available data (e.g., reviews or stored information)

---

### 4. User-to-User Chat (Same Location)
- Users staying at the same accommodation can chat with each other
- This enables direct communication between people currently at the same place

---

### 5. Chatbot for On-Site Users
- Users who are currently staying at an accommodation can chat with the chatbot
- They can ask for additional information related to that place

---

### 6. User-Contributed Data to Chatbot
- Users can provide new information through interaction with the chatbot
- This data is stored in the database
- The stored data is later used to improve the chatbot’s responses (RAG)

---

### 7. Personalized Recommendations
- The system suggests accommodations based on user preferences, past interactions, and available place data
- Recommendations are powered by a combination of search results, review signals, and AI scoring
- Users receive curated accommodation suggestions that are relevant to their trip context

---