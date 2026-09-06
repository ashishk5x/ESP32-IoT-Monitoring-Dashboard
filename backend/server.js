// =============================================================
// FILE: backend/server.js
// MỤC ĐÍCH: Điểm khởi động chính của backend.
//           Tạo Express app, đăng ký routes, khởi động server.
// CÁCH CHẠY:
//   node server.js
//   hoặc (tự restart khi sửa file):
//   npx nodemon server.js
// =============================================================

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());                  // Cho phép frontend gọi API từ cổng khác
app.use(express.json());          // Parse body dạng JSON
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
const devicesRouter  = require('./routes/devices');
const sensorsRouter  = require('./routes/sensors');
const commandsRouter = require('./routes/commands');
const alertsRouter   = require('./routes/alerts');

// Health check — kiểm tra server đang chạy
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server đang chạy bình thường',
        timestamp: new Date().toISOString()
    });
});

// Đăng ký các nhóm route
app.use('/api/devices',  devicesRouter);
app.use('/api',          sensorsRouter);   // /api/latest, /api/history, /api/sensor
app.use('/api',          commandsRouter);  // /api/commands, /api/fan/on, /api/fan/off
app.use('/api/alerts',   alertsRouter);

// Route không tồn tại
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại` });
});

// --- Khởi động server ---
app.listen(PORT, () => {
    console.log('==============================================');
    console.log(`  IoT Dashboard Backend đang chạy`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log('==============================================');
});
