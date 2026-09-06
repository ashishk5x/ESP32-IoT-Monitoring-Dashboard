# Hướng dẫn Demo Web App lên Internet

> Dành cho: trình bày đồ án trên lớp, chia sẻ link cho giảng viên chấm, demo nhóm từ xa

---

## Tổng quan — Chọn cách nào?

| Cách | Thời gian setup | Miễn phí | Phù hợp khi nào |
|------|----------------|----------|-----------------|
| **Ngrok** (tunnel local) | 5 phút | Có (giới hạn) | Demo nhanh ngay hôm nay, không cần deploy |
| **Railway** (cloud thật) | 30 phút | Có ($5 credit/tháng) | Nộp đồ án, chạy 24/7 |
| **Render** (cloud thật) | 30 phút | Có (sleep sau 15 phút) | Lựa chọn thay thế Railway |

---

## CÁCH 1 — Ngrok (demo nhanh nhất, không cần deploy)

Ngrok tạo một đường hầm (tunnel) từ internet vào máy tính của bạn.  
URL dạng: `https://abc123.ngrok.io` → trỏ thẳng vào `localhost:3000`

### Bước 1 — Cài Ngrok

```bash
# Windows (dùng winget)
winget install ngrok

# Hoặc tải tay tại: https://ngrok.com/download
# Giải nén → đặt ngrok.exe vào thư mục project hoặc thêm vào PATH
```

### Bước 2 — Đăng ký tài khoản miễn phí

1. Vào https://ngrok.com → Sign up
2. Lấy authtoken tại: Dashboard → Your Authtoken
3. Chạy lệnh:
```bash
ngrok config add-authtoken <token_của_bạn>
```

### Bước 3 — Khởi động tunnel

```bash
# Terminal 1: chạy backend như bình thường
cd backend && node server.js

# Terminal 2: mở tunnel ngrok
ngrok http 3000
```

Ngrok sẽ hiện ra URL dạng:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### Bước 4 — Cập nhật frontend dùng URL ngrok

Mở `frontend/app.js`, đổi dòng:
```js
// Trước
const API_BASE = 'http://localhost:3000/api';

// Sau (dùng URL ngrok của bạn)
const API_BASE = 'https://abc123.ngrok-free.app/api';
```

### Bước 5 — Mở frontend cho người khác xem

Dùng VS Code Live Server → chia sẻ URL Live Server của bạn, hoặc mở file `frontend/index.html` trực tiếp qua ngrok nếu bạn tunnel cả port 5500.

> ⚠️ **Lưu ý:** URL ngrok thay đổi mỗi lần restart (với tài khoản miễn phí).  
> Nếu cần URL cố định, upgrade lên gói trả phí hoặc dùng Railway.

---

## CÁCH 2 — Railway (deploy cloud thật, khuyến nghị cho nộp đồ án)

Railway là nền tảng cloud đơn giản nhất cho Node.js + PostgreSQL.  
Cho phép deploy từ GitHub bằng vài click.

### Bước 1 — Chuẩn bị repo GitHub

```bash
# Khởi tạo git (nếu chưa có)
git init
git add .
git commit -m "first commit"

# Tạo repo trên GitHub và push lên
git remote add origin https://github.com/username/ten-repo.git
git push -u origin main
```

### Bước 2 — Tạo tài khoản Railway

1. Vào https://railway.app → Sign up with GitHub
2. Xác nhận email

### Bước 3 — Tạo project PostgreSQL trên Railway

1. Click **"New Project"**
2. Chọn **"Deploy PostgreSQL"**
3. Railway tự tạo database PostgreSQL — lấy thông tin kết nối tại tab **"Connect"**

### Bước 4 — Import database schema

1. Vào tab **"Data"** của PostgreSQL service trong Railway
2. Chọn tab **"Query"**
3. Copy toàn bộ nội dung file `database/init.sql` → paste vào → chạy

Hoặc dùng psql kết nối từ local:
```bash
# Lấy connection string từ Railway (dạng postgresql://user:pass@host:port/db)
psql "postgresql://..." -f database/init.sql
```

### Bước 5 — Deploy backend lên Railway

1. Trong Railway project → click **"New Service"** → **"GitHub Repo"**
2. Chọn repo của bạn
3. Railway hỏi **"Root Directory"** → nhập `backend`
4. Vào tab **"Variables"** → thêm các biến:

```
PORT         = 3000
DB_HOST      = (lấy từ PostgreSQL service → Connect → Host)
DB_PORT      = (lấy từ PostgreSQL service → Connect → Port)
DB_NAME      = (lấy từ PostgreSQL service → Connect → Database)
DB_USER      = (lấy từ PostgreSQL service → Connect → User)
DB_PASSWORD  = (lấy từ PostgreSQL service → Connect → Password)
```

5. Railway tự detect `package.json` và chạy `npm start`
6. Vào tab **"Settings"** → **"Networking"** → **"Generate Domain"** để có URL công khai

### Bước 6 — Cập nhật frontend dùng URL Railway

```js
// frontend/app.js
const API_BASE = 'https://ten-app-cua-ban.railway.app/api';
```

### Bước 7 — Deploy frontend

**Cách đơn giản nhất — Netlify Drop:**
1. Vào https://app.netlify.com/drop
2. Kéo thả thư mục `frontend/` vào trang web
3. Netlify tạo URL ngay lập tức

**Cách khác — GitHub Pages:**
1. Push thư mục `frontend/` lên GitHub
2. Vào Settings → Pages → Source: `main branch / frontend folder`

---

## CÁCH 3 — Render (thay thế Railway)

Render.com tương tự Railway, miễn phí nhưng backend **sleep sau 15 phút không có request**.

1. Vào https://render.com → Sign up with GitHub
2. New → **Web Service** → chọn repo → Root directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Thêm Environment Variables như Railway
6. New → **PostgreSQL** → tạo database → lấy connection string
7. Chạy `init.sql` qua psql hoặc Render Shell

---

## Tóm tắt nhanh

```
Demo hôm nay ngay:
  node server.js  +  ngrok http 3000  →  có URL public ngay

Nộp đồ án / demo ổn định:
  Push lên GitHub → Deploy Railway (backend + PostgreSQL)
                  → Deploy Netlify Drop (frontend)
  → 2 URL cố định, chạy 24/7
```
