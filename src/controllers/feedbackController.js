const Feedback = require("../models/Feedback");
const Workout = require("../models/Workout");

exports.giveFeedback = async (req, res) => {
  try {
    const { workoutId, comment, rating } = req.body;
    if (!mongoose.Types.ObjectId.isValid(workoutId)) {
      return res.status(400).json({ message: "Invalid workout ID format" });
    }
    const authorRole = req.user.role;
    const authorId = req.user.id;

    if (!workoutId || !comment || !rating) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields." });
    }
    if (rating > 5 || rating <= 0) {
      return res.status(400).json({ message: "Invalid Rating." });
    }

    // Find the workout by ID
    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found." });
    }

    // Check if the workout is in the correct state for feedback
    if (
      authorRole === "CLIENT" &&
      workout.state !== "WAITING FOR FEEDBACK FROM CLIENT"
    ) {
      return res.status(400).json({
        message:
          "Feedback can only be submitted when the workout is in 'WAITING FOR FEEDBACK FROM CLIENT' state.",
      });
    }

    if (
      authorRole === "COACH" &&
      workout.state !== "WAITING FOR FEEDBACK FROM COACH"
    ) {
      return res.status(400).json({
        message:
          "Feedback can only be submitted when the workout is in 'WAITING FOR FEEDBACK FROM COACH' state.",
      });
    }

    // Authorization check: ensure that the client can only submit feedback for their own workout
    if (
      authorRole === "CLIENT" &&
      String(workout.clientId) !== String(authorId)
    ) {
      return res
        .status(403)
        .json({
          message:
            "You are not authorized to provide feedback for this workout.",
        });
    }

    // Authorization check: ensure that the coach can only submit feedback for their own workout
    if (
      authorRole === "COACH" &&
      String(workout.coachId) !== String(authorId)
    ) {
      return res
        .status(403)
        .json({
          message:
            "You are not authorized to provide feedback for this workout.",
        });
    }

    // Ensure the user hasn't already provided feedback for this workout
    const existingFeedback = await Feedback.findOne({ workoutId, authorRole });
    if (existingFeedback) {
      return res
        .status(400)
        .json({
          message: "You have already provided feedback for this workout.",
        });
    }

    // Create and save new feedback
    const feedback = new Feedback({
      workoutId,
      clientId: workout.clientId,
      coachId: workout.coachId,
      comment,
      rating,
      authorRole,
    });

    await feedback.save();

    // Update workout state based on who provided feedback
    if (authorRole === "CLIENT") {
      // If client provided feedback, change state to waiting for coach feedback
      workout.state = "WAITING FOR FEEDBACK FROM COACH";
      await workout.save();
    } else if (authorRole === "COACH") {
      // If coach provided feedback, mark workout as finished
      workout.state = "FINISHED";
      await workout.save();
    }

    return res
      .status(201)
      .json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};
