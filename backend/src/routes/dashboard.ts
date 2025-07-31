import { Router } from 'express';

const router = Router();

// GET /dashboard
router.get('/', (_req, res) => {
  res.json({ status: 'Dashboard endpoint alive 🚀' });
});

export default router;
