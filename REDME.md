# 🎓 EduFlow LMS — Open Source Learning Management System

A production-grade, full-featured Learning Management System built with the MERN stack + PostgreSQL.

![EduFlow](https://placehold.co/1200x400/6366f1/white?text=EduFlow+LMS)

## ✨ Features

### 🎯 Core LMS
- HD video streaming with HLS (multi-quality: 360p / 720p / 1080p)
- Course builder with sections, lessons, quizzes
- Student enrollment + progress tracking
- PDF certificate generation on completion
- Reviews & star ratings

### 👥 User Management
- Role-based access: Admin / Instructor / Student
- JWT authentication with refresh token rotation
- Bulk enrollment by email list
- User blocking / activation

### 📹 Live Classes
- Zoom & Google Meet integration
- Recording upload & playback
- Upcoming class notifications

### 📝 MCQ Quiz System
- Question bank with explanations
- Timer, shuffle, max attempts
- Auto-scoring + pass/fail
- Answer review after submission

### 💳 Payments
- Khalti payment gateway
- eSewa payment gateway
- Installment payment plans
- QR payment with screenshot verification
- Manual payment ledger

### 📦 E-Commerce
- Book store (physical & digital products)
- Orders, inventory, stock management
- Shopping cart + checkout

### 💰 Finance & Accounting
- Revenue dashboard
- Income / expense tracking
- Instructor salary management
- Profit & loss reports

### 🔗 Affiliate Marketing
- Unique referral links
- Commission tracking (10% default)
- Payout requests (min NPR 500)
- Referral history logs

### 📱 Content Management
- Blog posts (Markdown support)
- Events management
- Testimonials with approval
- Newsletter with bulk sending
- Consultation request system

### 🤖 AI Chatbot
- Claude AI-powered student support
- Context-aware (knows enrolled courses)
- Quick suggestion prompts

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Primary DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Video | FFmpeg + HLS + AWS S3 |
| Auth | JWT + Refresh Tokens |
| Queue | Bull (Redis-based) |
| Email | Nodemailer |
| Payments | Khalti + eSewa |
| AI | Anthropic Claude API |
| Containers | Docker + Docker Compose |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- AWS S3 bucket (for video storage)
- Khalti merchant account
- Anthropic API key (for AI chatbot)

### 1. Clone the repository
```bash
git clone https://github.com/sxnmgxr/eduflow-lms.git
cd eduflow-lms
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

### 3. Start with Docker
```bash
docker-compose up -d
```

### 4. Run database migrations
```bash
docker exec -i eduflow-lms-postgres-1 psql -U postgres -d eduflow < backend/src/db/migrations/001_init.sql
```

### 5. Create admin user
```bash
docker exec -it eduflow-lms-postgres-1 psql -U postgres -d eduflow -c "
INSERT INTO users (name, email, password_hash, role, is_active, email_verified)
VALUES ('Admin', 'admin@eduflow.com', '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', 'admin', TRUE, TRUE);
"
```

Default credentials: `admin@eduflow.com` / `Admin@123`

### 6. Access
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| API Health | http://localhost:8000/api/health |

## 📁 Project Structure