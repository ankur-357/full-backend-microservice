const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User's unique identifier
 *           example: 60d21b4667d0d8992e610c85
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
 *         about:
 *           type: string
 *           description: User's bio or description
 *           example: Fitness enthusiast with 5 years of experience
 *         title:
 *           type: string
 *           description: User's professional title
 *           example: Certified Personal Trainer
 *         imageUrl:
 *           type: string
 *           description: URL to user's profile image
 *           example: https://team-1-deployment-bucket.s3.eu-west-1.amazonaws.com/img/profile.jpg
 *         fileUrls:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs to user's uploaded files
 *           example: ["https://team-1-deployment-bucket.s3.eu-west-1.amazonaws.com/files/certificate.pdf"]
 *         role:
 *           type: string
 *           enum: [CLIENT, COACH]
 *           description: User's role
 *           example: CLIENT
 *         preferableActivity:
 *           type: string
 *           description: User's preferred activity
 *           example: Yoga
 *         specializations:
 *           type: array
 *           items:
 *             type: string
 *           description: Coach's specializations
 *           example: ["Weight Loss", "Strength Training"]
 *         target:
 *           type: string
 *           description: User's fitness goal
 *           example: GENERAL_FITNESS
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: Doe
 *         about:
 *           type: string
 *           description: User's bio or description
 *           example: Fitness enthusiast with 5 years of experience
 *         title:
 *           type: string
 *           description: User's professional title
 *           example: Certified Personal Trainer
 *         preferableActivity:
 *           type: string
 *           description: User's preferred activity
 *           example: Yoga
 *         specializations:
 *           type: array
 *           items:
 *             type: string
 *           description: Coach's specializations
 *           example: ["Weight Loss", "Strength Training"]
 *         target:
 *           type: string
 *           description: User's fitness goal
 *           example: GENERAL_FITNESS
 *         base64encodedImage:
 *           type: string
 *           description: Base64 encoded profile image
 *           example: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...
 *         base64encodedFiles:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of base64 encoded files
 *           example: ["data:application/pdf;base64,JVBERi0xLjMKJcTl8uXrp..."]
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *           format: password
 *           description: User's current password
 *           example: CurrentPassword123!
 *         newPassword:
 *           type: string
 *           format: password
 *           description: User's new password
 *           example: NewPassword456!
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: Password updated successfully.
 *     NotFoundError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Not found error message
 *           example: User not found
 *     ValidationPError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Validation error message
 *           example: Old and new passwords are required.
 *     AuthPError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Authentication error message
 *           example: Old password is incorrect.
 *     ServerError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Server error message
 *           example: Internal server error.
 *         error:
 *           type: string
 *           description: Detailed error message
 *           example: Error uploading file to S3
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and account management
 */

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieves a user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
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
 *         description: User not found
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
router.get('/:userId', auth, userController.getUserProfile);

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update user profile
 *     description: Updates a user's profile information including optional image and file uploads
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
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
 *         description: User not found
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
router.put('/:userId', auth, userController.updateUserProfile);

/**
 * @swagger
 * /users/{userId}/password:
 *   put:
 *     summary: Update user password
 *     description: Updates a user's password after verifying the old password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or incorrect old password
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationPError'
 *                 - $ref: '#/components/schemas/AuthPError'
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
 *         description: User not found
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
router.put('/:userId/password', auth, userController.updateUserPassword);

module.exports = router;