// ═══════════════════════════════════════════════════════════
// جوجو AI - وضع الصيانة
// أمانة محافظة الطائف
// ═══════════════════════════════════════════════════════════
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// منع الـ Cache تماماً
app.use(function (req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'microphone=*');
  next();
});

const maintenancePage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>جوجو AI - تحت الصيانة | أمانة محافظة الطائف</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'IBM Plex Sans Arabic','Cairo',sans-serif;background:linear-gradient(135deg,#0a3d2e 0%,#1a5d4a 50%,#2d8659 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:white;text-align:center;padding:20px;overflow:hidden;position:relative}
body::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(232,192,80,0.08) 1px,transparent 1px);background-size:40px 40px;animation:moveBackground 25s linear infinite}
@keyframes moveBackground{0%{transform:translate(0,0)}100%{transform:translate(40px,40px)}}
.petal{position:fixed;font-size:28px;opacity:0;pointer-events:none;animation:fall 15s linear infinite}
.petal:nth-child(1){left:10%;animation-delay:0s}
.petal:nth-child(2){left:25%;animation-delay:3s}
.petal:nth-child(3){left:50%;animation-delay:6s}
.petal:nth-child(4){left:75%;animation-delay:9s}
.petal:nth-child(5){left:90%;animation-delay:12s}
@keyframes fall{0%{transform:translateY(-100px) rotate(0deg);opacity:0}10%{opacity:0.6}90%{opacity:0.6}100%{transform:translateY(110vh) rotate(360deg);opacity:0}}
.container{max-width:580px;background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:30px;padding:60px 40px;border:1px solid rgba(232,192,80,0.3);box-shadow:0 25px 80px rgba(0,0,0,0.4);position:relative;z-index:1;animation:fadeIn 1.2s ease-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(40px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
.icon{width:110px;height:110px;background:linear-gradient(135deg,rgba(232,192,80,0.2),rgba(232,192,80,0.05));border:2px solid rgba(232,192,80,0.4);border-radius:50%;margin:0 auto 25px;display:flex;align-items:center;justify-content:center;font-size:3.5em;animation:float 3.5s ease-in-out infinite;box-shadow:0 0 50px rgba(232,192,80,0.2)}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.ornament{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:15px;opacity:0.8}
.ornament-line{height:1px;width:50px;background:linear-gradient(90deg,transparent,#e8c050,transparent)}
.ornament-dot{width:6px;height:6px;background:#e8c050;border-radius:50%}
.label{font-size:0.95em;font-weight:500;color:#e8c050;margin-bottom:10px;letter-spacing:1px}
h1{font-size:2.5em;font-weight:900;margin-bottom:8px;background:linear-gradient(90deg,#ffffff,#e8c050,#ffffff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.subtitle{font-size:1.4em;font-weight:600;margin-bottom:30px;color:#fce7eb}
p{font-size:1.1em;line-height:1.9;opacity:0.9;margin-bottom:12px}
.badge{display:inline-flex;align-items:center;gap:10px;background:rgba(232,192,80,0.15);padding:14px 32px;border-radius:50px;margin-top:30px;border:1px solid rgba(232,192,80,0.4);font-weight:700;font-size:1.05em;color:#e8c050}
.badge-dot{width:10px;height:10px;background:#4caf50;border-radius:50%;animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(76,175,80,0.6);transform:scale(1)}50%{box-shadow:0 0 0 12px rgba(76,175,80,0);transform:scale(1.1)}}
.footer{margin-top:35px;padding-top:25px;border-top:1px solid rgba(255,255,255,0.1);font-size:0.85em;opacity:0.7;line-height:1.8}
@media (max-width:480px){.container{padding:40px 25px}h1{font-size:1.9em}.subtitle{font-size:1.15em}.icon{width:90px;height:90px;font-size:2.8em}p{font-size:1em}}
</style>
</head>
<body>
<div class="petal">🌹</div>
<div class="petal">🌹</div>
<div class="petal">🌹</div>
<div class="petal">🌹</div>
<div class="petal">🌹</div>
<div class="container">
<div class="icon">🔧</div>
<div class="ornament">
<div class="ornament-line"></div>
<div class="ornament-dot"></div>
<div class="ornament-line"></div>
</div>
<p class="label">أمانة محافظة الطائف</p>
<h1>جوجو AI</h1>
<p class="subtitle">الموقع تحت الصيانة</p>
<p>نعمل حالياً على تحديث وتطوير الموقع<br>لتقديم تجربة أفضل لزوارنا الكرام</p>
<p style="margin-top:18px">شكراً لصبركم وتفهمكم 🌹</p>
<div class="badge">
<span class="badge-dot"></span>
<span>سنعود قريباً</span>
</div>
<div class="footer">
<p>سفيرة التحول الحضري - مساعد موسم الحج الذكي</p>
<p style="margin-top:8px;font-size:0.9em">© الإعلام المؤسسي لأمانة محافظة الطائف</p>
</div>
</div>
</body>
</html>`;

// Health Check
app.get('/api/health', function (req, res) {
  res.json({ status: 'maintenance', service: 'Jojo AI' });
});

// كل الطلبات ترجع صفحة الصيانة
app.get('*', function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(maintenancePage);
});

// Start Server
app.listen(PORT, '0.0.0.0', function () {
  console.log('🔧 Maintenance mode active on port ' + PORT);
});
