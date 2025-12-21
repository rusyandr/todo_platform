import { api } from './axios';

export interface TeamDetailsResponse {
  id: number;
  name: string;
  joinCode: string;
  deadline?: string | null;
  subject: {
    id: number;
    title: string;
    deadline?: string | null;
  };
  isAdmin: boolean;
  members: Array<{ id: number; name: string; role: 'admin' | 'member' }>;
  tasks: Array<{
    id: number;
    title: string;
    description: string | null;
    deadline: string | null;
    isCompleted: boolean;
    createdAt: string;
    completedById: number | null;
    assignees: Array<{ id: number; name: string }>;
    dependencies: Array<{ id: number; title: string; isCompleted: boolean }>;
  }>;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeIds: number[];
  deadline?: string;
  dependencyIds?: number[];
}

export function getTeamDetails(teamId: number) {
  return api.get<TeamDetailsResponse>(`/teams/${teamId}`);
}

export function createTeamTask(teamId: number, payload: CreateTaskPayload) {
  return api.post(`/teams/${teamId}/tasks`, payload);
}

export function updateTaskStatus(
  teamId: number,
  taskId: number,
  isCompleted: boolean,
) {
  return api.patch(`/teams/${teamId}/tasks/${taskId}`, { isCompleted });
}

