import api from './axios';
import type { ChangeRequest } from '../types';

export async function getChangeRequests(): Promise<ChangeRequest[]> {
    const response = await api.get<ChangeRequest[]>('/api/change-requests');
    return response.data;
}

export async function createChangeRequest(data: {
    taskId: number;
    changeType: string;
    oldValue: string;
    newValue: string;
}): Promise<ChangeRequest> {
    const response = await api.post<ChangeRequest>('/api/change-requests', data);
    return response.data;
}

export async function approveChangeRequest(id: number): Promise<void> {
    await api.put(`/api/change-requests/${id}/approve`);
}

export async function rejectChangeRequest(id: number): Promise<void> {
    await api.put(`/api/change-requests/${id}/reject`);
}