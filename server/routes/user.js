// routes/user.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/interests', async (req, res) => {
  try {
    const { interests, subscribedToEmails } = req.body;
    const user = await User.findById(req.user.id);  // Assuming authMiddleware sets req.user
    user.interests = interests;
    user.subscribedToEmails = subscribedToEmails;
    await user.save();
    res.json({ message: 'Interests updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating interests' });
  }
});

export default router;