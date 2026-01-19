import { api } from './axios';

export interface TeamDetailsResponse {
  id: number;
  name: string;
  joinCode: string;
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
    comments: Array<{
      id: number;
      text: string;
      author: { id: number; name: string };
      createdAt: string;
    }>;
    files: Array<{
      id: number;
      fileName: string;
      fileUrl: string;
      fileSize: number | null;
      uploadedBy: { id: number | null; name: string | null };
      createdAt: string;
    }>;
  }>;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeIds: number[];
  deadline?: string;
  dependencyIds?: number[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  deadline?: string | null;
  assigneeIds?: number[];
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

export function addTaskComment(teamId: number, taskId: number, text: string) {
  return api.post(`/teams/${teamId}/tasks/${taskId}/comments`, { text });
}

export function uploadTaskFile(teamId: number, taskId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/teams/${teamId}/tasks/${taskId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function downloadTaskFile(fileUrl: string) {
  return api.get(fileUrl, { responseType: 'blob' });
}

export function removeTeamMember(teamId: number, userId: number) {
  return api.post(`/teams/${teamId}/members/${userId}/remove`);
}

export function leaveTeam(teamId: number) {
  return api.post(`/teams/${teamId}/leave`);
}

export function updateTeamTask(teamId: number, taskId: number, payload: UpdateTaskPayload) {
  return api.patch(`/teams/${teamId}/tasks/${taskId}/edit`, payload);
}

export function deleteTeamTask(teamId: number, taskId: number) {
  return api.delete(`/teams/${teamId}/tasks/${taskId}`);
}
