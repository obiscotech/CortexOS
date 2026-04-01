import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Task } from '../store/cortex';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'executing':
        return <Loader className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
    }
  };

  const getStatusClass = () => {
    switch (task.status) {
      case 'pending':
        return 'status-pending';
      case 'executing':
        return 'status-executing';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="task-card"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-100 mb-1">
            {task.goal}
          </h3>
          <p className="text-sm text-gray-400">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass()}`}>
          {getStatusIcon()}
          <span className="capitalize">{task.status}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Task #{task.id}</span>
        {task.created_by && <span>• User {task.created_by}</span>}
      </div>
    </motion.div>
  );
}
