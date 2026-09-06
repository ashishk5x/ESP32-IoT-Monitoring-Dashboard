// =============================================================
// FILE: frontend/app.js
// MỤC ĐÍCH: Logic chính của dashboard — gọi API backend,
//           render dữ liệu lên giao diện, điều khiển quạt.
//
// CẤU TRÚC FILE:
//   1. Cấu hình
//   2. Hàm gọi API
//   3. Hàm render giao diện
//   4. Hàm điều khiển quạt
//   5. Hàm vẽ biểu đồ đơn giản
//   6. Khởi động và lập lịch tự động
// =============================================================

// =============================================================
// 1. CẤU HÌNH
// =============================================================

// Địa chỉ backend — đổi nếu backend chạy cổng khác
const API_BASE = 'http://localhost:3000/api';

// Thiết bị mặc định để hiển thị (có thể mở rộng thành dropdown)
const DEFAULT_DEVICE = 'esp32-001';

// Tự động làm mới dữ liệu mỗi N giây
const REFRESH_INTERVAL_SEC = 10;

// =============================================================
// 2. HÀM GỌI API
// =============================================================

// Hàm fetch chung — trả về data hoặc null nếu lỗi
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(API_BASE + endpoint);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        return json.success ? json.data : null;
    } catch (err) {
        console.error(`Lỗi gọi API ${endpoint}:`, err.message);
        return null;
    }
}

// Lấy dữ liệu mới nhất của thiết bị
async function fetchLatest() {
    return await fetchAPI('/latest');
}

// Lấy lịch sử 20 bản ghi gần nhất
async function fetchHistory(limit = 20) {
    return await fetchAPI(`/history?limit=${limit}`);
}

// Lấy danh sách cảnh báo
async function fetchAlerts() {
    return await fetchAPI('/alerts');
}

// Lấy lịch sử lệnh điều khiển
async function fetchCommands(limit = 8) {
    return await fetchAPI(`/commands?limit=${limit}`);
}

// Kiểm tra server còn sống không
async function checkHealth() {
    try {
        const res = await fetch(API_BASE + '/health');
        return res.ok;
    } catch {
        return false;
    }
}

// =============================================================
// 3. HÀM RENDER GIAO DIỆN
// =============================================================

// Hiển thị trạng thái kết nối server
function renderConnectionStatus(isOk) {
    const el = document.getElementById('connection-status');
    if (isOk) {
        el.textContent = '✅ Đã kết nối server';
        el.className = 'conn-status conn-ok';
    } else {
        el.textContent = '❌ Mất kết nối server';
        el.className = 'conn-status conn-error';
    }
}

// Hiển thị dữ liệu nhiệt độ / độ ẩm / trạng thái thiết bị
function renderLatest(data) {
    if (!data || data.length === 0) {
        document.getElementById('temp-value').textContent   = '--';
        document.getElementById('humid-value').textContent  = '--';
        document.getElementById('device-status').textContent = 'Không có dữ liệu';
        return;
    }

    // Tìm bản ghi của thiết bị mặc định
    const record = data.find(d => d.device_id === DEFAULT_DEVICE) || data[0];

    const tempEl   = document.getElementById('temp-value');
    const humidEl  = document.getElementById('humid-value');
    const statusEl = document.getElementById('device-status');
    const nameEl   = document.getElementById('device-name');
    const timeEl   = document.getElementById('last-updated');

    // Nhiệt độ — đổi màu theo ngưỡng
    const temp = parseFloat(record.temperature);
    tempEl.textContent = temp.toFixed(1);
    tempEl.className = 'card-value ' + getTempClass(temp);

    // Độ ẩm
    humidEl.textContent = parseFloat(record.humidity).toFixed(1);

    // Trạng thái thiết bị
    const isOnline = record.status === 'online';
    statusEl.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
    statusEl.className = 'card-value ' + (isOnline ? 'status-online' : 'status-offline');

    nameEl.textContent = record.device_name || record.device_id;

    // Thời gian cập nhật
    timeEl.textContent = formatTime(record.recorded_at);
}

// Xác định class màu theo nhiệt độ
function getTempClass(temp) {
    if (temp >= 35)  return 'temp-danger';
    if (temp >= 30)  return 'temp-warn';
    return 'temp-normal';
}

// Render bảng lịch sử dữ liệu cảm biến
function renderHistory(data) {
    const tbody = document.getElementById('history-body');

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((row, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${row.device_name || row.device_id}</td>
            <td class="${getTempClass(parseFloat(row.temperature))}">${parseFloat(row.temperature).toFixed(1)}</td>
            <td>${parseFloat(row.humidity).toFixed(1)}</td>
            <td>${formatTime(row.recorded_at)}</td>
        </tr>
    `).join('');
}

// Render danh sách cảnh báo
function renderAlerts(data) {
    const container = document.getElementById('alert-list');
    const badge     = document.getElementById('alert-badge');

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-msg">Không có cảnh báo nào 👍</div>';
        badge.textContent = '';
        return;
    }

    const unreadCount = data.filter(a => !a.is_read).length;
    badge.textContent = unreadCount > 0 ? unreadCount : '';

    container.innerHTML = data.map(alert => `
        <div class="alert-item type-${alert.type} ${!alert.is_read ? 'unread' : ''}">
            ${!alert.is_read ? '<div class="alert-unread-dot"></div>' : ''}
            <div class="alert-message">
                <strong>${getAlertTypeLabel(alert.type)}</strong> — ${alert.message}
                <div style="font-size:0.78rem;color:#888;margin-top:3px;">Thiết bị: ${alert.device_name || alert.device_id}</div>
            </div>
            <div class="alert-time">${formatTime(alert.created_at)}</div>
        </div>
    `).join('');
}

// Chuyển loại cảnh báo thành tiếng Việt
function getAlertTypeLabel(type) {
    const labels = {
        'high_temp':       '🔥 Nhiệt độ cao',
        'low_humidity':    '💧 Độ ẩm thấp',
        'device_offline':  '📡 Mất kết nối'
    };
    return labels[type] || type;
}

// Render bảng lịch sử lệnh điều khiển
function renderCommands(data) {
    const tbody = document.getElementById('commands-body');

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Chưa có lệnh nào</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((cmd, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${cmd.device_name || cmd.device_id}</td>
            <td class="cmd-${cmd.command}">${getCommandLabel(cmd.command)}</td>
            <td class="status-${cmd.status}">${getStatusLabel(cmd.status)}</td>
            <td>${formatTime(cmd.created_at)}</td>
        </tr>
    `).join('');
}

// Nhãn lệnh tiếng Việt
function getCommandLabel(cmd) {
    return cmd === 'fan_on' ? '▶ Bật quạt' : '■ Tắt quạt';
}

// Nhãn trạng thái tiếng Việt
function getStatusLabel(status) {
    const labels = { sent: 'Đã gửi', executed: 'Đã thực thi', failed: 'Thất bại' };
    return labels[status] || status;
}

// =============================================================
// 4. ĐIỀU KHIỂN QUẠT
// =============================================================

let isFanOn = false;

async function sendFanCommand(action) {
    const btnOn    = document.getElementById('btn-fan-on');
    const btnOff   = document.getElementById('btn-fan-off');
    const feedback = document.getElementById('command-feedback');
    const fanIcon  = document.getElementById('fan-icon');
    const fanText  = document.getElementById('fan-status-text');

    // Vô hiệu hóa nút trong khi gửi
    btnOn.disabled  = true;
    btnOff.disabled = true;
    feedback.textContent = '⏳ Đang gửi lệnh...';
    feedback.className = 'feedback loading';

    try {
        const response = await fetch(`${API_BASE}/fan/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: DEFAULT_DEVICE })
        });

        const json = await response.json();

        if (json.success) {
            isFanOn = (action === 'on');
            fanText.textContent = `Trạng thái quạt: ${isFanOn ? 'ĐANG BẬT' : 'ĐÃ TẮT'}`;

            if (isFanOn) {
                fanIcon.classList.add('spinning');
            } else {
                fanIcon.classList.remove('spinning');
            }

            feedback.textContent = `✅ ${json.message}`;
            feedback.className = 'feedback success';

            // Làm mới bảng lệnh sau khi gửi thành công
            setTimeout(async () => {
                const commands = await fetchCommands();
                if (commands) renderCommands(commands);
            }, 500);
        } else {
            feedback.textContent = `❌ Lỗi: ${json.message}`;
            feedback.className = 'feedback error';
        }
    } catch (err) {
        feedback.textContent = `❌ Không gửi được lệnh. Kiểm tra backend có đang chạy không.`;
        feedback.className = 'feedback error';
    } finally {
        btnOn.disabled  = false;
        btnOff.disabled = false;
    }
}

// =============================================================
// 5. BIỂU ĐỒ ĐƠN GIẢN DÙNG CANVAS THUẦN
// =============================================================

function drawTempChart(historyData) {
    const canvas = document.getElementById('temp-chart');
    if (!canvas || !historyData || historyData.length === 0) return;

    const ctx    = canvas.getContext('2d');
    const width  = canvas.offsetWidth  || 800;
    const height = 180;

    canvas.width  = width;
    canvas.height = height;

    // Lấy 20 bản ghi gần nhất, đảo chiều để vẽ từ trái sang phải
    const points = historyData.slice(0, 20).reverse();
    const temps  = points.map(p => parseFloat(p.temperature));

    const minT   = Math.min(...temps) - 2;
    const maxT   = Math.max(...temps) + 2;
    const padL   = 40, padR = 16, padT = 16, padB = 30;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    // Hàm chuyển nhiệt độ -> tọa độ Y
    const toY = t => padT + chartH - ((t - minT) / (maxT - minT)) * chartH;
    const toX = i => padL + (i / (points.length - 1)) * chartW;

    // Xóa canvas
    ctx.clearRect(0, 0, width, height);

    // Vẽ lưới ngang
    ctx.strokeStyle = '#eee';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padT + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();

        // Nhãn trục Y
        const tLabel = maxT - ((maxT - minT) / 4) * i;
        ctx.fillStyle = '#999';
        ctx.font      = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(tLabel.toFixed(1), padL - 4, y + 4);
    }

    // Vẽ đường biểu đồ
    ctx.strokeStyle = '#1e88e5';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
        const x = toX(i);
        const y = toY(parseFloat(p.temperature));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Vẽ điểm tròn
    ctx.fillStyle = '#1e88e5';
    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(toX(i), toY(parseFloat(p.temperature)), 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Nhãn thời gian trục X (chỉ hiện vài điểm để tránh chồng chất)
    ctx.fillStyle   = '#999';
    ctx.font        = '10px sans-serif';
    ctx.textAlign   = 'center';
    const step = Math.ceil(points.length / 5);
    points.forEach((p, i) => {
        if (i % step === 0 || i === points.length - 1) {
            const label = formatTimeShort(p.recorded_at);
            ctx.fillText(label, toX(i), height - 6);
        }
    });
}

// =============================================================
// 6. HÀM TIỆN ÍCH
// =============================================================

// Format thời gian đầy đủ — ví dụ: "17/04 14:32:05"
function formatTime(isoString) {
    if (!isoString) return '--';
    const d = new Date(isoString);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Format ngắn cho trục X biểu đồ — ví dụ: "14:32"
function formatTimeShort(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// =============================================================
// 7. KHỞI ĐỘNG VÀ TỰ ĐỘNG LÀM MỚI
// =============================================================

// Tải toàn bộ dữ liệu lên giao diện
async function loadAll() {
    const isAlive = await checkHealth();
    renderConnectionStatus(isAlive);

    if (!isAlive) return;

    const [latest, history, alerts, commands] = await Promise.all([
        fetchLatest(),
        fetchHistory(20),
        fetchAlerts(),
        fetchCommands(8)
    ]);

    if (latest)   renderLatest(latest);
    if (history)  { renderHistory(history); drawTempChart(history); }
    if (alerts)   renderAlerts(alerts);
    if (commands) renderCommands(commands);
}

// Chạy ngay khi trang load
loadAll();

// Tự động làm mới theo chu kỳ
document.getElementById('refresh-interval').textContent = REFRESH_INTERVAL_SEC;
setInterval(loadAll, REFRESH_INTERVAL_SEC * 1000);
