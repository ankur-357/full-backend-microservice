const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Coach:
 *       type: object
 *       properties:
 *         _id:
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
 *         role:
 *           type: string
 *           enum: [COACH]
 *           description: User role
 *           example: COACH
 *         imageUrl:
 *           type: string
 *           description: URL to coach's profile image
 *           example: https://example.com/coach.jpg
 *         preferableActivity:
 *           type: string
 *           description: Coach's specialization
 *           example: Yoga
 *         availableTimeSlots:
 *           type: array
 *           items:
 *             type: string
 *           description: List of available time slots
 *           example: ["9:00 AM - 10:00 AM", "2:00 PM - 3:00 PM"]
 *     TimeSlot:
 *       type: string
 *       description: Time slot in format "HH:MM AM/PM - HH:MM AM/PM"
 *       example: "10:30 AM - 11:30 AM"
 *     AvailableSlotsResponse:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *     Feedback:
 *       type: object
 *       properties:
 *         clientImageUrl:
 *           type: string
 *           description: URL to client's profile image
 *           example: https://example.com/client.jpg
 *         clientName:
 *           type: string
 *           description: Client's name
 *           example: Jane Doe
 *         date:
 *           type: string
 *           format: date
 *           description: Date when feedback was created
 *           example: 2023-05-15
 *         id:
 *           type: string
 *           description: Feedback's unique identifier
 *           example: 60d21b4667d0d8992e610c85
 *         message:
 *           type: string
 *           description: Feedback comment
 *           example: Great coaching session!
 *         rating:
 *           type: number
 *           description: Rating given by client (1-5)
 *           example: 4.5
 *     FeedbacksResponse:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Feedback'
 *         currentPage:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         totalElements:
 *           type: integer
 *           description: Total number of feedbacks
 *           example: 15
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *           example: 3
 *     NotFoundError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Not found error message
 *           example: Coach not found
 *     ValidationCError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Validation error message
 *           example: Coach ID and date are required
 *     ServerError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Server error message
 *           example: Error getting coaches
 */

/**
 * @swagger
 * tags:
 *   name: Coaches
 *   description: Public coach-related endpoints
 */

/**
 * @swagger
 * /coaches:
 *   get:
 *     summary: Get all coaches
 *     tags: [Coaches]
 *     responses:
 *       200:
 *         description: List of coaches
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coach'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.get('/', coachController.getCoaches);

/**
 * @swagger
 * /coaches/{id}:
 *   get:
 *     summary: Get a coach by ID
 *     tags: [Coaches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coach ID
 *     responses:
 *       200:
 *         description: Coach details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coach'
 *       404:
 *         description: Coach not found
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
router.get('/:id', coachController.getCoachById);

/**
 * @swagger
 * /coaches/{coachId}/available-slots/{date}:
 *   get:
 *     summary: Get available slots for a coach on a specific date
 *     tags: [Coaches]
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *         description: Coach's unique identifier
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: List of available time slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailableSlotsResponse'
 *       400:
 *         description: Bad request - missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationCError'
 *       404:
 *         description: Coach not found
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
router.get('/:coachId/available-slots/:date', coachController.getAvailableSlots);

/**
 * @swagger
 * /coaches/{coachId}/feedbacks:
 *   get:
 *     summary: Get feedbacks for a coach
 *     tags: [Coaches]
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *         description: Coach's unique identifier
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: date,desc
 *           enum: [rating,asc, rating,desc, date,asc, date,desc]
 *         description: Sort field and order (field,order)
 *     responses:
 *       200:
 *         description: List of feedbacks for the coach
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeedbacksResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationCError'
 */
router.get('/:coachId/feedbacks', coachController.getCoachFeedbacks);

module.exports = router;