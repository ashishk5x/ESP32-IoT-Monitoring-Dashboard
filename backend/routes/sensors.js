// =============================================================
// FILE: backend/routes/sensors.js
// MỤC ĐÍCH: Các API liên quan đến dữ liệu cảm biến
//           (nhiệt độ, độ ẩm)
// =============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/latest
// Trả về bản ghi mới nhất của mỗi thiết bị
// Frontend dùng để hiển thị nhiệt độ / độ ẩm hiện tại
router.get('/latest', async (req, res) => {
    try {
        // DISTINCT ON lấy bản ghi mới nhất theo device_id
        const result = await pool.query(`
            SELECT DISTINCT ON (sd.device_id)
                sd.id,
                sd.device_id,
                sd.temperature,
                sd.humidity,
                sd.recorded_at,
                d.name        AS device_name,
                d.location,
                d.status
            FROM sensor_data sd
            JOIN devices d ON d.device_id = sd.device_id
            ORDER BY sd.device_id, sd.recorded_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Lỗi GET /api/latest:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/history?device_id=esp32-001&limit=20
// Trả về lịch sử dữ liệu cảm biến gần nhất
// Mặc định lấy 20 bản ghi, có thể truyền limit và device_id qua query string
router.get('/history', async (req, res) => {
    const device_id = req.query.device_id || null;
    const limit     = parseInt(req.query.limit) || 20;

    try {
        let query, params;

        if (device_id) {
            query = `
                SELECT sd.*, d.name AS device_name
                FROM sensor_data sd
                JOIN devices d ON d.device_id = sd.device_id
                WHERE sd.device_id = $1
                ORDER BY sd.recorded_at DESC
                LIMIT $2
            `;
            params = [device_id, limit];
        } else {
            query = `
                SELECT sd.*, d.name AS device_name
                FROM sensor_data sd
                JOIN devices d ON d.device_id = sd.device_id
                ORDER BY sd.recorded_at DESC
                LIMIT $1
            `;
            params = [limit];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Lỗi GET /api/history:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/sensor
// Nhận dữ liệu cảm biến từ ESP32 gửi lên (hoặc từ simulator)
// Body: { device_id, temperature, humidity }
router.post('/sensor', async (req, res) => {
    const { device_id, temperature, humidity } = req.body;

    if (!device_id || temperature === undefined || humidity === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu dữ liệu: cần có device_id, temperature, humidity'
        });
    }

    try {
        // Lưu dữ liệu cảm biến
        await pool.query(
            'INSERT INTO sensor_data (device_id, temperature, humidity) VALUES ($1, $2, $3)',
            [device_id, temperature, humidity]
        );

        // Cập nhật trạng thái thiết bị thành online
        await pool.query(
            'UPDATE devices SET status = $1, last_seen = NOW() WHERE device_id = $2',
            ['online', device_id]
        );

        // Tự động tạo cảnh báo nếu nhiệt độ quá cao
        if (parseFloat(temperature) > 35) {
            await pool.query(
                `INSERT INTO alerts (device_id, type, message)
                 VALUES ($1, 'high_temp', $2)`,
                [device_id, `Nhiệt độ vượt ngưỡng: ${temperature}°C`]
            );
        }

        res.json({ success: true, message: 'Đã lưu dữ liệu cảm biến' });
    } catch (err) {
        console.error('Lỗi POST /api/sensor:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
