import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * GET /api/billing/fee-configurations
 * Get all fee configurations (pricing) - Admin only
 */
router.get('/fee-configurations', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const fees = await prisma.feeConfiguration.findMany({
      where: { isActive: true },
      orderBy: { feeType: 'asc' },
    });

    res.json({ fees });
  } catch (error) {
    console.error('Get fee configurations error:', error);
    res.status(500).json({
      error: 'Failed to fetch fee configurations',
      message: 'An error occurred while fetching fee configurations',
    });
  }
});

/**
 * POST /api/billing/fee-configurations
 * Create or update fee configuration - Admin only
 */
router.post('/fee-configurations', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { feeType, name, description, amount } = req.body;

    const fee = await prisma.feeConfiguration.upsert({
      where: { feeType },
      update: { name, description, amount },
      create: { feeType, name, description, amount },
    });

    res.json({
      message: 'Fee configuration saved successfully',
      fee,
    });
  } catch (error) {
    console.error('Save fee configuration error:', error);
    res.status(500).json({
      error: 'Failed to save fee configuration',
      message: 'An error occurred while saving fee configuration',
    });
  }
});

/**
 * POST /api/billing/invoices
 * Create invoice from encounter fees - Receptionist only
 */
router.post('/invoices', authenticate, authorize('RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { encounterId, patientId } = req.body;
    const userId = req.user?.userId;

    // Get encounter with fees
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        encounterFees: true,
        patient: true,
      },
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate total from fees
    const subtotal = encounter.encounterFees.reduce((sum, fee) => sum + Number(fee.amount), 0);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        patientId: patientId || encounter.patientId,
        encounterId,
        status: 'DRAFT',
        subtotal,
        total: subtotal,
        balance: subtotal,
        createdBy: userId,
        items: {
          create: encounter.encounterFees.map(fee => ({
            itemType: 'SERVICE',
            refId: fee.id,
            description: fee.description,
            quantity: 1,
            unitPrice: fee.amount,
            lineTotal: fee.amount,
          })),
        },
      },
      include: {
        items: true,
        patient: true,
      },
    });

    res.json({
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      message: 'An error occurred while creating invoice',
    });
  }
});

/**
 * GET /api/billing/invoices/:invoiceId
 * Get invoice details for checkout screen
 * Roles: RECEPTIONIST, ADMIN
 */
router.get('/invoices/:invoiceId', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: Array.isArray(invoiceId) ? invoiceId[0] : invoiceId },
      include: {
        items: true,
        payments: true,
        encounter: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      message: 'An error occurred while fetching the invoice',
    });
  }
});

/**
 * POST /api/billing/calculate-total
 * Calculate grand total with discount
 * Roles: RECEPTIONIST, ADMIN
 */
router.post('/calculate-total', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { invoiceId, discountAmount, discountReason } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, payments: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const discount = discountAmount || 0;
    const total = subtotal - discount;

    res.json({
      message: 'Total calculated successfully',
      calculations: { subtotal, discount, total },
    });
  } catch (error) {
    console.error('Calculate total error:', error);
    res.status(500).json({
      error: 'Failed to calculate total',
      message: 'An error occurred while calculating the total',
    });
  }
});

/**
 * POST /api/billing/process-payment
 * Process payment and update invoice status
 * Roles: RECEPTIONIST, ADMIN
 */
router.post('/process-payment', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, method, reference } = req.body;
    const userId = req.user?.userId;

    const payment = await prisma.payment.create({
      data: {
        invoice: {
          connect: { id: invoiceId },
        },
        amount,
        method,
        reference,
        receivedBy: userId || '',
      },
    });

    const totalPaid = await prisma.payment.findMany({
      where: { invoiceId },
    }).then(payments => payments.reduce((sum, p) => sum + Number(p.amount), 0));

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    const totalAmount = invoice?.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0) || 0;

    let status = 'PARTIALLY_PAID';
    if (totalPaid >= totalAmount) {
      status = 'PAID';
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' as any },
      });
    }

    res.json({
      message: 'Payment processed successfully',
      payment,
      totalPaid,
      status,
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      error: 'Failed to process payment',
      message: 'An error occurred while processing the payment',
    });
  }
});

/**
 * POST /api/billing/issue-invoice
 * Issue invoice (change status from DRAFT to ISSUED)
 * Roles: RECEPTIONIST, ADMIN
 */
router.post('/issue-invoice', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'ISSUED' as any },
    });

    res.json({
      message: 'Invoice issued successfully',
      invoice,
    });
  } catch (error) {
    console.error('Issue invoice error:', error);
    res.status(500).json({
      error: 'Failed to issue invoice',
      message: 'An error occurred while issuing the invoice',
    });
  }
});

/**
 * POST /api/billing/apply-discount
 * Apply discount to invoice
 * Roles: RECEPTIONIST, ADMIN
 */
router.post('/apply-discount', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { invoiceId, discountAmount, discountReason } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        discountAmount,
        discountReason,
      },
    });

    res.json({
      message: 'Discount applied successfully',
      invoice,
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({
      error: 'Failed to apply discount',
      message: 'An error occurred while applying the discount',
    });
  }
});

/**
 * POST /api/billing/void-invoice
 * Void invoice
 * Roles: RECEPTIONIST, ADMIN
 */
router.post('/void-invoice', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { invoiceId, reason } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'VOID' as any },
    });

    res.json({
      message: 'Invoice voided successfully',
      invoice,
    });
  } catch (error) {
    console.error('Void invoice error:', error);
    res.status(500).json({
      error: 'Failed to void invoice',
      message: 'An error occurred while voiding the invoice',
    });
  }
});

/**
 * GET /api/billing/patient/:patientId/invoices
 * Get all invoices for a patient
 */
router.get('/patient/:patientId/invoices', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const invoices = await prisma.invoice.findMany({
      where: {
        patientId: Array.isArray(patientId) ? patientId[0] : patientId
      },
      include: {
        items: true,
        payments: true,
        encounter: {
          select: {
            id: true,
            visitStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ invoices });
  } catch (error) {
    console.error('Get patient invoices error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient invoices',
      message: 'An error occurred while fetching patient invoices',
    });
  }
});

/**
 * GET /api/billing/invoices
 * Get all invoices - Receptionist only
 */
router.get('/invoices', authenticate, authorize('RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        items: true,
        payments: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
          },
        },
        encounter: {
          select: {
            id: true,
            visitStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    res.json({ invoices });
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      message: 'An error occurred while fetching invoices',
    });
  }
});

/**
 * PATCH /api/billing/invoices/:invoiceId/mark-paid
 * Mark invoice as paid - Receptionist only
 */
router.patch('/invoices/:invoiceId/mark-paid', authenticate, authorize('RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user?.userId;

    const invoice = await prisma.invoice.findUnique({
      where: { id: Array.isArray(invoiceId) ? invoiceId[0] : invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice status to PAID
    const updatedInvoice = await prisma.invoice.update({
      where: { id: Array.isArray(invoiceId) ? invoiceId[0] : invoiceId },
      data: {
        status: 'PAID',
        balance: 0,
        issuedAt: new Date(),
      },
    });

    res.json({
      message: 'Invoice marked as paid successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Mark invoice as paid error:', error);
    res.status(500).json({
      error: 'Failed to mark invoice as paid',
      message: 'An error occurred while marking invoice as paid',
    });
  }
});

export default router;