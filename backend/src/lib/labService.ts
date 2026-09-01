import { prisma } from './prisma';

/**
 * Laboratory Service
 * Handles lab orders, results entry, and lab catalogue management
 */

export class LabService {
  /**
   * Create lab catalogue item
   */
  static async createLabTest(testData: {
    name: string;
    code: string;
    category: string;
    description?: string;
    sampleType: string;
    normalRange?: string;
    unit?: string;
    price: number;
  }) {
    try {
      const labTest = await prisma.labTest.create({
        data: {
          name: testData.name,
          code: testData.code,
          department: testData.category,
          price: testData.price,
          referenceRange: testData.normalRange,
          unit: testData.unit
        }
      });

      return labTest;
    } catch (error) {
      console.error('Error creating lab test:', error);
      throw error;
    }
  }

  /**
   * Get all lab tests
   */
  static async getLabTests(category?: string) {
    try {
      const labTests = await prisma.labTest.findMany({
        where: {
          ...(category && { department: category })
        },
        orderBy: {
          name: 'asc'
        }
      });

      return labTests;
    } catch (error) {
      console.error('Error getting lab tests:', error);
      throw error;
    }
  }

  /**
   * Create lab order
   */
  static async createLabOrder(orderData: {
    encounterId: string;
    patientId: string;
    doctorId: string;
    priority: string;
    notes?: string;
  }) {
    try {
      const labOrder = await prisma.labOrder.create({
        data: {
          encounterId: orderData.encounterId,
          patientId: orderData.patientId,
          orderedBy: orderData.doctorId
        }
      });

      // Get patient for notification
      const patient = await prisma.patient.findUnique({
        where: { id: orderData.patientId }
      });

      // Create notification for lab staff
      await prisma.notification.create({
        data: {
          userId: orderData.doctorId,
          type: 'LAB_ORDER_CREATED',
          title: 'New Lab Order',
          message: `Lab order ${patient ? `for ${patient.firstName} ${patient.lastName}` : ''}`,
          data: JSON.stringify({ labOrderId: labOrder.id })
        }
      });

      return labOrder;
    } catch (error) {
      console.error('Error creating lab order:', error);
      throw error;
    }
  }

  /**
   * Add test to lab order
   */
  static async addTestToOrder(labOrderId: string, labTestId: string) {
    try {
      const labOrder = await prisma.labOrder.update({
        where: { id: labOrderId },
        data: {
          status: 'IN_PROGRESS'
        }
      });

      // The actual result will be created when results are entered
      return labOrder;
    } catch (error) {
      console.error('Error adding test to order:', error);
      throw error;
    }
  }

  /**
   * Enter lab results
   */
  static async enterLabResult(resultData: {
    labOrderId: string;
    labTestId: string;
    result: string;
    isAbnormal: boolean;
    notes?: string;
    performedBy: string;
  }) {
    try {
      const labResult = await prisma.labResult.create({
        data: {
          labOrderId: resultData.labOrderId,
          labTestId: resultData.labTestId,
          value: resultData.result,
          flag: resultData.isAbnormal ? 'H' : 'N',
          enteredBy: resultData.performedBy
        },
        include: {
          labTest: true
        }
      });

      // Get lab order for notification
      const labOrder = await prisma.labOrder.findUnique({
        where: { id: resultData.labOrderId }
      });

      // Get patient for notification
      const patient = await prisma.patient.findUnique({
        where: { id: labOrder?.patientId }
      });

      // Update lab order status if all results are in
      const orderResults = await prisma.labResult.findMany({
        where: { labOrderId: resultData.labOrderId }
      });

      if (orderResults.length > 0) {
        await prisma.labOrder.update({
          where: { id: resultData.labOrderId },
          data: { status: 'COMPLETED' }
        });
      }

      // Create notification for doctor
      if (labOrder) {
        await prisma.notification.create({
          data: {
            userId: labOrder.orderedBy,
            type: 'LAB_RESULT_READY',
            title: 'Lab Result Ready',
            message: `Lab result ${patient ? `for ${patient.firstName} ${patient.lastName}` : ''} is ready`,
            data: JSON.stringify({ labResultId: labResult.id })
          }
        });
      }

      return labResult;
    } catch (error) {
      console.error('Error entering lab result:', error);
      throw error;
    }
  }

  /**
   * Get lab order with results
   */
  static async getLabOrder(labOrderId: string) {
    try {
      const labOrder = await prisma.labOrder.findUnique({
        where: { id: labOrderId },
        include: {
          results: {
            include: {
              labTest: true
            }
          },
          encounter: true
        }
      });

      return labOrder;
    } catch (error) {
      console.error('Error getting lab order:', error);
      throw error;
    }
  }

  /**
   * Get patient lab history
   */
  static async getPatientLabHistory(patientId: string, limit: number = 20) {
    try {
      const labOrders = await prisma.labOrder.findMany({
        where: { patientId },
        include: {
          results: {
            include: {
              labTest: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return labOrders;
    } catch (error) {
      console.error('Error getting patient lab history:', error);
      throw error;
    }
  }

  /**
   * Get pending lab orders
   */
  static async getPendingLabOrders() {
    try {
      const labOrders = await prisma.labOrder.findMany({
        where: {
          status: { in: ['ORDERED', 'IN_PROGRESS'] }
        },
        include: {
          encounter: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return labOrders;
    } catch (error) {
      console.error('Error getting pending lab orders:', error);
      throw error;
    }
  }

  /**
   * Update lab test
   */
  static async updateLabTest(labTestId: string, updateData: any) {
    try {
      const labTest = await prisma.labTest.update({
        where: { id: labTestId },
        data: updateData
      });

      return labTest;
    } catch (error) {
      console.error('Error updating lab test:', error);
      throw error;
    }
  }

  /**
   * Delete lab test
   */
  static async deleteLabTest(labTestId: string) {
    try {
      await prisma.labTest.delete({
        where: { id: labTestId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting lab test:', error);
      throw error;
    }
  }
}