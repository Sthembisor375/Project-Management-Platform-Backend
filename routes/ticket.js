const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const ticketMiddleware = require('../middleware/ticketMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Create a ticket
router.post('/', authMiddleware, ticketMiddleware, ticketController.createTicket);

// Get all tickets
router.get('/', authMiddleware, ticketController.getTickets);

// Get a ticket by ID
router.get('/:id', authMiddleware, ticketController.getTicketById);

// Update a ticket
router.put('/:id', authMiddleware, ticketMiddleware, ticketController.updateTicket);

// Delete a ticket
router.delete('/:id', authMiddleware, ticketController.deleteTicket);

module.exports = router; 