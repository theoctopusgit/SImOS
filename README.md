# SimOS Setup Guide

## Overview

SimOS is an interactive Operating System simulator for CPU Scheduling and Memory Management algorithms.

### Tech Stack

Frontend:

* React
* TypeScript
* TailwindCSS
* Vite

Backend:

* FastAPI
* Python

Tools:

* Git
* GitHub
* Python Virtual Environment (venv)

---

# Clone Repository

```bash
git https://github.com/RodneyGG/SImOS.git
cd SImOS
```

---

# Frontend Setup

## Go to Frontend Folder

```bash
cd frontend
```

## Install Dependencies

```bash
npm install
```

## Run Frontend

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

# Backend Setup

## Go to Backend Folder

```bash
cd backend
```

## Create Virtual Environment

### Windows

```bash
python -m venv venv
```

Activate venv:

```bash
venv\Scripts\activate
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Install Backend Dependencies

```bash
pip install -r requirements.txt
```

If requirements.txt does not exist yet:

```bash
pip install fastapi uvicorn
pip freeze > requirements.txt
```

---

# Run Backend Server

IMPORTANT:
Run this command inside the `backend` folder.

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```txt
http://127.0.0.1:8000
```

---

# FastAPI Documentation

Swagger UI:

```txt
http://127.0.0.1:8000/docs
```

ReDoc:

```txt
http://127.0.0.1:8000/redoc
```

---

# Project Structure

```txt
SimOS/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── algorithms/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── venv/
│   └── requirements.txt
│
└── README.md
```

---

# Repository Workflow

## Fork the Repository

Before starting development, fork the repository to your own GitHub account.

1. Open the SimOS GitHub repository.
2. Click the `Fork` button on the top-right.
3. Clone your forked repository.

```bash
git clone YOUR_FORK_URL
cd SimOS
```

---

## IMPORTANT: Create a Branch First

Before changing anything or adding a new feature, ALWAYS create a new branch.

DO NOT work directly on the `main` branch.

Create a branch using:

```bash
git checkout -b feature-name
```

Examples:

```bash
git checkout -b frontend-ui
git checkout -b fcfs-algorithm
git checkout -b gantt-chart
```

After finishing your work:

```bash
git add .
git commit -m "Describe your changes"
git push origin feature-name
```

Then create a Pull Request (PR) on GitHub.

---

# Git Workflow

## Pull Latest Changes

```bash
git pull origin main
```

---

## Create a Branch

```bash
git checkout -b feature-name
```

Example:

```bash
git checkout -b frontend-ui
```

---

## Push Changes

```bash
git add .
git commit -m "Describe your changes"
git push origin feature-name
```

---

# Important Notes

DO NOT upload:

* `venv`
* `node_modules`
* `.env`

Make sure `.gitignore` is working properly.

---

# Common Backend Error

If you get:

```txt
ModuleNotFoundError: No module named 'app'
```

You are probably inside the wrong directory.

Correct:

```bash
cd backend
uvicorn app.main:app --reload
```

Wrong:

```bash
cd backend/app
uvicorn app.main:app --reload
```

---

# Contributors

* Lloyd Rodney Arevalo
* Jasper Martin Gabriel
* Altheo Evans Mananquil 
* Dustin Ong
