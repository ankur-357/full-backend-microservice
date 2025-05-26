const Workout = require("../models/Workout");
const User = require("../models/User");


// Get available workouts
exports.getAvailableWorkout = async (req, res) => {
  try {
    // Extract query parameters from the request
    const queryParams = req.query || {};
    const { date, time, activity, coachId } = queryParams;

    if (!date || !time) {
      return res.status(400).json({ error: "Date and time are required." });
    }
    if (activity) {
      const validActivities = ['Yoga', 'Climbing', 'Strength training', 'Cross-fit', 'Cardio Training', 'Rehabilitation'];

      // Case-insensitive check for valid activity
      const isValidActivity = validActivities.some(
        validActivity => validActivity.toLowerCase() === activity.toLowerCase()
      );

      if (!isValidActivity) {
        return res.status(400).json({
          error: `Invalid activity. Valid activities are: ${validActivities.join(', ')}`,
        });
      }
    }
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
    } else if (requestedDay.length !==2 || !/^\d{2}$/.test(requestedDay) || day < 1 || day > 31) {
      return res.status(400).json({
        error: `Day should be a valid number between 01 and 31.`,
      });
    }

    // Additional validation for valid dates (e.g., no February 30)
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      return res.status(400).json({
        error: `Invalid date. Please provide a valid date.`,
      });
    }

    // Time validation (HH:MM in 24-hour format)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({
        error: "Time should be in HH:MM format (e.g., 09:30, 14:45)."
      });
    }

    const [hours, minutes] = time.split(':').map(Number);

    // Validate hours (00-23)
    if (hours < 0 || hours > 23) {
      return res.status(400).json({
        error: "Hours should be between 00 and 23."
      });
    }

    // Validate minutes (00-59)
    if (minutes < 0 || minutes > 59) {
      return res.status(400).json({
        error: "Minutes should be between 00 and 59."
      });
    }

    // Convert requested time to readable format (e.g., "10:30 AM")
    const requestedTime = new Date(`1970-01-01T${time}:00Z`).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }
    );

    // Build coach filter based on provided activity and coachId
    const coachFilter = {
      role: "COACH",
      availableTimeSlots: { $elemMatch: { $regex: requestedTime } },
    };

    if (activity) {
      // Case-insensitive activity matching
      coachFilter.preferableActivity = { $regex: new RegExp(`^${activity}$`, 'i') };
    }

    if (coachId) {
      coachFilter._id = coachId;
    }

    // Find coaches matching the filter criteria
    const coaches = await User.find(coachFilter).lean();

    // Check each coach's scheduled workouts at the requested date and time
    const requestedDateTime = new Date(`${date}T${time}:00.000Z`);
    const currentUTCTime = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours and 30 minutes in milliseconds
    const currentISTTime = new Date(currentUTCTime.getTime() + istOffsetMs);

    const currentISTTimeWithBuffer = new Date(currentISTTime.getTime());

    // Check if requested time is in the past or too close to current time
    if (requestedDateTime < currentISTTimeWithBuffer) {
      return res.status(400).json({
        error: `Workouts must be scheduled at least 30 minutes in advance from your local time.`,
      });
    }

    const availableCoaches = [];

    for (const coach of coaches) {
      const existingWorkout = await Workout.findOne({
        coachId: coach._id,
        dateTime: requestedDateTime,
        state: { $in: ["SCHEDULED", "IN_PROGRESS"] },
      });

      // Coach is available if no existing workout is found at requested time
      if (!existingWorkout) {
        availableCoaches.push({
          coachId: coach._id,
          firstName: coach.firstName,
          lastName: coach.lastName,
          email: coach.email,
          preferableActivity: coach.preferableActivity,
          availableTimeSlots: coach.availableTimeSlots,
          imageUrl: coach.imageUrl,
          about:
            coach.about ||
            `A ${coach.preferableActivity} Expert dedicated to crafting personalized workout plans that align with your goals.`,
        });
      }
    }

    return res.status(200).json({ availableCoaches });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Book a new workout
exports.bookNewWorkout = async (req, res) => {
  // Handle OPTIONS request for CORS preflight
  if (req.httpMethod === "OPTIONS") {
    return res.status(200).json( {});
  }

  try {
    const authResult = await verifyToken(req);
    if (!authResult.isAuthorized) return authResult.response;

    const body = JSON.parse(req.body || "{}");
    const user = authResult.user;
    const clientId = user.id;

    // Fetch user from DB to verify role
    const userDoc = await User.findById(clientId);
    if (!userDoc || userDoc.role !== "CLIENT") {
      return res.status(403).json({ message: "Only clients can book workouts" });
    }

    const { date, coachId, timeSlot } = body;

    if (!coachId || !date || !timeSlot) {
      return res.status(400).json({
        error: "coachId, date, and timeSlot are required.",
      });
    }

    // Verify coach exists
    const coach = await User.findOne({
      _id: coachId,
      role: "COACH",
    });

    if (!coach) {
      return res.status(404).json({ error: "Coach not found." });
    }

    // Check if the coach has an available time slot that matches the requested time
    function convertTo12HourFormat(time24) {
      const [hour, minute] = time24.split(':').map(Number);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    const formattedTime = convertTo12HourFormat(timeSlot);

    const matchingTimeSlot = coach.availableTimeSlots.find(slot =>
      slot.startsWith(formattedTime)
    );

    console.log(matchingTimeSlot, "matchingTimeSlot");

    if (!matchingTimeSlot) {
      return res.status(404).json({
        error: "Coach not available at the selected time slot.",
      });
    }

    let startTime;
    if (timeSlot.includes("-")) {
      startTime = timeSlot.split("-")[0].trim();
    } else {
      startTime = timeSlot;
    }

    // Parse the time components
    const [hours, minutes] = startTime.split(':').map(Number);

    // Get current date and time in IST
    const currentUTCTime = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours and 30 minutes in milliseconds
    const currentISTTime = new Date(currentUTCTime.getTime() + istOffsetMs);

    // Parse the requested date
    const [requestedYear, requestedMonth, requestedDay] = date.split('-');

    // Convert to numbers after validation
    const year = Number(requestedYear);
    const month = Number(requestedMonth);
    const day = Number(requestedDay);

    // Check format (YYYY-MM-DD)
    if (requestedYear.length !== 4 || !/^\d{4}$/.test(requestedYear)) {
      return res.status(400).json( {
        error: `Year should be a 4-digit number.`,
      });
    } else if (requestedMonth.length !== 2 || !/^\d{2}$/.test(requestedMonth) || month < 1 || month > 12) {
      return res.status(400).json({
        error: `Month should be a 2-digit number between 01 and 12.`,
      });
    } else if (requestedDay.length !== 2 || !/^\d{2}$/.test(requestedDay) || day < 1 || day > 31) {
      return res.status(400).json({
        error: `Day should be a 2-digit number between 01 and 31.`,
      });
    }

    // Additional validation for valid dates (e.g., no February 30)
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      return res.status(400).json({
        error: `Invalid date. Please provide a valid date.`,
      });
    }

    // Create a date object for the requested time in IST
    const requestedISTDateTime = new Date(Date.UTC(
      requestedYear,
      requestedMonth - 1, // JavaScript months are 0-indexed
      requestedDay,
      hours,
      minutes
    ));

    console.log("Current IST time:", currentISTTime.toISOString());
    console.log("Requested time in IST:", requestedISTDateTime.toISOString());

    // Add buffer time (e.g., 30 minutes)
    const bufferTimeInMinutes = 30;
    const currentISTTimeWithBuffer = new Date(currentISTTime.getTime() + bufferTimeInMinutes * 60000);

    // Check if requested time is in the past or too close to current time
    if (requestedISTDateTime < currentISTTimeWithBuffer) {
      return res.status(400).json({
        error: `Workouts must be scheduled at least ${bufferTimeInMinutes} minutes in advance from your local time.`,
      });
    }

    // Convert the IST time to UTC for storage
    const workoutDateTime = requestedISTDateTime.toISOString();

    // Check if client already has a workout scheduled at this time
    const clientExistingWorkout = await Workout.findOne({
      clientId,
      dateTime: workoutDateTime,
      state: { $in: ["SCHEDULED", "IN_PROGRESS"] },
    });

    if (clientExistingWorkout) {
      return res.status(409).json({
        error: "You already have a workout scheduled at this time.",
      });
    }

    // Check for conflicting workouts for the coach (ignore CANCELED/FINISHED)
    const conflictingWorkout = await Workout.findOne({
      coachId,
      dateTime: workoutDateTime,
      state: { $in: ["SCHEDULED", "IN_PROGRESS"] },
    });

    if (conflictingWorkout) {
      return res.status(409).json({
        error: "Coach already has a workout scheduled at this time slot.",
      });
    }

    //  Check for AVAILABLE workout to reuse
    const availableWorkout = await Workout.findOne({
      coachId,
      dateTime: workoutDateTime,
      state: "AVAILABLE",
    });

    if (availableWorkout) {
      availableWorkout.clientId = clientId;
      availableWorkout.state = "SCHEDULED";
      await availableWorkout.save();

      return res.status(200).json({
        id: availableWorkout._id,
        name: availableWorkout.name,
        activity: availableWorkout.activity,
        description: availableWorkout.description,
        dateTime: availableWorkout.dateTime,
        coachId: availableWorkout.coachId,
        clientId: availableWorkout.clientId,
        feedbackId: availableWorkout.feedbackId || "",
        state: availableWorkout.state,
      });
    }

    // Create and save the new workout booking
    const newWorkout = new Workout({
      name: `${coach.preferableActivity} class`,
      activity: coach.preferableActivity,
      description: `${coach.preferableActivity} class with coach ${coach.firstName} ${coach.lastName}`,
      dateTime: workoutDateTime,
      coachId,
      clientId,
      state: "SCHEDULED",
    });

    await newWorkout.save();

    // Prepare response aligned with BookedWorkoutResponse structure
    return res.status(201).json({
      id: newWorkout._id,
      name: newWorkout.name,
      activity: newWorkout.activity,
      description: newWorkout.description,
      dateTime: newWorkout.dateTime,
      coachId: newWorkout.coachId,
      clientId: newWorkout.clientId,
      feedbackId: newWorkout.feedbackId || "",
      state: newWorkout.state,
    });
  } catch (error) {
    // console.error(error);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(409).json({
        error:
          "This time slot is already booked. Please try a different time or date.",
      });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
};
// Get user's workouts
exports.getUserWorkouts = async (req, res) => {
  // Handle OPTIONS request for CORS preflight
  if (req.httpMethod === "OPTIONS") {
    return res.status(200).json({});
  }

  try {
    const authResult = await verifyToken(req);
    if (!authResult.isAuthorized) return authResult.response;

    // Get user from auth result
    const user = authResult.user;
    const userId = user.id;
    const userRole = user.role;

    const currentUTCTime = new Date();

    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours and 30 minutes in milliseconds
    const currentISTTime = new Date(currentUTCTime.getTime() + istOffsetMs);
    console.log(currentISTTime);

    let query = {};
    let populatePath = "";
    let selectFields = "";

    if (userRole === "CLIENT") {
      query = { clientId: userId };
      populatePath = "coachId";
      selectFields = "firstName lastName email imageUrl title";
    } else if (userRole === "COACH") {
      query = { coachId: userId, state: { $ne: "AVAILABLE" } };
      populatePath = "clientId";
      selectFields = "firstName lastName email imageUrl";
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    const workouts = await Workout.find(query)
      .populate({
        path: populatePath,
        select: selectFields,
      })
      .sort({ dateTime: 1 });

    // Update workout states based on time
    for (const workout of workouts) {
      const endTime = new Date(
        workout.dateTime.getTime() + workout.duration * 60000
      );
      console.log("endTime", endTime);
      // If workout is scheduled and has ended
      if (
        currentISTTime >= endTime &&
        workout.state === "SCHEDULED"
      ) {
        // Change state to waiting for client feedback
        workout.state = "WAITING FOR FEEDBACK FROM CLIENT";
        await workout.save();
      }
    }

    // Transform workouts while preserving populated data
    const transformedWorkouts = workouts.map((workout) => {
      // Convert Mongoose document to plain object
      const workoutObj = workout.toObject ? workout.toObject() : workout;

      return {
        id: workoutObj._id,
        activity: workoutObj.activity,
        name: workoutObj.name,
        description: workoutObj.description,
        dateTime: workoutObj.dateTime,
        state: workoutObj.state,
        // Preserve the populated objects
        coachId: workoutObj.coachId,
        clientId: workoutObj.clientId,
        duration: workoutObj.duration
      };
    });

    return res.status(200).json({ content: transformedWorkouts });
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return res.status(500).json({ message: "Error fetching workouts" });
  }
};

// Cancel workout
exports.cancelWorkout = async (req, res) => {
  // Handle OPTIONS request for CORS preflight
  if (req.httpMethod === "OPTIONS") {
    return res.status(200).json({});
  }

  try {
    const authResult = await verifyToken(req);
    if (!authResult.isAuthorized) return authResult.response;

    // Get workoutId from either pathParameters or directly from req
    const workoutId = req.workoutId || req.pathParameters?.workoutId;
    if (!workoutId) {
      return res.status(400).json({ message: "Workout ID is required" });
    }

    const user = authResult.user;
    const userId = user.id;

    console.log("Looking for workout with ID:", workoutId);
    const workout = await Workout.findById(workoutId.trim());
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    console.log(workout);
    const isCoach = workout.coachId.toString() === userId;
    const isClient = workout.clientId && workout.clientId.toString() === userId;

    if (!isCoach && !isClient) {
      return res.status(403).json({
        message: "Not authorized to cancel this workout",
      });
    }

    if (isClient && workout.state !== "SCHEDULED") {
      return res.status(400).json({
        message: "Only scheduled workouts can be cancelled",
      });
    }

    // Add 12-hour cutoff rule
    const now = new Date();
    const workoutTime = new Date(workout.dateTime);
    const hoursDiff = (workoutTime - now) / (1000 * 60 * 60);

    if (hoursDiff < 12) {
      return res.status(400).json( {
        message: "Workout can only be cancelled 12 hours in advance",
      });
    }

    if (isClient) {
      // Mark the existing workout as cancelled (for history)
      workout.state = "CANCELED";
      await workout.save();

      // Create a new AVAILABLE workout slot for the same time
      const newAvailableWorkout = new Workout({
        name: workout.name,
        activity: workout.activity,
        description: workout.description,
        dateTime: workout.dateTime,
        coachId: workout.coachId,
        state: "AVAILABLE",
      });
      await newAvailableWorkout.save();


      return res.status(200).json({
        message: "Workout cancelled and new slot made available",
        workoutId: workout._id,
      });
    }

    if (isCoach) {
      // // Coach cancellation: delete workout completely
      await workout.deleteOne();
      return res.status(200).json({
        message: "Workout cancelled and removed from availability",
        workoutId,
      });
    }
  } catch (error) {
    console.error("Error cancelling workout:", error);
    return res.status(400).json({ message: "Error cancelling workout" });
  }
};