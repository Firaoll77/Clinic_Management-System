import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Report Service
 * Handles operational reports, financial tracking, and data exports
 */

export class ReportService {
  /**
   * Get daily revenue report
   */
  static async getDailyRevenueReport(date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          payments: true,
          items: true
        }
      });

      const totalRevenue = invoices.reduce((sum, inv) => sum.plus(inv.total), new Decimal(0));
      const totalCollected = invoices.reduce((sum, inv) =>
        sum.plus(inv.payments.reduce((pSum, p) => pSum.plus(p.amount), new Decimal(0))), new Decimal(0)
      );
      const totalPending = totalRevenue.minus(totalCollected);

      return {
        date,
        totalInvoices: invoices.length,
        totalRevenue,
        totalCollected,
        totalPending,
        invoices
      };
    } catch (error) {
      console.error('Error getting daily revenue report:', error);
      throw error;
    }
  }

  /**
   * Get monthly revenue report
   */
  static async getMonthlyRevenueReport(year: number, month: number) {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        include: {
          payments: true,
          items: true,
          patient: true
        }
      });

      const totalRevenue = invoices.reduce((sum, inv) => sum.plus(inv.total), new Decimal(0));
      const totalCollected = invoices.reduce((sum, inv) =>
        sum.plus(inv.payments.reduce((pSum, p) => pSum.plus(p.amount), new Decimal(0))), new Decimal(0)
      );

      // Revenue by service type
      const revenueByType = invoices.reduce((acc, inv) => {
        inv.items.forEach(item => {
          acc[item.itemType] = (acc[item.itemType] || new Decimal(0)).plus(item.lineTotal);
        });
        return acc;
      }, {} as Record<string, Decimal>);

      return {
        year,
        month,
        totalInvoices: invoices.length,
        totalRevenue,
        totalCollected,
        totalPending: totalRevenue.minus(totalCollected),
        revenueByType,
        invoices
      };
    } catch (error) {
      console.error('Error getting monthly revenue report:', error);
      throw error;
    }
  }

  /**
   * Get operational statistics
   */
  static async getOperationalStats(startDate: Date, endDate: Date) {
    try {
      const patients = await prisma.patient.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const appointments = await prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const encounters = await prisma.encounter.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const labOrders = await prisma.labOrder.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      return {
        period: { startDate, endDate },
        newPatients: patients,
        totalAppointments: appointments,
        totalEncounters: encounters,
        totalLabOrders: labOrders
      };
    } catch (error) {
      console.error('Error getting operational stats:', error);
      throw error;
    }
  }

  /**
   * Get doctor performance report
   */
  static async getDoctorPerformanceReport(doctorId: string, startDate: Date, endDate: Date) {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          encounter: true
        }
      });

      const encounters = await prisma.encounter.findMany({
        where: {
          doctorId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRevenue = encounters.reduce((sum, enc) => {
        // Assuming each encounter generates revenue
        return sum + 100; // Placeholder calculation
      }, 0);

      return {
        doctorId,
        period: { startDate, endDate },
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'COMPLETED').length,
        totalEncounters: encounters.length,
        totalRevenue
      };
    } catch (error) {
      console.error('Error getting doctor performance report:', error);
      throw error;
    }
  }

  /**
   * Export data to CSV format
   */
  static async exportToCSV(data: any[], filename: string) {
    try {
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          const escaped = ('' + (value ?? '')).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      return {
        filename,
        content: csvRows.join('\n'),
        mimeType: 'text/csv'
      };
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Get patient visit history for export
   */
  static async getPatientVisitHistory(patientId: string) {
    try {
      const encounters = await prisma.encounter.findMany({
        where: { patientId },
        include: {
          vitals: true,
          labOrders: {
            include: {
              results: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return encounters;
    } catch (error) {
      console.error('Error getting patient visit history:', error);
      throw error;
    }
  }

  /**
   * Get financial summary
   */
  static async getFinancialSummary(startDate: Date, endDate: Date) {
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          payments: true,
          items: true
        }
      });

      const totalBilled = invoices.reduce((sum, inv) => sum.plus(inv.total), new Decimal(0));
      const totalCollected = invoices.reduce((sum, inv) =>
        sum.plus(inv.payments.reduce((pSum, p) => pSum.plus(p.amount), new Decimal(0))), new Decimal(0)
      );
      const totalDiscounts = invoices.reduce((sum, inv) => sum.plus(inv.discountAmount || new Decimal(0)), new Decimal(0));
      const totalOutstanding = totalBilled.minus(totalCollected);

      const paymentMethods = invoices.reduce((acc, inv) => {
        inv.payments.forEach(pay => {
          acc[pay.method] = (acc[pay.method] || new Decimal(0)).plus(pay.amount);
        });
        return acc;
      }, {} as Record<string, Decimal>);

      return {
        period: { startDate, endDate },
        totalBilled,
        totalCollected,
        totalDiscounts,
        totalOutstanding,
        paymentMethods,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(inv => inv.status === 'PAID').length,
        pendingInvoices: invoices.filter(inv => inv.status === 'DRAFT').length
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }
}