const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - preferableActivity
 *         - target
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (min 8 chars, must include uppercase, number, and special char)
 *           example: Password123!
 *         preferableActivity:
 *           type: string
 *           enum: [Yoga, YOGA, PILATES, CARDIO, WEIGHTS, STRENGTH, FLEXIBILITY, Climbing, "Strength training", "Cross-fit", "Cardio Training", Rehabilitation]
 *           description: User's preferred activity
 *           example: Yoga
 *         target:
 *           type: string
 *           enum: [LOSE_WEIGHT, GAIN_WEIGHT, IMPROVE_FLEXIBILITY, GENERAL_FITNESS, BUILD_MUSCLE, REHABILITATION_RECOVERY]
 *           description: User's fitness goal
 *           example: GENERAL_FITNESS
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: Password123!
  *     SignInResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: User's unique identifier
 *               example: "6811e1382deaec7174eaabbd"
 *             firstName:
 *               type: string
 *               example: "Coach"
 *             lastName:
 *               type: string
 *               example: "One"
 *             email:
 *               type: string
 *               format: email
 *               example: "coach1@gmail.com"
 *             role:
 *               type: string
 *               enum: [CLIENT, COACH]
 *               example: "COACH"
 *             imageUrl:
 *               type: string
 *               example: "https://team-1-asset-bucket.s3.eu-west-1.amazonaws.com/img/9e2422cd-7046-4547-8e63-f8e96134cdc4.jpeg"
 *         token:
 *           type: string
 *           description: JWT authentication token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjgxMWUxMzgyZGVhZWM3MTc0ZWFhYmJkIiwiZmlyc3ROYW1lIjoiQ29hY2giLCJsYXN0TmFtZSI6Ik9uZSJ9.example"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Response message
 *           example: User registered successfully
 *         token:
 *           type: string
 *           description: JWT authentication token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: User's unique identifier
 *               example: 60d21b4667d0d8992e610c85
 *             firstName:
 *               type: string
 *               example: John
 *             lastName:
 *               type: string
 *               example: Doe
 *             email:
 *               type: string
 *               format: email
 *               example: user@example.com
 *             role:
 *               type: string
 *               enum: [CLIENT, COACH]
 *               example: CLIENT
 *             imageUrl:
 *               type: string
 *               example: https://example.com/profile.jpg
 *     ValidationError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Validation error message
 *           example: Password must contain at least one capital letter
 *     AuthError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Authentication error message
 *           example: Invalid credentials
 *     ServerError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Server error message
 *           example: Error registering user
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.post('/sign-up', authController.registerUser);

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignInResponse'
 *       400:
 *         description: Input validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.post('/sign-in', authController.loginUser);

module.exports = router;