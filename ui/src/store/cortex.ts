import { create } from 'zustand';

export interface Task {
  id: number;
  goal: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface Step {
  id: number;
  task_id: number;
  action: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
}

export interface SystemStatus {
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  tasks: {
    pending: number;
    executing: number;
    completed: number;
    failed: number;
  };
  tools: number;
  timestamp: string;
}

interface CortexStore {
  tasks: Task[];
  selectedTask: Task | null;
  steps: Step[];
  systemStatus: SystemStatus | null;
  isLoading: boolean;
  error: string | null;
  
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setSteps: (steps: Step[]) => void;
  setSystemStatus: (status: SystemStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: number, updates: Partial<Task>) => void;
}

export const useCortexStore = create<CortexStore>((set) => ({
  tasks: [],
  selectedTask: null,
  steps: [],
  systemStatus: null,
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setSteps: (steps) => set({ steps }),
  setSystemStatus: (status) => set({ systemStatus: status }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    selectedTask: state.selectedTask?.id === id 
      ? { ...state.selectedTask, ...updates } 
      : state.selectedTask,
  })),
}));
