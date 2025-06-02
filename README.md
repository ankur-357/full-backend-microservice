# 🏋️‍♂️ Gym Management Backend

This is the backend for a Gym Management Application developed using **Node.js**, **Express**, and **MongoDB**. It provides a full set of features to manage gym users, workouts, coaches, feedback, and reporting.

---

## 📦 Project Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- AWS credentials (if using AWS features like S3)
- `.env` configuration file

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🚀 Features Implemented

### ✅ User Stories (R8.1)

| User Story ID | Feature | Status |
|--------------|---------|--------|
| US_1 | User Profile Registration | ✅ Completed |
| US_2 | User Login | ✅ Completed |
| US_3 | Automatic Role Assignment | ✅ Completed |
| US_4 | View Available Workouts | ✅ Completed |
| US_5 | View Coach Information | ✅ Completed |
| US_6 | Client's Workout Management | ✅ Completed |
| US_7 | Coach Workout Management | ✅ Completed |
| US_8 | Client Feedback | ✅ Completed |
| US_9 | Coach Feedback | ✅ Completed |
| US_10 | Automated Reports | ✅ Completed |
| US_11 | Reporting Interface (Optional) | ✅ Completed |
| US_12 | Update Profile Information (Optional) | ✅ Completed |

## 📝 User Registration

### Fields Required
- Full Name
- Email (must be unique)
- Password (validated for strength)
- Fitness Goal (e.g., lose weight, gain muscle)
- Preferred Activity (e.g., yoga, strength training)

### Validation Rules
- Email must be in proper format
- Password must meet complexity requirements
- Duplicate emails are not allowed

## 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Client, Coach, Admin)
- Cookies used to store session tokens securely

## 📅 Client Workout Booking

### Booking Flow
- Accessible via Client Dashboard or Coach's card
- Select available workout slots
- Form includes:
  - Time of workout
  - Type of workout
  - Coach's name

### Constraints
- Only logged-in users can access the booking form
- Prevents overbooking (respects workout capacity)
- Confirmation shown after successful booking
- Bookings manageable from Client dashboard
- Cancelation allowed up to 12 hours before start

## 🗣️ Client Feedback

### Flow
- Feedback form becomes available when workout is marked as "finished"
- After submission, feedback is visible to:
  - The Client
  - Assigned Coach
  - Admin

## ⚙️ Technologies Used
- Node.js & Express – Backend Framework
- MongoDB & Mongoose – NoSQL Database
- JWT – Authentication
- Multer – File Uploads
- node-cron – Scheduling Reports
- Swagger – API Documentation
- dotenv – Environment Configuration

## 📁 Folder Structure
```
src/
├── controllers/        # Business logic
├── models/             # Mongoose models
├── routes/             # API endpoints
├── middleware/         # Auth, validation, error handlers
├── utils/              # Helpers/utilities
└── app.js              # Application entry point
```

## 📚 API Documentation
Swagger UI is available at:

```
http://localhost:<PORT>/api-docs
```

## 🧪 Environment Variables
Create a .env file at the root of the project with the following keys:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gym
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## 📜 Scripts
```json
"scripts": {
  "start": "node src/app.js",
  "dev": "nodemon src/app.js",
  "test": "echo \"Error: no test specified\" && exit 1",
  "build": "npx esbuild src/app.js --bundle --platform=node --outfile=dist/app.js --external:aws-sdk --external:mongoose"
}
```

## 👤 Author
Created by: Ankur kumar 
Last Modified: May 28, 2025

## 🪪 License
Licensed under the ISC license.

## 📞 Contact
For any queries or issues, please contact [Tatiana Marchenko].

## Installation

Install my-project with npm

```bash
npm install my-project
cd my-project
```

## Usage/Examples

```javascript
import Component from 'my-project'

function App() {
  return <Component />
}
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
