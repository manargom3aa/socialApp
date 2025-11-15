# SocialApp Backend 🌟

Backend API for a social media application built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

- **JWT Authentication** (Register/Login)
- **User Management** with avatar upload
- **Post Management** with text and images
- **Like & Comment System**
- **Real-time Chat** with Socket.io
- **Follow/Unfollow** functionality
- **RESTful API** design

## 🛠 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Multer** - File uploads
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin requests

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/manargom3aa/socialApp.git
cd socialApp
Backend Setup

bash
cd backend
npm install
Environment Configuration
Create .env file in backend directory:

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/socialapp
JWT_SECRET=your_jwt_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
Run the Server

bash
npm start
The server will run on: http://localhost:5000

🔧 API Endpoints
Authentication
POST /api/auth/register - User registration

POST /api/auth/login - User login

Users
GET /api/users/profile - Get user profile

PUT /api/users/profile - Update profile

GET /api/users/:id - Get user by ID

PUT /api/users/follow/:id - Follow user

PUT /api/users/unfollow/:id - Unfollow user

Posts
GET /api/posts - Get all posts

POST /api/posts - Create new post

GET /api/posts/:id - Get single post

PUT /api/posts/like/:id - Like/unlike post

POST /api/posts/comment/:id - Add comment

DELETE /api/posts/:id - Delete post

Chat
GET /api/chat/conversations - Get user conversations

GET /api/chat/messages/:userId - Get messages with user

📁 Project Structure
text
backend/
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   └── chatController.js
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   └── Message.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   └── chat.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── config/
│   └── database.js
└── server.js
🔐 Authentication
Protected routes require JWT token in header:

http
Authorization: Bearer <your_jwt_token>
💬 Real-time Features
Socket.io events:

sendMessage - Send new message

newMessage - Receive new message

userOnline - User online status

userOffline - User offline status

🗄 Database Models
User: name, email, password, avatar, bio, followers, following

Post: content, image, user, likes, comments

Comment: text, user, post

Message: sender, receiver, text, timestamp

🚀 Deployment
Set environment variables for production

Build and deploy to your preferred hosting service

Configure MongoDB Atlas for database

 
 
