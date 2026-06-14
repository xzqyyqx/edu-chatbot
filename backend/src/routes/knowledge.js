const express = require('express');
const router = express.Router();
const { getDbInstance } = require('../database');

router.get('/courses', (req, res) => {
  const db = getDbInstance();
  const { q } = req.query;
  try {
    let courses;
    if (q) {
      courses = db.prepare(`SELECT * FROM kb_courses WHERE is_active = 1 AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?) LIMIT 6`)
        .all(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    } else {
      courses = db.prepare('SELECT * FROM kb_courses WHERE is_active = 1').all();
    }
    // 附带班型数据
    const result = courses.map(c => {
      const classes = db.prepare('SELECT * FROM kb_classes WHERE course_id = ? AND is_active = 1').all(c.id);
      return { ...c, classes };
    });
    res.json({ success: true, courses: result });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取课程失败' });
  }
});

router.get('/device-issues', (req, res) => {
  const db = getDbInstance();
  const { q } = req.query;
  try {
    let issues;
    if (q) {
      issues = db.prepare(`SELECT * FROM kb_device_issues WHERE LOWER(title) LIKE ? OR LOWER(solution) LIKE ? LIMIT 10`)
        .all(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    } else {
      issues = db.prepare('SELECT * FROM kb_device_issues').all();
    }
    res.json({ success: true, issues });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取故障知识库失败' });
  }
});

router.get('/refund-policies', (req, res) => {
  const db = getDbInstance();
  try {
    const policies = db.prepare('SELECT * FROM kb_refund_policies WHERE is_active = 1 ORDER BY sort_order').all();
    res.json({ success: true, policies });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取退费政策失败' });
  }
});

module.exports = router;
