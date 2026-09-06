# Hướng dẫn xây dựng hệ thống IoT thật từ đầu

> Dành cho: sinh viên đã chạy được template cơ bản và muốn làm project thật với phần cứng ESP32

---

## Tổng quan hệ thống đầy đủ

```
┌──────────────┐    WiFi/HTTP     ┌─────────────────┐    SQL     ┌──────────────┐
│  ESP32       │ ─────────────► │  Backend        │ ─────────► │  PostgreSQL  │
│  + DHT22     │                 │  Node.js/Express│            │  (cloud/VPS) │
│  + Relay     │ ◄───────────── │  + MQTT broker  │            └──────────────┘
│  (quạt thật) │   lệnh điều     └─────────────────┘                   ▲
└──────────────┘   khiển                 │                              │
                                    REST API                            │
                                         │                              │
                                ┌────────────────┐                      │
                                │  Frontend      │ ─────────────────────┘
                                │  Dashboard     │   (đọc dữ liệu)
                                └────────────────┘
```

---

## Lộ trình từng bước — Bắt đầu từ đâu?

### GIAI ĐOẠN 1 — Phần cứng + Firmware (Tuần 1–2)

**Làm trước tiên vì:** Đây là nguồn dữ liệu thật. Nếu không có dữ liệu thật, mọi thứ chỉ là demo.

#### 1.1 — Chuẩn bị linh kiện

| Linh kiện | Vai trò | Giá tham khảo |
|-----------|---------|---------------|
| ESP32 DevKit | Vi điều khiển, WiFi tích hợp | ~80.000đ |
| DHT22 (AM2302) | Cảm biến nhiệt độ + độ ẩm (chính xác hơn DHT11) | ~40.000đ |
| DHT11 | Thay thế DHT22 nếu không có (kém chính xác hơn) | ~15.000đ |
| Module Relay 5V | Bật/tắt quạt 220V từ ESP32 | ~15.000đ |
| Quạt 5V hoặc đèn LED | Demo thiết bị được điều khiển | ~20.000đ |
| Dây cắm breadboard | Kết nối linh kiện | ~10.000đ |

#### 1.2 — Sơ đồ kết nối ESP32 + DHT22

```
ESP32               DHT22
3.3V  ─────────────  VCC  (chân 1)
GPIO4 ─────────────  DATA (chân 2)  ← có thể đổi GPIO khác
GND   ─────────────  GND  (chân 4)

Ghi chú: Thêm điện trở 10kΩ giữa VCC và DATA (pull-up)
```

```
ESP32               Relay Module
3.3V  ─────────────  VCC
GND   ─────────────  GND
GPIO5 ─────────────  IN   ← chân điều khiển relay
```

#### 1.3 — Firmware Arduino cho ESP32

Cài đặt Arduino IDE:
1. Tải Arduino IDE tại https://www.arduino.cc/en/software
2. Thêm ESP32 board: File → Preferences → Additional boards URLs:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Tools → Board Manager → tìm "esp32" → Install
4. Cài thư viện: Sketch → Include Library → Manage Libraries → tìm "DHT sensor library" by Adafruit → Install

**File firmware: `esp32_firmware/main.ino`**

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ===== CẤU HÌNH — SINH VIÊN SỬA PHẦN NÀY =====
const char* WIFI_SSID     = "TenWifi";
const char* WIFI_PASSWORD = "MatKhauWifi";
const char* SERVER_URL    = "http://192.168.1.100:3000/api/sensor";
                          // ↑ đổi thành IP máy tính chạy backend
                          // hoặc URL Railway nếu đã deploy cloud
const char* DEVICE_ID     = "esp32-001";
const int   RELAY_PIN     = 5;    // GPIO điều khiển relay
const int   DHT_PIN       = 4;    // GPIO kết nối DHT22
const int   SEND_INTERVAL = 10000; // Gửi dữ liệu mỗi 10 giây

// ===== KHỞI TẠO =====
DHT dht(DHT_PIN, DHT22);  // Đổi DHT22 thành DHT11 nếu dùng DHT11
HTTPClient http;

void setup() {
    Serial.begin(115200);
    dht.begin();
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW);  // Tắt quạt khi khởi động

    Serial.println("Đang kết nối WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi đã kết nối!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}

void loop() {
    // Đọc cảm biến
    float humidity    = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
        Serial.println("Lỗi đọc DHT!");
        delay(2000);
        return;
    }

    Serial.printf("Nhiệt độ: %.1f°C  Độ ẩm: %.1f%%\n", temperature, humidity);

    // Gửi lên backend
    sendSensorData(temperature, humidity);

    // Đợi trước lần gửi tiếp theo
    delay(SEND_INTERVAL);
}

void sendSensorData(float temperature, float humidity) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi mất kết nối, bỏ qua lần này");
        return;
    }

    // Tạo JSON body
    StaticJsonDocument<200> doc;
    doc["device_id"]   = DEVICE_ID;
    doc["temperature"] = temperature;
    doc["humidity"]    = humidity;
    String body;
    serializeJson(doc, body);

    // Gửi HTTP POST
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(body);

    if (httpCode == 200) {
        Serial.println("Gửi dữ liệu thành công ✓");
    } else {
        Serial.printf("Gửi thất bại, HTTP code: %d\n", httpCode);
    }
    http.end();
}
```

> **Ghi chú quan trọng:** Thư viện `ArduinoJson` cần cài thêm:  
> Library Manager → tìm "ArduinoJson" by Benoit Blanchon → Install

---

### GIAI ĐOẠN 2 — Điều khiển quạt thật từ Backend (Tuần 2–3)

Sau khi ESP32 đã gửi được dữ liệu lên → tiếp theo cần nhận lệnh từ backend.

#### 2.1 — Cách đơn giản: ESP32 tự hỏi backend (Polling)

Thêm vào firmware: mỗi 3 giây, ESP32 gọi `GET /api/commands/latest` để hỏi có lệnh mới không.

**Thêm vào `backend/routes/commands.js`:**
```js
// GET /api/commands/latest?device_id=esp32-001
// ESP32 gọi endpoint này để lấy lệnh mới nhất chưa thực thi
router.get('/latest', async (req, res) => {
    const { device_id } = req.query;
    const result = await pool.query(
        `SELECT * FROM commands
         WHERE device_id = $1 AND status = 'sent'
         ORDER BY created_at DESC LIMIT 1`,
        [device_id]
    );
    if (result.rows.length === 0) {
        return res.json({ success: true, data: null });
    }
    // Đánh dấu đã gửi cho thiết bị
    await pool.query(
        "UPDATE commands SET status = 'executed' WHERE id = $1",
        [result.rows[0].id]
    );
    res.json({ success: true, data: result.rows[0] });
});
```

**Thêm vào firmware ESP32:**
```cpp
// Gọi sau sendSensorData() trong loop()
checkForCommand();

void checkForCommand() {
    String url = "http://192.168.1.100:3000/api/commands/latest?device_id=esp32-001";
    http.begin(url);
    int code = http.GET();
    if (code == 200) {
        String payload = http.getString();
        StaticJsonDocument<300> doc;
        deserializeJson(doc, payload);
        const char* command = doc["data"]["command"];
        if (command) {
            Serial.printf("Nhận lệnh: %s\n", command);
            if (strcmp(command, "fan_on") == 0) {
                digitalWrite(RELAY_PIN, HIGH);
            } else if (strcmp(command, "fan_off") == 0) {
                digitalWrite(RELAY_PIN, LOW);
            }
        }
    }
    http.end();
}
```

#### 2.2 — Cách nâng cao: MQTT (realtime, không cần polling)

MQTT là giao thức nhẹ, phù hợp IoT. ESP32 và backend kết nối cùng một broker.

```
ESP32 ────────────────────────────────► MQTT Broker (Mosquitto)
      publish: devices/esp32-001/data        │
      subscribe: devices/esp32-001/cmd  ◄────┘
                                             │
Backend ─────────────────────────────────────┘
      subscribe: devices/+/data
      publish: devices/esp32-001/cmd
```

**Cài Mosquitto broker (local):**
```bash
# Windows: tải tại https://mosquitto.org/download
# Ubuntu:
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

**Thêm MQTT vào backend:**
```bash
cd backend
npm install mqtt
```

Tạo file `backend/mqtt.js`:
```js
const mqtt  = require('mqtt');
const pool  = require('./db');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
    console.log('Kết nối MQTT broker thành công');
    client.subscribe('devices/+/data');  // Nhận dữ liệu từ mọi ESP32
});

client.on('message', async (topic, message) => {
    // topic ví dụ: devices/esp32-001/data
    const device_id = topic.split('/')[1];
    const data = JSON.parse(message.toString());

    await pool.query(
        'INSERT INTO sensor_data (device_id, temperature, humidity) VALUES ($1, $2, $3)',
        [device_id, data.temperature, data.humidity]
    );
    console.log(`MQTT: ${device_id} → ${data.temperature}°C / ${data.humidity}%`);
});

// Hàm gửi lệnh tới ESP32 qua MQTT
function sendCommand(device_id, command) {
    client.publish(`devices/${device_id}/cmd`, command);
}

module.exports = { sendCommand };
```

---

### GIAI ĐOẠN 3 — Cải thiện Backend (Tuần 3–4)

Sau khi phần cứng + kết nối ổn định → nâng cấp backend:

#### 3.1 — Thêm xác thực đơn giản

```bash
npm install jsonwebtoken bcryptjs
```

Thêm bảng `users` vào database:
```sql
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50) UNIQUE NOT NULL,
    password   VARCHAR(100) NOT NULL,  -- lưu dạng hash bcrypt
    role       VARCHAR(20) DEFAULT 'viewer',  -- viewer | admin
    created_at TIMESTAMP DEFAULT NOW()
);
```

Thêm route đăng nhập trả về JWT token, middleware kiểm tra token trên các route quan trọng.

#### 3.2 — Thêm API phân trang và lọc theo thời gian

```js
// GET /api/history?from=2024-01-01&to=2024-01-31&device_id=esp32-001
router.get('/history', async (req, res) => {
    const { device_id, from, to, limit = 100, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    // ... query với WHERE recorded_at BETWEEN $1 AND $2
});
```

#### 3.3 — Thêm logic cảnh báo tự động

Trong `POST /api/sensor`, tự tạo cảnh báo thông minh:
```js
// Cảnh báo nhiệt độ cao
if (temperature > 35) { ... }
// Cảnh báo độ ẩm thấp
if (humidity < 40) { ... }
// Cảnh báo thiết bị offline (chạy cron job mỗi 5 phút)
// Nếu last_seen > 10 phút trước → đánh dấu offline và tạo alert
```

---

### GIAI ĐOẠN 4 — Cải thiện Frontend (Tuần 4–5)

#### 4.1 — Thêm biểu đồ đẹp với Chart.js

```html
<!-- Thêm vào index.html -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

```js
// Thay drawTempChart() trong app.js bằng Chart.js
const chart = new Chart(document.getElementById('temp-chart'), {
    type: 'line',
    data: {
        labels: history.map(h => formatTimeShort(h.recorded_at)),
        datasets: [
            {
                label: 'Nhiệt độ (°C)',
                data: history.map(h => h.temperature),
                borderColor: '#ef5350',
                fill: false
            },
            {
                label: 'Độ ẩm (%)',
                data: history.map(h => h.humidity),
                borderColor: '#29b6f6',
                fill: false
            }
        ]
    }
});
```

#### 4.2 — Thêm realtime với WebSocket

```bash
npm install ws
```

Thay vì `setInterval` 10 giây, backend **đẩy dữ liệu** tới frontend ngay khi ESP32 gửi lên:
```js
// Trong server.js: sau khi nhận POST /api/sensor thành công
wss.clients.forEach(client => {
    client.send(JSON.stringify({ type: 'new_data', data: sensorRecord }));
});
```

```js
// Trong app.js frontend
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'new_data') updateDashboard(msg.data);
};
```

---

### GIAI ĐOẠN 5 — Deploy lên Cloud (Tuần 5–6)

Xem chi tiết: [huong-dan-demo-online.md](./huong-dan-demo-online.md)

Checklist trước khi deploy:
- [ ] Tất cả thông tin nhạy cảm trong `.env`, không hard-code
- [ ] File `.gitignore` đã bỏ qua `.env` và `node_modules`
- [ ] `POST /api/sensor` có kiểm tra device_id hợp lệ
- [ ] Giới hạn số bản ghi trả về (LIMIT) để tránh query quá nặng
- [ ] Test lại toàn bộ API sau khi deploy

---

## Checklist tổng — Hệ thống đầy đủ

```
Phần cứng
  [x] ESP32 kết nối DHT22 đọc được nhiệt độ/độ ẩm
  [x] ESP32 kết nối relay bật/tắt được quạt/đèn
  [x] ESP32 kết nối WiFi thành công

Firmware
  [x] ESP32 gửi dữ liệu lên POST /api/sensor mỗi 10 giây
  [x] ESP32 nhận lệnh từ backend (polling hoặc MQTT)

Backend
  [x] Tất cả API cơ bản hoạt động
  [x] Lưu dữ liệu vào PostgreSQL đúng
  [x] Tự tạo cảnh báo khi nhiệt độ vượt ngưỡng
  [x] Có xử lý lỗi, không crash khi nhận dữ liệu sai

Database
  [x] 4 bảng đầy đủ, có ràng buộc
  [x] Index để query nhanh

Frontend
  [x] Hiển thị đúng dữ liệu từ backend
  [x] Điều khiển quạt có phản hồi
  [x] Tự làm mới dữ liệu

Deploy
  [x] Backend chạy ổn định trên cloud
  [x] Frontend public URL
  [x] ESP32 kết nối được với backend cloud
```

---

## Thứ tự ưu tiên cho nhóm 4–5 người

```
Tuần 1:  Thành viên A — Setup phần cứng ESP32 + DHT22
         Thành viên B — Setup database PostgreSQL + import init.sql
         Thành viên C — Chạy được backend local + test API

Tuần 2:  Thành viên A — Viết firmware gửi HTTP POST lên backend
         Thành viên B,C — Nâng cấp API, thêm tính năng mới

Tuần 3:  Cả nhóm — Tích hợp phần cứng + backend + frontend
                  — Sửa lỗi, test end-to-end

Tuần 4:  Thành viên D — Cải thiện giao diện (Chart.js, responsive)
         Thành viên E — Deploy cloud (Railway + Netlify)

Tuần 5:  Cả nhóm — Demo, viết báo cáo
```
