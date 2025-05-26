const mongoose = require("mongoose");

const WorkoutSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    activity: {
      type: String,
      enum: ['Yoga', "Climbing", "Strength training", "Cross-fit", "Cardio Training", "Rehabilitation"],
      required: true,
    },
      description: String,
      dateTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          if (this.isNew) {
            return value > new Date();
          }
          return true; 
        },
        message: "Workout must be scheduled for a future time.",
      },
    },
    duration: { type: Number, default: 60 },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    state: {
      type: String,
      enum: ["AVAILABLE","IN_PROGRESS", "SCHEDULED","WAITING FOR FEEDBACK FROM CLIENT, WAITING FOR FEEDBACK FROM COACH", "FINISHED", "CANCELED"],
      default: "AVAILABLE",
    },
    feedbackId: { type: mongoose.Schema.Types.ObjectId, ref: "Feedback" },
  },
  { timestamps: true }
);
WorkoutSchema.index({ coachId: 1, dateTime: 1 }, { unique: true });
module.exports = mongoose.model("Workout", WorkoutSchema);
