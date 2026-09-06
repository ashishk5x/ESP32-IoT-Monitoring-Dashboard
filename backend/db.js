// =============================================================
// FILE: backend/db.js
// MỤC ĐÍCH: Tạo kết nối đến PostgreSQL và export ra để dùng ở
//           các file khác. Dùng thư viện `pg` (node-postgres).
// =============================================================

const { Pool } = require('pg');
require('dotenv').config();

// Pool là nhóm kết nối — hiệu quả hơn tạo kết nối mới mỗi request
const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'iot_db',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

// Kiểm tra kết nối khi server khởi động
pool.connect((err, client, release) => {
    if (err) {
        console.error('Lỗi kết nối PostgreSQL:', err.message);
        console.error('Hãy kiểm tra lại file .env và đảm bảo PostgreSQL đang chạy.');
    } else {
        console.log('Kết nối PostgreSQL thành công!');
        release();
    }
});

module.exports = pool;
