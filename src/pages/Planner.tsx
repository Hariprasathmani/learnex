import { useState, useEffect } from 'react';
import { Calendar, Plus, CreditCard as Edit2, Trash2, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { StudySession } from '../types';

export function Planner() {
  const { studyPlans, addStudyPlan, updateStudyPlan } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [newSession, setNewSession] = useState({
    time: '',
    subject: '',
    duration: 60,
  });

  const todaysPlan = studyPlans.find(
    (plan) => new Date(plan.date).toDateString() === selectedDate.toDateString()
  );

  const generateAIPlan = () => {
    const aiGeneratedSessions: StudySession[] = [
      {
        id: crypto.randomUUID(),
        time: '09:00',
        subject: 'Mathematics - Calculus Review',
        duration: 60,
        completed: false,
      },
      {
        id: crypto.randomUUID(),
        time: '10:30',
        subject: 'Biology - Cell Structure',
        duration: 45,
        completed: false,
      },
      {
        id: crypto.randomUUID(),
        time: '14:00',
        subject: 'Chemistry - Organic Compounds',
        duration: 90,
        completed: false,
      },
      {
        id: crypto.randomUUID(),
        time: '16:00',
        subject: 'Physics - Newton\'s Laws',
        duration: 60,
        completed: false,
      },
      {
        id: crypto.randomUUID(),
        time: '19:00',
        subject: 'English - Essay Writing',
        duration: 45,
        completed: false,
      },
    ];

    if (todaysPlan) {
      updateStudyPlan(todaysPlan.id, { schedule: aiGeneratedSessions });
    } else {
      addStudyPlan({
        date: selectedDate,
        schedule: aiGeneratedSessions,
      });
    }
  };

  const handleAddSession = () => {
    if (!newSession.time || !newSession.subject) return;

    const session: StudySession = {
      id: crypto.randomUUID(),
      time: newSession.time,
      subject: newSession.subject,
      duration: newSession.duration,
      completed: false,
    };

    const sessions = todaysPlan ? [...todaysPlan.schedule, session] : [session];
    const sortedSessions = sessions.sort((a, b) => a.time.localeCompare(b.time));

    if (todaysPlan) {
      updateStudyPlan(todaysPlan.id, { schedule: sortedSessions });
    } else {
      addStudyPlan({
        date: selectedDate,
        schedule: sortedSessions,
      });
    }

    setNewSession({ time: '', subject: '', duration: 60 });
    setShowAddModal(false);
  };

  const handleToggleComplete = (sessionId: string) => {
    if (!todaysPlan) return;

    const updatedSchedule = todaysPlan.schedule.map((session) =>
      session.id === sessionId ? { ...session, completed: !session.completed } : session
    );

    updateStudyPlan(todaysPlan.id, { schedule: updatedSchedule });
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!todaysPlan) return;

    const updatedSchedule = todaysPlan.schedule.filter((session) => session.id !== sessionId);
    updateStudyPlan(todaysPlan.id, { schedule: updatedSchedule });
  };

  const completedCount = todaysPlan?.schedule.filter(s => s.completed).length || 0;
  const totalCount = todaysPlan?.schedule.length || 0;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Planner</h1>
          <p className="text-gray-600">Plan and track your daily study sessions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateAIPlan}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate AI Plan</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          {totalCount > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{completedCount}</span> of{' '}
              <span className="font-semibold">{totalCount}</span> completed
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {!todaysPlan || todaysPlan.schedule.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions scheduled</h3>
            <p className="text-gray-600 mb-6">Create your study schedule for this day</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={generateAIPlan}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate with AI</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-full hover:bg-blue-50 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>Add Manually</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysPlan.schedule.map((session) => (
              <div
                key={session.id}
                className={`flex items-center p-5 rounded-xl border-2 transition-all duration-200 ${
                  session.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => handleToggleComplete(session.id)}
                  className="mr-4 flex-shrink-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      session.completed
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300 hover:border-blue-600'
                    }`}
                  >
                    {session.completed && <CheckCircle className="w-5 h-5 text-white" />}
                  </div>
                </button>

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-semibold text-blue-600">{session.time}</span>
                    <span className={`font-medium ${session.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {session.subject}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{session.duration} minutes</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Study Session</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={newSession.time}
                  onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                  placeholder="e.g., Mathematics - Algebra"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={newSession.duration}
                  onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) || 60 })}
                  min="15"
                  step="15"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSession}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                >
                  Add Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
