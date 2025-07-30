export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  createdAt: string;
  taskCount: number;
}

export interface Task {
  id: number;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
  projectId: number;
  projectTitle: string;
  createdAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface CreateTaskRequest {
  title: string;
  dueDate?: string;
  projectId: number;
}

export interface UpdateTaskRequest {
  title: string;
  dueDate?: string;
  isCompleted: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
} 