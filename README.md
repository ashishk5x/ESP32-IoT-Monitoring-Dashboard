# 🌡️ IoT Dashboard — ESP32 Temperature & Humidity Monitoring

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)
![ESP32](https://img.shields.io/badge/Hardware-ESP32-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

A beginner-friendly **IoT monitoring dashboard** built with **ESP32, Node.js, Express, PostgreSQL, HTML, CSS, and JavaScript**.

This project provides a complete foundation for monitoring **temperature and humidity**, storing sensor readings in PostgreSQL, viewing historical data through a web dashboard, and controlling devices such as a fan remotely.

> 🎓 Designed as a learning-friendly template for students working on **IoT, embedded systems, backend development, databases, and web development projects**.

---

## 🚀 Features

- 🌡️ Real-time temperature monitoring
- 💧 Humidity monitoring
- 📊 Sensor data history
- 📡 ESP32 device monitoring
- 🟢 Online/offline device status
- ⚠️ Temperature threshold alerts
- 🌀 Fan ON/OFF control
- 🗄️ PostgreSQL data storage
- 🔌 REST API for ESP32 and frontend communication
- 🧪 ESP32 simulator for development without hardware
- 🌐 Ready for cloud deployment
- 📱 Simple and responsive dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Hardware | ESP32 |
| Sensors | DHT11 / DHT22 |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Database Driver | `pg` / node-postgres |
| Environment Config | dotenv |
| API Communication | REST API / JSON |
| Development | VS Code |
| Deployment | Railway / Render / Netlify |
| Optional Realtime | WebSockets / MQTT |

---

# 🏗️ System Architecture

```text
                     ┌──────────────────────┐
                     │       ESP32          │
                     │                      │
                     │  DHT11 / DHT22       │
                     │  Temperature         │
                     │  Humidity            │
                     └──────────┬───────────┘
                                │
                         HTTP POST / JSON
                                │
                                ▼
                     ┌──────────────────────┐
                     │   Node.js + Express  │
                     │                      │
                     │      REST API        │
                     └──────────┬───────────┘
                                │
                         SQL Queries
                                │
                                ▼
                     ┌──────────────────────┐
                     │      PostgreSQL      │
                     │                      │
                     │   Sensor History     │
                     │   Devices            │
                     │   Commands           │
                     │   Alerts             │
                     └──────────┬───────────┘
                                │
                           REST API
                                │
                                ▼
                     ┌──────────────────────┐
                     │    Web Dashboard     │
                     │                      │
                     │ HTML + CSS + JS       │
                     │ Charts / Status      │
                     │ Device Control       │
                     └──────────────────────┘
```

### Data Flow

```text
ESP32
  ↓
Sensor Data
  ↓
Express REST API
  ↓
PostgreSQL
  ↓
Frontend Dashboard
```

### Device Control Flow

```text
Web Dashboard
  ↓
REST API
  ↓
Backend
  ↓
Command Storage
  ↓
ESP32
  ↓
Fan / Relay / Device
```

---

# 📁 Project Structure

```text
IoT-Dashboard/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── simulator.js
│   ├── package.json
│   ├── .env.example
│   │
│   └── routes/
│       ├── devices.js
│       ├── sensors.js
│       ├── commands.js
│       └── alerts.js
│
├── database/
│   └── init.sql
│
├── docs/
│   ├── architecture.md
│   ├── online-demo-guide.md
│   └── real-project-guide.md
│
├── .gitignore
├── .env.example
└── README.md
```

---

# ⚡ Quick Start

## 1. Clone the repository

```bash
git clone https://github.com/ashishk5x/IoT-Dashboard.git
cd IoT-Dashboard
```

> Replace `IoT-Dashboard` with your actual repository name if it is different.

---

## 2. Create the PostgreSQL database

Make sure PostgreSQL is installed and running.

```bash
psql -U postgres -c "CREATE DATABASE iot_db;"
```

Then import the database schema:

```bash
psql -U postgres -d iot_db -f database/init.sql
```

---

## 3. Configure environment variables

Go to the backend directory:

```bash
cd backend
```

### Windows

```bash
copy .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

Open `.env` and configure your PostgreSQL credentials:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=iot_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
```

### ⚠️ Important

Never commit your real `.env` file to GitHub.

Your `.gitignore` should contain:

```text
.env
node_modules/
```

Commit `.env.example` instead.

---

# 📦 4. Install Backend Dependencies

Inside the `backend` directory:

```bash
npm install
```

Main dependencies include:

- **Express** — Web framework
- **pg** — PostgreSQL database connection
- **dotenv** — Environment variable management
- **cors** — Cross-Origin Resource Sharing
- **nodemon** — Development server auto-restart

---

# ▶️ 5. Start the Backend

Run:

```bash
node server.js
```

Or during development:

```bash
npx nodemon server.js
```

The backend should be available at:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running"
}
```

---

# 🌐 6. Start the Frontend

The frontend is a static web application.

Do **not** open `index.html` directly using `file://`.

Use VS Code **Live Server** or `http-server`.

### Using Live Server

1. Open the project in VS Code.
2. Install the **Live Server** extension.
3. Right-click `frontend/index.html`.
4. Select **Open with Live Server**.

The dashboard should open at something similar to:

```text
http://127.0.0.1:5500
```

### Using http-server

Install it once:

```bash
npm install -g http-server
```

Then:

```bash
cd frontend
http-server -p 5500
```

Open:

```text
http://localhost:5500
```

---

# 🧪 Running Without ESP32

Don't have an ESP32 yet?

No problem.

The project includes an **ESP32 simulator** that generates fake temperature and humidity readings.

### Terminal 1 — Backend

```bash
cd backend
node server.js
```

### Terminal 2 — Simulator

```bash
cd backend
node simulator.js
```

The simulator sends sensor readings to the backend periodically.

Example:

```text
==============================================
 ESP32 Simulator is running
 Device     : esp32-001
 Endpoint   : http://localhost:3000/api/sensor
 Interval   : 5 seconds
==============================================

[14:32:01] ✅ Sent
Temperature: 29.3°C
Humidity: 63.8%

[14:32:06] ✅ Sent
Temperature: 30.1°C
Humidity: 62.4%
```

This allows you to develop and test the complete web application **before connecting the physical hardware**.

---

# 🔌 ESP32 Integration

Once the dashboard is working with the simulator, replace the simulator with a real ESP32.

The ESP32 can send sensor readings to:

```http
POST /api/sensor
```

Example JSON:

```json
{
  "device_id": "esp32-001",
  "temperature": 29.5,
  "humidity": 63.2
}
```

The complete flow becomes:

```text
DHT11 / DHT22
      ↓
    ESP32
      ↓
HTTP POST
      ↓
Node.js API
      ↓
PostgreSQL
      ↓
Web Dashboard
```

---

# 🔗 REST API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check server status |
| `GET` | `/api/devices` | Get all devices |
| `GET` | `/api/devices/:device_id` | Get device details |
| `GET` | `/api/latest` | Get latest sensor reading for each device |
| `GET` | `/api/history?limit=20` | Get sensor history |
| `GET` | `/api/history?device_id=esp32-001&limit=20` | Get device-specific history |
| `POST` | `/api/sensor` | Receive sensor data |
| `GET` | `/api/alerts` | Get system alerts |
| `GET` | `/api/alerts?unread_only=true` | Get unread alerts |
| `PATCH` | `/api/alerts/:id/read` | Mark alert as read |
| `GET` | `/api/commands?limit=10` | Get command history |
| `POST` | `/api/fan/on` | Turn fan ON |
| `POST` | `/api/fan/off` | Turn fan OFF |

---

# 🧑‍💻 API Examples

### Get latest sensor data

```bash
curl http://localhost:3000/api/latest
```

### Send sensor data

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32-001","temperature":29.5,"humidity":63.2}'
```

### Turn fan ON

```bash
curl -X POST http://localhost:3000/api/fan/on \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32-001"}'
```

### Turn fan OFF

```bash
curl -X POST http://localhost:3000/api/fan/off \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32-001"}'
```

---

# 🗄️ Database

The PostgreSQL database contains the core tables required for the IoT system:

```text
devices
   │
   ├── sensor_data
   │
   ├── commands
   │
   └── alerts
```

### Main tables

| Table | Purpose |
|---|---|
| `devices` | Stores registered ESP32 devices |
| `sensor_data` | Stores temperature and humidity readings |
| `commands` | Stores device-control commands |
| `alerts` | Stores temperature and connectivity alerts |

---

# 🛠️ Customizing the Project

This template is designed to be extended for different IoT applications.

## 🏠 Smart Home

Replace the fan with:

- 💡 Lights
- 🚪 Door locks
- ❄️ AC control
- 🔔 Buzzer
- 🔌 Smart switches

---

## 🌱 Smart Agriculture

Add:

- Soil moisture sensor
- Water pump
- Light sensor
- Temperature/humidity sensor
- Automatic irrigation

Example:

```text
Soil Moisture
      ↓
    ESP32
      ↓
Node.js API
      ↓
PostgreSQL
      ↓
Dashboard
      ↓
Water Pump
```

---

## 🌡️ Environmental Monitoring

Add:

- CO₂ sensor
- Air-quality sensor
- Pressure sensor
- Light intensity sensor

For example:

```sql
ALTER TABLE sensor_data
ADD COLUMN co2 NUMERIC(6,2);
```

---

# 📈 Suggested Improvements

Once the basic project is working, gradually add more functionality.

### 🟢 Beginner

- Real ESP32 sensor data
- Multiple ESP32 devices
- Temperature thresholds
- More device controls
- Better dashboard UI

### 🟡 Intermediate

- Chart.js graphs
- Time-based filtering
- MQTT communication
- User authentication
- Device management
- Responsive mobile UI

### 🔴 Advanced

- WebSockets for realtime updates
- Docker
- Docker Compose
- JWT authentication
- Role-based access control
- Cloud deployment
- Automated alerts
- Email/Telegram notifications
- IoT device authentication

---

# ☁️ Deployment

The application can be deployed online once the local version is working.

A possible deployment architecture:

```text
                    INTERNET
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
      Frontend                  ESP32
      Netlify                     │
          │                       │
          └──────────┬────────────┘
                     ▼
              Node.js API
              Railway/Render
                     │
                     ▼
                PostgreSQL
```

### Suggested deployment options

**Frontend**

- Netlify
- Vercel
- GitHub Pages

**Backend**

- Railway
- Render
- VPS

**Database**

- Railway PostgreSQL
- Supabase
- Neon
- Self-hosted PostgreSQL

---

# 🧭 Development Roadmap

```text
Phase 1
Hardware + Firmware
        ↓
Phase 2
REST API Integration
        ↓
Phase 3
Database + Sensor History
        ↓
Phase 4
Dashboard + Device Control
        ↓
Phase 5
Alerts + Charts
        ↓
Phase 6
MQTT / WebSockets
        ↓
Phase 7
Cloud Deployment
```

### Recommended approach

Don't build everything at once.

Follow:

**Build → Test → Integrate → Debug → Improve**

---

# ❗ Common Issues

### PostgreSQL connection failed

Check:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

Also make sure PostgreSQL is running.

Test:

```bash
psql -U postgres -d iot_db
```

---

### `Cannot GET /api/...`

Make sure the backend is running:

```bash
cd backend
node server.js
```

---

### CORS Error

Do not open the frontend using:

```text
file://
```

Use Live Server or `http-server`.

---

### `relation does not exist`

Run:

```bash
psql -U postgres -d iot_db -f database/init.sql
```

---

### Dashboard is not updating

The dashboard may use periodic polling.

Wait for the next update cycle or refresh the page.

If using the simulator, make sure both are running:

```text
Backend
   +
Simulator
   +
Frontend
```

---

# 🎓 Learning Objectives

By completing this project, you can gain practical experience with:

- ESP32 development
- Arduino programming
- Sensor integration
- IoT architecture
- REST API development
- Node.js
- Express.js
- PostgreSQL
- SQL
- Frontend development
- HTTP/JSON communication
- Backend ↔ hardware communication
- Database design
- Device monitoring
- Remote device control
- Cloud deployment

This makes the project useful as a **portfolio project for IoT, backend, embedded systems, and full-stack development**.

---

# 🤝 Contributing

Contributions, improvements, and suggestions are welcome.

If you want to contribute:

```bash
# Fork the repository

# Create a new branch
git checkout -b feature/your-feature

# Make your changes

# Commit
git commit -m "Add your feature"

# Push
git push origin feature/your-feature

# Open a Pull Request
```

---

# 📄 License

This project is licensed under the **MIT License**.

You are free to:

- Use the project
- Modify it
- Extend it
- Use it for learning
- Use it as a foundation for academic projects
- Create your own IoT applications from it

---

# 👨‍💻 Author

**Ashish Kumar Yadav**

GitHub: **[ashishk5x](https://github.com/ashishk5x)**

---

## ⭐ Support

If this project helped you learn something about **IoT, ESP32, Node.js, PostgreSQL, or web development**, consider giving the repository a ⭐.

**Build something. Connect it. Measure it. Automate it. 🚀**
