import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const cortexApi = {
  // Tasks
  getTasks: () => api.get('/api/tasks'),
  getTask: (id: number) => api.get(`/api/tasks/${id}`),
  createTask: (goal: string, userId: number) => 
    api.post('/api/tasks', { goal, userId }),
  
  // Cortex Integration
  executeTask: (goal: string, userId: number, options?: any) =>
    api.post('/cortex/execute', { goal, userId, options }),
  getTaskStatus: (taskId: number) =>
    api.get(`/cortex/task/${taskId}`),
  getSystemStatus: () =>
    api.get('/cortex/status'),
  
  // Learning
  getSkills: (userId: number, goal?: string) =>
    api.get('/learning/skills', { params: { userId, goal } }),
  recordFeedback: (taskId: number, rating: number, comment: string, userId: number) =>
    api.post('/learning/feedback', { taskId, rating, comment, userId }),
  getPerformance: (userId: number) =>
    api.get('/learning/performance', { params: { userId } }),
  getLearningReport: (userId: number) =>
    api.get('/learning/report', { params: { userId } }),
  
  // Connectors
  listConnectors: () =>
    api.get('/connectors/list'),
  executeConnector: (connector: string, action: string, params: any) =>
    api.post('/connectors/execute', { connector, action, params }),
  getConnectorHealth: () =>
    api.get('/connectors/health'),
};
