const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
}

/**
 * Validate name (only letters and spaces allowed)
 */
function validateName(name) {
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name);
}

/**
 * Validate password strength
 * Returns an object with isValid and message properties
 */
function validatePassword(password) {
  // Check if password is too long
  if (password.length > 29) {
    return { isValid: false, message: "Password too long" };
  }
  
  // Check if password is too short
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  // Check for uppercase letter
  const hasUpperCase = /[A-Z]/.test(password);
  if (!hasUpperCase) {
    return { isValid: false, message: "Password must contain at least one capital letter" };
  }
  
  // Check for special character
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasSpecialChar) {
    return { isValid: false, message: "Password must contain at least one special character" };
  }
  
  // Check for number
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  
  // If all checks pass
  return { isValid: true, message: "Strong password" };
}

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, preferableActivity, target } = req.body;

    // Check for required fields
    if (!firstName || !lastName || !email || !password || !preferableActivity || !target) {
      return res.status(400).json({ message: "Please provide all required values" });
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    // Validate first name (no digits or special characters)
    if (!validateName(firstName)) {
      return res.status(400).json({ message: "First name should only contain letters (no digits or special characters)" });
    }
    
    // Validate last name (no digits or special characters)
    if (!validateName(lastName)) {
      return res.status(400).json({ message: "Last name should only contain letters (no digits or special characters)" });
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }
    
    // Check if email contains consecutive dots
    if (email.includes('..')) {
      return res.status(400).json({ message: "Email cannot contain consecutive dots" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate preferableActivity and target
    const validActivities = ['Yoga', 'YOGA', 'PILATES', 'CARDIO', 'WEIGHTS', 'STRENGTH', 'FLEXIBILITY', "Climbing", "Strength training", "Cross-fit", "Cardio Training", "Rehabilitation"];
    const validTargets = [
      'LOSE_WEIGHT',
      'GAIN_WEIGHT',
      'IMPROVE_FLEXIBILITY',
      'GENERAL_FITNESS',
      'BUILD_MUSCLE',
      'REHABILITATION_RECOVERY'
    ];

    if (!validActivities.includes(preferableActivity)) {
      return res.status(400).json({ message: "Invalid preferable activity" });
    }
    
    if (!validTargets.includes(target)) {
      return res.status(400).json({ message: "Invalid target" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role based on email pattern
    let role;
    const coachEmailRegex = /^coach([0-9]|[1-9][0-9])@gmail\.com$/;
    
    if (email && coachEmailRegex.test(email)) {
      role = "COACH";
    } else {
      role = "CLIENT";
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      preferableActivity,
      target
    });

    // Save user
    await user.save();

    // Create user object without password for token
    const userForToken = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      imageUrl: user.imageUrl || ""
    };

    // Create JWT token with complete user object
    const token = jwt.sign(
      { user: userForToken }, 
      process.env.JWT_SECRET || "secret", 
      { expiresIn: "7d" }
    );

    // Return success response with token
    res.status(201).json({ 
      message: "User registered successfully",
      token,
      user: userForToken
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for required fields
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create user object without password for token
    const userForToken = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      imageUrl: user.imageUrl || ""
    };

    // Create JWT token with complete user object
    const token = jwt.sign(
      { user: userForToken }, 
      process.env.JWT_SECRET || "secret", 
      { expiresIn: "7d" }
    );

    // Return success response with token and user data
    res.status(200).json({ 
      user: userForToken,
      token
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};

// No need for logout functionality with token-based auth
// The client simply discards the token
exports.logoutUser = (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};