const { getDbInstance } = require('./database');

function searchCourses(query = '', limit = 6) {
  const db = getDbInstance();
  if (!query) {
    return db.prepare('SELECT * FROM kb_courses WHERE is_active = 1 LIMIT ?').all(limit);
  }
  const kw = `%${query.toLowerCase()}%`;
  return db.prepare(`SELECT * FROM kb_courses WHERE is_active = 1 AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?) LIMIT ?`).all(kw, kw, limit);
}

function searchClassesByCourse(courseId) {
  const db = getDbInstance();
  return db.prepare(`SELECT c.*, co.name as course_name, co.cover_emoji FROM kb_classes c LEFT JOIN kb_courses co ON c.course_id = co.id WHERE c.course_id = ? AND c.is_active = 1`).all(courseId);
}

function getAllCoursesWithClasses() {
  const db = getDbInstance();
  const courses = db.prepare('SELECT * FROM kb_courses WHERE is_active = 1').all();
  return courses.map(course => {
    const classes = searchClassesByCourse(course.id);
    return { ...course, classes };
  });
}

function searchDeviceIssues(query = '') {
  const db = getDbInstance();
  if (!query) return db.prepare('SELECT * FROM kb_device_issues LIMIT 10').all();
  const allIssues = db.prepare('SELECT * FROM kb_device_issues').all();
  const keywords = query.toLowerCase();
  const scored = allIssues.map(issue => {
    const kws = JSON.parse(issue.keywords || '[]');
    let score = 0;
    kws.forEach(kw => { if (keywords.includes(kw.toLowerCase())) score += 2; });
    if (issue.title.toLowerCase().includes(keywords)) score += 3;
    if (issue.problem.toLowerCase().includes(keywords)) score += 1;
    return { ...issue, score };
  });
  return scored.filter(i => i.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

function getRefundPolicies() {
  const db = getDbInstance();
  return db.prepare('SELECT * FROM kb_refund_policies WHERE is_active = 1 ORDER BY sort_order').all();
}

function smartSearch(message) {
  const msg = message.toLowerCase();
  const result = { courses: [], classes: [], deviceIssues: [], refundPolicies: [], suggestCards: false };

  // 退费相关
  if (/退费|退款|退课|退钱/.test(msg)) {
    result.refundPolicies = getRefundPolicies();
  }

  // 技术故障相关
  if (/登录|密码|视频|播放|卡顿|直播|作业|证书|下载|环境|安装|配置/.test(msg)) {
    result.deviceIssues = searchDeviceIssues(msg);
  }

  // 课程相关 - 宽泛匹配：只要提到课程、价格、报名等意图就返回全部课程
  if (/课程|班|学习|报名|价格|费用|多少钱|java|python|前端|设计|ui|产品|数据|ai|人工智能|有哪些|什么课|推荐|介绍|想学|感兴趣|咨询/.test(msg)) {
    // 如果消息包含具体课程关键词，精确搜索；否则返回全部
    const specificKw = msg.match(/java|python|前端|设计|ui|产品|数据|ai|人工智能/);
    if (specificKw) {
      result.courses = searchCourses(specificKw[0], 3);
    } else {
      // 用户泛泛询问课程，返回全部课程概览
      result.courses = searchCourses('', 10);
    }
    result.suggestCards = result.courses.length > 0;
    if (result.suggestCards) {
      result.courses.forEach(c => {
        const cls = searchClassesByCourse(c.id);
        result.classes.push(...cls);
      });
    }
  }
  return result;
}

module.exports = { searchCourses, searchClassesByCourse, getAllCoursesWithClasses, searchDeviceIssues, getRefundPolicies, smartSearch };
