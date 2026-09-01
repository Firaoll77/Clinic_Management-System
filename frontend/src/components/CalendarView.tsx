'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Filter
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMin: number;
  reason: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
  };
}

interface CalendarViewProps {
  appointments: Appointment[];
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onNewAppointment?: (date: Date) => void;
}

export default function CalendarView({ 
  appointments, 
  onDateSelect, 
  onAppointmentClick,
  onNewAppointment 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    return { daysInMonth, startDay };
  };

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(dayDate);
    }

    return weekDates;
  };

  const getAppointmentsForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledAt);
      return aptDate >= startOfDay && aptDate <= endOfDay;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'CHECKED_IN': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {view === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {view === 'week' && `Week of ${getWeekDates(currentDate)[0].toLocaleDateString()}`}
                {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <p className="text-sm text-gray-600">Appointments Calendar</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="ml-4 flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map((viewMode) => (
                <button
                  key={viewMode}
                  onClick={() => setView(viewMode)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === viewMode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            appointments={appointments}
            onDateClick={handleDateClick}
            onAppointmentClick={onAppointmentClick}
            onNewAppointment={onNewAppointment}
            getStatusColor={getStatusColor}
            dayNames={dayNames}
            getDaysInMonth={getDaysInMonth}
            getAppointmentsForDate={getAppointmentsForDate}
          />
        )}

        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            onDateClick={handleDateClick}
            onAppointmentClick={onAppointmentClick}
            onNewAppointment={onNewAppointment}
            getStatusColor={getStatusColor}
            dayNames={dayNames}
            getWeekDates={getWeekDates}
            getAppointmentsForDate={getAppointmentsForDate}
          />
        )}

        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
            onNewAppointment={onNewAppointment}
            getStatusColor={getStatusColor}
            getAppointmentsForDate={getAppointmentsForDate}
          />
        )}
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ 
  currentDate, 
  appointments, 
  onDateClick, 
  onAppointmentClick, 
  onNewAppointment,
  getStatusColor,
  dayNames,
  getDaysInMonth,
  getAppointmentsForDate
}: any) {
  const { daysInMonth, startDay } = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 border border-gray-100 bg-gray-50"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayAppointments = getAppointmentsForDate(date);
    const isToday = date.getTime() === today.getTime();

    days.push(
      <div
        key={day}
        onClick={() => onDateClick(date)}
        className={`h-32 border border-gray-100 p-2 cursor-pointer hover:bg-blue-50 transition-colors ${
          isToday ? 'bg-blue-50 border-blue-200' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </span>
          {onNewAppointment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNewAppointment(date);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <Plus className="h-3 w-3 text-gray-500" />
            </button>
          )}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-24">
          {dayAppointments.slice(0, 3).map((apt: any) => (
            <div
              key={apt.id}
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentClick?.(apt);
              }}
              className={`text-xs p-1 rounded border ${getStatusColor(apt.status)} truncate cursor-pointer hover:opacity-80`}
            >
              {new Date(apt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {apt.patient.firstName}
            </div>
          ))}
          {dayAppointments.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{dayAppointments.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {dayNames.map((day: string) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {days}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ 
  currentDate, 
  appointments, 
  onDateClick, 
  onAppointmentClick, 
  onNewAppointment,
  getStatusColor,
  dayNames,
  getWeekDates,
  getAppointmentsForDate
}: any) {
  const weekDates = getWeekDates(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {dayNames.map((day: string, index: number) => {
          const date = weekDates[index];
          const isToday = date.getTime() === today.getTime();
          return (
            <div key={day} className="text-center">
              <div className="text-sm font-medium text-gray-600 py-2">{day}</div>
              <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date: Date, index: number) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isToday = date.getTime() === today.getTime();

          return (
            <div
              key={index}
              onClick={() => onDateClick(date)}
              className={`min-h-64 border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                isToday ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {onNewAppointment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewAppointment(date);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Plus className="h-3 w-3 text-gray-500" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {dayAppointments.map((apt: any) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(apt);
                    }}
                    className={`p-2 rounded-lg border text-xs cursor-pointer hover:opacity-80 ${getStatusColor(apt.status)}`}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">
                        {new Date(apt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{apt.patient.firstName} {apt.patient.lastName}</span>
                    </div>
                  </motion.div>
                ))}
                {dayAppointments.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-4">
                    No appointments
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ 
  currentDate, 
  appointments, 
  onAppointmentClick, 
  onNewAppointment,
  getStatusColor,
  getAppointmentsForDate
}: any) {
  const dayAppointments = getAppointmentsForDate(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = currentDate.getTime() === today.getTime();

  // Generate time slots from 8 AM to 6 PM
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        {onNewAppointment && (
          <button
            onClick={() => onNewAppointment(currentDate)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </button>
        )}
      </div>

      <div className="space-y-2">
        {timeSlots.map((time) => {
          const slotAppointments = dayAppointments.filter((apt: any) => {
            const aptTime = new Date(apt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            return aptTime.startsWith(time.split(':')[0]);
          });

          return (
            <div key={time} className="flex items-start space-x-4">
              <div className="w-20 text-sm text-gray-600 font-medium pt-2">
                {time}
              </div>
              <div className="flex-1 min-h-16 border border-gray-200 rounded-lg p-2 bg-gray-50">
                {slotAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {slotAppointments.map((apt: any) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => onAppointmentClick?.(apt)}
                        className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 ${getStatusColor(apt.status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium text-sm">
                              {new Date(apt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs">({apt.durationMin} min)</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded border bg-white">{apt.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{apt.patient.firstName} {apt.patient.lastName}</span>
                          <span className="text-sm text-gray-600">({apt.patient.mrn})</span>
                        </div>
                        {apt.reason && (
                          <p className="text-sm mt-1">{apt.reason}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-3">
                    Available
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}