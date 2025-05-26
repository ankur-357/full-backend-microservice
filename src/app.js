const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const feedbackRoutes = require("./routes/feedbackRoutes");
const coachRoutes = require("./routes/coachRoutes");
const authRoutes = require("./routes/authRoutes");
// Import routes
const workoutRoutes = require("./routes/workoutRoutes");
const userRoutes = require("./routes/userRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "EnergyX API",
    version: "1.0.0",
    description: "API documentation for the EnergyX backend",
  },
  servers: [
    {
      url: "https://gym-backend-run8-1-team1-gym-dev.development.krci-dev.cloudmentor.academy/api/v1",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
const swaggerOptions = {
  swaggerDefinition,
  apis: ["**/routes/*.js"], // Assumes your routes are documented in route files
};

let swaggerSpec;
try {
  swaggerSpec = swaggerJSDoc(swaggerOptions);
} catch (err) {
  console.error("Swagger setup failed:", err);
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI ||
    "mongodb+srv://atharva:atharva123@cluster0.lhzs4pw.mongodb.net/usersDB?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("MongoDB Connected");
    // Start cron job after MongoDB connection
  })
  .catch((err) => console.log("MongoDB Connection Error: ", err));

// Routes
app.use("/auth", authRoutes);
app.use("/coaches", coachRoutes);
app.use("/workouts", workoutRoutes);
app.use("/feedbacks", feedbackRoutes);
app.use("/users", userRoutes);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
