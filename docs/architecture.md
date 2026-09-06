# Kiến trúc hệ thống — IoT Dashboard Template

## Tổng quan

```
[ESP32] --> (HTTP/MQTT) --> [Backend Node.js] --> [PostgreSQL]
                                  |
                            [REST API]
                                  |
                           [Frontend HTML/JS]
```

## Luồng dữ liệu cảm biến

```
ESP32 đo nhiệt độ/độ ẩm
    --> POST /api/sensor { device_id, temperature, humidity }
    --> Backend lưu vào bảng sensor_data
    --> Frontend gọi GET /api/latest mỗi 10 giây
    --> Hiển thị lên dashboard
```

## Luồng điều khiển quạt

```
Người dùng click "Bật quạt" trên dashboard
    --> Frontend gọi POST /api/fan/on { device_id }
    --> Backend lưu lệnh vào bảng commands
    --> Backend gửi lệnh tới ESP32 (qua MQTT — mở rộng sau)
    --> ESP32 nhận lệnh và bật quạt thật
```

## Các thành phần

| Thành phần | Vai trò |
|------------|---------|
| Frontend   | Giao diện người dùng, hiển thị dữ liệu, gửi lệnh điều khiển |
| Backend    | Xử lý logic, kết nối database, cung cấp REST API |
| PostgreSQL | Lưu trữ dữ liệu cảm biến, lịch sử lệnh, cảnh báo |
| ESP32      | Thu thập dữ liệu, nhận lệnh điều khiển (phần cứng thật) |

## Điểm mở rộng MQTT (cho sau)

Trong file `backend/routes/commands.js`, có comment:
```js
// Ở đây có thể gửi lệnh qua MQTT tới ESP32 thật
// mqttClient.publish(`devices/${device_id}/cmd`, 'fan_on');
```

Để tích hợp MQTT thật:
1. Cài thêm thư viện `mqtt`: `npm install mqtt`
2. Tạo file `backend/mqtt.js` để kết nối broker
3. Subscribe topic `devices/+/data` để nhận dữ liệu từ ESP32
4. Publish topic `devices/{id}/cmd` để gửi lệnh điều khiển
