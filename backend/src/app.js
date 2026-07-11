require('dotenv').config();
require('./workers/video.worker'); // Start the video transcoding worker 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later.',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/lessons', require('./routes/lesson.routes'));
app.use('/api/enrollments', require('./routes/enrollment.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/sections', require('./routes/section.routes'));
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('api/certificates', require('./routes/certificate.routes'));
app.use('/api/live-classes', require('./routes/liveclass.routes'))
app.use('/api/quizzes', require('./routes/quiz.routes'))
app.use('/api/blogs', require('./routes/blog.routes'))
app.use('/api/cms', require('./routes/cms.routes'))
app.use('/api/qr-payments', require('./routes/qrpayment.routes'))
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/finance', require('./routes/finance.routes'))
app.use('/api/affiliates', require('./routes/affiliate.routes'))
app.use('/api/esewa', require('./routes/esewa.routes'))
app.use('/api/installments', require('./routes/installment.routes'))
app.use('/api/chatbot', require('./routes/chatbot.routes'))



// Socket.io — real-time notifications
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.set('io', io);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 EduFlow server running on port ${PORT}`));

module.exports = { app, io };
