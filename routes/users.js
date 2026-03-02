const express = require('express');
const { getProfile } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/profile', authenticateToken, getProfile);

module.exports = router;