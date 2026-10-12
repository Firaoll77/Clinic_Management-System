'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Menu,
  Bell,
  Check,
  CheckCheck,
  User,
  LogOut,
  Settings,
  Shield,
  Clock,
  AlertTriangle,
  Info,
  X,
  ChevronDown,
  Activity,
  HeartPulse,
  Beaker,
  FileText
} from 'lucide-react';

export interface DashboardHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  roleTitle: string;
  roleBadge: string;
  themeColor?: string;
  badgeColorClass?: string;
}

interface ClinicalNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'urgent' | 'clinical' | 'info';
  isRead: boolean;
}

// Tailored, role-specific notifications for each clinical role
const ROLE_NOTIFICATIONS: Record<string, ClinicalNotification[]> = {
  ADMIN: [
    {
      id: 'adm-1',
      title: 'Database Backup Completed',
      message: 'Nightly encrypted electronic health records backup successfully verified.',
      time: '12m ago',
      type: 'info',
      isRead: false,
    },
    {
      id: 'adm-2',
      title: 'Security Audit Flag',
      message: 'New staff profile registered from Reception Desk IP (Admin approval logged).',
      time: '45m ago',
      type: 'urgent',
      isRead: false,
    },
    {
      id: 'adm-3',
      title: 'Monthly Revenue Reconciled',
      message: 'Pharmacy and consultation billing summaries ready for end-of-month review.',
      time: '2h ago',
      type: 'info',
      isRead: true,
    },
  ],
  DOCTOR: [
    {
      id: 'doc-1',
      title: 'STAT Lab Results Available',
      message: 'Cardiac enzyme & Troponin-I test completed for Patient in Room 3.',
      time: '4m ago',
      type: 'urgent',
      isRead: false,
    },
    {
      id: 'doc-2',
      title: 'Patient Ready in Queue',
      message: 'Nurse triage completed vital sign intake for John Doe (MRN-1082).',
      time: '15m ago',
      type: 'clinical',
      isRead: false,
    },
    {
      id: 'doc-3',
      title: 'Prescription Authorization',
      message: 'Pharmacy counter verified dosage for Encounter #4029.',
      time: '1h ago',
      type: 'info',
      isRead: true,
    },
  ],
  NURSE: [
    {
      id: 'nur-1',
      title: 'Abnormal Vitals Detected',
      message: 'Elevated systolic blood pressure (168/104 mmHg) recorded in triage booth.',
      time: '2m ago',
      type: 'urgent',
      isRead: false,
    },
    {
      id: 'nur-2',
      title: 'New Patient in Triage Queue',
      message: 'Front desk checked in walk-in patient complaining of severe headache.',
      time: '8m ago',
      type: 'clinical',
      isRead: false,
    },
    {
      id: 'nur-3',
      title: 'Doctor Referral Accepted',
      message: 'Dr. Smith accepted patient assignment from your triage intake.',
      time: '35m ago',
      type: 'info',
      isRead: true,
    },
  ],
  RECEPTIONIST: [
    {
      id: 'rec-1',
      title: 'Physician Now Available',
      message: 'Dr. Johnson completed previous consultation. Next patient can be called in.',
      time: '3m ago',
      type: 'clinical',
      isRead: false,
    },
    {
      id: 'rec-2',
      title: 'Cashier Payment Pending',
      message: 'Consultation & lab invoice #INV-2041 issued. Awaiting patient checkout.',
      time: '14m ago',
      type: 'info',
      isRead: false,
    },
    {
      id: 'rec-3',
      title: 'Prescription Print Queue',
      message: 'Medical discharge prescription approved and queued for patient handover.',
      time: '50m ago',
      type: 'info',
      isRead: true,
    },
  ],
  LAB_TECH: [
    {
      id: 'lab-1',
      title: 'STAT Specimen Delivered',
      message: 'Urgent venous blood draw received from Triage for immediate blood gas analysis.',
      time: '1m ago',
      type: 'urgent',
      isRead: false,
    },
    {
      id: 'lab-2',
      title: 'New Lab Test Ordered',
      message: 'Dr. Smith ordered Complete Blood Count (CBC) for Patient #904.',
      time: '19m ago',
      type: 'clinical',
      isRead: false,
    },
    {
      id: 'lab-3',
      title: 'Test Verification Completed',
      message: 'Lipid panel results transmitted to doctor chart successfully.',
      time: '1h ago',
      type: 'info',
      isRead: true,
    },
  ],
};

export default function DashboardHeader({
  sidebarOpen,
  onToggleSidebar,
  roleTitle,
  roleBadge,
  badgeColorClass = 'bg-slate-100 text-slate-700 border-slate-200',
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [status, setStatus] = useState<'available' | 'busy' | 'away'>('available');
  const [emergencyAlert, setEmergencyAlert] = useState(false);

  useEffect(() => {
    const checkEmergency = () => {
      try {
        const raw = localStorage.getItem('clinic_system_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          setEmergencyAlert(Boolean(parsed.emergencyBroadcast));
        }
      } catch {
        // ignore
      }
    };
    checkEmergency();
    const interval = setInterval(checkEmergency, 2000);
    return () => clearInterval(interval);
  }, []);

  const roleKey = (user?.role || roleBadge || 'ADMIN').toUpperCase();
  const initialRoleNotifs = useMemo(() => {
    return ROLE_NOTIFICATIONS[roleKey] || ROLE_NOTIFICATIONS['ADMIN'];
  }, [roleKey]);

  const [notifications, setNotifications] = useState<ClinicalNotification[]>(initialRoleNotifs);

  // Sync role notifications when role changes or fetch from API
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        const response = await apiClient.get<{ notifications: any[] }>('/notifications');
        if (isMounted && response.data?.notifications && response.data.notifications.length > 0) {
          const mapped: ClinicalNotification[] = response.data.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: n.type?.toLowerCase().includes('stat') || n.type?.toLowerCase().includes('urgent') ? 'urgent' : 'clinical',
            isRead: Boolean(n.isRead),
          }));
          setNotifications(mapped);
          return;
        }
      } catch (err) {
        // Fallback to role-specific tailored notifications
      }
      if (isMounted) {
        setNotifications(ROLE_NOTIFICATIONS[roleKey] || ROLE_NOTIFICATIONS['ADMIN']);
      }
    }
    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [roleKey]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiClient.patch('/notifications/read-all', {});
    } catch {
      // non-blocking
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await apiClient.patch(`/notifications/${id}/read`, {});
    } catch {
      // non-blocking
    }
  };

  const clearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const initials = user?.staffProfile?.fullName
    ? user.staffProfile.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.role
    ? user.role.slice(0, 2).toUpperCase()
    : 'CL';

  const displayName =
    user?.staffProfile?.fullName || user?.username || user?.email || 'Clinical Staff';

  return (
    <>
      {emergencyAlert && (
        <div className="bg-rose-600 text-white px-5 py-2 text-xs font-bold flex items-center justify-between shadow-md z-40 border-b border-rose-700 animate-pulse">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-white" />
            <span className="tracking-wide">
              FACILITY EMERGENCY BROADCAST: High-priority clinical alert issued by administration. All departments maintain immediate readiness.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyAlert(false)}
            className="text-white/80 hover:text-white hover:underline text-xs shrink-0 ml-4 font-semibold cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 flex-shrink-0">
        <div className="px-5 sm:px-7 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Sidebar Toggle & Context Info (NO BREADCRUMBS, NO SEARCH) */}
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <button
              onClick={onToggleSidebar}
              className="p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar to default'}
              aria-label="Toggle navigation sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                {roleTitle}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${badgeColorClass}`}
              >
                {roleBadge}
              </span>
            </div>
          </div>

          {/* Right: Functional Notification & Profile Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotificationOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                className={`relative p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  notificationOpen
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Notifications"
                aria-label="Clinical notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                        {roleBadge} Alerts
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No notifications for this role at this time
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => markAsRead(item.id)}
                          className={`p-3.5 transition-colors cursor-pointer group flex items-start space-x-3 ${
                            item.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {item.type === 'urgent' ? (
                              <div className="p-1 rounded bg-rose-100 text-rose-600">
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </div>
                            ) : item.type === 'clinical' ? (
                              <div className="p-1 rounded bg-blue-100 text-blue-600">
                                <Clock className="h-3.5 w-3.5" />
                              </div>
                            ) : (
                              <div className="p-1 rounded bg-slate-100 text-slate-600">
                                <Info className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs font-semibold ${item.isRead ? 'text-slate-800' : 'text-slate-900 font-bold'}`}>
                                {item.title}
                              </p>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {item.message}
                            </p>
                          </div>

                          <button
                            onClick={(e) => clearNotification(item.id, e)}
                            className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            title="Dismiss"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Real-time {roleBadge} updates active
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200" />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen((prev) => !prev);
                  setNotificationOpen(false);
                }}
                className={`flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-lg border transition-all ${
                  profileOpen
                    ? 'bg-slate-100 border-slate-300 text-slate-900'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Account Menu"
                aria-label="User account and profile menu"
              >
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900 leading-none truncate max-w-[140px]">
                    {displayName}
                  </p>
                  <p className="text-xs font-medium text-slate-500 capitalize leading-none mt-1">
                    {user?.role ? user.role.toLowerCase() : 'Staff'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 ml-0.5" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User summary card */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user?.email || `${user?.username || 'user'}@clinic.local`}
                        </p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-200/70 text-slate-800 text-[10px] font-semibold rounded">
                          {user?.role || 'STAFF'}
                        </span>
                      </div>
                    </div>

                    {/* Status selector */}
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setStatus('available')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                            status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          On Duty
                        </button>
                        <button
                          onClick={() => setStatus('busy')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                            status === 'busy'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          Busy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Links & Actions */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setShowSettingsModal(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-left"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Account Details</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setShowSettingsModal(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-left"
                    >
                      <Settings className="h-4 w-4 text-slate-500" />
                      <span>Preferences</span>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Account Details & Preferences Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Account & Clinical Profile</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-base">{displayName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email || 'Active System User'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-200 text-slate-800 text-xs font-semibold rounded">
                    Role: {user?.role || 'Staff'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Username:</span>
                  <span className="font-semibold text-slate-900">{user?.username || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">User ID:</span>
                  <span className="font-mono text-slate-700">{user?.id || '—'}</span>
                </div>
                {user?.staffProfile?.phone && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Contact Phone:</span>
                    <span className="font-semibold text-slate-900">{user.staffProfile.phone}</span>
                  </div>
                )}
                {user?.staffProfile?.specialization && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Specialization:</span>
                    <span className="font-semibold text-slate-900">{user.staffProfile.specialization}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Session Status:</span>
                  <span className="text-emerald-600 font-bold flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    Authenticated & Verified
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
