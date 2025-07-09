import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@temp.local';
  const password = 'TempAdmin123!';
  const hashed = await bcrypt.hash(password, 12);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Temp admin already exists:', email);
    process.exit(0);
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: 'Temp Admin',
      role: 'ADMIN',
    },
  });
  console.log('Temp admin created:', user.email);
  console.log('Password:', password);

  // Example for one endpoint:
  // const subscription = user ? await prisma.subscription.findUnique({ where: { userId: user.id } }) : null;
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect()); 