import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, Loader, Star } from 'lucide-react';
import { Task, Step } from '../store/cortex';
import { cortexApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    loadTaskDetails();
  }, [task.id]);

  const loadTaskDetails = async () => {
    try {
      const response = await cortexApi.getTaskStatus(task.id);
      setSteps(response.data.steps);
    } catch (error) {
      console.error('Failed to load task details:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await cortexApi.recordFeedback(task.id, rating, comment, task.created_by || 1);
      setShowFeedback(false);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'executing':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="glass-panel p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">{task.goal}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Task #{task.id}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                <span>•</span>
                <span className="capitalize">{task.status}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {steps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Execution Steps</h3>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-dark-bg border border-dark-border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStepIcon(step.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-400">
                            Step {index + 1}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {step.status}
                          </span>
                        </div>
                        <p className="text-gray-200">{step.action}</p>
                        {step.result && (
                          <p className="text-sm text-gray-400 mt-2">{step.result}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.status === 'completed' && (
            <div className="border-t border-dark-border pt-6">
              {!showFeedback ? (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="w-full px-4 py-3 bg-dark-hover hover:bg-dark-border text-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5" />
                  <span>Provide Feedback</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-200">Rate this execution</h3>
                  
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => setRating(value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            value <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your comments (optional)..."
                    className="w-full h-24 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="flex-1 px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={rating === 0}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
