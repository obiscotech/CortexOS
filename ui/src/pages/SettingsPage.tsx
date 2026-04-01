import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Key, Bell, Shield, Palette } from 'lucide-react';
import { DotGridBackground } from '../components/DotGridBackground';
import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'notifications' | 'security' | 'appearance'>('profile');
  const { user } = useAuth();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="min-h-screen p-4">
      <DotGridBackground />
      
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel p-6 mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-mosaic-gold" />
            <div>
              <h1 className="text-3xl font-bold gradient-text font-mosaic">Settings</h1>
              <p className="text-beige-600 font-modern">Configure your CortexOS experience</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-modern transition-all ${
                    activeTab === tab.id
                      ? 'bg-mosaic-gold/20 text-mosaic-gold border border-mosaic-gold/30'
                      : 'text-beige-600 hover:bg-dark-hover hover:text-beige-400'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6"
            >
              {activeTab === 'profile' && <ProfileSettings user={user} />}
              {activeTab === 'api' && <APISettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'appearance' && <AppearanceSettings />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-beige-100 mb-4 font-mosaic">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">Email</label>
            <input type="email" value={user?.email || ''} disabled className="chat-input bg-dark-hover" />
          </div>
          <div>
            <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">User ID</label>
            <input type="text" value={user?.id || ''} disabled className="chat-input bg-dark-hover" />
          </div>
        </div>
      </div>
    </div>
  );
}

function APISettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-beige-100 mb-4 font-mosaic">API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">LLM Provider</label>
            <select className="chat-input">
              <option value="groq">Groq</option>
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
              <option value="mistral">Mistral</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">API Key</label>
            <input type="password" className="chat-input" placeholder="••••••••••••••••" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-beige-100 mb-4 font-mosaic">Notification Preferences</h2>
      
      <div className="bg-dark-hover border border-beige-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-beige-200 font-modern">Task Completion</p>
            <p className="text-sm text-beige-600 font-modern">Notify when tasks complete</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-dark-surface rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mosaic-gold"></div>
          </label>
        </div>
      </div>

      <div className="bg-dark-hover border border-beige-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-beige-200 font-modern">Task Failures</p>
            <p className="text-sm text-beige-600 font-modern">Notify when tasks fail</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-dark-surface rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mosaic-gold"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-beige-100 mb-4 font-mosaic">Security Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">Current Password</label>
          <input type="password" className="chat-input" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">New Password</label>
          <input type="password" className="chat-input" placeholder="••••••••" />
        </div>
        <button className="btn-primary">Update Password</button>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-beige-100 mb-4 font-mosaic">Appearance</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">Theme</label>
          <select className="chat-input">
            <option value="mosaic">Mosaic (Current)</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-beige-400 mb-2 font-modern">Font Size</label>
          <select className="chat-input">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    </div>
  );
}
