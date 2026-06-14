const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDbInstance } = require('../database');
const { callLLM } = require('../llmService');
const { getSystemPrompt, getKnowledgeContext } = require('../prompts');
const { smartSearch } = require('../knowledgeService');

// 创建新会话
router.post('/sessions', (req, res) => {
  const { userType = 'prospect', name, phone } = req.body;
  const db = getDbInstance();
  const sessionId = uuidv4();
  const userId = uuidv4();

  try {
    db.prepare(`INSERT INTO users (id, type, name, phone) VALUES (?, ?, ?, ?)`)
      .run(userId, userType, name || null, phone || null);

    db.prepare(`INSERT INTO sessions (id, user_id, user_type, title) VALUES (?, ?, ?, ?)`)
      .run(sessionId, userId, userType, `${userType === 'enrolled' ? '在读学员' : '意向学员'}咨询 - ${new Date().toLocaleDateString()}`);

    const welcomeMsg = userType === 'enrolled'
      ? '您好！我是学员服务助手小慧 🎓 很高兴为您服务！请问遇到什么问题需要帮助？'
      : '您好！我是启慧教育顾问小慧 👋 我可以为您介绍热门课程、解答学习疑问、帮您找到最适合的职业方向。请问有什么想了解的吗？';

    db.prepare(`INSERT INTO messages (id, session_id, role, content, message_type) VALUES (?, ?, ?, ?, ?)`)
      .run(uuidv4(), sessionId, 'assistant', welcomeMsg, 'text');

    res.json({ success: true, sessionId, userId, userType, welcomeMessage: welcomeMsg });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({ success: false, error: '创建会话失败' });
  }
});

// 发送消息
router.post('/sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  const { content, userType } = req.body;
  const db = getDbInstance();

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: '消息内容不能为空' });
  }

  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }

    const currentUserType = userType || session.user_type;

    db.prepare(`INSERT INTO messages (id, session_id, role, content, message_type) VALUES (?, ?, ?, ?, ?)`)
      .run(uuidv4(), sessionId, 'user', content, 'text');

    // 获取历史消息（最近10条）
    const history = db.prepare(`
      SELECT role, content FROM messages 
      WHERE session_id = ? AND role IN ('user', 'assistant')
      ORDER BY created_at DESC LIMIT 10
    `).all(sessionId).reverse();

    // 知识库检索
    const knowledgeResult = smartSearch(content);
    const knowledgeContext = getKnowledgeContext(
      knowledgeResult.courses,
      knowledgeResult.classes,
      knowledgeResult.deviceIssues,
      knowledgeResult.refundPolicies
    );

    const systemPrompt = getSystemPrompt(currentUserType, knowledgeContext);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    const llmResult = await callLLM(messages, { userType: currentUserType });

    const aiMsgId = uuidv4();
    db.prepare(`INSERT INTO messages (id, session_id, role, content, message_type) VALUES (?, ?, ?, ?, ?)`)
      .run(aiMsgId, sessionId, 'assistant', llmResult.content, 'text');

    db.prepare('UPDATE sessions SET updated_at = datetime(\'now\') WHERE id = ?').run(sessionId);

    // 推送课程卡片
    let courseCards = null;
    if (knowledgeResult.suggestCards && knowledgeResult.courses.length > 0) {
      courseCards = knowledgeResult.courses.map(c => {
        const classes = knowledgeResult.classes.filter(cl => cl.course_id === c.id);
        return {
          id: c.id,
          name: c.name,
          emoji: c.cover_emoji,
          description: c.description,
          duration: c.duration,
          level: c.level,
          highlights: JSON.parse(c.highlights || '[]'),
          classes: classes.slice(0, 2).map(cl => ({
            name: cl.name,
            price: cl.price,
            originalPrice: cl.original_price,
            features: JSON.parse(cl.features || '[]').slice(0, 3)
          }))
        };
      });
    }

    const needTicket = detectTicketTrigger(content);

    res.json({
      success: true,
      message: { id: aiMsgId, role: 'assistant', content: llmResult.content, createdAt: new Date().toISOString() },
      courseCards,
      needTicket,
      userType: currentUserType
    });

  } catch (error) {
    console.error('消息处理失败:', error);
    res.status(500).json({ success: false, error: '消息处理失败，请稍后重试' });
  }
});

// 获取会话历史
router.get('/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const db = getDbInstance();
  try {
    const messages = db.prepare(`
      SELECT id, role, content, message_type, card_data, created_at
      FROM messages WHERE session_id = ? ORDER BY created_at ASC
    `).all(sessionId);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取消息失败' });
  }
});

// 归档会话
router.put('/sessions/:sessionId/archive', (req, res) => {
  const { sessionId } = req.params;
  const db = getDbInstance();
  try {
    db.prepare(`UPDATE sessions SET status = 'archived', archived_at = datetime('now') WHERE id = ?`).run(sessionId);
    res.json({ success: true, message: '会话已归档' });
  } catch (error) {
    res.status(500).json({ success: false, error: '归档失败' });
  }
});

function detectTicketTrigger(userMsg) {
  const triggers = {
    refund: /退费|退款|退钱|退课/,
    device: /故障|无法|不能|打不开|登不上/,
    complaint: /投诉|不满意|骗|差评|态度/
  };
  for (const [type, regex] of Object.entries(triggers)) {
    if (regex.test(userMsg)) {
      return { suggest: true, type, reason: `检测到${type === 'refund' ? '退费' : type === 'device' ? '技术故障' : '投诉'}相关诉求` };
    }
  }
  return null;
}

module.exports = router;
