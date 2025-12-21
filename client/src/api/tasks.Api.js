import axios from "axios";

const API_URL = "http://localhost:3000/tasks";

export const getAllTasks = async () => {
const response = await axios.get(API_URL);
return response.data;
};

export const getTaskById = async (id) => {
const response = await axios.get(API_URL + "/" + id);
return response.data;};

export const createTask = async (taskData) => {
const response = await axios.post(API_URL, taskData);
return response.data;
};

export const updateTask = async (id, updateData) => {
const response = await axios.patch(API_URL + "/" + id, updateData);
return response.data;
};

export const deleteTask = async (id) => {
const response = await axios.delete(API_URL + "/" + id);
return response.data;
};

export const assignTaskToUser = async (taskId, userId) => {
const response = await axios.patch(
    API_URL + "/" + taskID + "/assign-user", 
    { userId: userId }
    );
return response.data;
};

export const assignTaskToProject = async (taskId, projectId) => {
const response = await axios.patch(
    API_URL + "/" + id + "/assign-project",
    { projectId: projectId }
);
return response.data;
};