import { Router } from 'express';
import { getFirestore } from '../config/firebase.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { roomStore } from '../services/roomStore.js';
import { userStore } from '../services/userStore.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/overview', async (_req, res, next) => {
  try {
    const rooms = await roomStore.listPublicRooms(100);
    const firestore = getFirestore();
    let reportsOpen = 0;
    let users = 0;

    if (firestore) {
      const reports = await firestore.collection('Reports').where('status', '==', 'open').count().get();
      const userCount = await firestore.collection('Users').count().get();
      reportsOpen = reports.data().count;
      users = userCount.data().count;
    }

    const reports = await userStore.listReports();

    res.json({
      metrics: {
        activeRooms: rooms.length,
        onlineParticipants: rooms.reduce(
          (sum, room) => sum + Object.values(room.participants).filter((participant) => participant.online).length,
          0
        ),
        reportsOpen,
        users
      },
      rooms,
      reports
    });
  } catch (error) {
    next(error);
  }
});
