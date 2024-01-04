
const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const User = require('../models/user'); // Assuming the path to your User model

const app = express();

// Use cookie-parser middleware
app.use(cookieParser());


// Route to update the mobile number for a user
router.post('/mobile', async (req, res) => {
  const { mobileNumber,userId } = req.body;

  try {
    // Check if userId is present in cookies
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in cookies' });
    }

    // Find user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the mobile number for the user
    user.mobileNumber = mobileNumber;
    await user.save();

    res.status(200).json({ message: 'Mobile number updated successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to update mobile number' });
  }
});


module.exports = router;
