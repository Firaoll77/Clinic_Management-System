import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Automated Billing Service
 * Handles automatic invoice line item creation for various clinical actions
 */

export class BillingAutomationService {
  /**
   * Automatically creates invoice line items when lab orders are created
   * This service hooks into the lab order creation process to ensure billing happens instantly
   */
  static async processLabOrderBilling(labOrderId: string, encounterId: string): Promise<void> {
    try {
      // Get the lab order with its results to identify which tests were ordered
      const labOrder = await prisma.labOrder.findUnique({
        where: { id: labOrderId },
        include: {
          results: {
            include: {
              labTest: true
            }
          }
        }
      });

      if (!labOrder) {
        throw new Error('Lab order not found');
      }

      // Get the encounter to find or create the invoice
      const encounter = await prisma.encounter.findUnique({
        where: { id: encounterId },
        include: {
          patient: true,
          invoices: {
            where: { status: 'DRAFT' } // Get the draft invoice if exists
          }
        }
      });

      if (!encounter) {
        throw new Error('Encounter not found');
      }

      // Find or create a draft invoice for this encounter
      let invoice = encounter.invoices[0];
      if (!invoice) {
        // Create new draft invoice
        invoice = await prisma.invoice.create({
          data: {
            invoiceNo: `INV-${Date.now()}-${encounter.patientId.substring(0, 8)}`,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            status: 'DRAFT',
            subtotal: new Decimal(0),
            total: new Decimal(0),
            balance: new Decimal(0),
          }
        });
      }

      // Process each lab test result as a billable item
      for (const result of labOrder.results) {
        // Check if this lab test is already billed for this invoice
        const existingItem = await prisma.invoiceItem.findFirst({
          where: {
            invoiceId: invoice.id,
            itemType: 'LAB',
            refId: result.labTestId
          }
        });

        if (!existingItem) {
          // Create new invoice line item for the lab test
          const lineTotal = result.labTest.price;
          
          await prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              itemType: 'LAB',
              refId: result.labTestId,
              description: result.labTest.name,
              quantity: 1,
              unitPrice: result.labTest.price,
              lineTotal: lineTotal,
            }
          });

          // Update invoice totals
          await this.updateInvoiceTotals(invoice.id);
        }
      }

      console.log(`Automated billing completed for lab order ${labOrderId}`);
    } catch (error) {
      console.error('Error in automated lab order billing:', error);
      throw error;
    }
  }

  /**
   * Automatically creates invoice line items for services during encounters
   * Called when doctor completes consultation
   */
  static async processServiceBilling(encounterId: string, serviceCode: string): Promise<void> {
    try {
      // Get the service details
      const service = await prisma.service.findUnique({
        where: { code: serviceCode }
      });

      if (!service) {
        throw new Error(`Service ${serviceCode} not found`);
      }

      // Get the encounter
      const encounter = await prisma.encounter.findUnique({
        where: { id: encounterId },
        include: {
          patient: true,
          invoices: {
            where: { status: 'DRAFT' }
          }
        }
      });

      if (!encounter) {
        throw new Error('Encounter not found');
      }

      // Find or create draft invoice
      let invoice = encounter.invoices[0];
      if (!invoice) {
        invoice = await prisma.invoice.create({
          data: {
            invoiceNo: `INV-${Date.now()}-${encounter.patientId.substring(0, 8)}`,
            patientId: encounter.patientId,
            encounterId: encounter.id,
            status: 'DRAFT',
            subtotal: new Decimal(0),
            total: new Decimal(0),
            balance: new Decimal(0),
          }
        });
      }

      // Check if service is already billed
      const existingItem = await prisma.invoiceItem.findFirst({
        where: {
          invoiceId: invoice.id,
          itemType: 'SERVICE',
          refId: service.code
        }
      });

      if (!existingItem) {
        // Create invoice line item for the service
        const lineTotal = service.price;
        
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemType: 'SERVICE',
            refId: service.code,
            description: service.name,
            quantity: 1,
            unitPrice: service.price,
            lineTotal: lineTotal,
          }
        });

        // Update invoice totals
        await this.updateInvoiceTotals(invoice.id);
      }

      console.log(`Automated billing completed for service ${serviceCode}`);
    } catch (error) {
      console.error('Error in automated service billing:', error);
      throw error;
    }
  }

  /**
   * Updates invoice totals by summing all line items
   * Handles subtotal, tax, and final total calculations
   */
  private static async updateInvoiceTotals(invoiceId: string): Promise<void> {
    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: invoiceId }
    });

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => 
      sum.plus(item.lineTotal), new Decimal(0)
    );

    // Get current invoice for discount/tax info
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate tax (10% example rate - configurable)
    const taxRate = new Decimal(0.10);
    const taxAmount = subtotal.minus(invoice.discountAmount || 0).times(taxRate);
    
    // Calculate total
    const total = subtotal.minus(invoice.discountAmount || 0).plus(taxAmount);
    
    // Calculate balance (total minus payments)
    const payments = await prisma.payment.findMany({
      where: { invoiceId: invoiceId }
    });
    
    const paidAmount = payments.reduce((sum, payment) => 
      sum.plus(payment.amount), new Decimal(0)
    );
    
    const balance = total.minus(paidAmount);

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        balance: balance,
      }
    });
  }

}