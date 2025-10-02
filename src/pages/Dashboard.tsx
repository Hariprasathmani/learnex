import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Award, BookOpen, Brain, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export function Dashboard() {
  const { user } = useAuth();
  const { notes, quizzes, streak, updateStreak } = useApp();

  useEffect(() => {
    updateStreak();
  }, []);

  const lastNote = notes.length > 0
    ? notes.reduce((latest, note) =>
        new Date(note.lastAccessedAt) > new Date(latest.lastAccessedAt) ? note : latest
      )
    : null;

  const lastQuiz = quizzes.length > 0
    ? quizzes.reduce((latest, quiz) =>
        new Date(quiz.createdAt) > new Date(latest.createdAt) ? quiz : quiz
      )
    : null;

  const completedQuizzes = quizzes.filter(q => q.completed).length;
  const averageScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.score / q.totalQuestions) * 100, 0) / quizzes.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-gray-600">Here's your learning progress at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <Flame className="w-8 h-8" />
            <span className="text-4xl font-bold">{streak?.currentStreak || 0}</span>
          </div>
          <h3 className="font-semibold text-lg mb-1">Current Streak</h3>
          <p className="text-orange-100 text-sm">Keep it going!</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8" />
            <span className="text-4xl font-bold">{notes.length}</span>
          </div>
          <h3 className="font-semibold text-lg mb-1">Total Notes</h3>
          <p className="text-blue-100 text-sm">Study materials</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <Brain className="w-8 h-8" />
            <span className="text-4xl font-bold">{completedQuizzes}</span>
          </div>
          <h3 className="font-semibold text-lg mb-1">Quizzes Completed</h3>
          <p className="text-green-100 text-sm">Great progress!</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8" />
            <span className="text-4xl font-bold">{averageScore}%</span>
          </div>
          <h3 className="font-semibold text-lg mb-1">Average Score</h3>
          <p className="text-purple-100 text-sm">Keep improving!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            {lastNote && (
              <Link
                to="/notes"
                className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Last Note</h3>
                  <p className="text-sm text-gray-600">{lastNote.title}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            )}

            {lastQuiz && (
              <Link
                to="/quiz"
                className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-green-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Last Quiz</h3>
                  <p className="text-sm text-gray-600">{lastQuiz.title}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            )}

            {!lastNote && !lastQuiz && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No recent activity yet</p>
                <Link
                  to="/notes"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <span>Start by uploading a note</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>

          {streak && streak.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {streak.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 text-center transform hover:scale-105 transition-transform"
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="mb-2 font-medium">No badges yet</p>
              <p className="text-sm">Keep studying to earn your first badge!</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Longest Streak</span>
              <span className="font-semibold text-gray-900">{streak?.longestStreak || 0} days</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Total Study Days</span>
              <span className="font-semibold text-gray-900">{streak?.totalStudyDays || 0} days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">Ready to study?</h2>
            <p className="text-blue-100">Check out your study plan for today</p>
          </div>
          <Link
            to="/planner"
            className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-full hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
          >
            <Calendar className="w-5 h-5" />
            <span>View Study Plan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
