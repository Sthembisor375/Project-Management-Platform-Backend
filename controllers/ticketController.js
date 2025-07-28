const Ticket = require("../models/Ticket");
const User = require("../models/User");

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all tickets
exports.getTickets = async (req, res) => {
  try {
    let query = {};
    
    // If user is a client, only show tickets assigned to them
    if (req.user.role === 'client') {
      query.client = req.user.username; // Filter by client field matching username
    }
    // If user is admin (or any other role), show all tickets
    
    const tickets = await Ticket.find(query).populate("client", "username email");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a client, only allow access to tickets assigned to them
    if (req.user.role === 'client') {
      query.client = req.user.username;
    }
    
    const ticket = await Ticket.findOne(query).populate("client", "username");
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a ticket
exports.updateTicket = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a client, only allow updates to tickets assigned to them
    if (req.user.role === 'client') {
      query.client = req.user.username;
    }
    
    const ticket = await Ticket.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a ticket
exports.deleteTicket = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is a client, only allow deletion of tickets assigned to them
    if (req.user.role === 'client') {
      query.client = req.user.username;
    }
    
    const ticket = await Ticket.findOneAndDelete(query);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ message: "Ticket deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
