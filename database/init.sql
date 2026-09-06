-- =============================================================
-- FILE: database/init.sql
-- MỤC ĐÍCH: Khởi tạo toàn bộ database cho hệ thống IoT giám sát
--           nhiệt độ / độ ẩm phòng bằng ESP32
-- CÁCH DÙNG:
--   psql -U postgres -d iot_db -f database/init.sql
-- =============================================================

-- Xóa các bảng cũ nếu đã tồn tại (để chạy lại được)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS commands CASCADE;
DROP TABLE IF EXISTS sensor_data CASCADE;
DROP TABLE IF EXISTS devices CASCADE;

-- =============================================================
-- BẢNG: devices
-- Lưu thông tin các thiết bị ESP32 trong hệ thống
-- =============================================================
CREATE TABLE devices (
    id          SERIAL PRIMARY KEY,
    device_id   VARCHAR(50) UNIQUE NOT NULL,   -- Mã thiết bị, ví dụ: esp32-001
    name        VARCHAR(100) NOT NULL,          -- Tên hiển thị
    location    VARCHAR(100),                   -- Vị trí đặt thiết bị
    status      VARCHAR(20) DEFAULT 'offline',  -- online | offline
    last_seen   TIMESTAMP,                      -- Lần cuối thiết bị gửi dữ liệu
    created_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- BẢNG: sensor_data
-- Lưu dữ liệu nhiệt độ / độ ẩm từ thiết bị gửi lên
-- =============================================================
CREATE TABLE sensor_data (
    id           SERIAL PRIMARY KEY,
    device_id    VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    temperature  NUMERIC(5, 2) NOT NULL,   -- Nhiệt độ (°C)
    humidity     NUMERIC(5, 2) NOT NULL,   -- Độ ẩm (%)
    recorded_at  TIMESTAMP DEFAULT NOW()  -- Thời điểm ghi nhận
);

-- Index để query lịch sử nhanh hơn
CREATE INDEX idx_sensor_data_device_time ON sensor_data(device_id, recorded_at DESC);

-- =============================================================
-- BẢNG: commands
-- Lưu lịch sử lệnh điều khiển gửi đến thiết bị (bật/tắt quạt)
-- =============================================================
CREATE TABLE commands (
    id          SERIAL PRIMARY KEY,
    device_id   VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    command     VARCHAR(50) NOT NULL,           -- fan_on | fan_off
    status      VARCHAR(20) DEFAULT 'sent',     -- sent | executed | failed
    note        TEXT,                            -- Ghi chú tùy chọn
    created_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- BẢNG: alerts
-- Lưu các cảnh báo tự động (nhiệt độ cao, thiết bị offline, v.v.)
-- =============================================================
CREATE TABLE alerts (
    id          SERIAL PRIMARY KEY,
    device_id   VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,         -- high_temp | low_humidity | device_offline
    message     TEXT NOT NULL,               -- Nội dung cảnh báo
    is_read     BOOLEAN DEFAULT FALSE,       -- Đã đọc chưa
    created_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- DỮ LIỆU MẪU — để giao diện hiển thị được ngay sau khi import
-- =============================================================

-- Thêm thiết bị mẫu
INSERT INTO devices (device_id, name, location, status, last_seen) VALUES
    ('esp32-001', 'ESP32 Phòng Lab A', 'Phòng Lab A - Tầng 2', 'online',  NOW() - INTERVAL '1 minute'),
    ('esp32-002', 'ESP32 Phòng Máy B', 'Phòng Máy B - Tầng 3', 'offline', NOW() - INTERVAL '2 hours');

-- Thêm dữ liệu cảm biến mẫu cho esp32-001 (30 bản ghi, mỗi 2 phút)
INSERT INTO sensor_data (device_id, temperature, humidity, recorded_at) VALUES
    ('esp32-001', 28.5, 65.2, NOW() - INTERVAL  '2 minutes'),
    ('esp32-001', 28.7, 64.8, NOW() - INTERVAL  '4 minutes'),
    ('esp32-001', 29.1, 63.5, NOW() - INTERVAL  '6 minutes'),
    ('esp32-001', 29.4, 63.1, NOW() - INTERVAL  '8 minutes'),
    ('esp32-001', 30.2, 61.0, NOW() - INTERVAL '10 minutes'),
    ('esp32-001', 31.0, 60.3, NOW() - INTERVAL '12 minutes'),
    ('esp32-001', 31.5, 59.8, NOW() - INTERVAL '14 minutes'),
    ('esp32-001', 30.8, 60.5, NOW() - INTERVAL '16 minutes'),
    ('esp32-001', 30.1, 61.2, NOW() - INTERVAL '18 minutes'),
    ('esp32-001', 29.7, 62.0, NOW() - INTERVAL '20 minutes'),
    ('esp32-001', 29.3, 62.5, NOW() - INTERVAL '22 minutes'),
    ('esp32-001', 28.9, 63.3, NOW() - INTERVAL '24 minutes'),
    ('esp32-001', 28.6, 64.1, NOW() - INTERVAL '26 minutes'),
    ('esp32-001', 28.3, 64.8, NOW() - INTERVAL '28 minutes'),
    ('esp32-001', 27.9, 65.5, NOW() - INTERVAL '30 minutes'),
    ('esp32-001', 27.6, 66.0, NOW() - INTERVAL '32 minutes'),
    ('esp32-001', 27.8, 65.7, NOW() - INTERVAL '34 minutes'),
    ('esp32-001', 28.1, 65.2, NOW() - INTERVAL '36 minutes'),
    ('esp32-001', 28.4, 64.6, NOW() - INTERVAL '38 minutes'),
    ('esp32-001', 28.8, 64.0, NOW() - INTERVAL '40 minutes');

-- Thêm lịch sử lệnh điều khiển mẫu
INSERT INTO commands (device_id, command, status, note, created_at) VALUES
    ('esp32-001', 'fan_on',  'executed', 'Bật quạt do nhiệt độ cao',     NOW() - INTERVAL '15 minutes'),
    ('esp32-001', 'fan_off', 'executed', 'Tắt quạt sau 10 phút',         NOW() - INTERVAL  '5 minutes'),
    ('esp32-001', 'fan_on',  'sent',     'Bật quạt thủ công từ dashboard', NOW() - INTERVAL  '1 minute'),
    ('esp32-002', 'fan_on',  'failed',   'Thiết bị offline',              NOW() - INTERVAL '3 hours');

-- Thêm cảnh báo mẫu
INSERT INTO alerts (device_id, type, message, is_read, created_at) VALUES
    ('esp32-001', 'high_temp',       'Nhiệt độ vượt 31°C lúc 31.5°C',         FALSE, NOW() - INTERVAL '14 minutes'),
    ('esp32-001', 'high_temp',       'Nhiệt độ vượt 30°C lúc 30.2°C',         TRUE,  NOW() - INTERVAL '10 minutes'),
    ('esp32-002', 'device_offline',  'Thiết bị esp32-002 mất kết nối > 1 giờ', FALSE, NOW() - INTERVAL  '1 hour'),
    ('esp32-001', 'low_humidity',    'Độ ẩm xuống dưới 60% — cần chú ý',      TRUE,  NOW() - INTERVAL '12 minutes');
