const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     FeedbackRequest:
 *       type: object
 *       required:
 *         - workoutId
 *         - comment
 *         - rating
 *       properties:
 *         clientId:
 *           type: string
 *           description: ID of the client to provide feedback for the workout
 *           example: 67f9551c019a26ed5da87a60
 *         coachId:
 *           type: string
 *           description: ID of the coach to provide feedback for the workout
 *           example: 67f9623f74bc53fb3786ac2d
 *         workoutId:
 *           type: string
 *           description: ID of the workout to provide feedback for
 *           example: 60d21b4667d0d8992e610c85
 *         comment:
 *           type: string
 *           description: Feedback comment
 *           example: Great workout session, very helpful!
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5
 *           example: 4.5
 *     SuccessFResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: Feedback submitted successfully.
 *     NotFoundError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Not found error message
 *           example: Workout not found.
 *     ValidationFError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Validation error message
 *           example: Feedback can only be submitted when the workout is in 'WAITING FOR FEEDBACK FROM CLIENT OR WAITING FOR FEEDBACK FROM COACH' state.
 *     AuthorizationFError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Authorization error message
 *           example: You are not authorized to provide feedback for this workout.
 *     DuplicateError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Duplicate submission error message
 *           example: You have already provided feedback for this workout.
 *     ServerError:
 *       type: object
 *       properties:
 *         message:
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
 *   name: Feedbacks
 *   description: Feedback operations between clients and coaches
 */

/**
 * @swagger
 * /feedbacks:
 *   post:
 *     summary: Submit feedback for a workout
 *     description: Allows clients and coaches to submit feedback for completed workouts
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackRequest'
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessFResponse'
 *       400:
 *         description: Validation error or duplicate feedback
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationFError'
 *                 - $ref: '#/components/schemas/DuplicateError'
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
 *         description: Forbidden - not authorized for this workout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthorizationFError'
 *       404:
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.post("/", auth, feedbackController.giveFeedback);

module.exports = router;
