# Senior Project – Clinic iQueue Management System

* **Course:** CSC 59866  
* **Instructor:** Prof. Thomas M. Sessa  
* **Institution:** CUNY – The City College of New York  
* **Semester:** Fall 2025 – Spring 2026  
* **Team Name:** Digital Worms  

---

## Team Members

- Ethan Nghiem  
- YiXuan Shi  
- Kelvin Bermejo  
- Munjer Masr  
- Kritan Baniya  

---

## Project Overview

This is a **full-stack web application** for managing clinic queues, patient check-ins, and staff workflows.

The system is split into:
- a **frontend** (React) for users and staff
- a **backend API** (FastAPI) for business logic
- **Supabase** for database, authentication, and realtime services

These parts run as **separate services** during development.

---

## Tech Stack

### Frontend
- React
- Vite
- React Router DOM
- Supabase JavaScript Client

### Backend
- Python
- FastAPI
- Uvicorn

### Infrastructure / Services
- Supabase (PostgreSQL, Auth, Realtime)

---

## Prerequisites

Make sure you have the following installed **before starting**:

- **Git**
- **Node.js** (required for frontend tooling)  
    https://nodejs.org/en/download
- **Python 3.10+**  
    https://www.python.org/downloads/

>   Node.js is **only** used for the frontend.  
>   Python is **only** used for the backend.

---

## Getting Started

### Run these commands in Git Bash
```bash
# Using Windows Git bash

git clone <repository-url>
cd Senior-Project

# frontend setup (React)
cd frontend
npm install
npm run dev

# backend setup (FastAPI)
python -m venv venv
source venv/Scripts/activate

#install backend deps
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

