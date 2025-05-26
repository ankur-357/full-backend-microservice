const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workout",
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comment: { type: String, required: true },
  rating: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  authorRole: { type: String, enum: ["CLIENT", "COACH"], required: true },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
