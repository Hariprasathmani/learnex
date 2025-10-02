import { useState } from 'react';
import { Plus, FileText, Trash2, Eye, Upload, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function Notes() {
  const { notes, addNote, deleteNote, updateNote } = useApp();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileType, setFileType] = useState<'text' | 'pdf'>('text');

  const handleUpload = () => {
    if (!title.trim() || (fileType === 'text' && !content.trim())) {
      return;
    }

    addNote({
      title,
      content: fileType === 'text' ? content : undefined,
      fileUrl: fileType === 'pdf' ? 'placeholder.pdf' : undefined,
      fileType,
    });

    setTitle('');
    setContent('');
    setShowUploadModal(false);
  };

  const handleView = (noteId: string) => {
    setSelectedNote(noteId);
    setShowViewModal(true);
    updateNote(noteId, { lastAccessedAt: new Date() });
  };

  const viewedNote = notes.find(n => n.id === selectedNote);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Notes</h1>
          <p className="text-gray-600">Upload and manage your study materials</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Upload New Note</span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-md text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
          <p className="text-gray-600 mb-6">Start by uploading your first study note</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Upload Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{note.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {note.fileType === 'pdf' ? 'PDF Document' : 'Text Note'}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Last accessed: {new Date(note.lastAccessedAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => handleView(note.id)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Eye className="w-4 h-4" />
                <span>View Note</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload New Note</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="e.g., Biology Chapter 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Type
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setFileType('text')}
                    className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                      fileType === 'text'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Text Note
                  </button>
                  <button
                    onClick={() => setFileType('pdf')}
                    className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                      fileType === 'pdf'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    PDF Upload
                  </button>
                </div>
              </div>

              {fileType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Type or paste your notes here..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-600 transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF files up to 10MB</p>
                    <input type="file" accept=".pdf" className="hidden" />
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                >
                  Upload Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{viewedNote.title}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {viewedNote.fileType === 'text' ? (
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {viewedNote.content}
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">PDF viewing would be available here</p>
                <p className="text-sm text-gray-500 mt-2">File: {viewedNote.fileUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
