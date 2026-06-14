require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const { seedKnowledgeBase } = require('./seedData');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 用户端
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// 静态文件服务 - 管理员端（前后端分离）
const adminPath = path.join(__dirname, '../../frontend/admin');
app.use('/admin', express.static(adminPath));

// API路由
app.use('/api/chat', require('./routes/chat'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '职业教育AI客服系统运行正常', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  const { getDbInstance } = require('./database');
  const db = getDbInstance();
  try {
    const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
    const openTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get();
    const msgCount = db.prepare("SELECT COUNT(*) as count FROM messages WHERE role = 'user'").get();
    res.json({
      success: true,
      stats: {
        totalSessions: sessionCount ? sessionCount.count : 0,
        totalMessages: msgCount ? msgCount.count : 0,
        totalTickets: ticketCount ? ticketCount.count : 0,
        openTickets: openTickets ? openTickets.count : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

// SPA回退 - 管理员端
app.get('/admin/*', (req, res) => {
  const fs = require('fs');
  const indexPath = path.join(adminPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.redirect('/admin');
  }
});

// SPA回退 - 用户端
app.get('*', (req, res) => {
  const fs = require('fs');
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: '后端服务正常', version: '1.0.0' });
  }
});

// 异步启动
(async () => {
  try {
    await initDatabase();
    seedKnowledgeBase();
    app.listen(PORT, () => {
      console.log(`\n🚀 职业教育AI客服系统启动成功！`);
      console.log(`🌐 访问地址：http://localhost:${PORT}`);
      console.log(`📡 API服务：http://localhost:${PORT}/api`);
      console.log(`❤️  健康检查：http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
})();

module.exports = app;
