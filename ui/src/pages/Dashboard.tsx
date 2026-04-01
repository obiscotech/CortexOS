import { useEffect, useState } from 'react';
import { Plus, Brain, TrendingUp, Settings as SettingsIcon, Crown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DotGridBackground } from '../components/DotGridBackground';
import { SystemDashboard } from '../components/SystemDashboard';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { ChatInterface } from '../components/ChatInterface';
import { CortexLogo } from '../components/CortexLogo';
import { useCortexStore } from '../store/cortex';
import { cortexApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { tasks, selectedTask, systemStatus, setTasks, setSelectedTask, setSystemStatus, addTask } = useCortexStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, statusRes] = await Promise.all([
        cortexApi.getTasks(),
        cortexApi.getSystemStatus(),
      ]);
      setTasks(tasksRes.data.tasks);
      setSystemStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreateTask = async (goal: string) => {
    try {
      const response = await cortexApi.executeTask(goal, parseInt(user?.id || '1'));
      addTask(response.data.task);
      await loadData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <DotGridBackground />
      
      <div className="relative z-10">
        <header className="glass-panel mx-4 mt-4 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CortexLogo className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold gradient-text font-mosaic">CortexOS</h1>
                <p className="text-beige-600 text-sm font-modern">Intelligent Agent Operating System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/master')}
                className="btn-secondary flex items-center gap-2"
              >
                <Crown className="w-5 h-5" />
                <span>Master</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="btn-secondary flex items-center gap-2"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <SystemDashboard status={systemStatus} />
            </div>
            <div className="lg:col-span-1">
              <ChatInterface />
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text font-mosaic">Recent Tasks</h2>
              <div className="flex items-center gap-2 text-sm text-beige-600 font-modern">
                <TrendingUp className="w-4 h-4" />
                <span>{tasks.length} total tasks</span>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-dark-hover mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-beige-700" />
                </div>
                <p className="text-beige-600 mb-4 font-modern">No tasks yet</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-mosaic-gold hover:text-mosaic-bronze transition-colors font-modern"
                >
                  Create your first task
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
