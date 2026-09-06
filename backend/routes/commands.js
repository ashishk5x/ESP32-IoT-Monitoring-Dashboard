// =============================================================
// FILE: backend/routes/commands.js
// MỤC ĐÍCH: Các API điều khiển thiết bị (bật/tắt quạt)
//           và xem lịch sử lệnh điều khiển
// =============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/commands?device_id=esp32-001&limit=10
// Trả về lịch sử lệnh điều khiển
router.get('/commands', async (req, res) => {
    const device_id = req.query.device_id || null;
    const limit     = parseInt(req.query.limit) || 10;

    try {
        let query, params;

        if (device_id) {
            query = `
                SELECT c.*, d.name AS device_name
                FROM commands c
                JOIN devices d ON d.device_id = c.device_id
                WHERE c.device_id = $1
                ORDER BY c.created_at DESC
                LIMIT $2
            `;
            params = [device_id, limit];
        } else {
            query = `
                SELECT c.*, d.name AS device_name
                FROM commands c
                JOIN devices d ON d.device_id = c.device_id
                ORDER BY c.created_at DESC
                LIMIT $1
            `;
            params = [limit];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Lỗi GET /api/commands:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/fan/on
// Gửi lệnh BẬT quạt cho thiết bị
// Body (tùy chọn): { device_id }  — mặc định dùng thiết bị đầu tiên
router.post('/fan/on', async (req, res) => {
    const device_id = req.body.device_id || 'esp32-001';

    try {
        // Kiểm tra thiết bị tồn tại
        const device = await pool.query(
            'SELECT * FROM devices WHERE device_id = $1',
            [device_id]
        );
        if (device.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        }

        // Lưu lệnh vào database
        const result = await pool.query(
            `INSERT INTO commands (device_id, command, status, note)
             VALUES ($1, 'fan_on', 'sent', 'Bật quạt từ dashboard')
             RETURNING *`,
            [device_id]
        );

        // Ở đây có thể gửi lệnh qua MQTT tới ESP32 thật
        // Ví dụ: mqttClient.publish(`devices/${device_id}/cmd`, 'fan_on');

        res.json({
            success: true,
            message: `Đã gửi lệnh BẬT quạt tới ${device_id}`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Lỗi POST /api/fan/on:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/fan/off
// Gửi lệnh TẮT quạt cho thiết bị
// Body (tùy chọn): { device_id }
router.post('/fan/off', async (req, res) => {
    const device_id = req.body.device_id || 'esp32-001';

    try {
        const device = await pool.query(
            'SELECT * FROM devices WHERE device_id = $1',
            [device_id]
        );
        if (device.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        }

        const result = await pool.query(
            `INSERT INTO commands (device_id, command, status, note)
             VALUES ($1, 'fan_off', 'sent', 'Tắt quạt từ dashboard')
             RETURNING *`,
            [device_id]
        );

        // Ở đây có thể gửi lệnh qua MQTT tới ESP32 thật
        // Ví dụ: mqttClient.publish(`devices/${device_id}/cmd`, 'fan_off');

        res.json({
            success: true,
            message: `Đã gửi lệnh TẮT quạt tới ${device_id}`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Lỗi POST /api/fan/off:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
