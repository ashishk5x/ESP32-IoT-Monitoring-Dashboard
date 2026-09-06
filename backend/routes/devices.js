// =============================================================
// FILE: backend/routes/devices.js
// MỤC ĐÍCH: Các API liên quan đến thiết bị (devices)
// =============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/devices
// Trả về danh sách tất cả thiết bị
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM devices ORDER BY created_at ASC'
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Lỗi GET /api/devices:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/devices/:device_id
// Trả về thông tin một thiết bị theo ID
router.get('/:device_id', async (req, res) => {
    const { device_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM devices WHERE device_id = $1',
            [device_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Lỗi GET /api/devices/:id:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
