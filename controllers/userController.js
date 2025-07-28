const User = require('../models/User');

// Get all clients (users with role 'client')
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 