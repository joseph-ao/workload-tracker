# EquiTask — Workload Tracker Platform

A full-stack team workload management application built with **ASP.NET Core 10 (.NET 10)** for the backend and **React + TypeScript (Vite)** for the frontend. It supports task assignment, change requests, workload visualization, and JWT-based authentication with role-based access.

---

## Prerequisites

Make sure the following are installed on your machine before running the project:

| Tool                                                       | Sources                                                               |
|------------------------------------------------------------|-----------------------------------------------------------------|
| .NET SDK  | https://dotnet.microsoft.com/download                           |
| Node.js (18)| https://nodejs.org                                              |
| SQL Server                                       | https://www.microsoft.com/en-us/sql-server/sql-server-downloads |
| Git                                                 | https://git-scm.com                                             |


---

## Project Structure

```
equitask-platform-main/
├── WorkloadTracker.API/        # ASP.NET Core Web API (backend)
│   ├── Controllers/            # API endpoints (Auth, Tasks, Users, etc.)
│   ├── Models/                 # Entity models
│   ├── DTOs/                   # Data transfer objects
│   ├── Services/               # Business logic
│   ├── Data/                   # EF Core DbContext
│   ├── Migrations/             # Database migrations
│   ├── appsettings.json        # App configuration
│   └── Program.cs              # App entry point
├── frontend/                   # React + TypeScript frontend (Vite)
│   ├── src/
│   │   ├── pages/              # Dashboard, Login, Members, Workload, Change Requests
│   │   ├── components/         # Shared UI components
│   │   ├── api/                # Axios API calls
│   │   ├── context/            # Auth context
│   │   └── types/              # TypeScript types
│   └── package.json
└── WorkloadTracker.sln         # Visual Studio solution file
```

---

## Setup Instructions

### 1. Clone / Extract the Project

If you downloaded the ZIP, extract it to a folder of your choice. Then open a terminal in that folder.

---

### 2. Configure the Database (Backend)

The API uses **SQL Server** with **Entity Framework Core**. You need to provide a connection string.

#### Option A — Using User Secrets 

Navigate to the API project folder:

```bash
cd WorkloadTracker.API
```

Set your connection string using .NET User Secrets (this keeps credentials off disk):

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=EquiTaskDb;Trusted_Connection=True;TrustServerCertificate=True;"
```



### 3. Apply Database Migrations

From inside the `WorkloadTracker.API` folder, run:

```bash
dotnet ef database update
```

---

### 4. Run the Backend API

Still inside `WorkloadTracker.API`, run:

```bash
dotnet run
```

The API will start at **`http://localhost:5197`**.


---

### 5. Run the Frontend

Open a **new terminal window** and navigate to the `frontend` folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at **`http://localhost:5173`**.

---

## Using the Application


### Logging In

Use the email and password you registered with. After login, you will be redirected to the dashboard based on your role.

### Key Features

- **Dashboard** : Overview of tasks and team workload
- **Tasks** : Create, assign, and track tasks with status and priority
- **Change Requests** : Members can request task changes; Managers can approve or reject
- **Workload** : Visual breakdown of each team member's current workload
- **Users Panel** : Manager view to manage team members

---

## API Overview

The backend exposes a REST API under `http://localhost:5197/api/`. All endpoints (except Register and Login) require a **Bearer JWT token** in the `Authorization` header.

| Endpoint | Description |
|---------|-------------|
| `POST /api/auth/register` | Register a new user |
| `POST /api/auth/login` | Login and receive a JWT token |
| `GET /api/tasks` | Get all tasks |
| `POST /api/tasks` | Create a new task |
| `GET /api/users` | Get all users |
| `GET /api/workload` | Get workload summary |
| `GET /api/changerequests` | Get all change requests |
| `POST /api/changerequests` | Submit a change request |


---

## Tech Stack

- **Backend:** ASP.NET Core 10, Entity Framework Core 10, ASP.NET Identity, JWT Authentication, Swagger/OpenAPI
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Axios, React Router
- **Database:** Microsoft SQL Server
