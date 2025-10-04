import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  // Clean up existing data (in correct order to handle foreign keys)
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.job.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customerEmployeeAssignment.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  const password = 'test1234';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'Customer User',
      role: 'CUSTOMER',
    },
  });

  // Create services (managed by admin)
  const cleaningService = await prisma.service.create({
    data: {
      name: 'House Cleaning',
      description: 'Full house cleaning service including kitchen, bathrooms, and bedrooms',
      category: 'CLEANING',
      complexity: 'SIMPLE',
      basePrice: 120,
      isActive: true,
    },
  });

  const plumbingService = await prisma.service.create({
    data: {
      name: 'Plumbing Repair',
      description: 'Expert plumbing services for leaks, clogs, and fixture installations',
      category: 'REPAIR',
      complexity: 'COMPLEX',
      basePrice: 180,
      isActive: true,
    },
  });

  const organizationService = await prisma.service.create({
    data: {
      name: 'Home Organization',
      description: 'Professional decluttering and organization of closets, garages, and living spaces',
      category: 'ORGANIZATION',
      complexity: 'MODERATE',
      basePrice: 100,
      isActive: true,
    },
  });

  // Create a booking
  await prisma.booking.create({
    data: {
      customerId: customer.id,
      serviceId: cleaningService.id,
      scheduledDate: new Date(Date.now() + 86400000),
      status: 'PENDING',
      totalAmount: 120,
      discountAmount: 0,
      finalAmount: 120,
    },
  });

  // Create a quote
  await prisma.quote.create({
    data: {
      userId: customer.id,
      email: customer.email,
      serviceId: cleaningService.id,
      message: 'Can I get a quote for deep cleaning of a 3-bedroom house?',
      status: 'PENDING',
    },
  });

  // Create email templates
  await prisma.emailTemplate.create({
    data: {
      name: 'Welcome Email',
      subject: 'Welcome to FixWell!',
      body: 'Welcome to FixWell! Thank you for joining us. We\'re excited to help you with your home maintenance needs.',
      html: '<h1>Welcome to FixWell!</h1><p>Thank you for joining us, {{userName}}! We\'re excited to help you with your home maintenance needs.</p><p>Your account is now active and ready to use.</p>',
      isHtmlMode: true,
      createdBy: admin.id,
    },
  });

  await prisma.emailTemplate.create({
    data: {
      name: 'Booking Confirmation',
      subject: 'Your appointment has been confirmed',
      body: 'Your appointment for {{serviceType}} has been confirmed for {{appointmentDate}} at {{appointmentTime}}.',
      html: '<h2>Appointment Confirmed</h2><p>Dear {{userName}},</p><p>Your appointment for <strong>{{serviceType}}</strong> has been confirmed for <strong>{{appointmentDate}}</strong> at <strong>{{appointmentTime}}</strong>.</p><p>Our technician {{technicianName}} will arrive at your location.</p>',
      isHtmlMode: true,
      createdBy: admin.id,
    },
  });

  await prisma.emailTemplate.create({
    data: {
      name: 'Payment Receipt',
      subject: 'Payment Receipt - {{invoiceNumber}}',
      body: 'Thank you for your payment of ${{amount}} for invoice {{invoiceNumber}}.',
      html: '<h2>Payment Receipt</h2><p>Dear {{userName}},</p><p>Thank you for your payment of <strong>${{amount}}</strong> for invoice <strong>{{invoiceNumber}}</strong>.</p><p>Payment Method: {{paymentMethod}}<br>Payment Date: {{paymentDate}}</p>',
      isHtmlMode: true,
      createdBy: admin.id,
    },
  });

  await prisma.emailTemplate.create({
    data: {
      name: 'Service Reminder',
      subject: 'Upcoming Service Appointment Reminder',
      body: 'This is a reminder that you have a service appointment scheduled for {{appointmentDate}} at {{appointmentTime}}.',
      html: '<h2>Service Appointment Reminder</h2><p>Dear {{userName}},</p><p>This is a friendly reminder that you have a service appointment scheduled for <strong>{{appointmentDate}}</strong> at <strong>{{appointmentTime}}</strong>.</p><p>Service: {{serviceType}}<br>Technician: {{technicianName}}</p>',
      isHtmlMode: true,
      createdBy: admin.id,
    },
  });

  await prisma.emailTemplate.create({
    data: {
      name: 'Service Completion',
      subject: 'Service Completed - Thank You!',
      body: 'Your {{serviceType}} service has been completed. Thank you for choosing FixWell!',
      html: '<h2>Service Completed</h2><p>Dear {{userName}},</p><p>Your <strong>{{serviceType}}</strong> service has been completed successfully!</p><p>We hope you\'re satisfied with our work. If you have any questions or need follow-up service, please don\'t hesitate to contact us.</p><p>Thank you for choosing FixWell!</p>',
      isHtmlMode: true,
      createdBy: admin.id,
    },
  });

  console.log('Seed data created! Password for all users: test1234');
  console.log('Admin: admin@example.com');
  console.log('Customer: customer@example.com');
  console.log('Email templates created: 5 templates');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 