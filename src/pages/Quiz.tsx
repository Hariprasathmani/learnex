import { useState } from 'react';
import { Brain, Play, CheckCircle, XCircle, Mic, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Question } from '../types';

export function Quiz() {
  const { notes, quizzes, addQuiz, updateQuiz } = useApp();
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const activeQuiz = quizzes.find(q => q.id === activeQuizId);

  const generateQuiz = () => {
    if (!selectedNoteId) return;

    const note = notes.find(n => n.id === selectedNoteId);
    if (!note) return;

    const sampleQuestions: Question[] = [
      {
        id: '1',
        question: 'What is the primary function of mitochondria in cells?',
        options: [
          'Protein synthesis',
          'Energy production (ATP)',
          'DNA replication',
          'Cell division',
        ],
        correctAnswer: 1,
        explanation: 'Mitochondria are known as the powerhouse of the cell because they generate most of the cell\'s supply of ATP (adenosine triphosphate), which is used as a source of chemical energy.',
      },
      {
        id: '2',
        question: 'Which organelle is responsible for photosynthesis in plant cells?',
        options: [
          'Nucleus',
          'Ribosome',
          'Chloroplast',
          'Golgi apparatus',
        ],
        correctAnswer: 2,
        explanation: 'Chloroplasts are organelles found in plant cells that conduct photosynthesis. They contain chlorophyll, which captures light energy and converts it into chemical energy.',
      },
      {
        id: '3',
        question: 'What is the basic unit of life?',
        options: [
          'Atom',
          'Cell',
          'Molecule',
          'Tissue',
        ],
        correctAnswer: 1,
        explanation: 'The cell is considered the basic unit of life. It is the smallest unit that can carry out all the processes of life, including growth, reproduction, and response to stimuli.',
      },
      {
        id: '4',
        question: 'Which structure controls what enters and exits the cell?',
        options: [
          'Cell wall',
          'Cytoplasm',
          'Cell membrane',
          'Nucleus',
        ],
        correctAnswer: 2,
        explanation: 'The cell membrane (also called plasma membrane) is a selectively permeable barrier that controls the movement of substances in and out of the cell, maintaining homeostasis.',
      },
      {
        id: '5',
        question: 'What is the function of ribosomes?',
        options: [
          'Energy production',
          'Protein synthesis',
          'Waste removal',
          'DNA storage',
        ],
        correctAnswer: 1,
        explanation: 'Ribosomes are molecular machines that synthesize proteins by translating messenger RNA (mRNA) into amino acid chains, which then fold into functional proteins.',
      },
    ];

    addQuiz({
      noteId: selectedNoteId,
      title: `Quiz: ${note.title}`,
      questions: sampleQuestions,
      score: 0,
      totalQuestions: sampleQuestions.length,
      completed: false,
    });

    const newQuiz = quizzes[quizzes.length];
    if (newQuiz) {
      setActiveQuizId(newQuiz.id);
    }
  };

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    if (!activeQuiz) return;

    const updatedQuestions = [...activeQuiz.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      userAnswer: answerIndex,
    };

    updateQuiz(activeQuiz.id, { questions: updatedQuestions });

    if (questionIndex < activeQuiz.questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(questionIndex + 1);
      }, 500);
    } else {
      const correctAnswers = updatedQuestions.filter(
        (q) => q.userAnswer === q.correctAnswer
      ).length;
      updateQuiz(activeQuiz.id, {
        questions: updatedQuestions,
        score: correctAnswers,
        completed: true,
        completedAt: new Date(),
      });
      setShowResults(true);
    }
  };

  const handleVoiceAnswer = () => {
    setIsRecording(!isRecording);
    setTimeout(() => {
      setIsRecording(false);
    }, 2000);
  };

  const resetQuiz = () => {
    setActiveQuizId(null);
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setSelectedNoteId('');
  };

  if (!activeQuiz) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Quiz</h1>
          <p className="text-gray-600">Generate instant quizzes from your notes</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-md">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Select a Note to Generate Quiz
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Our AI will create multiple-choice questions with detailed explanations
            </p>

            {notes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You don't have any notes yet</p>
                <a href="/notes" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Upload a note first
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a note
                </label>
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select a note...</option>
                  {notes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={generateQuiz}
                  disabled={!selectedNoteId}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Quiz with AI</span>
                </button>
              </div>
            )}

            {quizzes.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Previous Quizzes</h3>
                <div className="space-y-2">
                  {quizzes.slice(-5).reverse().map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{quiz.title}</p>
                        <p className="text-sm text-gray-600">
                          Score: {quiz.score}/{quiz.totalQuestions} ({Math.round((quiz.score / quiz.totalQuestions) * 100)}%)
                        </p>
                      </div>
                      {quiz.completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((activeQuiz.score / activeQuiz.totalQuestions) * 100);
    const isPassing = percentage >= 70;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-md">
          <div className="max-w-2xl mx-auto text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isPassing ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {isPassing ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <Brain className="w-12 h-12 text-orange-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isPassing ? 'Great Job!' : 'Keep Practicing!'}
            </h2>
            <p className="text-gray-600 mb-8">You completed the quiz</p>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">{percentage}%</div>
              <p className="text-gray-700 font-medium">
                {activeQuiz.score} out of {activeQuiz.totalQuestions} correct
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {activeQuiz.questions.map((question, index) => {
                const isCorrect = question.userAnswer === question.correctAnswer;
                return (
                  <div key={question.id} className="text-left bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start space-x-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {question.options[question.userAnswer || 0]}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-gray-600 mb-2">
                            Correct answer: <span className="text-green-600">
                              {question.options[question.correctAnswer]}
                            </span>
                          </p>
                        )}
                        <div className="bg-blue-50 rounded-lg p-3 mt-3">
                          <p className="text-sm text-gray-700">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetQuiz}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Take Another Quiz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / activeQuiz.totalQuestions) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeQuiz.title}</h1>
        <p className="text-gray-600">
          Question {currentQuestionIndex + 1} of {activeQuiz.totalQuestions}
        </p>
      </div>

      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {currentQuestion.question}
          </h2>

          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQuestionIndex, index)}
                disabled={currentQuestion.userAnswer !== undefined}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                  currentQuestion.userAnswer === index
                    ? index === currentQuestion.correctAnswer
                      ? 'border-green-600 bg-green-50'
                      : 'border-red-600 bg-red-50'
                    : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    currentQuestion.userAnswer === index
                      ? index === currentQuestion.correctAnswer
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 font-medium text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleVoiceAnswer}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-200 ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>{isRecording ? 'Listening...' : 'Voice Answer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
