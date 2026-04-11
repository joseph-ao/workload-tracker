import api from './axios';
import type { Task } from '../types';

export async function getTasks(): Promise<Task[]> {
    const response = await api.get<Task[]>('/api/tasks');
    return response.data;
}

export async function createTask(data: {
    title: string;
    description: string;
    priority: string;
    complexity: string;
    effortHours: number;
    startDate: string;
    dueDate: string;
    assignedUserId: string;
}): Promise<Task> {
    const response = await api.post<Task>('/api/tasks', data);
    return response.data;
}

export async function updateTask(id: number, data: {
    title: string;
    description: string;
    priority: string;
    complexity: string;
    effortHours: number;
    startDate: string;
    dueDate: string;
    status: string;
    assignedUserId: string;
}): Promise<Task> {
    const response = await api.put<Task>(`/api/tasks/${id}`, data);
    return response.data;
}

export async function deleteTask(id: number): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
}

export async function acknowledgeTask(id: number): Promise<void> {
    await api.post(`/api/tasks/${id}/acknowledge`);
}