const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDbInstance } = require('../database');

router.post('/', (req, res) => {
  const { sessionId, userId, type, title, description, priority = 'normal' } = req.body;
  const db = getDbInstance();
  if (!sessionId || !type || !title) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  try {
    const ticketId = uuidv4();
    db.prepare(`INSERT INTO tickets (id, session_id, user_id, type, title, description, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(ticketId, sessionId, userId || null, type, title, description || null, priority);

    const ticketMsg = `✅ **工单已创建**\n\n工单编号：${ticketId.slice(0, 8).toUpperCase()}\n类型：${getTicketTypeName(type)}\n优先级：${getPriorityName(priority)}\n\n专业团队将在以下时间联系您：\n• 高优先级：2小时内\n• 普通：24小时内\n\n请保持手机畅通 🙏`;
    db.prepare(`INSERT INTO messages (id, session_id, role, content, message_type) VALUES (?, ?, ?, ?, ?)`)
      .run(uuidv4(), sessionId, 'system', ticketMsg, 'system');

    res.json({ success: true, ticketId, ticket: { id: ticketId, type, title, status: 'open', priority, createdAt: new Date().toISOString() } });
  } catch (error) {
    console.error('创建工单失败:', error);
    res.status(500).json({ success: false, error: '创建工单失败' });
  }
});

router.get('/', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const db = getDbInstance();
  try {
    let tickets;
    if (status) {
      tickets = db.prepare(`SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(status, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    } else {
      tickets = db.prepare(`SELECT * FROM tickets ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    }
    const total = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
    res.json({ success: true, tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total: total ? total.count : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取工单列表失败' });
  }
});

router.get('/:ticketId', (req, res) => {
  const db = getDbInstance();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.ticketId);
  if (!ticket) return res.status(404).json({ success: false, error: '工单不存在' });
  res.json({ success: true, ticket });
});

router.put('/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const { status, assignedTo, description } = req.body;
  const db = getDbInstance();
  try {
    if (status) {
      if (status === 'resolved') {
        db.prepare(`UPDATE tickets SET status = ?, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(status, ticketId);
      } else {
        db.prepare(`UPDATE tickets SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, ticketId);
      }
    }
    if (assignedTo) db.prepare(`UPDATE tickets SET assigned_to = ? WHERE id = ?`).run(assignedTo, ticketId);
    res.json({ success: true, message: '工单已更新' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新工单失败' });
  }
});

router.post('/:ticketId/transfer', (req, res) => {
  const { ticketId } = req.params;
  const { assignedTo = '人工客服', note } = req.body;
  const db = getDbInstance();
  try {
    db.prepare(`UPDATE tickets SET status = 'processing', assigned_to = ?, updated_at = datetime('now') WHERE id = ?`).run(assignedTo, ticketId);
    const ticket = db.prepare('SELECT session_id FROM tickets WHERE id = ?').get(ticketId);
    if (ticket) {
      db.prepare(`INSERT INTO messages (id, session_id, role, content, message_type) VALUES (?, ?, ?, ?, ?)`)
        .run(uuidv4(), ticket.session_id, 'system',
          `🔄 **工单已转接人工处理**\n\n已分配给：${assignedTo}\n${note ? `备注：${note}\n` : ''}人工客服将尽快与您联系 📞`, 'system');
    }
    res.json({ success: true, message: '工单已转接人工' });
  } catch (error) {
    res.status(500).json({ success: false, error: '转接失败' });
  }
});

function getTicketTypeName(type) {
  return { refund: '退费申请', device: '技术故障', complaint: '投诉建议', other: '其他问题' }[type] || type;
}

function getPriorityName(priority) {
  return { low: '低', normal: '普通', high: '高', urgent: '紧急' }[priority] || priority;
}

module.exports = router;
