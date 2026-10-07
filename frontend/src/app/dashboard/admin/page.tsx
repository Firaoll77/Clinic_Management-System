/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus, 
  UserCheck, 
  UserX, 
  Edit3, 
  Trash2, 
  Archive, 
  RotateCcw, 
  Shield, 
  UserPlus, 
  Eye, 
  RefreshCw, 
  Stethoscope, 
  FileText, 
  Sparkles, 
  Phone, 
  Mail, 
  Building2, 
  Award, 
  X, 
  ChevronRight, 
  FolderArchive,
  Layers,
  Terminal,
  DollarSign,
  Receipt,
  Settings
} from 'lucide-react';

interface StaffProfile {
  id?: string;
  fullName: string;
  phone?: string;
  specialization?: string;
  licenseNo?: string;
  departmentId?: string;
}

interface UserAccount {
  id: string;
  username: string;
  email?: string;
  role: 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'NURSE' | 'LAB_TECH' | 'PHARMACIST' | 'ACCOUNTANT';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  staffProfile?: StaffProfile | null;
}

interface PatientRecord {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phone: string;
  email?: string;
  isArchived: boolean;
  archivedAt?: string;
  lastActivityAt?: string;
  createdAt: string;
}

type TabType = 'overview' | 'staff' | 'patients' | 'billing' | 'audit' | 'settings';
type RoleFilter = 'ALL' | 'DOCTOR' | 'NURSE' | 'ACCOUNTANT' | 'LAB_TECH' | 'RECEPTIONIST' | 'PHARMACIST' | 'ADMIN';
type StatusFilter = 'all' | 'active' | 'inactive';
type PatientFilter = 'active' | 'archived' | 'all';

interface FeeConfig {
  feeType: string;
  name: string;
  description: string;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  patient?: {
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  total: number;
  status: string;
  [key: string]: unknown;
}

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  activeDoctors: number;
  activeStaff?: number;
  pendingTasks: number;
  patientGrowth: string;
}

interface AuditLog {
  id: string;
  time: string;
  action: string;
  user: string;
  type: string;
  status: string;
  createdAt: string;
  fieldName?: string;
  entityType: string;
  actorRole?: string;
  [key: string]: any;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { currentStep, setCurrentStep, completedSteps, completeStep, canAccessStep, getNextStep, getPreviousStep } = useWorkflow();

  // Active Main Tab synced with Workflow currentStep
  const validTabs: TabType[] = ['overview', 'staff', 'patients', 'billing', 'audit', 'settings'];
  const activeTab: TabType = validTabs.includes(currentStep as TabType) ? (currentStep as TabType) : 'overview';

  const setActiveTab = (tab: TabType) => {
    setCurrentStep(tab as never);
  };

  // Billing & Fees State
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([
    { feeType: 'CONSULTATION', name: 'General Doctor Consultation', description: 'Standard physician check-up fee', amount: 50 },
    { feeType: 'URGENT_CONSULTATION', name: 'Urgent / Priority Consultation', description: 'Immediate doctor review fee', amount: 80 },
    { feeType: 'CBC_LAB_TEST', name: 'Complete Blood Count (CBC)', description: 'Full hematology panel and smear', amount: 45 },
    { feeType: 'TRIAGE_FEE', name: 'Nurse Triage & Vitals Check', description: 'Initial nursing assessment fee', amount: 20 },
  ]);
  const [feeConfigsLoading, setFeeConfigsLoading] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<string | null>(null);
  const [editingFeeAmount, setEditingFeeAmount] = useState<number>(0);
  const [adminInvoices, setAdminInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    activeDoctors: 0,
    activeStaff: 0,
    pendingTasks: 0,
    patientGrowth: '0%',
  });

  // Staff State
  const [staffList, setStaffList] = useState<UserAccount[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<RoleFilter>('ALL');
  const [staffStatusFilter, setStaffStatusFilter] = useState<StatusFilter>('all');
  const [staffCounts, setStaffCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    doctors: 0,
    nurses: 0,
    accountants: 0,
    labTechs: 0,
    receptionists: 0,
    pharmacists: 0,
    admins: 0,
  });

  // Staff Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isDeleteStaffOpen, setIsDeleteStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<UserAccount | null>(null);

  // Staff Form
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'DOCTOR' as UserAccount['role'],
    phone: '',
    specialization: '',
    licenseNo: '',
    departmentId: '',
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Patient State
  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientFilterTab, setPatientFilterTab] = useState<PatientFilter>('active');
  const [patientCounts, setPatientCounts] = useState({
    total: 0,
    active: 0,
    archived: 0,
  });

  // Patient Modals
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [patientActionLoading, setPatientActionLoading] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL');
  
  // Fetch audit logs from database
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const response = await apiClient.get<{ logs: AuditLog[] }>('/audit/logs?limit=50');
      if (response.data && response.data.logs) {
        setAuditLogs(response.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Calculate real department loads from staff data
  const departmentLoads = useMemo(() => {
    const activeDoctors = staffList.filter(s => s.role === 'DOCTOR' && s.isActive).length;
    const activeNurses = staffList.filter(s => s.role === 'NURSE' && s.isActive).length;
    const activeLabTechs = staffList.filter(s => s.role === 'LAB_TECH' && s.isActive).length;
    const activeReceptionists = staffList.filter(s => s.role === 'RECEPTIONIST' && s.isActive).length;

    // Calculate load percentage based on staff availability vs optimal ratios
    // Optimal ratios: 1 doctor per 10 patients, 1 nurse per 5 patients, etc.
    const totalPatients = patientCounts.active;
    const doctorLoad = Math.min(100, Math.round((totalPatients / Math.max(1, activeDoctors * 10)) * 100));
    const nurseLoad = Math.min(100, Math.round((totalPatients / Math.max(1, activeNurses * 5)) * 100));
    const labLoad = Math.min(100, Math.round((totalPatients / Math.max(1, activeLabTechs * 15)) * 100));
    const receptionLoad = Math.min(100, Math.round((totalPatients / Math.max(1, activeReceptionists * 25)) * 100));

    return [
      { 
        name: 'General Consultations', 
        load: doctorLoad, 
        activeStaff: `${activeDoctors} Doctors, ${activeNurses} Nurses`, 
        status: doctorLoad > 80 ? 'High Load' : doctorLoad > 60 ? 'Moderate' : 'Optimal',
        color: doctorLoad > 80 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
      },
      { 
        name: 'Emergency & Triage', 
        load: nurseLoad, 
        activeStaff: `${activeNurses} Nurses`, 
        status: nurseLoad > 80 ? 'High Load' : nurseLoad > 60 ? 'Moderate' : 'Optimal',
        color: nurseLoad > 80 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
      },
      { 
        name: 'Laboratory Diagnostics', 
        load: labLoad, 
        activeStaff: `${activeLabTechs} Laboratorists`, 
        status: labLoad > 80 ? 'High Load' : labLoad > 60 ? 'Moderate' : 'Optimal',
        color: labLoad > 80 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
      },
      { 
        name: 'Reception & Intake', 
        load: receptionLoad, 
        activeStaff: `${activeReceptionists} Receptionists`, 
        status: receptionLoad > 80 ? 'High Load' : receptionLoad > 60 ? 'Moderate' : 'Optimal',
        color: receptionLoad > 80 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
      },
    ];
  }, [staffList, patientCounts.active]);

  // Fetch Dashboard Overall KPIs
  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ stats: DashboardStats }>('/dashboard/stats');
      if (response.data && response.data.stats) {
        setStats(prev => ({
          ...prev,
          totalPatients: response.data!.stats.totalPatients || 0,
          todayAppointments: response.data!.stats.todayAppointments || 0,
          activeDoctors: response.data!.stats.activeDoctors || 0,
          pendingTasks: response.data!.stats.pendingTasks || 0,
          patientGrowth: response.data!.stats.patientGrowth || '0%',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  }, []);

  // Fetch Staff List
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (staffSearch.trim()) queryParams.set('search', staffSearch.trim());
      if (staffRoleFilter !== 'ALL') queryParams.set('role', staffRoleFilter);
      if (staffStatusFilter !== 'all') queryParams.set('status', staffStatusFilter);

      const response = await apiClient.get<{ users: UserAccount[]; counts: typeof staffCounts; total: number }>(
        `/users?${queryParams.toString()}`
      );

      if (response.data) {
        setStaffList(response.data.users || []);
        if (response.data.counts) {
          setStaffCounts(response.data.counts);
          setStats(prev => ({ ...prev, activeStaff: response.data!.counts.active }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff', err);
      showToast('Failed to load staff list. Please try again.', 'error');
    } finally {
      setStaffLoading(false);
    }
  }, [staffSearch, staffRoleFilter, staffStatusFilter]);

  // Fetch Patients List
  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (patientSearch.trim()) queryParams.set('search', patientSearch.trim());
      queryParams.set('status', patientFilterTab);

      const response = await apiClient.get<{
        patients: PatientRecord[];
        total: number;
        totalAll: number;
        activeCount: number;
        archivedCount: number;
      }>(`/patients?${queryParams.toString()}`);

      if (response.data) {
        setPatientsList(response.data.patients || []);
        setPatientCounts({
          total: response.data.totalAll || 0,
          active: response.data.activeCount || 0,
          archived: response.data.archivedCount || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch patients', err);
      showToast('Failed to load patient records.', 'error');
    } finally {
      setPatientsLoading(false);
    }
  }, [patientSearch, patientFilterTab]);

  const fetchFeeConfigs = useCallback(async () => {
    setFeeConfigsLoading(true);
    try {
      const response = await apiClient.get<{ fees: FeeConfig[] }>('/billing/fee-configurations');
      if (response.data?.fees && response.data.fees.length > 0) {
        setFeeConfigs(response.data.fees);
      }
    } catch (err) {
      console.error('Failed to fetch fee configs:', err);
    } finally {
      setFeeConfigsLoading(false);
    }
  }, []);

  const fetchAdminInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const response = await apiClient.get<{ invoices: Invoice[] }>('/billing/invoices');
      if (response.data?.invoices) {
        setAdminInvoices(response.data.invoices);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const handleUpdateFee = async (feeType: string, name: string, description: string, amount: number) => {
    try {
      const response = await apiClient.post<{ message: string; fee: FeeConfig }>('/billing/fee-configurations', {
        feeType,
        name,
        description,
        amount
      });
      if (response.error) {
        showToast(response.error, 'error');
        return;
      }
      showToast(`Fee for ${name} updated to $${amount}`, 'success');
      setEditingFeeType(null);
      fetchFeeConfigs();
    } catch (err: unknown) {
      showToast('Failed to update fee configuration', 'error');
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchStaff();
    fetchPatients();
    fetchAuditLogs();
    fetchFeeConfigs();
    fetchAdminInvoices();
    
    // Set up real-time polling for dashboard stats
    const statsInterval = setInterval(() => {
      fetchDashboardStats();
    }, 30000); // Refresh stats every 30 seconds
    
    // Set up real-time polling for staff
    const staffInterval = setInterval(() => {
      fetchStaff();
    }, 60000); // Refresh staff every 60 seconds
    
    // Set up real-time polling for patients
    const patientsInterval = setInterval(() => {
      fetchPatients();
    }, 45000); // Refresh patients every 45 seconds
    
    // Set up real-time polling for audit logs
    const auditInterval = setInterval(() => {
      fetchAuditLogs();
    }, 20000); // Refresh audit logs every 20 seconds
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(staffInterval);
      clearInterval(patientsInterval);
      clearInterval(auditInterval);
    };
  }, [fetchDashboardStats, fetchStaff, fetchPatients, fetchAuditLogs, fetchFeeConfigs, fetchAdminInvoices]);

  // Trigger search on filter changes
  useEffect(() => {
    fetchStaff();
  }, [staffRoleFilter, staffStatusFilter, fetchStaff]);

  useEffect(() => {
    fetchPatients();
  }, [patientFilterTab, fetchPatients]);

  // Handlers for Staff Control
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!staffForm.fullName || !staffForm.username || !staffForm.password || !staffForm.phone) {
      setFormError('Please fill in all required fields (Name, Username, Password, Phone).');
      return;
    }
    if (staffForm.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        fullName: staffForm.fullName,
        username: staffForm.username,
        email: staffForm.email || undefined,
        password: staffForm.password,
        role: staffForm.role,
        phone: staffForm.phone,
        specialization: staffForm.specialization || undefined,
        licenseNo: staffForm.licenseNo || undefined,
        departmentId: staffForm.departmentId || undefined,
      };

      const response = await apiClient.post<{ user: UserAccount; message: string }>('/users', payload);
      
      if (response.error) {
        setFormError(response.error);
        return;
      }

      showToast(`Staff member ${staffForm.fullName} (${staffForm.role}) registered successfully!`);
      setIsAddStaffOpen(false);
      setStaffForm({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'DOCTOR',
        phone: '',
        specialization: '',
        licenseNo: '',
        departmentId: '',
        isActive: true,
      });

      // Add to audit log
      setAuditLogs(prev => [
        {
          id: Date.now().toString(),
          time: 'Just now',
          action: `Added new staff: ${staffForm.fullName} (${staffForm.role})`,
          user: user?.email || 'admin@clinic.com',
          type: 'staff',
          status: 'success',
          createdAt: new Date().toISOString(),
          entityType: 'STAFF'
        },
        ...prev
      ]);

      fetchStaff();
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to create staff member.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditStaffOpen = (member: UserAccount) => {
    setSelectedStaff(member);
    setStaffForm({
      fullName: member.staffProfile?.fullName || '',
      username: member.username || '',
      email: member.email || '',
      password: '',
      role: member.role,
      phone: member.staffProfile?.phone || '',
      specialization: member.staffProfile?.specialization || '',
      licenseNo: member.staffProfile?.licenseNo || '',
      departmentId: member.staffProfile?.departmentId || '',
      isActive: member.isActive,
    });
    setFormError('');
    setIsEditStaffOpen(true);
  };

  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setFormSubmitting(true);
    setFormError('');

    try {
      const payload: Record<string, unknown> = {
        fullName: staffForm.fullName,
        email: staffForm.email,
        role: staffForm.role,
        phone: staffForm.phone,
        specialization: staffForm.specialization || null,
        licenseNo: staffForm.licenseNo || null,
        departmentId: staffForm.departmentId || null,
        isActive: staffForm.isActive,
      };
      if (staffForm.password) {
        payload.password = staffForm.password;
      }

      const response = await apiClient.patch<{ user: UserAccount; message: string }>(`/users/${selectedStaff.id}`, payload);
      if (response.error) {
        setFormError(response.error);
        return;
      }

      showToast(`Updated details for ${staffForm.fullName}.`);
      setIsEditStaffOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to update staff member.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStaffStatus = async (member: UserAccount) => {
    try {
      const nextStatus = !member.isActive;
      const response = await apiClient.patch<{ user: UserAccount }>(`/users/${member.id}`, {
        isActive: nextStatus,
      });

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      showToast(`Staff member ${member.staffProfile?.fullName || member.email} ${nextStatus ? 'activated' : 'deactivated'}.`);
      fetchStaff();
    } catch (err) {
      showToast('Failed to change status.', 'error');
    }
  };

  const handleDeleteStaffConfirm = async () => {
    if (!selectedStaff) return;
    setFormSubmitting(true);
    try {
      const response = await apiClient.delete(`/users/${selectedStaff.id}`);
      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      showToast(`Staff account for ${selectedStaff.staffProfile?.fullName || selectedStaff.username} deleted.`);
      setIsDeleteStaffOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      showToast('Failed to delete staff member.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handlers for Patient Archiving & Restoration
  const handleArchivePatient = async () => {
    if (!selectedPatient) return;
    setPatientActionLoading(true);
    try {
      const response = await apiClient.post(`/patients/${selectedPatient.id}/archive`, {});
      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      showToast(`Patient ${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.mrn}) archived successfully.`);
      setIsArchiveModalOpen(false);
      setSelectedPatient(null);

      // Add to audit log
      setAuditLogs(prev => [
        {
          id: Date.now().toString(),
          time: 'Just now',
          action: `Archived patient ${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.mrn})`,
          user: user?.email || 'admin@clinic.com',
          type: 'patient',
          status: 'warning',
          createdAt: new Date().toISOString(),
          entityType: 'PATIENT'
        },
        ...prev
      ]);

      fetchPatients();
      fetchDashboardStats();
    } catch (err) {
      showToast('Failed to archive patient.', 'error');
    } finally {
      setPatientActionLoading(false);
    }
  };

  const handleRestorePatient = async () => {
    if (!selectedPatient) return;
    setPatientActionLoading(true);
    try {
      const response = await apiClient.post(`/patients/${selectedPatient.id}/restore`, {});
      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      showToast(`Patient ${selectedPatient.firstName} ${selectedPatient.lastName} restored from archive to active roster.`);
      setIsRestoreModalOpen(false);
      setSelectedPatient(null);

      // Add to audit log
      setAuditLogs(prev => [
        {
          id: Date.now().toString(),
          time: 'Just now',
          action: `Restored patient ${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.mrn})`,
          user: user?.email || 'admin@clinic.com',
          type: 'patient',
          status: 'success',
          createdAt: new Date().toISOString(),
          entityType: 'PATIENT'
        },
        ...prev
      ]);

      fetchPatients();
      fetchDashboardStats();
    } catch (err) {
      showToast('Failed to restore patient.', 'error');
    } finally {
      setPatientActionLoading(false);
    }
  };

  // Role Badge Styling Helper
  const getRoleBadge = (role: UserAccount['role']) => {
    switch (role) {
      case 'DOCTOR':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"><Stethoscope className="w-3 h-3 mr-1" /> Doctor</span>;
      case 'NURSE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><Activity className="w-3 h-3 mr-1" /> Nurse</span>;
      case 'ACCOUNTANT':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Award className="w-3 h-3 mr-1" /> Accountant</span>;
      case 'LAB_TECH':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"><Sparkles className="w-3 h-3 mr-1" /> Laboratorist</span>;
      case 'RECEPTIONIST':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200"><Building2 className="w-3 h-3 mr-1" /> Receptionist</span>;
      case 'PHARMACIST':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-200"><FileText className="w-3 h-3 mr-1" /> Pharmacist</span>;
      case 'ADMIN':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300"><Shield className="w-3 h-3 mr-1" /> Administrator</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{role}</span>;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, { title: string; subtitle: string }> = {
      overview: { title: 'Admin Dashboard', subtitle: 'Manage clinic operations, staff, and patient records' },
      staff: { title: 'Staff Management', subtitle: 'Manage registered doctors, nurses, and clinic staff' },
      patients: { title: 'Patient Records', subtitle: 'View active patients, archive records, and restore patients' },
      billing: { title: 'Billing & Fees', subtitle: 'Configure service pricing and review financial transactions' },
      audit: { title: 'Audit Logs', subtitle: 'Track system activity and security events' },
      settings: { title: 'System Settings', subtitle: 'Configure clinic infrastructure and security policies' },
    };
    return titles[activeTab] || titles.overview;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center justify-between min-w-[300px] ${
              toast.type === 'success' ? 'bg-white text-gray-900 border-emerald-200' :
              toast.type === 'error' ? 'bg-white text-gray-900 border-red-200' :
              'bg-white text-gray-900 border-blue-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-lg ${
                toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                toast.type === 'error' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                 toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                 <Activity className="h-4 w-4" />}
              </div>
              <span className="font-medium text-sm">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {activeTab === 'overview' ? 'Administration' :
               activeTab === 'staff' ? 'Staff Management' :
               activeTab === 'patients' ? 'Patient Records' :
               activeTab === 'billing' ? 'Financial' :
               activeTab === 'audit' ? 'System' :
               'Configuration'}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle().title}</h1>
            <p className="text-sm text-gray-600 mt-1">{getPageTitle().subtitle}</p>
          </div>
          {(activeTab === 'staff' || activeTab === 'patients') && (
            <button
              onClick={() => {
                if (activeTab === 'staff') {
                  setStaffForm({
                    fullName: '',
                    username: '',
                    email: '',
                    password: '',
                    role: 'DOCTOR',
                    phone: '',
                    specialization: '',
                    licenseNo: '',
                    departmentId: '',
                    isActive: true,
                  });
                  setFormError('');
                  setIsAddStaffOpen(true);
                }
              }}
              className="px-4 py-2 bg-[#D93344] hover:bg-[#b92b3a] text-white rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{activeTab === 'staff' ? 'Add Staff' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>


      {/* ========================================================================= */}
      {/* TAB 1: OPERATIONAL OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Patients</span>
                <div className="p-2 bg-red-50 rounded-lg text-[#D93344]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{patientCounts.total}</div>
              <div className="text-xs text-gray-500">Active: {patientCounts.active}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Appointments</span>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.todayAppointments}</div>
              <div className="text-xs text-gray-500">Scheduled for today</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Doctors</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Stethoscope className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeDoctors}</div>
              <div className="text-xs text-gray-500">Available for consultation</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Staff</span>
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{staffCounts.active}</div>
              <div className="text-xs text-gray-500">Total: {staffCounts.total}</div>
            </motion.div>
          </div>

          {/* Quick Action Command Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-[#D93344] rounded-lg p-5 text-white shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex p-2 bg-white/10 rounded-lg mb-3 backdrop-blur-sm">
                  <UserPlus className="h-5 w-5 text-red-200" />
                </div>
                <h3 className="text-base font-bold mb-1">Onboard Clinic Staff</h3>
                <p className="text-xs text-red-200 mb-4">
                  Add new doctors, nurses, accountants, or lab technicians with instant system credentials.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('staff');
                  setIsAddStaffOpen(true);
                }}
                className="w-full py-2 bg-white text-[#D93344] font-semibold rounded-md hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Staff Member</span>
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex p-2 bg-red-50 rounded-lg mb-3 text-[#D93344]">
                  <FolderArchive className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Patient Archival Center</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Safely archive inactive medical records or restore previously archived patients anytime.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('patients');
                  setPatientFilterTab('archived');
                }}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-[#D93344] font-semibold rounded-md transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <span>View {patientCounts.archived} Archived Records</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex p-2 bg-red-50 rounded-lg mb-3 text-[#D93344]">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">System Audit & Security</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Track real-time security events, staff edits, role changes, and system access logs.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('audit')}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-[#D93344] font-semibold rounded-md transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <span>Open Audit Log Viewer</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>

          {/* Department Workloads & Live Audit Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Department Operational Workload */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-[#D93344]" />
                    Department Real-Time Capacity
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Live workload and staffing metrics across clinic wings</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                  All Systems Operational
                </span>
              </div>

              {/* Staff Sparsity Visualization */}
              <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-900">Staff Distribution Overview</span>
                  <span className="text-xs text-gray-500">{staffCounts.total} Total Staff</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { role: 'DOCTOR', count: staffCounts.doctors, color: 'bg-blue-100', icon: Stethoscope },
                    { role: 'NURSE', count: staffCounts.nurses, color: 'bg-emerald-100', icon: Activity },
                    { role: 'LAB_TECH', count: staffCounts.labTechs, color: 'bg-purple-100', icon: Sparkles },
                    { role: 'RECEPTIONIST', count: staffCounts.receptionists, color: 'bg-cyan-100', icon: Building2 },
                  ].map((staff) => (
                    <div key={staff.role} className="text-center">
                      <div className={`w-full aspect-square rounded-lg ${staff.color} flex items-center justify-center mb-1 relative`}>
                        <staff.icon className="h-5 w-5 text-gray-700" />
                        <span className="absolute -top-1 -right-1 bg-[#D93344] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {staff.count}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium truncate block">{staff.role.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Load Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departmentLoads.map(dept => (
                  <div key={dept.name} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{dept.name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        dept.status === 'High Load' ? 'bg-amber-100 text-amber-800' : dept.status === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {dept.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 mr-3">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${dept.color} transition-all duration-700`}
                            style={{ width: `${dept.load}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{dept.load}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Staff: {dept.activeStaff}</span>
                      <span className={`font-medium ${
                        dept.load > 80 ? 'text-amber-600' : dept.load > 60 ? 'text-yellow-600' : 'text-emerald-600'
                      }`}>
                        {dept.load > 80 ? 'Overloaded' : dept.load > 60 ? 'Moderate' : 'Optimal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Live System Feed */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center">
                    <Terminal className="h-4 w-4 mr-2 text-[#D93344]" />
                    Live Activity Feed
                  </h3>
                  <button onClick={() => setActiveTab('audit')} className="text-xs text-[#D93344] font-semibold hover:underline">
                    View full
                  </button>
                </div>

                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-2 text-xs">
                      <div className="mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{log.action}</p>
                        <p className="text-gray-500 mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString()} • {log.actorRole} • {log.entityType}
                        </p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center text-gray-500 text-xs py-4">
                      No recent audit activity
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <span className="text-xs text-gray-500">Continuous audit streaming active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REAL-TIME STAFF CONTROL */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Role Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Roles', count: staffCounts.total },
              { id: 'DOCTOR', label: 'Doctors', count: staffCounts.doctors },
              { id: 'NURSE', label: 'Nurses', count: staffCounts.nurses },
              { id: 'ACCOUNTANT', label: 'Accountants', count: staffCounts.accountants },
              { id: 'LAB_TECH', label: 'Laboratorists', count: staffCounts.labTechs },
              { id: 'PHARMACIST', label: 'Pharmacists', count: staffCounts.pharmacists },
              { id: 'RECEPTIONIST', label: 'Receptionists', count: staffCounts.receptionists },
              { id: 'ADMIN', label: 'Admins', count: staffCounts.admins },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setStaffRoleFilter(chip.id as RoleFilter)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-2 border ${
                  staffRoleFilter === chip.id
                    ? 'bg-[#D93344] text-white border-[#D93344]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  staffRoleFilter === chip.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Status Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, phone, license number, or specialization..."
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900 bg-gray-50/50"
              />
              {staffSearch && (
                <button
                  onClick={() => setStaffSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="flex items-center bg-gray-100 rounded-md p-1 text-xs font-medium text-gray-700">
                <button
                  onClick={() => setStaffStatusFilter('all')}
                  className={`px-3 py-1.5 rounded transition-all ${staffStatusFilter === 'all' ? 'bg-white shadow text-[#D93344]' : 'hover:text-gray-900'}`}
                >
                  All ({staffCounts.total})
                </button>
                <button
                  onClick={() => setStaffStatusFilter('active')}
                  className={`px-3 py-1.5 rounded transition-all ${staffStatusFilter === 'active' ? 'bg-white shadow text-emerald-700' : 'hover:text-gray-900'}`}
                >
                  Active ({staffCounts.active})
                </button>
                <button
                  onClick={() => setStaffStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded transition-all ${staffStatusFilter === 'inactive' ? 'bg-white shadow text-amber-700' : 'hover:text-gray-900'}`}
                >
                  Inactive ({staffCounts.inactive})
                </button>
              </div>

              {(staffSearch || staffRoleFilter !== 'ALL' || staffStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStaffSearch('');
                    setStaffRoleFilter('ALL');
                    setStaffStatusFilter('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-[#D93344] hover:bg-red-50 rounded-md border border-red-200 transition-colors whitespace-nowrap"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Staff Table / Roster */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {staffLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D93344] mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading staff members...</p>
              </div>
            ) : staffList.length === 0 ? (
              /* No Results Empty State */
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-red-50 text-[#D93344] rounded-lg flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <UserX className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No staff members found</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                  {staffSearch || staffRoleFilter !== 'ALL' || staffStatusFilter !== 'all'
                    ? `No staff match your current search "${staffSearch || staffRoleFilter}". Try resetting your filters.`
                    : 'No staff members are registered in the system yet. Get started by adding your first staff member.'}
                </p>
                <div className="flex items-center justify-center space-x-3">
                  {(staffSearch || staffRoleFilter !== 'ALL' || staffStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setStaffSearch('');
                        setStaffRoleFilter('ALL');
                        setStaffStatusFilter('all');
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-sm transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setStaffForm({
                        fullName: '',
                        username: '',
                        email: '',
                        password: '',
                        role: 'DOCTOR',
                        phone: '',
                        specialization: '',
                        licenseNo: '',
                        departmentId: '',
                        isActive: true,
                      });
                      setFormError('');
                      setIsAddStaffOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#D93344] hover:bg-[#b92b3a] text-white font-medium rounded-md text-sm transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Staff Member</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3">Assigned Role</th>
                      <th className="px-4 py-3">Specialization & License</th>
                      <th className="px-4 py-3">Contact Info</th>
                      <th className="px-4 py-3">Account Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {staffList.map((member, index) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-md bg-[#D93344] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                              {member.staffProfile?.fullName
                                ? member.staffProfile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                : (member.email ? member.email[0].toUpperCase() : 'S')}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {member.staffProfile?.fullName || 'Unnamed Staff'}
                              </p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getRoleBadge(member.role)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-gray-900 text-xs">
                            {member.staffProfile?.specialization || 'General'}
                          </p>
                          {member.staffProfile?.licenseNo ? (
                            <p className="text-xs text-gray-500 font-mono">Lic: {member.staffProfile.licenseNo}</p>
                          ) : (
                            <p className="text-xs text-gray-400">No license listed</p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {member.staffProfile?.phone || 'No phone'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {member.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {member.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5" />
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Toggle Active Button */}
                            <button
                              onClick={() => handleToggleStaffStatus(member)}
                              className={`p-1.5 rounded transition-colors ${
                                member.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={member.isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {member.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditStaffOpen(member)}
                              className="p-1.5 text-[#D93344] hover:bg-red-50 rounded transition-colors"
                              title="Edit Staff Details"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            {/* Delete Button (disabled for current logged in user) */}
                            {user?.id !== member.id && (
                              <button
                                onClick={() => {
                                  setSelectedStaff(member);
                                  setIsDeleteStaffOpen(true);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Staff Account"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PATIENT ARCHIVE & RECORDS */}
      {/* ========================================================================= */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          {/* Counters */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md text-center min-w-[80px]">
              <p className="text-xs font-semibold text-emerald-700">Active</p>
              <p className="text-base font-bold text-emerald-900">{patientCounts.active}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-md text-center min-w-[80px]">
              <p className="text-xs font-semibold text-amber-700">Archived</p>
              <p className="text-base font-bold text-amber-900">{patientCounts.archived}</p>
            </div>
            <div className="bg-red-50 border border-red-200 px-3 py-2 rounded-md text-center min-w-[80px]">
              <p className="text-xs font-semibold text-red-700">Total</p>
              <p className="text-base font-bold text-red-900">{patientCounts.total}</p>
            </div>
          </div>

          {/* Sub-Tabs: Active / Archived / All */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 flex-wrap gap-4">
            <div className="flex items-center bg-gray-100 rounded-md p-1 text-xs font-medium text-gray-700">
              <button
                onClick={() => setPatientFilterTab('active')}
                className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                  patientFilterTab === 'active' ? 'bg-white shadow text-emerald-800' : 'hover:text-gray-900'
                }`}
              >
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                <span>Active ({patientCounts.active})</span>
              </button>

              <button
                onClick={() => setPatientFilterTab('archived')}
                className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                  patientFilterTab === 'archived' ? 'bg-white shadow text-amber-800' : 'hover:text-gray-900'
                }`}
              >
                <Archive className="h-3 w-3 text-amber-600" />
                <span>Archived ({patientCounts.archived})</span>
              </button>

              <button
                onClick={() => setPatientFilterTab('all')}
                className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                  patientFilterTab === 'all' ? 'bg-white shadow text-[#D93344]' : 'hover:text-gray-900'
                }`}
              >
                <Layers className="h-3 w-3 text-[#D93344]" />
                <span>All ({patientCounts.total})</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, MRN, phone, or national ID..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D93344] text-xs text-gray-900 bg-gray-50/50"
              />
              {patientSearch && (
                <button
                  onClick={() => setPatientSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {patientsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D93344] mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading patient records...</p>
              </div>
            ) : patientsList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <Archive className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No patient records found</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                  {patientSearch
                    ? `No patients match "${patientSearch}" under ${patientFilterTab} records.`
                    : patientFilterTab === 'archived'
                    ? 'There are currently no archived patients in the system.'
                    : 'No patients registered in the clinic yet.'}
                </p>
                {patientSearch && (
                  <button
                    onClick={() => setPatientSearch('')}
                    className="px-3 py-1.5 bg-[#D93344] text-white font-medium rounded-md text-sm hover:bg-[#b92b3a] transition-colors"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">MRN</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Demographics</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {patientsList.map(patient => (
                      <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                              patient.isArchived
                                ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                                : 'bg-gradient-to-br from-teal-500 to-emerald-600'
                            }`}>
                              {patient.firstName[0]}{patient.lastName[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="text-xs text-gray-500">Registered: {new Date(patient.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                            {patient.mrn}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {patient.phone}
                          </p>
                          {patient.email && (
                            <p className="text-xs text-gray-500 flex items-center mt-0.5">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {patient.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-900 font-medium">
                            {patient.gender} • {patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'N/A'} yrs
                          </p>
                          <p className="text-xs text-gray-500">DOB: {new Date(patient.dob).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {patient.isArchived ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <Archive className="w-3 h-3 mr-1" />
                              Archived
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Archive or Restore Action Button */}
                            {patient.isArchived ? (
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setIsRestoreModalOpen(true);
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium rounded text-xs transition-colors flex items-center space-x-1"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setIsArchiveModalOpen(true);
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-medium rounded text-xs transition-colors flex items-center space-x-1"
                              >
                                <Archive className="h-3 w-3" />
                                <span>Archive</span>
                              </button>
                            )}

                            {/* View Profile */}
                            <Link
                              href={`/dashboard/patients/${patient.id}`}
                              className="p-1.5 text-gray-500 hover:text-[#D93344] hover:bg-red-50 rounded transition-colors"
                              title="View Patient Record"
                              onClick={(e) => {
                                console.log('Navigating to patient:', patient.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SYSTEM AUDIT FEED */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            {['ALL', 'staff', 'patient', 'system', 'security'].map(cat => (
              <button
                key={cat}
                onClick={() => setAuditFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  auditFilter === cat
                    ? 'bg-[#D93344] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-5">
            <div className="space-y-2 font-mono text-xs">
              {auditLogs
                .filter(log => auditFilter === 'ALL' || (log.entityType && log.entityType.toLowerCase() === auditFilter))
                .map(log => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">{log.action}</p>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Actor: {log.actorRole} • Entity: {log.entityType}
                          {log.fieldName && ` • Field: ${log.fieldName}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              {auditLogs.length === 0 && (
                <div className="text-center text-gray-500 text-xs py-8">
                  No audit logs found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BILLING & FEE CONFIGURATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                fetchFeeConfigs();
                fetchAdminInvoices();
              }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-sm transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${invoicesLoading || feeConfigsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Invoices</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{adminInvoices.length}</p>
              <span className="text-xs text-gray-500 mt-1 block">Issued by reception</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid Settlements</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                {adminInvoices.filter(i => i.status === 'PAID').length}
              </p>
              <span className="text-xs text-emerald-700 font-medium mt-1 block">Fully settled</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Payments</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-amber-600">
                {adminInvoices.filter(i => i.status !== 'PAID').length}
              </p>
              <span className="text-xs text-amber-700 font-medium mt-1 block">Awaiting checkout</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Collected</span>
                <div className="p-2 bg-red-50 text-[#D93344] rounded-md">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {adminInvoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0).toFixed(2)}
              </p>
              <span className="text-xs text-gray-500 mt-1 block">Settled cash & cards</span>
            </div>
          </div>

          {/* Standard Service Fee Pricing (Admin Configurable) */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Standard Service Pricing Table</h3>
                <p className="text-xs text-gray-500 mt-0.5">Admin-controlled pricing applied automatically during patient checkout</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {feeConfigs.map((fee) => (
                <div key={fee.feeType} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{fee.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{fee.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 font-mono text-xs rounded">
                      {fee.feeType}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {editingFeeType === fee.feeType ? (
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">ETB</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editingFeeAmount}
                            onChange={(e) => setEditingFeeAmount(Number(e.target.value))}
                            className="w-24 pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#D93344]"
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateFee(fee.feeType, fee.name, fee.description, editingFeeAmount)}
                          className="px-3 py-1.5 bg-[#D93344] hover:bg-[#b92b3a] text-white text-xs font-medium rounded-md shadow-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFeeType(null)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <span className="text-xl font-bold text-gray-900">{Number(fee.amount).toFixed(2)}</span>
                        <button
                          onClick={() => {
                            setEditingFeeType(fee.feeType);
                            setEditingFeeAmount(Number(fee.amount));
                          }}
                          className="px-2 py-1 border border-gray-200 hover:border-[#D93344] text-[#D93344] text-xs font-medium rounded transition-colors flex items-center space-x-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices Ledger */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Invoice Register</h3>
                <p className="text-xs text-gray-500 mt-0.5">Live billing records created during checkout</p>
              </div>
              <span className="text-xs text-gray-500 font-medium">{adminInvoices.length} entries</span>
            </div>
            {adminInvoices.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No billing transactions recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {adminInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-semibold text-gray-900">{inv.invoiceNo}</td>
                        <td className="px-4 py-3 text-gray-800">{inv.patient?.firstName} {inv.patient?.lastName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{Number(inv.total).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SYSTEM & CLINIC SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Status Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center">
                <Activity className="h-4 w-4 mr-2 text-[#D93344]" />
                Infrastructure & Connectivity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">API Gateway</span>
                  <span className="font-mono text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">http://localhost:4000/api</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Frontend Web Host</span>
                  <span className="font-mono text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">http://localhost:3000 (Next.js 16)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Database Engine</span>
                  <span className="font-mono text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">PostgreSQL 16 (Healthy)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Current Operator</span>
                  <span className="font-medium text-gray-800">{user?.username} ({user?.role})</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Workflow Mode</span>
                  <span className="font-medium text-gray-800">Walk-In Triage & Consultation Pipeline</span>
                </div>
              </div>
            </div>

            {/* Security Policies Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center">
                <Shield className="h-4 w-4 mr-2 text-[#D93344]" />
                Security & Access Policies
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Token Algorithm</span>
                  <span className="font-medium text-gray-800">HS256 JWT</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Access Token Lifetime</span>
                  <span className="font-medium text-gray-800">15 minutes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Refresh Token Lifetime</span>
                  <span className="font-medium text-gray-800">7 days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Prisma Audit Interceptors</span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active & Logging</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Password Hashing</span>
                  <span className="font-medium text-gray-800">Bcrypt (Salt rounds 10)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD STAFF MEMBER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 bg-[#D93344] text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Onboard New Staff Member
                  </h3>
                  <p className="text-red-100 text-xs mt-1">Create credentials and assign clinic permissions</p>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(false)}
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddStaffSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-xs flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Robert Chen"
                      value={staffForm.fullName}
                      onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. drchen"
                      value={staffForm.username || ''}
                      onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Email Address <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="staff@clinic.com"
                      value={staffForm.email || ''}
                      onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Initial Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min. 8 characters"
                      value={staffForm.password}
                      onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Assigned Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={e => setStaffForm({ ...staffForm, role: e.target.value as UserAccount['role'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 font-medium"
                    >
                      <option value="DOCTOR">Doctor (Consultations & Prescriptions)</option>
                      <option value="NURSE">Nurse (Triage & Vitals)</option>
                      <option value="ACCOUNTANT">Accountant (Billing & Invoices)</option>
                      <option value="LAB_TECH">Laboratorist (Lab Tests & Results)</option>
                      <option value="RECEPTIONIST">Receptionist (Intake & Appointments)</option>
                      <option value="PHARMACIST">Pharmacist (Medication Dispense)</option>
                      <option value="ADMIN">System Administrator</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={staffForm.phone}
                      onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Specialization / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cardiology, Hematology, General Care"
                      value={staffForm.specialization}
                      onChange={e => setStaffForm({ ...staffForm, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  {/* License No */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Professional License #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MD-982124"
                      value={staffForm.licenseNo}
                      onChange={e => setStaffForm({ ...staffForm, licenseNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Department / Wing
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Outpatient, Diagnostics, Surgery"
                      value={staffForm.departmentId}
                      onChange={e => setStaffForm({ ...staffForm, departmentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-[#D93344] hover:bg-[#b92b3a] text-white font-medium rounded-md text-sm shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Confirm & Register Staff</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT STAFF MEMBER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditStaffOpen && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 bg-[#D93344] text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center">
                    <Edit3 className="h-5 w-5 mr-2" />
                    Edit Staff Profile: {selectedStaff.staffProfile?.fullName || selectedStaff.username}
                  </h3>
                  <p className="text-red-100 text-xs mt-1">Update roles, contact info, and status</p>
                </div>
                <button
                  onClick={() => setIsEditStaffOpen(false)}
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditStaffSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-xs flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={staffForm.fullName}
                      onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Assigned Role</label>
                    <select
                      value={staffForm.role}
                      onChange={e => setStaffForm({ ...staffForm, role: e.target.value as UserAccount['role'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900 font-medium"
                    >
                      <option value="DOCTOR">Doctor</option>
                      <option value="NURSE">Nurse</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="LAB_TECH">Laboratorist</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="PHARMACIST">Pharmacist</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Specialization</label>
                    <input
                      type="text"
                      value={staffForm.specialization}
                      onChange={e => setStaffForm({ ...staffForm, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">License No</label>
                    <input
                      type="text"
                      value={staffForm.licenseNo}
                      onChange={e => setStaffForm({ ...staffForm, licenseNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reset Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep unchanged"
                      value={staffForm.password}
                      onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Account Active Status</label>
                    <select
                      value={staffForm.isActive ? 'true' : 'false'}
                      onChange={e => setStaffForm({ ...staffForm, isActive: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D93344] text-sm text-gray-900 font-medium"
                    >
                      <option value="true">Active (Has system access)</option>
                      <option value="false">Deactivated (Access suspended)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditStaffOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-[#D93344] hover:bg-[#b92b3a] text-white font-medium rounded-md text-sm shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {formSubmitting ? <span>Saving...</span> : <span>Save Profile Changes</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE STAFF CONFIRMATION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDeleteStaffOpen && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Delete Staff Member Account?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete the account for <strong className="text-gray-900">{selectedStaff.staffProfile?.fullName || selectedStaff.username}</strong> ({selectedStaff.role})? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteStaffOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStaffConfirm}
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Deleting...' : 'Yes, Delete Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: ARCHIVE PATIENT CONFIRMATION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isArchiveModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Archive className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Archive Patient Record
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to archive the record for <strong className="text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</strong> (MRN: {selectedPatient.mrn})?
              </p>
              <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-800 mb-6">
                Archived patients are excluded from active daily clinic queues, but their full medical history remains securely preserved and can be restored anytime by an Admin.
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchivePatient}
                  disabled={patientActionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {patientActionLoading ? 'Archiving...' : 'Archive Patient'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: RESTORE PATIENT CONFIRMATION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRestoreModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Restore Patient to Active Roster
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Restore <strong className="text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</strong> (MRN: {selectedPatient.mrn}) back to the active patient roster? They will immediately be available for scheduling and consultations.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRestorePatient}
                  disabled={patientActionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {patientActionLoading ? 'Restoring...' : 'Yes, Restore to Active'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}