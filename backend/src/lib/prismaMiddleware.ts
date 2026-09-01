import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from './prisma';
import { BillingAutomationService } from './billingAutomation';
import { VisitRoutingService } from './visitRouting';

/**
 * Prisma Middleware for Database Automation
 * Provides automatic triggers/hooks for clinic workflow automation
 */

export function setupPrismaMiddleware() {
  // Middleware for Encounter creation
  prisma.$use(async (params, next) => {
    // Before creating an encounter, set initial visit status
    if (params.model === 'Encounter' && params.action === 'create') {
      console.log('🔄 AUTOMATION: Creating new encounter with initial TRIAGE status');
      
      // Ensure visit status is set to TRIAGE by default
      if (!params.args.data.visitStatus) {
        params.args.data.visitStatus = 'TRIAGE';
      }
    }

    // After creating an encounter, trigger automated triage notification
    // Note: Prisma middleware doesn't have "after" action, notifications are handled in service layer
    if (params.model === 'Encounter' && params.action === 'create') {
      console.log('🔄 AUTOMATION: Encounter created, notifying nursing staff');
      // Here you could add notification logic to alert nurses
    }

    // Before updating encounter visit status
    if (params.model === 'Encounter' && params.action === 'update') {
      const oldData = await prisma.encounter.findUnique({
        where: { id: params.args.where.id as string },
        select: { visitStatus: true }
      });

      const newStatus = params.args.data.visitStatus;
      
      if (oldData && newStatus && oldData.visitStatus !== newStatus) {
        console.log(`🔄 AUTOMATION: Visit status changing from ${oldData.visitStatus} to ${newStatus}`);
        
        // Trigger specific automation based on status change
        switch (newStatus) {
          case 'LAB_PENDING':
            console.log('🔄 AUTOMATION: Lab orders pending, notifying lab technicians');
            break;
          case 'LAB_READY':
            console.log('🔄 AUTOMATION: Lab results ready, notifying doctor');
            break;
          case 'BILLING':
            console.log('🔄 AUTOMATION: Visit complete, sending to billing');
            // Automatically create draft invoice if doesn't exist
            await ensureDraftInvoice(params.args.where.id as string);
            break;
          case 'COMPLETED':
            console.log('🔄 AUTOMATION: Visit completed, clearing from dashboards');
            break;
        }
      }
    }

    // After creating lab orders, trigger automated billing
    if (params.model === 'LabOrder' && params.action === 'create') {
      console.log('🔄 AUTOMATION: Lab order created, triggering automated billing');
      
      // The automated billing is handled in the API route, but we could add backup here
      // if (params.args.data.encounterId) {
      //   try {
      //     await BillingAutomationService.processLabOrderBilling(
      //       (result as any).id,
      //       params.args.data.encounterId as string
      //     );
      //   } catch (error) {
      //     console.error('Middleware automated billing failed:', error);
      //   }
      // }
    }

    // After updating lab results, check if all results are complete
    if (params.model === 'LabResult' && params.action === 'update') {
      console.log('🔄 AUTOMATION: Lab result updated, checking completion status');
      
      // The visit routing is handled in the API route, but this provides backup
    }

    // After creating invoice items, recalculate invoice totals
    if (params.model === 'InvoiceItem' && params.action === 'create') {
      console.log('🔄 AUTOMATION: Invoice item created, recalculating totals');
      
      // Recalculate invoice totals automatically
      if (params.args.data.invoiceId) {
        try {
          await recalculateInvoiceTotals(params.args.data.invoiceId as string);
        } catch (error) {
          console.error('Middleware invoice recalculation failed:', error);
        }
      }
    }

    // After creating payments, update invoice status and balance
    if (params.model === 'Payment' && params.action === 'create') {
      console.log('🔄 AUTOMATION: Payment created, updating invoice status');
      
      // Update invoice status and balance
      if (params.args.data.invoiceId) {
        try {
          await updateInvoiceAfterPayment(params.args.data.invoiceId as string);
        } catch (error) {
          console.error('Middleware invoice update after payment failed:', error);
        }
      }
    }

    // Audit logging for critical operations
    const criticalModels = ['Encounter', 'LabOrder', 'Invoice', 'Payment'];
    if (criticalModels.includes(params.model as string)) {
      const criticalActions = ['create', 'update', 'delete'];
      if (criticalActions.includes(params.action as string)) {
        try {
          await logAuditEvent(params);
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      }
    }

    return next(params);
  });

  console.log('✅ Prisma middleware setup complete');
}

/**
 * Ensure draft invoice exists for encounter when moving to billing
 */
async function ensureDraftInvoice(encounterId: string): Promise<void> {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        patient: true,
        invoices: {
          where: { status: 'DRAFT' }
        }
      }
    });

    if (!encounter) return;

    // Only create draft invoice if one doesn't exist
    if (encounter.invoices.length === 0) {
      await prisma.invoice.create({
        data: {
          invoiceNo: `INV-${Date.now()}-${encounter.patientId.substring(0, 8)}`,
          patientId: encounter.patientId,
          encounterId: encounter.id,
          status: 'DRAFT',
          subtotal: 0,
          total: 0,
          balance: 0,
        }
      });
      console.log('🔄 AUTOMATION: Created draft invoice for encounter');
    }
  } catch (error) {
    console.error('Error ensuring draft invoice:', error);
  }
}

/**
 * Recalculate invoice totals after invoice item changes
 */
async function recalculateInvoiceTotals(invoiceId: string): Promise<void> {
  try {
    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: invoiceId }
    });

    const subtotal = items.reduce((sum, item) => 
      sum.plus(item.lineTotal), new Decimal(0)
    );

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) return;

    const discountAmount = invoice.discountAmount || new Decimal(0);
    const discountedSubtotal = subtotal.minus(discountAmount);
    const taxRate = new Decimal(0.10);
    const taxAmount = discountedSubtotal.times(taxRate);
    const total = discountedSubtotal.plus(taxAmount);

    // Calculate payments
    const payments = await prisma.payment.findMany({
      where: { invoiceId: invoiceId }
    });

    const paidAmount = payments.reduce((sum, payment) => 
      sum.plus(payment.amount), new Decimal(0)
    );

    const balance = total.minus(paidAmount);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        balance: balance,
      }
    });

    console.log('🔄 AUTOMATION: Invoice totals recalculated');
  } catch (error) {
    console.error('Error recalculating invoice totals:', error);
  }
}

/**
 * Update invoice status after payment
 */
async function updateInvoiceAfterPayment(invoiceId: string): Promise<void> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce((sum, payment) => 
      sum.plus(payment.amount), new Decimal(0)
    );

    const newBalance = invoice.total.minus(totalPaid);

    let newStatus = invoice.status;
    if (newBalance.equals(0)) {
      newStatus = 'PAID';
    } else if (newBalance.lessThan(invoice.total) && newBalance.greaterThan(0)) {
      newStatus = 'PARTIALLY_PAID';
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        balance: newBalance,
        status: newStatus,
      }
    });

    // If fully paid and visit is in billing, complete the visit
    if (newStatus === 'PAID' && invoice.encounterId) {
      const encounter = await prisma.encounter.findUnique({
        where: { id: invoice.encounterId },
        select: { visitStatus: true }
      });

      if (encounter?.visitStatus === 'BILLING') {
        await prisma.encounter.update({
          where: { id: invoice.encounterId },
          data: { visitStatus: 'COMPLETED' }
        });
        console.log('🔄 AUTOMATION: Visit completed after payment');
      }
    }

    console.log('🔄 AUTOMATION: Invoice status updated after payment');
  } catch (error) {
    console.error('Error updating invoice after payment:', error);
  }
}

/**
 * Log audit events for critical operations
 */
async function logAuditEvent(params: any): Promise<void> {
  try {
    // This is a simplified audit logging - in production you'd want more details
    const auditData = {
      entityType: params.model,
      action: params.action,
      entityId: params.args.where?.id || params.args.data?.id || 'unknown',
      timestamp: new Date(),
      // Add more details as needed
    };

    console.log('🔄 AUDIT:', auditData);
    
    // In production, you'd save this to the AuditLog table
    // await prisma.auditLog.create({ data: auditData });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}