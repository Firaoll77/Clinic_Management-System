import { prisma } from './prisma';

/**
 * Doctor Availability Service
 * Handles doctor availability configuration, slot management, and appointment scheduling
 */

export class DoctorAvailabilityService {
  /**
   * Create doctor availability schedule
   */
  static async createAvailability(availabilityData: {
    doctorId: string;
    weekday: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    slotMinutes: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }) {
    try {
      const availability = await prisma.doctorAvailability.create({
        data: availabilityData
      });

      return availability;
    } catch (error) {
      console.error('Error creating availability:', error);
      throw error;
    }
  }

  /**
   * Get doctor availability for a specific date
   */
  static async getAvailabilityForDate(doctorId: string, date: Date) {
    try {
      const weekday = date.getDay();
      
      const availabilities = await prisma.doctorAvailability.findMany({
        where: {
          doctorId: doctorId,
          weekday: weekday,
          effectiveFrom: { lte: date },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: date } }
          ]
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return availabilities;
    } catch (error) {
      console.error('Error getting availability:', error);
      throw error;
    }
  }

  /**
   * Get available slots for a doctor on a specific date
   */
  static async getAvailableSlots(doctorId: string, date: Date) {
    try {
      const availabilities = await this.getAvailabilityForDate(doctorId, date);
      
      // Get existing appointments for this doctor on this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctorId,
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: { not: 'CANCELLED' }
        },
        select: {
          scheduledAt: true,
          durationMin: true
        }
      });

      // Generate available slots
      const availableSlots: Array<{
        time: string;
        duration: number;
        available: boolean;
      }> = [];

      for (const availability of availabilities) {
        const [startHour, startMin] = availability.startTime.split(':').map(Number);
        const [endHour, endMin] = availability.endTime.split(':').map(Number);
        
        let currentTime = new Date(date);
        currentTime.setHours(startHour, startMin, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(endHour, endMin, 0, 0);

        while (currentTime < endTime) {
          const slotEndTime = new Date(currentTime.getTime() + availability.slotMinutes * 60000);
          
          if (slotEndTime <= endTime) {
            // Check if this slot is already booked
            const isBooked = existingAppointments.some(apt => {
              const aptStart = new Date(apt.scheduledAt);
              const aptEnd = new Date(aptStart.getTime() + apt.durationMin * 60000);
              return (
                (aptStart <= currentTime && aptEnd > currentTime) ||
                (aptStart >= currentTime && aptStart < slotEndTime)
              );
            });

            availableSlots.push({
              time: currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              duration: availability.slotMinutes,
              available: !isBooked
            });
          }

          currentTime = slotEndTime;
        }
      }

      return availableSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }

  /**
   * Get all doctor availabilities
   */
  static async getAllDoctorAvailabilities(doctorId: string) {
    try {
      const availabilities = await prisma.doctorAvailability.findMany({
        where: { doctorId: doctorId },
        include: {
          doctor: true
        },
        orderBy: [
          { weekday: 'asc' },
          { startTime: 'asc' }
        ]
      });

      return availabilities;
    } catch (error) {
      console.error('Error getting all availabilities:', error);
      throw error;
    }
  }

  /**
   * Update doctor availability
   */
  static async updateAvailability(availabilityId: string, updateData: {
    weekday?: number;
    startTime?: string;
    endTime?: string;
    slotMinutes?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }) {
    try {
      const availability = await prisma.doctorAvailability.update({
        where: { id: availabilityId },
        data: updateData
      });

      return availability;
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  /**
   * Delete doctor availability
   */
  static async deleteAvailability(availabilityId: string) {
    try {
      await prisma.doctorAvailability.delete({
        where: { id: availabilityId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw error;
    }
  }

  /**
   * Get weekly availability overview for a doctor
   */
  static async getWeeklyAvailability(doctorId: string, weekStart: Date) {
    try {
      const weeklyAvailability = [];

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(currentDay.getDate() + i);
        
        const dayAvailabilities = await this.getAvailabilityForDate(doctorId, currentDay);
        const availableSlots = await this.getAvailableSlots(doctorId, currentDay);

        weeklyAvailability.push({
          date: currentDay,
          weekday: currentDay.getDay(),
          availabilities: dayAvailabilities,
          availableSlots: availableSlots.filter(slot => slot.available)
        });
      }

      return weeklyAvailability;
    } catch (error) {
      console.error('Error getting weekly availability:', error);
      throw error;
    }
  }
}