'use client';

import { useState, useMemo } from 'react';
import { Goal, Note, GoalCategory, GoalStatus, NoteType, NoteVisibility } from '@/lib/types';
import { getGoalsByMember, getNotesByMember, createGoal, updateGoal, deleteGoal, createNote, updateNote, deleteNote } from '@/lib/dataStore';
import { Target, FileText, Plus, Edit2, Trash2, CheckCircle, Pause, X } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import ConfirmDialog from './ConfirmDialog';

interface TrainingTabProps {
  memberId: string;
  memberName: string;
  currentStaffId: string;
  currentStaffName: string;
}

const goalTemplates: { category: GoalCategory; title: string; description: string }[] = [
  { category: 'weight-loss', title: 'Lose 10 pounds', description: 'Achieve healthy weight loss through consistent training and nutrition' },
  { category: 'weight-loss', title: 'Lose 20 pounds', description: 'Long-term weight loss goal with sustainable habits' },
  { category: 'strength', title: 'Increase bench press by 20%', description: 'Build upper body strength progressively' },
  { category: 'strength', title: 'Complete 10 pull-ups', description: 'Develop back and arm strength' },
  { category: 'attendance', title: 'Attend 3x per week', description: 'Build consistent training habit' },
  { category: 'attendance', title: 'Attend 4x per week', description: 'Increase training frequency' },
  { category: 'mobility', title: 'Touch toes without bending knees', description: 'Improve hamstring flexibility' },
  { category: 'mobility', title: 'Full squat depth', description: 'Achieve proper squat form and mobility' },
  { category: 'rehab', title: 'Return to training post-injury', description: 'Safely rebuild strength and mobility' },
];

const noteTemplates: { type: NoteType; title: string; content: string }[] = [
  { type: 'session', title: 'Training Session', content: 'Focus: \nExercises completed: \nRPE: /10\nNotes: ' },
  { type: 'assessment', title: 'Fitness Assessment', content: 'Strengths: \nAreas for improvement: \nRecommendations: ' },
  { type: 'injury', title: 'Injury Update', content: 'Injury: \nStatus: \nModifications needed: \nNext steps: ' },
  { type: 'nutrition', title: 'Nutrition Check-in', content: 'Current habits: \nChallenges: \nRecommendations: ' },
  { type: 'general', title: 'General Note', content: '' },
];

export default function TrainingTab({ memberId, memberName, currentStaffId, currentStaffName }: TrainingTabProps) {
  const [goals, setGoals] = useState<Goal[]>(() => getGoalsByMember(memberId));
  const [notes, setNotes] = useState<Note[]>(() => getNotesByMember(memberId));
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'goal' | 'note'; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'goals' | 'notes'>('goals');
  
  const { success, error } = useToast();

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals]);

  const handleCreateGoal = (goalData: Omit<Goal, 'id' | 'createdDate' | 'updatedDate'>) => {
    const result = createGoal(goalData);
    if (result.success && result.goal) {
      setGoals([...goals, result.goal]);
      success('Goal created successfully');
      setShowGoalModal(false);
    } else {
      error('Failed to create goal');
    }
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    const result = updateGoal(goalId, updates);
    if (result.success && result.goal) {
      setGoals(goals.map(g => g.id === goalId ? result.goal! : g));
      success('Goal updated successfully');
      setEditingGoal(null);
      setShowGoalModal(false);
    } else {
      error('Failed to update goal');
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    const result = deleteGoal(goalId);
    if (result.success) {
      setGoals(goals.filter(g => g.id !== goalId));
      success('Goal deleted successfully');
      setConfirmDelete(null);
    } else {
      error('Failed to delete goal');
    }
  };

  const handleCreateNote = (noteData: Omit<Note, 'id' | 'createdDate' | 'updatedDate'>) => {
    const result = createNote(noteData);
    if (result.success && result.note) {
      setNotes([result.note, ...notes]);
      success('Note added successfully');
      setShowNoteModal(false);
    } else {
      error('Failed to add note');
    }
  };

  const handleUpdateNote = (noteId: string, updates: Partial<Note>) => {
    const result = updateNote(noteId, updates);
    if (result.success && result.note) {
      setNotes(notes.map(n => n.id === noteId ? result.note! : n));
      success('Note updated successfully');
      setEditingNote(null);
      setShowNoteModal(false);
    } else {
      error('Failed to update note');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const result = deleteNote(noteId);
    if (result.success) {
      setNotes(notes.filter(n => n.id !== noteId));
      success('Note deleted successfully');
      setConfirmDelete(null);
    } else {
      error('Failed to delete note');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'goals'
              ? 'border-[rgb(172,19,5)] text-[rgb(172,19,5)]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target size={18} />
            Goals ({activeGoals.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-[rgb(172,19,5)] text-[rgb(172,19,5)]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={18} />
            Session Notes ({notes.length})
          </div>
        </button>
      </div>

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Client Goals</h3>
            <button
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
            >
              <Plus size={18} />
              Add Goal
            </button>
          </div>

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Active Goals</h4>
              {activeGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => {
                    setEditingGoal(goal);
                    setShowGoalModal(true);
                  }}
                  onDelete={() => setConfirmDelete({ type: 'goal', id: goal.id })}
                  onUpdateStatus={(status) => handleUpdateGoal(goal.id, { status })}
                />
              ))}
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Completed Goals</h4>
              {completedGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => {
                    setEditingGoal(goal);
                    setShowGoalModal(true);
                  }}
                  onDelete={() => setConfirmDelete({ type: 'goal', id: goal.id })}
                  onUpdateStatus={(status) => handleUpdateGoal(goal.id, { status })}
                />
              ))}
            </div>
          )}

          {goals.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Target size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No goals set yet</p>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
              >
                Create First Goal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Session Notes</h3>
            <button
              onClick={() => {
                setEditingNote(null);
                setShowNoteModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
            >
              <Plus size={18} />
              Add Note
            </button>
          </div>

          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => {
                    setEditingNote(note);
                    setShowNoteModal(true);
                  }}
                  onDelete={() => setConfirmDelete({ type: 'note', id: note.id })}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No session notes yet</p>
              <button
                onClick={() => {
                  setEditingNote(null);
                  setShowNoteModal(true);
                }}
                className="px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
              >
                Add First Note
              </button>
            </div>
          )}
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          memberId={memberId}
          currentStaffId={currentStaffId}
          onSave={(goalData) => {
            if (editingGoal) {
              handleUpdateGoal(editingGoal.id, goalData);
            } else {
              if (!goalData.title || !goalData.category || !goalData.targetDate) {
                error('Please fill in all required fields');
                return;
              }
              handleCreateGoal({
                memberId,
                title: goalData.title,
                description: goalData.description || '',
                category: goalData.category,
                targetDate: goalData.targetDate,
                startValue: goalData.startValue,
                targetValue: goalData.targetValue,
                currentValue: goalData.currentValue,
                units: goalData.units,
                status: 'active',
                progress: 0,
                assignedCoach: currentStaffId,
                memberVisible: goalData.memberVisible ?? true,
                privateNotes: goalData.privateNotes,
              });
            }
          }}
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
        />
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <NoteModal
          note={editingNote}
          memberId={memberId}
          currentStaffId={currentStaffId}
          currentStaffName={currentStaffName}
          onSave={(noteData) => {
            if (editingNote) {
              handleUpdateNote(editingNote.id, noteData);
            } else {
              if (!noteData.title || !noteData.content || !noteData.type || !noteData.visibility) {
                error('Please fill in all required fields');
                return;
              }
              handleCreateNote({
                memberId,
                type: noteData.type,
                title: noteData.title,
                content: noteData.content,
                authorId: currentStaffId,
                authorName: currentStaffName,
                visibility: noteData.visibility,
                classId: noteData.classId,
              });
            }
          }}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete ${confirmDelete.type === 'goal' ? 'Goal' : 'Note'}`}
          message={`Are you sure you want to delete this ${confirmDelete.type}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={() => {
            if (confirmDelete.type === 'goal') {
              handleDeleteGoal(confirmDelete.id);
            } else {
              handleDeleteNote(confirmDelete.id);
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, onUpdateStatus }: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: GoalStatus) => void;
}) {
  const statusColors = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    abandoned: 'bg-gray-100 text-gray-800',
  };

  const categoryLabels = {
    'weight-loss': 'Weight Loss',
    'strength': 'Strength',
    'attendance': 'Attendance',
    'mobility': 'Mobility',
    'rehab': 'Rehab',
    'other': 'Other',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{goal.title}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[goal.status]}`}>
              {goal.status}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {categoryLabels[goal.category]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
          {(goal.startValue || goal.targetValue) && (
            <p className="text-sm text-gray-500">
              Target: {goal.startValue} → {goal.targetValue} {goal.units}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Target Date: {new Date(goal.targetDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {goal.status === 'active' && (
            <>
              <button
                onClick={() => onUpdateStatus('completed')}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="Mark Complete"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => onUpdateStatus('paused')}
                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                title="Pause"
              >
                <Pause size={18} />
              </button>
            </>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      {goal.progress > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{goal.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[rgb(172,19,5)] h-2 rounded-full transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeColors = {
    session: 'bg-blue-100 text-blue-800',
    assessment: 'bg-purple-100 text-purple-800',
    injury: 'bg-red-100 text-red-800',
    nutrition: 'bg-green-100 text-green-800',
    general: 'bg-gray-100 text-gray-800',
  };

  const visibilityIcons = {
    private: '🔒',
    team: '👥',
    member: '👤',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{note.title}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[note.type]}`}>
              {note.type}
            </span>
            <span className="text-sm" title={`Visibility: ${note.visibility}`}>
              {visibilityIcons[note.visibility]}
            </span>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">{note.content}</p>
          <p className="text-xs text-gray-500">
            By {note.authorName} • {new Date(note.createdDate).toLocaleDateString()} at {new Date(note.createdDate).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalModal({ goal, onSave, onClose }: {
  goal: Goal | null;
  memberId: string;
  currentStaffId: string;
  onSave: (goalData: Partial<Goal>) => void;
  onClose: () => void;
}) {
  const defaultTargetDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  })();

  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || 'other' as GoalCategory,
    targetDate: goal?.targetDate || defaultTargetDate,
    startValue: goal?.startValue || '',
    targetValue: goal?.targetValue || '',
    currentValue: goal?.currentValue || '',
    units: goal?.units || '',
    status: goal?.status || 'active' as GoalStatus,
    progress: goal?.progress || 0,
    memberVisible: goal?.memberVisible ?? true,
    privateNotes: goal?.privateNotes || '',
  });

  const [showTemplates, setShowTemplates] = useState(!goal);

  const handleTemplateSelect = (template: typeof goalTemplates[0]) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      category: template.category,
    });
    setShowTemplates(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {goal ? 'Edit Goal' : 'Create Goal'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          {showTemplates && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Choose a template (optional)</h4>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {goalTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTemplateSelect(template)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:border-[rgb(172,19,5)] hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">{template.title}</p>
                    <p className="text-xs text-gray-500">{template.category}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-sm text-[rgb(172,19,5)] hover:underline"
              >
                Skip templates
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                >
                  <option value="weight-loss">Weight Loss</option>
                  <option value="strength">Strength</option>
                  <option value="attendance">Attendance</option>
                  <option value="mobility">Mobility</option>
                  <option value="rehab">Rehab</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Value</label>
                <input
                  type="text"
                  value={formData.startValue}
                  onChange={(e) => setFormData({ ...formData, startValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                  placeholder="e.g., 200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                <input
                  type="text"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                  placeholder="e.g., 180"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                <input
                  type="text"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                  placeholder="e.g., 190"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                <input
                  type="text"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                  placeholder="lbs"
                />
              </div>
            </div>

            {goal && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as GoalStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes (Coach Only)</label>
              <textarea
                value={formData.privateNotes}
                onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                rows={2}
                placeholder="Internal notes not visible to member"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="memberVisible"
                checked={formData.memberVisible}
                onChange={(e) => setFormData({ ...formData, memberVisible: e.target.checked })}
                className="rounded border-gray-300 text-[rgb(172,19,5)] focus:ring-[rgb(172,19,5)]"
              />
              <label htmlFor="memberVisible" className="text-sm text-gray-700">
                Visible to member (future member portal)
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (formData.title && formData.category && formData.targetDate) {
                  onSave(formData);
                }
              }}
              className="flex-1 px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
            >
              {goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteModal({ note, onSave, onClose }: {
  note: Note | null;
  memberId: string;
  currentStaffId: string;
  currentStaffName: string;
  onSave: (noteData: Partial<Note>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    type: note?.type || 'session' as NoteType,
    title: note?.title || '',
    content: note?.content || '',
    visibility: note?.visibility || 'team' as NoteVisibility,
  });

  const [showTemplates, setShowTemplates] = useState(!note);

  const handleTemplateSelect = (template: typeof noteTemplates[0]) => {
    setFormData({
      ...formData,
      type: template.type,
      title: template.title,
      content: template.content,
    });
    setShowTemplates(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {note ? 'Edit Note' : 'Add Session Note'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          {showTemplates && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Choose a template (optional)</h4>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {noteTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTemplateSelect(template)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:border-[rgb(172,19,5)] hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">{template.title}</p>
                    <p className="text-xs text-gray-500">{template.type}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-sm text-[rgb(172,19,5)] hover:underline"
              >
                Skip templates
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as NoteType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                >
                  <option value="session">Training Session</option>
                  <option value="assessment">Assessment</option>
                  <option value="injury">Injury Update</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility *</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as NoteVisibility })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                >
                  <option value="private">🔒 Private (Only Me)</option>
                  <option value="team">👥 Team (Coaches & Managers)</option>
                  <option value="member">👤 Member Visible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                rows={8}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (formData.title && formData.content && formData.type && formData.visibility) {
                  onSave(formData);
                }
              }}
              className="flex-1 px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
            >
              {note ? 'Update Note' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
