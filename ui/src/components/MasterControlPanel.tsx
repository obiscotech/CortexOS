import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Settings, BookOpen, Clock, Target, Zap } from 'lucide-react';

export function MasterControlPanel() {
  const [activeTab, setActiveTab] = useState<'teach' | 'preferences' | 'schedule'>('teach');

  const tabs = [
    { id: 'teach', label: 'Teach Task', icon: BookOpen },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'schedule', label: 'Schedule', icon: Clock },
  ];

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mosaic-gold to-mosaic-bronze flex items-center justify-center mosaic-glow">
          <Crown className="w-6 h-6 text-dark-bg" />
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text font-mosaic">Master Control</h2>
          <p className="text-sm text-beige-600 font-modern">Train and configure your agent</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-beige-900/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 font-modern transition-all ${
              activeTab === tab.id
                ? 'text-mosaic-gold border-b-2 border-mosaic-gold'
                : 'text-beige-600 hover:text-beige-400'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'teach' && <TeachTaskPanel />}
        {activeTab === 'preferences' && <PreferencesPanel />}
        {activeTab === 'schedule' && <SchedulePanel />}
      </motion.div>
    </div>
  );
}

function TeachTaskPanel() {
  const [taskName, setTaskName] = useState('');
  const [taskSteps, setTaskSteps] = useState('');
  const [taskCategory, setTaskCategory] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">
          Task Name
        </label>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="chat-input"
          placeholder="e.g., Deploy Application"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">
          Category
        </label>
        <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="chat-input">
          <option value="">Select category</option>
          <option value="automation">Automation</option>
          <option value="communication">Communication</option>
          <option value="data-processing">Data Processing</option>
          <option value="deployment">Deployment</option>
          <option value="monitoring">Monitoring</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">
          Steps (one per line)
        </label>
        <textarea
          value={taskSteps}
          onChange={(e) => setTaskSteps(e.target.value)}
          className="chat-input h-32 resize-none"
          placeholder="1. Check prerequisites&#10;2. Run build command&#10;3. Deploy to server&#10;4. Verify deployment"
        />
      </div>

      <button className="btn-primary w-full">
        <Target className="w-5 h-5" />
        <span>Teach Agent</span>
      </button>
    </div>
  );
}

function PreferencesPanel() {
  return (
    <div className="space-y-4">
      <div className="bg-dark-hover border border-beige-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-beige-200 font-modern">Auto-learn from tasks</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-dark-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mosaic-gold"></div>
          </label>
        </div>
        <p className="text-sm text-beige-600 font-modern">Automatically extract skills from completed tasks</p>
      </div>

      <div className="bg-dark-hover border border-beige-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-beige-200 font-modern">Adaptive strategies</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-dark-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mosaic-gold"></div>
          </label>
        </div>
        <p className="text-sm text-beige-600 font-modern">Adjust execution strategies based on performance</p>
      </div>

      <div className="bg-dark-hover border border-beige-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-beige-200 font-modern">Pattern recognition</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-dark-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mosaic-gold"></div>
          </label>
        </div>
        <p className="text-sm text-beige-600 font-modern">Identify recurring patterns in task execution</p>
      </div>

      <div className="bg-dark-hover border border-beige-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-beige-200 font-modern">Feedback collection</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-dark-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mosaic-gold"></div>
          </label>
        </div>
        <p className="text-sm text-beige-600 font-modern">Request feedback after task completion</p>
      </div>

      <div className="bg-dark-hover border border-beige-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-beige-200 font-modern">Notification alerts</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-dark-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mosaic-gold"></div>
          </label>
        </div>
        <p className="text-sm text-beige-600 font-modern">Receive alerts for task completion and failures</p>
      </div>
    </div>
  );
}

function SchedulePanel() {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">
          Learning Time Window
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input type="time" className="chat-input" defaultValue="09:00" />
          <input type="time" className="chat-input" defaultValue="17:00" />
        </div>
        <p className="text-xs text-beige-600 mt-1 font-modern">Agent will prioritize learning during this time</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">
          Analysis Frequency
        </label>
        <select className="chat-input">
          <option value="hourly">Every Hour</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">
          Skill Extraction Threshold
        </label>
        <input type="range" min="1" max="10" defaultValue="3" className="w-full" />
        <p className="text-xs text-beige-600 mt-1 font-modern">Minimum successful executions before extracting skill</p>
      </div>

      <button className="btn-primary w-full">
        <Zap className="w-5 h-5" />
        <span>Save Schedule</span>
      </button>
    </div>
  );
}
