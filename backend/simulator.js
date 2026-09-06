// =============================================================
// FILE: backend/simulator.js
// MỤC ĐÍCH: Giả lập ESP32 gửi dữ liệu nhiệt độ/độ ẩm lên backend
//           định kỳ — dùng khi chưa có phần cứng thật để test
//
// CÁCH CHẠY (mở terminal riêng, sau khi backend đã chạy):
//   node simulator.js
//
// DỪNG: nhấn Ctrl+C
// =============================================================

const http = require('http');

// --- Cấu hình ---
const BACKEND_HOST   = 'localhost';
const BACKEND_PORT   = 3000;
const DEVICE_ID      = 'esp32-001';
const INTERVAL_MS    = 5000;   // Gửi dữ liệu mỗi 5 giây

// Nhiệt độ và độ ẩm ban đầu
let temperature = 28.0;
let humidity    = 65.0;

// Mô phỏng dao động tự nhiên theo kiểu "random walk"
function nextValue(current, min, max, maxStep) {
    const delta = (Math.random() - 0.5) * 2 * maxStep;
    const next  = current + delta;
    return Math.min(max, Math.max(min, parseFloat(next.toFixed(2))));
}

// Gửi một bản ghi cảm biến lên POST /api/sensor
function sendSensorData() {
    temperature = nextValue(temperature, 20, 40, 0.8);
    humidity    = nextValue(humidity, 40, 90, 1.5);

    const body = JSON.stringify({
        device_id:   DEVICE_ID,
        temperature: temperature,
        humidity:    humidity
    });

    const options = {
        hostname: BACKEND_HOST,
        port:     BACKEND_PORT,
        path:     '/api/sensor',
        method:   'POST',
        headers: {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    const req = http.request(options, (res) => {
        const ts = new Date().toLocaleTimeString('vi-VN');
        if (res.statusCode === 200) {
            console.log(`[${ts}] ✅ Đã gửi — Nhiệt độ: ${temperature}°C  |  Độ ẩm: ${humidity}%`);
        } else {
            console.log(`[${ts}] ⚠️  Server trả về HTTP ${res.statusCode}`);
        }
    });

    req.on('error', (err) => {
        const ts = new Date().toLocaleTimeString('vi-VN');
        console.error(`[${ts}] ❌ Không gửi được: ${err.message}`);
        console.error('     → Hãy đảm bảo backend đang chạy: node server.js');
    });

    req.write(body);
    req.end();
}

// --- Bắt đầu giả lập ---
console.log('==============================================');
console.log(`  ESP32 Simulator đang chạy`);
console.log(`  Thiết bị : ${DEVICE_ID}`);
console.log(`  Gửi tới  : http://${BACKEND_HOST}:${BACKEND_PORT}/api/sensor`);
console.log(`  Chu kỳ   : ${INTERVAL_MS / 1000} giây/lần`);
console.log(`  Dừng     : Ctrl+C`);
console.log('==============================================');

// Gửi ngay lần đầu, sau đó theo chu kỳ
sendSensorData();
setInterval(sendSensorData, INTERVAL_MS);
