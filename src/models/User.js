const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName:  {
    type: String,
    required: true
  },
  lastName:{
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ""
  },
  about: String,
  imageUrl: {
    type: String,
    default: ""
  },
  fileUrls: [String],
  phoneNumber: String,
  rating: String,
  role: {
    type: String,
    enum: ['CLIENT', 'COACH', 'ADMIN'],
    default: 'CLIENT'
  },
  specializations: {
    type: [String],
    default: ["Yoga", "Cardio", "Weight Loss"]
  },
  preferableActivity: {
    type: String,
    enum: ['Yoga', "Climbing", "Strength training", "Cross-fit", "Cardio Training", "Rehabilitation"],
  },

  target: {
    type: String,
    enum: [
      'LOSE_WEIGHT',
      'GAIN_WEIGHT',
      'IMPROVE_FLEXIBILITY',
      'GENERAL_FITNESS',
      'BUILD_MUSCLE',
      'REHABILITATION_RECOVERY'
    ],
    required: true
  
  },

  availableTimeSlots: {
    type: [String],
    default: function () {
      return this.role === 'COACH' ? [
        "8:00 PM - 9:00 PM",
        "10:30 AM - 11:30 AM",
        "3:00 PM - 4:00 PM",
        "4:00 PM - 5:00 PM",
        "6:00 PM - 7:00 PM",
        "7:00 PM - 8:00 PM",
        "8:00 PM - 9:00 PM"
      ] : [];
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.index({ "bookedTimeSlots.dateTime": 1 });

module.exports = mongoose.model('User', UserSchema);
