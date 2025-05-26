const Feedback = require("../models/Feedback");
const Workout = require("../models/Workout");
const User = require("../models/User");
const mongoose = require("mongoose");

// Get all coaches
exports.getCoaches = async (req, res) => {
  try {
    const coaches = await User.find({ role: "COACH" }).select(
      "-password -bookedTimeSlots"
    );

    res.json(coaches);
  } catch (error) {
    console.error("Error getting coaches:", error);
    res.status(500).json({ message: "Error getting coaches" });
  }
};

// Get coach by ID
exports.getCoachById = async (req, res) => {
  
  try {
    
    const coach = await User.findOne({
      _id: req.params.id,
      role: "COACH",
    }).select("-password -bookedTimeSlots");

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    res.json(coach);
  } catch (error) {
    console.error("Error getting coach:", error);
    res.status(500).json({ message: "Error getting coach" });
  }
};

// GET /coaches/:coachId/available-slots/:date
exports.getAvailableSlots = async (req, res) => {

  try {
    const { coachId, date } = req.params;
    if (!mongoose.Types.ObjectId.isValid(coachId)) {
      return res.status(400).json({ message: "Invalid coach ID format" });
    }
    if (!coachId || !date) {
      return res
        .status(400)
        .json({ message: "Coach ID and date are required" });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD format." });
  }

    // First, get the coach to check their available time slots
    const coach = await User.findOne({ 
      _id: coachId,
      role: 'COACH'
    });


    const [requestedYear, requestedMonth, requestedDay] = date.split('-');

    // Convert to numbers after validation
    const year = Number(requestedYear);
    const month = Number(requestedMonth);
    const day = Number(requestedDay);
  
    // Check format (YYYY-MM-DD)
    if (requestedYear.length !== 4 || !/^\d{4}$/.test(requestedYear)) {
      return res.status(400).json({
        error: `Year should be a 4-digit number.`,
      });
    } else if (requestedMonth.length !== 2 || !/^\d{2}$/.test(requestedMonth) || month < 1 || month > 12) {
      return res.status(400).json({
        error: `Month should be a 2-digit number between 01 and 12.`,
      });
    } else if (requestedDay.length === 0 || requestedDay.length === 3 || !/^\d{2}$/.test(requestedDay) || day < 1 || day > 31) {
      return res.status(400).json({
        error: `Day should be a 2-digit number between 01 and 31.`,
      });
    }
    // Parse the requested date explicitly in UTC
    const requestedDate = new Date(`${date}T00:00:00.000Z`);
  
    // Get today's date explicitly in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
  
    // Check if the requested date is in the past
    if (requestedDate < today) {
      return res.status(400).json({
        error: `You cannot check available slots for past dates. Please select today or a future date.`,
      });
    }

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    // Get all booked workouts for this coach on the given date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const bookedWorkouts = await Workout.find({
      coachId,
      dateTime: { $gte: startOfDay, $lte: endOfDay },
      state: { $in: ["SCHEDULED", "IN_PROGRESS", "WAITING FOR FEEDBACK FROM CIENT", "WAITING FOR FEEDBACK FROM COACH"] }
    });

    // Create a set of booked time slots in the format "10:30 AM - 11:30 AM"
    const bookedSlots = new Set();
    
    bookedWorkouts.forEach(workout => {
      const startTime = new Date(workout.dateTime);
      const endTime = new Date(startTime.getTime() + workout.duration * 60000);
      
      const formatTime = (time) =>
        time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC"
        });
      
      bookedSlots.add(`${formatTime(startTime)} - ${formatTime(endTime)}`);
    });

    // Filter out booked slots from the coach's available time slots
    const availableSlots = coach.availableTimeSlots.filter(
      slot => !bookedSlots.has(slot)
    );

    res.status(200).json({ content: availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Error fetching available slots" });
  }
};

// GET /coaches/:coachId/feedbacks
exports.getCoachFeedbacks = async (req, res) => {
  try {
    const { coachId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(coachId)) {
      return { status: 400, message: "Invalid coach ID format" };
    }

    const coach = await User.findOne({ _id: coachId, role: "COACH" });
  if (!coach) {
    return { status: 404, message: "Coach not found" };
  }
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 5;
    const sortQuery = req.query.sort || "date.desc";

    const [sortField, sortOrderRaw] = sortQuery.split(",");
    const sortOrder = sortOrderRaw === "asc" ? 1 : -1;
    const validSortFields = ["rating", "date"];
    const field =
      sortField === "date"
        ? "createdAt"
        : validSortFields.includes(sortField)
        ? sortField
        : "createdAt";
    const sort = { [field]: sortOrder };

    const skip = (page - 1) * size;

    const feedbacks = await Feedback.find({ coachId, authorRole: "CLIENT" })
      .sort(sort)
      .skip(skip)
      .limit(size)
      .populate("clientId", "name imageUrl");

    const totalElements = await Feedback.countDocuments({
      coachId,
      authorRole: "CLIENT",
    });

    const content = feedbacks.map((fb) => ({
      clientImageUrl: fb.clientId?.imageUrl || "",
      clientName: fb.clientId?.name || "Unknown",
      date: fb.createdAt ? fb.createdAt.toISOString().split("T")[0] : "",
      id: fb._id,
      message: fb.comment,
      rating: fb.rating || "",
    }));

    res.status(200).json({
      content,
      currentPage: page,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(400).json({ message: "Bad request" });
  }
};
