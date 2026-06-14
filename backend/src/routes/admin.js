const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDbInstance } = require('../database');

// ===== 管理员认证中间件 =====
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin_token_2024';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function adminAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token === ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ success: false, error: '未授权访问，请先登录' });
  }
}

// ===== 登录 =====
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN, user: { username: ADMIN_USERNAME, role: 'admin' } });
  } else {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
  }
});

// ===== 以下所有路由都需要管理员认证 =====
router.use(adminAuth);

// ===== 仪表盘统计 =====
router.get('/dashboard', (req, res) => {
  const db = getDbInstance();
  try {
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get()?.count || 0;
    const totalMessages = db.prepare("SELECT COUNT(*) as count FROM messages WHERE role = 'user'").get()?.count || 0;
    const totalTickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get()?.count || 0;
    const openTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get()?.count || 0;
    const totalCourses = db.prepare('SELECT COUNT(*) as count FROM kb_courses WHERE is_active = 1').get()?.count || 0;
    const totalIssues = db.prepare('SELECT COUNT(*) as count FROM kb_device_issues').get()?.count || 0;
    const todaySessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE date(created_at) = date('now')").get()?.count || 0;

    // 最近7天会话趋势
    const recentSessions = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM sessions WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at) ORDER BY date
    `).all();

    // 工单类型分布
    const ticketByType = db.prepare(`
      SELECT type, COUNT(*) as count FROM tickets GROUP BY type
    `).all();

    res.json({
      success: true,
      data: {
        totalSessions, totalMessages, totalTickets, openTickets,
        totalCourses, totalIssues, todaySessions,
        recentSessions, ticketByType
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

// ==================== 课程管理 ====================

// 获取所有课程（包含非活跃）
router.get('/courses', (req, res) => {
  const db = getDbInstance();
  try {
    const courses = db.prepare('SELECT * FROM kb_courses ORDER BY created_at DESC').all();
    const result = courses.map(c => {
      const classes = db.prepare('SELECT * FROM kb_classes WHERE course_id = ?').all(c.id);
      return { ...c, classes };
    });
    res.json({ success: true, courses: result });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取课程列表失败' });
  }
});

// 新增课程
router.post('/courses', (req, res) => {
  const db = getDbInstance();
  const { id, name, category, description, highlights, duration, level, cover_emoji } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, error: '课程名称和分类为必填项' });
  }

  try {
    const courseId = id || `course_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO kb_courses (id, name, category, description, highlights, duration, level, cover_emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(courseId, name, category, description || '', JSON.stringify(highlights || []), duration || '', level || 'beginner', cover_emoji || '📚');

    res.json({ success: true, message: '课程添加成功', id: courseId });
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      return res.status(400).json({ success: false, error: '课程ID已存在' });
    }
    res.status(500).json({ success: false, error: '添加课程失败' });
  }
});

// 更新课程
router.put('/courses/:id', (req, res) => {
  const db = getDbInstance();
  const { id } = req.params;
  const { name, category, description, highlights, duration, level, cover_emoji, is_active } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM kb_courses WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: '课程不存在' });

    db.prepare(`
      UPDATE kb_courses SET name = ?, category = ?, description = ?, highlights = ?,
      duration = ?, level = ?, cover_emoji = ?, is_active = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      category || existing.category,
      description !== undefined ? description : existing.description,
      highlights ? JSON.stringify(highlights) : existing.highlights,
      duration !== undefined ? duration : existing.duration,
      level || existing.level,
      cover_emoji || existing.cover_emoji,
      is_active !== undefined ? is_active : existing.is_active,
      id
    );

    res.json({ success: true, message: '课程更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新课程失败' });
  }
});

// 删除课程
router.delete('/courses/:id', (req, res) => {
  const db = getDbInstance();
  try {
    db.prepare('DELETE FROM kb_classes WHERE course_id = ?').run(req.params.id);
    db.prepare('DELETE FROM kb_courses WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '课程已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除课程失败' });
  }
});

// ==================== 班型管理 ====================

router.get('/classes', (req, res) => {
  const db = getDbInstance();
  try {
    const classes = db.prepare(`
      SELECT c.*, co.name as course_name FROM kb_classes c
      LEFT JOIN kb_courses co ON c.course_id = co.id
      ORDER BY c.created_at DESC
    `).all();
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取班型列表失败' });
  }
});

router.post('/classes', (req, res) => {
  const db = getDbInstance();
  const { id, course_id, name, price, original_price, duration, features, max_students } = req.body;

  if (!course_id || !name || price === undefined) {
    return res.status(400).json({ success: false, error: '课程ID、班型名称和价格为必填项' });
  }

  try {
    const classId = id || `class_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO kb_classes (id, course_id, name, price, original_price, duration, features, max_students)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(classId, course_id, name, price, original_price || price, duration || '', JSON.stringify(features || []), max_students || null);

    res.json({ success: true, message: '班型添加成功', id: classId });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加班型失败' });
  }
});

router.put('/classes/:id', (req, res) => {
  const db = getDbInstance();
  const { id } = req.params;
  const { course_id, name, price, original_price, duration, features, max_students, is_active } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM kb_classes WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: '班型不存在' });

    db.prepare(`
      UPDATE kb_classes SET course_id = ?, name = ?, price = ?, original_price = ?,
      duration = ?, features = ?, max_students = ?, is_active = ?
      WHERE id = ?
    `).run(
      course_id || existing.course_id,
      name || existing.name,
      price !== undefined ? price : existing.price,
      original_price !== undefined ? original_price : existing.original_price,
      duration !== undefined ? duration : existing.duration,
      features ? JSON.stringify(features) : existing.features,
      max_students !== undefined ? max_students : existing.max_students,
      is_active !== undefined ? is_active : existing.is_active,
      id
    );

    res.json({ success: true, message: '班型更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新班型失败' });
  }
});

router.delete('/classes/:id', (req, res) => {
  const db = getDbInstance();
  try {
    db.prepare('DELETE FROM kb_classes WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '班型已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除班型失败' });
  }
});

// ==================== 故障问题管理 ====================

router.get('/device-issues', (req, res) => {
  const db = getDbInstance();
  try {
    const issues = db.prepare('SELECT * FROM kb_device_issues ORDER BY created_at DESC').all();
    res.json({ success: true, issues });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取故障列表失败' });
  }
});

router.post('/device-issues', (req, res) => {
  const db = getDbInstance();
  const { id, title, keywords, problem, solution, category } = req.body;

  if (!title || !problem || !solution) {
    return res.status(400).json({ success: false, error: '标题、问题和解决方案为必填项' });
  }

  try {
    const issueId = id || `di_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO kb_device_issues (id, title, keywords, problem, solution, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(issueId, title, JSON.stringify(keywords || []), problem, solution, category || 'other');

    res.json({ success: true, message: '故障问题添加成功', id: issueId });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加故障问题失败' });
  }
});

router.put('/device-issues/:id', (req, res) => {
  const db = getDbInstance();
  const { id } = req.params;
  const { title, keywords, problem, solution, category } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM kb_device_issues WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: '故障问题不存在' });

    db.prepare(`
      UPDATE kb_device_issues SET title = ?, keywords = ?, problem = ?, solution = ?, category = ?
      WHERE id = ?
    `).run(
      title || existing.title,
      keywords ? JSON.stringify(keywords) : existing.keywords,
      problem || existing.problem,
      solution || existing.solution,
      category || existing.category,
      id
    );

    res.json({ success: true, message: '故障问题更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新故障问题失败' });
  }
});

router.delete('/device-issues/:id', (req, res) => {
  const db = getDbInstance();
  try {
    db.prepare('DELETE FROM kb_device_issues WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '故障问题已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除故障问题失败' });
  }
});

// ==================== 退费政策管理 ====================

router.get('/refund-policies', (req, res) => {
  const db = getDbInstance();
  try {
    const policies = db.prepare('SELECT * FROM kb_refund_policies ORDER BY sort_order').all();
    res.json({ success: true, policies });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取退费政策失败' });
  }
});

router.post('/refund-policies', (req, res) => {
  const db = getDbInstance();
  const { id, title, condition, policy, processing_days, sort_order } = req.body;

  if (!title || !condition || !policy) {
    return res.status(400).json({ success: false, error: '标题、条件和政策内容为必填项' });
  }

  try {
    const policyId = id || `rp_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO kb_refund_policies (id, title, condition, policy, processing_days, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(policyId, title, condition, policy, processing_days || 7, sort_order || 0);

    res.json({ success: true, message: '退费政策添加成功', id: policyId });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加退费政策失败' });
  }
});

router.put('/refund-policies/:id', (req, res) => {
  const db = getDbInstance();
  const { id } = req.params;
  const { title, condition, policy, processing_days, sort_order, is_active } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM kb_refund_policies WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: '退费政策不存在' });

    db.prepare(`
      UPDATE kb_refund_policies SET title = ?, condition = ?, policy = ?,
      processing_days = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `).run(
      title || existing.title,
      condition || existing.condition,
      policy || existing.policy,
      processing_days !== undefined ? processing_days : existing.processing_days,
      sort_order !== undefined ? sort_order : existing.sort_order,
      is_active !== undefined ? is_active : existing.is_active,
      id
    );

    res.json({ success: true, message: '退费政策更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新退费政策失败' });
  }
});

router.delete('/refund-policies/:id', (req, res) => {
  const db = getDbInstance();
  try {
    db.prepare('DELETE FROM kb_refund_policies WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '退费政策已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除退费政策失败' });
  }
});

// ==================== 对话记录管理 ====================

router.get('/sessions', (req, res) => {
  const db = getDbInstance();
  const { page = 1, limit = 20, status } = req.query;

  try {
    let sessions;
    if (status) {
      sessions = db.prepare(`
        SELECT s.*, COUNT(m.id) as message_count
        FROM sessions s LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.status = ?
        GROUP BY s.id ORDER BY s.updated_at DESC LIMIT ? OFFSET ?
      `).all(status, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    } else {
      sessions = db.prepare(`
        SELECT s.*, COUNT(m.id) as message_count
        FROM sessions s LEFT JOIN messages m ON s.id = m.session_id
        GROUP BY s.id ORDER BY s.updated_at DESC LIMIT ? OFFSET ?
      `).all(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    }

    const total = db.prepare('SELECT COUNT(*) as count FROM sessions').get()?.count || 0;

    res.json({ success: true, sessions, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取会话列表失败' });
  }
});

// 获取会话详情及消息
router.get('/sessions/:sessionId', (req, res) => {
  const db = getDbInstance();
  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, error: '会话不存在' });

    const messages = db.prepare(`
      SELECT id, role, content, message_type, created_at
      FROM messages WHERE session_id = ? ORDER BY created_at ASC
    `).all(req.params.sessionId);

    res.json({ success: true, session, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取会话详情失败' });
  }
});

// 删除会话
router.delete('/sessions/:sessionId', (req, res) => {
  const db = getDbInstance();
  try {
    db.prepare('DELETE FROM messages WHERE session_id = ?').run(req.params.sessionId);
    db.prepare('DELETE FROM tickets WHERE session_id = ?').run(req.params.sessionId);
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.sessionId);
    res.json({ success: true, message: '会话已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除会话失败' });
  }
});

// ==================== 工单管理 ====================

// 获取工单列表
router.get('/tickets', (req, res) => {
  const db = getDbInstance();
  const { status, limit = 50, page = 1 } = req.query;
  try {
    let tickets;
    if (status) {
      tickets = db.prepare(`SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(status, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    } else {
      tickets = db.prepare(`SELECT * FROM tickets ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    }
    const total = db.prepare('SELECT COUNT(*) as count FROM tickets').get()?.count || 0;
    res.json({ success: true, tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取工单列表失败' });
  }
});

// 获取工单详情
router.get('/tickets/:id', (req, res) => {
  const db = getDbInstance();
  try {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: '工单不存在' });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取工单详情失败' });
  }
});

// 更新工单状态
router.put('/tickets/:id', (req, res) => {
  const db = getDbInstance();
  const { id } = req.params;
  const { status, assignedTo, description } = req.body;
  try {
    const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: '工单不存在' });

    if (status) {
      if (status === 'resolved') {
        db.prepare(`UPDATE tickets SET status = ?, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(status, id);
      } else {
        db.prepare(`UPDATE tickets SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
      }
    }
    if (assignedTo) {
      db.prepare(`UPDATE tickets SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?`).run(assignedTo, id);
    }
    res.json({ success: true, message: '工单已更新' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新工单失败' });
  }
});

// 转接工单到人工
router.post('/tickets/:id/transfer', (req, res) => {
  const db = getDbInstance();
  const { id } = req.params;
  const { assignedTo = '人工客服专员', note } = req.body;
  try {
    const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: '工单不存在' });

    db.prepare(`UPDATE tickets SET status = 'processing', assigned_to = ?, updated_at = datetime('now') WHERE id = ?`).run(assignedTo, id);

    // 通知用户工单已转接
    const ticket = db.prepare('SELECT session_id FROM tickets WHERE id = ?').get(id);
    if (ticket && ticket.session_id) {
      const { v4: uuidv4 } = require('uuid');
      db.prepare(`INSERT INTO messages (id, session_id, role, content, message_type) VALUES (?, ?, ?, ?, ?)`)
        .run(uuidv4(), ticket.session_id, 'system',
          `🔄 **工单已转接人工处理**\n\n已分配给：${assignedTo}\n${note ? `备注：${note}\n` : ''}人工客服将尽快与您联系 📞`, 'system');
    }

    res.json({ success: true, message: '工单已转接人工' });
  } catch (error) {
    res.status(500).json({ success: false, error: '转接失败' });
  }
});

// 删除工单
router.delete('/tickets/:id', (req, res) => {
  const db = getDbInstance();
  try {
    db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '工单已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除工单失败' });
  }
});

module.exports = router;
