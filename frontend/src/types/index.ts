export interface User {
    token: string;
    userId: string;
    fullName: string;
    email: string;
    role: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    priority: string;
    complexity: string;
    effortHours: number;
    startDate: string;
    dueDate: string;
    status: string;
    assignedUserId: string;
    assignedUserName: string;
    weight: number;
}

export interface ChangeRequest {
    id: number;
    taskId: number;
    taskTitle: string;
    requestedBy: string;
    changeType: string;
    oldValue: string;
    newValue: string;
    status: string;
    createdAt: string;
}

export interface WorkloadEntry {
    userId: string;
    fullName: string;
    taskCount: number;
    totalWeight: number;
}