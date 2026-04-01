import { motion } from 'framer-motion';
import { Activity, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { SystemStatus } from '../store/cortex';

interface SystemDashboardProps {
  status: SystemStatus | null;
}

export function SystemDashboard({ status }: SystemDashboardProps) {
  if (!status) {
    return (
      <div className="glass-panel p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-dark-hover rounded w-1/4"></div>
          <div className="h-20 bg-dark-hover rounded"></div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Active Tasks',
      value: status.tasks.executing,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Queue',
      value: status.queue.waiting,
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Completed',
      value: status.tasks.completed,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Failed',
      value: status.tasks.failed,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold gradient-text mb-6">System Status</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-lg p-4 border border-dark-border`}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </span>
            </div>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-dark-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Available Tools</span>
          <span className="text-primary font-semibold">{status.tools}</span>
        </div>
      </div>
    </div>
  );
}
