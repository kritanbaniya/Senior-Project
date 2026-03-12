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

#NOTE:To enable LAN hosting, install https certificate (if hosting does not work check firewall settings)
npm install --save-dev vite-plugin-mkcert

```
## ShadCN/UI Components
We use [shadcn/ui](https://ui.shadcn.com) for beautiful, accessible, and fully customizable UI components.  
These components are NOT installed as an npm package — the CLI copies the code directly into our repo (in `@/components/ui`), so we own and can tweak everything with Tailwind CSS.

### Setup Status
✅ **Initialization is already complete**  
Your `components.json`, Tailwind config, and global styles (`src/style.css`) are committed to the repo.  
After cloning or pulling the latest main branch and running `npm install`, **you do NOT need to run `npx shadcn@latest init`** again.  
The CLI will detect the config automatically.


# Browse the full list of available components here:  
#   👉 **[https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)**  
#   *(Click any component to see live previews, usage examples, props, and copy-paste code if needed for reference.)*

### In your project root, run this command to add one or more: ###
```bash
#In Windows Git Bash or VSCode Terminal:
#Note: Component button is already installed, try another component
   npx shadcn@latest add button
   npx shadcn@latest add [insert name of component]
