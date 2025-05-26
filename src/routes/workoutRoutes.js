const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AvailableCoach:
 *       type: object
 *       properties:
 *         coachId: 
 *           type: string
 *           description: Coach's unique identifier
 *           example: 60d21b4667d0d8992e610c85
 *         firstName:
 *           type: string
 *           description: Coach's first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: Coach's last name
 *           example: Smith
 *         email:
 *           type: string
 *           format: email
 *           description: Coach's email address
 *           example: coach@example.com
 *         preferableActivity:
 *           type: string
 *           description: Coach's preferred activity
 *           example: Yoga
 *         availableTimeSlots:
 *           type: array
 *           items:
 *             type: string
 *           description: Coach's available time slots
 *           example: ["9:00 AM - 10:00 AM", "2:00 PM - 3:00 PM"]
 *         imageUrl:
 *           type: string
 *           description: URL to coach's profile image
 *           example: https://example.com/coach.jpg
 *         about:
 *           type: string
 *           description: Coach's bio or description
 *           example: A Yoga Expert dedicated to crafting personalized workout plans that align with your goals.
 *     AvailableCoachesResponse:
 *       type: object
 *       properties:
 *         availableCoaches:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AvailableCoach'
 *     Workout:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Workout's unique identifier
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           description: Name of the workout
 *           example: Yoga class
 *         activity:
 *           type: string
 *           description: Type of workout activity
 *           example: Yoga
 *         description:
 *           type: string
 *           description: Description of the workout
 *           example: Yoga class with coach John
 *         dateTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the workout
 *           example: 2023-06-15T14:00:00.000Z
 *         state:
 *           type: string
 *           enum: [AVAILABLE, SCHEDULED, IN_PROGRESS, WAITING_FOR_FEEDBACK, FINISHED, CANCELED]
 *           description: Current state of the workout
 *           example: SCHEDULED
 *         coachId:
 *           type: object
 *           description: Coach information
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d21b4667d0d8992e610c85
 *             firstName:
 *               type: string
 *               example: John
 *             lastName:
 *               type: string
 *               example: Smith
 *             email:
 *               type: string
 *               example: coach@example.com
 *             imageUrl:
 *               type: string
 *               example: https://example.com/coach.jpg
 *             title:
 *               type: string
 *               example: Certified Yoga Instructor
 *         clientId:
 *           type: object
 *           description: Client information
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d21b4667d0d8992e610c86
 *             firstName:
 *               type: string
 *               example: Jane
 *             lastName:
 *               type: string
 *               example: Doe
 *             email:
 *               type: string
 *               example: client@example.com
 *     WorkoutsResponse:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Workout'
 *     BookWorkoutRequest:
 *       type: object
 *       required:
 *         - coachId
 *         - date
 *         - timeSlot
 *       properties:
 *         coachId:
 *           type: string
 *           description: ID of the coach
 *           example: 60d21b4667d0d8992e610c85
 *         date:
 *           type: string
 *           format: date
 *           description: Date for the workout (YYYY-MM-DD format)
 *           example: 2023-06-15
 *         timeSlot:
 *           type: string
 *           description: Time for the workout (HH:MM format)
 *           example: 14:00
 *     BookWorkoutResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Workout's unique identifier
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           example: Yoga class
 *         activity:
 *           type: string
 *           example: Yoga
 *         description:
 *           type: string
 *           example: Yoga class with coach John
 *         dateTime:
 *           type: string
 *           format: date-time
 *           example: 2023-06-15T14:00:00.000Z
 *         coachId:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         clientId:
 *           type: string
 *           example: 60d21b4667d0d8992e610c86
 *         feedbackId:
 *           type: string
 *           example: ""
 *         state:
 *           type: string
 *           example: SCHEDULED
 *     CancelWorkoutResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: Workout cancelled and new slot made available
 *         workoutId:
 *           type: string
 *           description: ID of the cancelled workout
 *           example: 60d21b4667d0d8992e610c85
 *     ValidationWError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Validation error message
 *           example: Date and time are required.
 *     NotFoundError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Not found error message
 *           example: Coach not found.
 *     ConflictError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Conflict error message
 *           example: Coach already has a workout scheduled at this time slot.
 *     ForbiddenError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Authorization error message
 *           example: Not authorized to cancel this workout
 *     TimeConstraintError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Time constraint error message
 *           example: Workout can only be cancelled 12 hours in advance
 *     ServerError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Server error message
 *           example: Internal server error.
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Workouts
 *   description: Workout management endpoints
 */

/**
 * @swagger
 * /workouts/available:
 *   get:
 *     summary: Get available coaches for workouts
 *     description: Retrieves coaches available at the specified date and time, optionally filtered by activity or coach ID
 *     tags: [Workouts]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for the workout (YYYY-MM-DD format)
 *         example: 2023-06-15
 *       - in: query
 *         name: time
 *         required: true
 *         schema:
 *           type: string
 *         description: Time for the workout (HH:MM format)
 *         example: 14:00
 *       - in: query
 *         name: activity
 *         required: false
 *         schema:
 *           type: string
 *         description: Type of workout activity (case-insensitive)
 *         example: yoga
 *       - in: query
 *         name: coachId
 *         required: false
 *         schema:
 *           type: string
 *         description: ID of the coach
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: List of available coaches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailableCoachesResponse'
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationWError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.get('/available', workoutController.getAvailableWorkout);

/**
 * @swagger
 * /workouts:
 *   post:
 *     summary: Book a new workout
 *     description: Books a workout with a coach at a specific date and time
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookWorkoutRequest'
 *     responses:
 *       200:
 *         description: Existing available workout slot booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookWorkoutResponse'
 *       201:
 *         description: New workout booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookWorkoutResponse'
 *       400:
 *         description: Validation error or past date/time
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationWError'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       404:
 *         description: Coach or client not found, or time slot not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Conflicting workout or time slot already booked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.post('/', auth, workoutController.bookNewWorkout);

/**
 * @swagger
 * /workouts/booked:
 *   get:
 *     summary: Get user's booked workouts
 *     description: Retrieves all workouts for the authenticated user (client or coach)
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of booked workouts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutsResponse'
 *       400:
 *         description: Invalid user role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid user role
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching workouts
 */
router.get('/booked', auth, workoutController.getUserWorkouts);

/**
 * @swagger
 * /workouts/{workoutId}:
 *   delete:
 *     summary: Cancel a workout
 *     description: Cancels a workout with different behavior for clients and coaches
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the workout to cancel
 *     responses:
 *       200:
 *         description: Workout cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CancelWorkoutResponse'
 *       400:
 *         description: Invalid state or time constraint
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Only scheduled workouts can be cancelled
 *                 - $ref: '#/components/schemas/TimeConstraintError'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       403:
 *         description: Not authorized to cancel this workout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       404:
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Workout not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error cancelling workout
 */
router.delete('/:workoutId', auth, workoutController.cancelWorkout);

module.exports = router;