'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type WorkflowStep = 'intake' | 'vitals' | 'encounter' | 'orders' | 'lab-results';

interface WorkflowContextType {
  currentStep: WorkflowStep;
  setCurrentStep: (step: WorkflowStep) => void;
  completedSteps: Set<WorkflowStep>;
  completeStep: (step: WorkflowStep) => void;
  canAccessStep: (step: WorkflowStep) => boolean;
  getNextStep: (current: WorkflowStep) => WorkflowStep | null;
  getPreviousStep: (current: WorkflowStep) => WorkflowStep | null;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const stepOrder: WorkflowStep[] = ['intake', 'vitals', 'encounter', 'orders', 'lab-results'];

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('intake');
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const canAccessStep = (step: WorkflowStep): boolean => {
    const stepIndex = stepOrder.indexOf(step);
    if (stepIndex === 0) return true; // First step is always accessible
    
    // Check if previous step is completed
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

  return (
    <WorkflowContext.Provider value={{
      currentStep,
      setCurrentStep,
      completedSteps,
      completeStep,
      canAccessStep,
      getNextStep,
      getPreviousStep
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
