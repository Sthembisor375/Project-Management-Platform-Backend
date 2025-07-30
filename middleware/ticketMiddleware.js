// Middleware to validate ticket data for creation and update
module.exports = (req, res, next) => {
  const { title, status } = req.body;
  if (!title || !status) {
    return res.status(400).json({ error: "Title and status are required." });
  }
  next();
};
