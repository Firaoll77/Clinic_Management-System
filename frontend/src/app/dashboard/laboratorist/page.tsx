'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api';
import {
  Beaker,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface LabAssignment {
  id: string;
  labOrderId: string;
  labTechId: string;
  assignedBy: string;
  assignedAt: string;
  status: string;
  labOrder: {
    id: string;
    patientId: string;
    orderedBy: string;
    status: string;
    orderedAt: string;
    priority: string;
    notes?: string;
    encounter: {
      id: string;
      visitStatus: string;
      chiefComplaint: string;
      patient: {
        firstName: string;
        lastName: string;
        mrn: string;
        dob: string;
        gender: string;
      };
    };
  };
}

export default function LaboratoristDashboardPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [assignments, setAssignments] = useState<LabAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedAssignmentForResults, setSelectedAssignmentForResults] = useState<LabAssignment | null>(null);
  const [submittingResult, setSubmittingResult] = useState(false);

  const [resultForm, setResultForm] = useState({
    value: '',
    unit: '',
    referenceRange: '',
    flag: 'N' as 'N' | 'H' | 'L',
    notes: ''
  });

  useEffect(() => {
    // Load availability from localStorage
    const savedAvailability = localStorage.getItem('labTechAvailability');
    if (savedAvailability !== null) {
      setIsAvailable(JSON.parse(savedAvailability));
    }
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await apiClient.get<{ assignments: LabAssignment[] }>('/assignments/lab-tech/my-assignments');
      if (response.data) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error('Failed to fetch lab assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      const response = await apiClient.post('/assignments/staff/toggle-availability', {
        isAvailable: newAvailability
      });

      if (response.data) {
        setIsAvailable(newAvailability);
        localStorage.setItem('labTechAvailability', JSON.stringify(newAvailability));
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      await apiClient.post(`/assignments/lab-tech/assignment/${assignmentId}/respond`, {
        action: 'accept'
      });
      fetchAssignments();
    } catch (error) {
      console.error('Failed to accept assignment:', error);
    }
  };

  const handleRejectAssignment = async (assignmentId: string) => {
    try {
      await apiClient.post(`/assignments/lab-tech/assignment/${assignmentId}/respond`, {
        action: 'reject',
        rejectionReason: 'Not available'
      });
      fetchAssignments();
    } catch (error) {
      console.error('Failed to reject assignment:', error);
    }
  };

  const handleOpenResultModal = (assignment: LabAssignment) => {
    setSelectedAssignmentForResults(assignment);
    setResultForm({
      value: '',
      unit: '',
      referenceRange: '',
      flag: 'N',
      notes: ''
    });
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForResults) return;

    setSubmittingResult(true);
    try {
      const resultRes = await apiClient.post('/lab/results', {
        labOrderId: selectedAssignmentForResults.labOrderId,
        value: resultForm.value,
        unit: resultForm.unit,
        referenceRange: resultForm.referenceRange,
        flag: resultForm.flag,
        notes: resultForm.notes
      });

      if (resultRes.error) {
        showError(`Failed to save results: ${resultRes.error}`);
        setSubmittingResult(false);
        return;
      }

      await apiClient.post(`/lab/orders/${selectedAssignmentForResults.labOrderId}/complete`, {});

      showSuccess('Lab results saved and order completed successfully!');
      setSelectedAssignmentForResults(null);
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting lab result:', error);
      showError('An error occurred while saving lab results');
    } finally {
      setSubmittingResult(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ROUTINE': return 'bg-gray-100 text-gray-700';
      case 'URGENT': return 'bg-orange-100 text-orange-700';
      case 'STAT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEncounterStatusColor = (status: string) => {
    switch (status) {
      case 'TRIAGE': return 'bg-blue-50 text-blue-700';
      case 'DOCTOR_CONSULT': return 'bg-green-50 text-green-700';
      case 'LAB_PENDING': return 'bg-yellow-50 text-yellow-700';
      case 'LAB_READY': return 'bg-purple-50 text-purple-700';
      case 'BILLING': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lab Technician Dashboard</h1>
        <button
          onClick={handleToggleAvailability}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            isAvailable
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {isAvailable ? (
            <>
              <ToggleRight className="h-5 w-5 mr-2" />
              Available
            </>
          ) : (
            <>
              <ToggleLeft className="h-5 w-5 mr-2" />
              Unavailable
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No lab assignments found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                    {assignment.labOrder.priority && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.labOrder.priority)}`}>
                        {assignment.labOrder.priority}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(assignment.assignedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {assignment.labOrder.encounter.patient.firstName} {assignment.labOrder.encounter.patient.lastName}
                </h3>
                <p className="text-sm text-gray-500">MRN: {assignment.labOrder.encounter.patient.mrn}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getEncounterStatusColor(assignment.labOrder.encounter.visitStatus)}`}>
                    {assignment.labOrder.encounter.visitStatus.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {assignment.labOrder.encounter.patient.gender}, {new Date(assignment.labOrder.encounter.patient.dob).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lab Order ID:</span>
                    <span className="font-medium">{assignment.labOrderId.substring(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Status:</span>
                    <span className="font-medium">{assignment.labOrder.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Chief Complaint:</span>
                    <p className="font-medium text-gray-900 mt-1">{assignment.labOrder.encounter.chiefComplaint}</p>
                  </div>
                  {assignment.labOrder.notes && (
                    <div>
                      <span className="text-gray-500">Order Notes:</span>
                      <p className="font-medium text-gray-900 mt-1">{assignment.labOrder.notes}</p>
                    </div>
                  )}
                </div>
                {assignment.status === 'PENDING' && (
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleAcceptAssignment(assignment.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectAssignment(assignment.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {assignment.status === 'ACCEPTED' && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleOpenResultModal(assignment)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <Beaker className="h-4 w-4" />
                      <span>Enter Results</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enter Lab Results Modal */}
      {selectedAssignmentForResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enter Lab Results</h3>
                <p className="text-sm text-gray-500">
                  Patient: {selectedAssignmentForResults.labOrder.encounter.patient.firstName} {selectedAssignmentForResults.labOrder.encounter.patient.lastName} (MRN: {selectedAssignmentForResults.labOrder.encounter.patient.mrn})
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForResults(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleResultSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result Value *</label>
                <input
                  type="text"
                  required
                  value={resultForm.value}
                  onChange={(e) => setResultForm({ ...resultForm, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 14.2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={resultForm.unit}
                    onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., g/dL, mg/dL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Range</label>
                  <input
                    type="text"
                    value={resultForm.referenceRange}
                    onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., 12.0 - 16.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flag Indicator</label>
                <select
                  value={resultForm.flag}
                  onChange={(e) => setResultForm({ ...resultForm, flag: e.target.value as 'N' | 'H' | 'L' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="N">Normal (N)</option>
                  <option value="H">High (H)</option>
                  <option value="L">Low (L)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technician Notes</label>
                <textarea
                  value={resultForm.notes}
                  onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-20"
                  placeholder="Sample observations or notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedAssignmentForResults(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResult}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Beaker className="h-4 w-4" />
                  <span>{submittingResult ? 'Saving...' : 'Save & Complete Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

