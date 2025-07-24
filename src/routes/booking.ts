import { Router } from 'express';
import { addMinutes } from 'date-fns';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  const { resource, date } = req.query;
  const where: any = {};

  if (resource) where.resource = resource;
  if (date) {
    const day = new Date(date as string);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    where.startTime = { gte: day, lt: nextDay };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: 'asc' }
  });

  res.json(bookings);
});

router.post('/', async (req, res) => {
  const { resource, startTime, endTime, requestedBy } = req.body;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) return res.status(400).json({ error: 'End must be after start' });
  if ((end.getTime() - start.getTime()) < 15 * 60 * 1000)
    return res.status(400).json({ error: 'Min duration 15 mins' });

  const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (durationInHours > 2)
    return res.status(400).json({ error: 'Max booking duration is 2 hours' });

  const bufferBefore = addMinutes(start, -10);
  const bufferAfter = addMinutes(end, 10);

  const conflict = await prisma.booking.findFirst({
    where: {
      resource,
      startTime: { lt: bufferAfter },
      endTime: { gt: bufferBefore }
    }
  });

  if (conflict) return res.status(409).json({ error: 'Booking conflict' });

  const booking = await prisma.booking.create({
    data: { resource, startTime: start, endTime: end, requestedBy }
  });

  res.json(booking);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    await prisma.booking.delete({ where: { id: idNum } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Booking not found' });
  }
});

export default router;
