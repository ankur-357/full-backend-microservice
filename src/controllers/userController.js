const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");

// AWS S3 setup
const s3 = new AWS.S3({
  region: "eu-west-1",
});

// Upload base64-encoded file to S3
const uploadBase64File = async (base64Data, folder) => {
  try {
    const matches = base64Data.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 data format");
    }

    const mimeType = matches[1];
    const base64 = matches[2];
    const buffer = Buffer.from(base64, "base64");

    // Determine file extension
    let extension = "bin";
    if (mimeType.startsWith("image/")) {
      extension = mimeType.split("/")[1];
    } else if (mimeType === "application/pdf") {
      extension = "pdf";
    }

    const filename = `${uuidv4()}.${extension}`;
    const key = `${folder}/${filename}`;
    const bucketName = "team-1-deployment-bucket";

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: "public-read", // Optional: remove if you want to keep files private
    };
    console.log("Uploading to S3:", params);
    const result = await s3.upload(params).promise();
    console.log("Upload result:", result);
    console.log("File uploaded successfully:", result.Location);
    return result.Location;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    // Get user ID from authenticated user in request
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      firstName,
      lastName,
      about,
      title,
      preferableActivity,
      specializations,
      target,
      base64encodedImage,
      base64encodedFiles,
    } = req.body;

    // Enhanced validation for firstName - no spaces allowed
    if (firstName !== undefined) {
      if (typeof firstName !== "string" || firstName.trim() === "") {
        return formatResponse(400, {
          message: "First name is required and must be a non-empty string",
        });
      }

      // Check for special characters, numbers, and spaces
      if (!/^[a-zA-Z-]+$/.test(firstName)) {
        return formatResponse(400, {
          message:
            "First name should only contain letters and hyphens (no spaces, numbers, or special characters)",
        });
      }

      user.firstName = firstName;
    }

    // Enhanced validation for lastName - no spaces allowed
    if (lastName !== undefined) {
      if (typeof lastName !== "string" || lastName.trim() === "") {
        return formatResponse(400, {
          message: "Last name is required and must be a non-empty string",
        });
      }

      // Check for special characters, numbers, and spaces
      if (!/^[a-zA-Z-]+$/.test(lastName)) {
        return formatResponse(400, {
          message:
            "Last name should only contain letters and hyphens (no spaces, numbers, or special characters)",
        });
      }

      user.lastName = lastName;
    }

    // Validation for preferableActivity
    if (preferableActivity !== undefined) {
      const validActivities = [
        "Yoga",
        "Climbing",
        "Strength training",
        "Cross-fit",
        "Cardio Training",
        "Rehabilitation",
      ];
      if (!validActivities.includes(preferableActivity)) {
        return formatResponse(400, {
          message: "Invalid preferableActivity value",
          validOptions: validActivities,
        });
      }
      user.preferableActivity = preferableActivity;
    }

    // Validation for target
    if (target !== undefined) {
      const validTargets = [
        "LOSE_WEIGHT",
        "GAIN_WEIGHT",
        "IMPROVE_FLEXIBILITY",
        "GENERAL_FITNESS",
        "BUILD_MUSCLE",
        "REHABILITATION_RECOVERY",
      ];
      if (!validTargets.includes(target)) {
        return formatResponse(400, {
          message: "Invalid target value",
          validOptions: validTargets,
        });
      }
      user.target = target;
    }

    if (about) user.about = about;
    if (title) user.title = title;
    if (specializations) user.specializations = specializations;

    if (base64encodedImage) {
      const imageUrl = await uploadBase64File(base64encodedImage, "img");
      user.imageUrl = imageUrl;
    }

    if (base64encodedFiles !== undefined) {
      if (base64encodedFiles.length > 0) {
        // Add new files to existing ones
        const newFileUrls = await Promise.all(
          base64encodedFiles.map((fileData) =>
            uploadBase64File(fileData, "files")
          )
        );
        user.fileUrls = [...(user.fileUrls || []), ...newFileUrls];
      } else {
        // If an empty array is explicitly provided, clear all files
        user.fileUrls = [];
      }
    }

    await user.save();
    const updatedUser = await User.findById(userId).select("-password");
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res
      .status(500)
      .json({ message: "Failed to update user profile", error: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Error getting user profile" });
  }
};

// Get user by ID for backward compatibility
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      about: user.about,
      imageUrl: user.imageUrl,
      fileUrls: user.fileUrls,
      role: user.role,
      preferableActivity: user.preferableActivity,
      specializations: user.specializations,
      target: user.target,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// PUT /users/:userId/password
exports.updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new passwords are required." });
    }

    // Password length validation - minimum and maximum
    if (newPassword.length < 8) {
      return formatResponse(400, {
        message: "Password must be at least 8 characters long.",
      });
    }

    if (newPassword.length > 30) {
      return formatResponse(400, {
        message: "Password cannot exceed 30 characters.",
      });
    }
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      return formatResponse(400, {
        message: "Password must contain at least one uppercase letter.",
      });
    }

    // Check for at least one number
    if (!/[0-9]/.test(newPassword)) {
      return formatResponse(400, {
        message: "Password must contain at least one number.",
      });
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return formatResponse(400, {
        message: "Password must contain at least one special character.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
