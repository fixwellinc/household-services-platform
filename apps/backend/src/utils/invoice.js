import prisma from '../config/database.js';

// Generate unique invoice number
export function generateInvoiceNumber() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `INV-${timestamp.slice(-6)}-${random}`;
}

// Get next invoice number in sequence
export async function getNextInvoiceNumber() {
  try {
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!lastInvoice) {
      return 'INV-000001';
    }

    // Extract number from last invoice
    const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `INV-${nextNumber.toString().padStart(6, '0')}`;
    }

    // Fallback to timestamp-based generation
    return generateInvoiceNumber();
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return generateInvoiceNumber();
  }
}

// Calculate tax amount
export function calculateTax(subtotal, taxRate = 0.1) {
  return Math.round(subtotal * taxRate * 100) / 100;
}

// Calculate total amount
export function calculateTotal(subtotal, taxAmount, discountAmount = 0) {
  return Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
}

// Format currency
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Generate invoice PDF data (placeholder for PDF generation)
export function generateInvoicePDFData(invoice) {
  return {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.createdAt,
    dueDate: invoice.dueDate,
    customer: invoice.customer,
    technician: invoice.technician,
    job: invoice.job,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    discountAmount: invoice.discountAmount,
    totalAmount: invoice.totalAmount,
    status: invoice.status
  };
}
