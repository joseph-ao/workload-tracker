import api from './axios';
import type { User } from '../types';

export async function loginUser(email: string, password: string): Promise<User> {
    const response = await api.post<User>('/api/auth/login', { email, password });
    return response.data;
}