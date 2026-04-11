import api from './axios';
import type { WorkloadEntry } from '../types';

export async function getWorkload(): Promise<WorkloadEntry[]> {
    const response = await api.get<WorkloadEntry[]>('/api/workload');
    return response.data;
}