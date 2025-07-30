const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Get all users (for admin assignment)
router.get('/', authMiddleware, userController.getAllUsers);

// Get all clients (users with role 'client')
router.get('/clients', authMiddleware, userController.getClients);

module.exports = router; 