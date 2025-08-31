# 🌐 Social Connect

A **full-featured social networking platform** built with **Next.js**, **Supabase**, and **TypeScript** — designed to bring people together with real-time interactions, robust security, and a modern, responsive interface.

## 👨‍💻 Author

<p align="center">
  <b>Sayantan Chakraborty</b><br><br>
  <a href="https://github.com/Chakraborty-Sayantan">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://www.linkedin.com/in/sayantan-c12/">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
</p>

---

## ✨ Features

### 👥 User Features
- 🔐 **Secure Authentication System**
- 👤 **User Profiles** with customizable avatars
- 📝 **Create, Edit, and Delete Posts**
- 🖼️ **Image Upload** support for posts (max 2MB)
- 👥 **Follow / Unfollow** other users
- 🔔 **Real-time Notifications**
- 💬 **Comment** on posts
- ❤️ **Like / Unlike** posts
- 🌓 **Light / Dark Theme** support
- 📱 **Responsive Design** for all devices

### 🛠️ Admin Features
- 📊 **Admin Dashboard** with statistics
- 👥 **User Management**
  - View all users
  - Modify user roles
  - Delete users
- 📝 **Post Management**
  - Monitor all posts
  - Remove inappropriate content
- 📈 **Analytics Overview**

### 🛡️ Security Features
- 🔒 **Role-Based Access Control**
- 🛡️ **Protected API Routes**
- 🔐 **Secure Password Management**
- 🚫 **Rate Limiting** for sensitive endpoints
- 🔑 **JWT-Based Authentication**
- 👮 **Admin-Only Route Protection**

---

## 🧩 Tech Stack

| Layer             | Technology               |
|-------------------|--------------------------|
| **Frontend**      | Next.js 15+ (App Router) |
| **Backend**       | Supabase                 |
| **Authentication**| Supabase Auth            |
| **Database**      | PostgreSQL (via Supabase)|
| **Styling**       | Tailwind CSS             |
| **UI Components** | shadcn/ui                |
| **Type Safety**   | TypeScript               |

---

## ⚙️ Setup Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Chakraborty-Sayantan/Social-Connect.git
cd Social-Connect
```


## ⚙️ Setup Guide

### 2️⃣ Install Dependencies

```bash
npm install
```
### 3️⃣ Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
### 4️⃣ Database Setup

1. Create a new **Supabase project**.
2. Run the **database migrations**.
3. Set up **storage buckets** for image uploads.

---

### 5️⃣ Run the Development Server

```bash
npm run dev
```

### 6️⃣ Build for Production

```bash
npm run build
npm start
```
### 🚀 Deployment

Optimized for Vercel deployment:

Connect your repository to Vercel.

Configure the environment variables (same as in .env.local).

Deploy — your app goes live!


🤝 Contributing

You're welcome to contribute to SocialConnect!

1. Fork the repository
2. Create your feature branch: git checkout -b feature/awesome-feature
3. Commit your changes: git commit -m "Add awesome feature"
4. Push to the branch: git push origin feature/awesome-feature
5. Open a Pull Request
