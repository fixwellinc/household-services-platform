import express from 'express';
import auth from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// PATCH /api/users/me - Update profile
router.patch('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, avatar } = req.body;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, email, phone, avatar },
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/users/me/change-password - Change password
router.post('/me/change-password', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/users/me/notifications - Update notification preferences
router.patch('/me/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications } = req.body; // Expecting an object, e.g. { email: true, sms: false }
    // TODO: Ensure 'notifications' is a JSON field on the user model
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { notifications },
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/me - Delete account
router.delete('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router; 