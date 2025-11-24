'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllLeads, updateLeadStatus, getLeadTasks } from '@/lib/dataStore';
import { Lead } from '@/lib/types';

export default function LeadPipeline() {
  const { location } = useApp();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const leads = getAllLeads().filter(l => l.location === location);
  const tasks = getLeadTasks();

  const stages = [
    { id: 'new-lead', name: 'New Lead', color: 'bg-gray-100 border-gray-300' },
    { id: 'trial-booked', name: 'Trial Booked', color: 'bg-purple-100 border-purple-300' },
    { id: 'trial-showed', name: 'Trial Showed', color: 'bg-blue-100 border-blue-300' },
    { id: 'joined', name: 'Joined', color: 'bg-green-100 border-green-300' },
    { id: 'trial-no-join', name: 'No Join', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'cancelled', name: 'Cancelled', color: 'bg-red-100 border-red-300' },
  ];

  const getLeadsForStage = (stageId: string) => {
    return leads.filter(l => l.status === stageId);
  };

  const getOverdueTasks = (leadId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.leadId === leadId && !t.completed && t.dueDate < today).length;
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('leadId', lead.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    updateLeadStatus(leadId, newStatus);
    setSelectedLead(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Pipeline</h1>
        <p className="text-gray-600 mt-1">Drag and drop leads to update their status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map(stage => {
          const stageLeads = getLeadsForStage(stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className={`p-3 ${stage.color} border-b`}>
                <h3 className="font-bold text-gray-900">{stage.name}</h3>
                <p className="text-sm text-gray-600">{stageLeads.length} leads</p>
              </div>

              <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                {stageLeads.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No leads</p>
                ) : (
                  stageLeads.map(lead => {
                    const overdueTasks = getOverdueTasks(lead.id);
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white border border-gray-200 rounded p-3 cursor-move hover:shadow-md transition-shadow"
                      >
                        <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{lead.email}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 capitalize">{lead.source}</span>
                          {overdueTasks > 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              {overdueTasks} overdue
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Lead Details</h2>
              <button onClick={() => setSelectedLead(null)} className="hover:bg-red-700 p-1 rounded">
                ×
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedLead.name}</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900 font-medium">{selectedLead.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="text-gray-900 font-medium capitalize">{selectedLead.source}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-gray-900 font-medium">{selectedLead.createdDate}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <select
                  value={selectedLead.status}
                  onChange={(e) => {
                    updateLeadStatus(selectedLead.id, e.target.value);
                    const newStatus = e.target.value as Lead['status'];
                    setSelectedLead({ ...selectedLead, status: newStatus });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="new-lead">New Lead</option>
                  <option value="trial-booked">Trial Booked</option>
                  <option value="trial-showed">Trial Showed</option>
                  <option value="joined">Joined</option>
                  <option value="trial-no-join">Trial - No Join</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Tasks</p>
                <div className="space-y-2">
                  {tasks.filter(t => t.leadId === selectedLead.id).length === 0 ? (
                    <p className="text-sm text-gray-400">No tasks</p>
                  ) : (
                    tasks.filter(t => t.leadId === selectedLead.id).map(task => (
                      <div key={task.id} className="bg-gray-50 p-3 rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="text-gray-900">{task.description}</p>
                          <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {task.completed ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
