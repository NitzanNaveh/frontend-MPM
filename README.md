# Mini Project Manager (MPM)

A full-stack project management application built with .NET 8 and React.

This system allows users to register, log in, and manage their projects and associated tasks through a secure and user-friendly interface. 
It's a deployed web app that includs authentication, data management and modern application architecture.

## 🚀 Live Application

The application is deployed and accessible here: [https://frontend-mpm.vercel.app/](https://frontend-mpm.vercel.app/)

## Core Features

### Authentication & Security
- **Secure User Registration & Login:** Users can create an account and log in using a secure system.
- **JWT Authentication:** Utilizes JSON Web Tokens (JWT) for securing API endpoints and managing user sessions.
- **Data Isolation:** Post-login, users can only access and manage their own projects and tasks, ensuring data privacy.

### Project Management
- **Create Projects:** Users can create multiple projects.
- **View All Projects:** A central dashboard displays a list of all projects created by the user.
- **Detailed Project View:** Users can view the details of a specific project, which includes title, description, and a list of its tasks.
- **Delete Projects:** Users have the ability to delete their projects.

### Task Management
- **Add Task:** Within each project, users can add multiple tasks. Each task requires a title and can optionally have a due date.
- **Edit Task:** Existing tasks can be modified.
- **Toggle Completion Status:** Users can easily mark tasks as complete or incomplete.
- **Delete Task:** Individual tasks can be removed from a project.

## Technologies Used

### Frontend (React + TypeScript)
- **Framework:** React with TypeScript for a type-safe and modern user interface
- **Routing:** React Router for navigation between pages (Login/Register, Dashboard, Project Details)
- **State Management:** Manages application state to handle user data and UI updates efficiently
- **API Communication:** Interacts with the backend REST API, storing and reusing JWTs for authenticated requests
- **UI/UX:** Includes form validation and error handling to provide clear user feedback

### Backend (C# .NET 8)
- **Framework:** .NET 8 Core with a REST API architecture
- **Database:** Entity Framework Core with a SQLite database for data persistence
- **Authentication:** JWT token-based authentication
- **Validation:** DataAnnotations for robust input validation on models
- **Architecture:** Follows the separation of concerns principle using DTOs, services, and models

### DevOps & Deployment
- **Containerization:** Docker for consistency across development and deployment environments
- **Hosting:** The frontend is deployed on Vercel

## Getting Started

### Prerequisites
- Docker
- .NET 8 SDK
- Node.js
- npm 

### Installation

1. Clone the repository
```bash
git clone https://github.com/NitzanNaveh/frontend-MPM.git
```

2. Navigate to the project directory
```bash
cd frontend-MPM
```

3. Build and Run with Docker
```bash
docker-compose up --build
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Registers a new user
- `POST /api/auth/login` - Authenticates a user and returns a JWT

### Projects
- `GET /api/projects` - Retrieves all projects for the authenticated user
- `POST /api/projects` - Creates a new project
- `GET /api/projects/{id}` - Retrieves a single project by its ID
- `DELETE /api/projects/{id}` - Deletes a specific project

### Tasks
- `POST /api/projects/{projectId}/tasks` - Creates a new task within a specific project
- `PUT /api/tasks/{taskId}` - Updates an existing task
- `DELETE /api/tasks/{taskId}` - Deletes a specific task

## Author

Nitzan Naveh - [@NitzanNaveh](https://github.com/NitzanNaveh)

## Project Status

🚀 Under active development
