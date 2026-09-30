# GMinsta

GMinsta is a beginner-friendly mini social media app built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.

## Features

- User registration and login with password hashing
- Profile management (username, email, bio, profile picture URL or **uploaded photo**)
- Follow and unfollow users
- Create text/image posts (URL or **file upload**), plus **Reels** (video upload with optional cover image)
- Profile grid: posts vs reels tabs (Instagram-style)
- Like and dislike posts
- Add and view comments
- Send and view chat messages between users

## Project Structure

```text
GMinsta/
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   ├── Message.js
├── middleware/
│   └── upload.js
├── routes/
│   ├── authRoutes.js
│   ├── postRoutes.js
│   ├── commentRoutes.js
│   ├── chatRoutes.js
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
├── views/
│   ├── login.html
│   ├── register.html
│   ├── home.html
│   ├── profile.html
│   ├── chat.html
├── app.js
├── package.json
└── README.md
```

## MongoDB Collections

- `users`
- `posts`
- `comments`
- `messages`

## Setup and Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Configure environment variables by creating a `.env` file in the root:

   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/gminsta
   JWT_SECRET=your-secret-key
   ```

3. Start MongoDB locally.

4. Run the app:

   ```bash
   npm run dev
   ```

   or

   ```bash
   npm start
   ```

5. Open in browser:

   [http://localhost:3000](http://localhost:3000)

## Notes

- This project uses simple HTML/CSS/JS frontend pages for clarity.
- Authentication uses JWT stored in browser localStorage.
- Uploaded files are stored under `public/uploads/` and served at `/public/uploads/...`.
- **API:** `POST /api/auth/me/avatar` (multipart field `avatar`) for profile photo; `POST /api/posts/upload` (fields `content`, `isReel`, `image`, `video`) for posts and reels.
