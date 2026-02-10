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

**Check if they are installed** (run in a terminal):

```bash
# Git — should print something like "git version 2.x.x"
git --version

# Node.js — should print something like "v20.x.x" or "v18.x.x"
node --version

# Python — should print "Python 3.10.x" or higher (e.g. 3.11, 3.12)
python --version
# On some systems you may need: python3 --version
```

If any command is not found or the version is too old, install or upgrade using the links above.

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
```

---

## How to run the frontend locally

1. **Open a terminal** (e.g. Git Bash, PowerShell, or Command Prompt).

2. **Go to the project and into the frontend folder:**
   ```bash
   cd Senior-Project
   cd frontend
   ```


3. **Start the development server:**
   ```bash
   npm run dev
   ```
   enter (y) to install vite if u dont have it 
   ```bash
   npm install -D vite
    ```
4. **Open the app in your browser** at the URL shown in the terminal (usually **http://localhost:5173**).

To stop the server, press `Ctrl+C` in the terminal.