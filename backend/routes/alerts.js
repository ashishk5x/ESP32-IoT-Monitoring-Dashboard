// =============================================================
// FILE: backend/routes/alerts.js
// MỤC ĐÍCH: Các API quản lý cảnh báo hệ thống
// =============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/alerts?unread_only=true
// Trả về danh sách cảnh báo, có thể lọc chỉ lấy chưa đọc
router.get('/', async (req, res) => {
    const unread_only = req.query.unread_only === 'true';

    try {
        let query, params;

        if (unread_only) {
            query = `
                SELECT a.*, d.name AS device_name
                FROM alerts a
                JOIN devices d ON d.device_id = a.device_id
                WHERE a.is_read = FALSE
                ORDER BY a.created_at DESC
                LIMIT 50
            `;
            params = [];
        } else {
            query = `
                SELECT a.*, d.name AS device_name
                FROM alerts a
                JOIN devices d ON d.device_id = a.device_id
                ORDER BY a.created_at DESC
                LIMIT 50
            `;
            params = [];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Lỗi GET /api/alerts:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PATCH /api/alerts/:id/read
// Đánh dấu một cảnh báo là đã đọc
router.patch('/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE alerts SET is_read = TRUE WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo' });
        }
        res.json({ success: true, message: 'Đã đánh dấu đã đọc', data: result.rows[0] });
    } catch (err) {
        console.error('Lỗi PATCH /api/alerts/:id/read:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
