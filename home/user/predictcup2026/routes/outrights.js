import express from 'express';
import { submitOutright } from '../services/outright.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, type, selectionId } = req.body;
    const result = await submitOutright(userId, type, selectionId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;