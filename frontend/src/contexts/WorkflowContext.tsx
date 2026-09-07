'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type DoctorWorkflowStep = 'intake' | 'vitals' | 'encounter' | 'orders' | 'lab-results';
export type ReceptionistWorkflowStep = 'queue' | 'registration' | 'appointments' | 'billing';
export type NurseWorkflowStep = 'triage' | 'vitals' | 'intake';
export type LaboratoristWorkflowStep = 'pending' | 'in-progress' | 'completed';
export type AdminWorkflowStep = 'overview' | 'staff' | 'appointments' | 'billing' | 'settings';

export type WorkflowStep = 
  | DoctorWorkflowStep 
  | ReceptionistWorkflowStep 
  | NurseWorkflowStep 
  | LaboratoristWorkflowStep 
  | AdminWorkflowStep;

interface WorkflowContextType {
  currentStep: WorkflowStep;
  setCurrentStep: (step: WorkflowStep) => void;
  completedSteps: Set<WorkflowStep>;
  completeStep: (step: WorkflowStep) => void;
  canAccessStep: (step: WorkflowStep) => boolean;
  getNextStep: (current: WorkflowStep) => WorkflowStep | null;
  getPreviousStep: (current: WorkflowStep) => WorkflowStep | null;
  resetWorkflow: () => void;
  setWorkflowSteps: (steps: WorkflowStep[]) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const defaultWorkflows: Record<string, WorkflowStep[]> = {
  doctor: ['intake', 'vitals', 'encounter', 'orders', 'lab-results'],
  receptionist: ['queue', 'registration', 'appointments', 'billing'],
  nurse: ['triage', 'vitals', 'intake'],
  laboratorist: ['pending', 'in-progress', 'completed'],
  admin: ['overview', 'staff', 'appointments', 'billing', 'settings']
};

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('intake');
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());
  const [stepOrder, setStepOrder] = useState<WorkflowStep[]>(defaultWorkflows.doctor);

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const canAccessStep = (step: WorkflowStep): boolean => {
    const stepIndex = stepOrder.indexOf(step);
    if (stepIndex === 0) return true;
    
    const previousStep = stepOrder[stepIndex - 1];
    return completedSteps.has(previousStep);
  };

  const getNextStep = (current: WorkflowStep): WorkflowStep | null => {
    const currentIndex = stepOrder.indexOf(current);
    if (currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    return null;
  };

  const getPreviousStep = (current: WorkflowStep): WorkflowStep | null => {
    const currentIndex = stepOrder.indexOf(current);
    if (currentIndex > 0) {
      return stepOrder[currentIndex - 1];
    }
    return null;
  };

  const resetWorkflow = () => {
    setCompletedSteps(new Set());
    setCurrentStep(stepOrder[0]);
  };

  const setWorkflowSteps = (steps: WorkflowStep[]) => {
    setStepOrder(steps);
    setCurrentStep(steps[0]);
    setCompletedSteps(new Set());
  };

  return (
    <WorkflowContext.Provider value={{
      currentStep,
      setCurrentStep,
      completedSteps,
      completeStep,
      canAccessStep,
      getNextStep,
      getPreviousStep,
      resetWorkflow,
      setWorkflowSteps
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
