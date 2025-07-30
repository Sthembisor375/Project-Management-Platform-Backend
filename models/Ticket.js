const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      required: true,
      enum: [
        "backlog",
        "in_progress",
        "revisions",
        "client_review",
        "complete",
      ],
      default: "backlog",
    },
    client: { type: String },
    assignedTo: { type: String, default: "None" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
