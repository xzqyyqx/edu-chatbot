const { getDbInstance } = require('./database');
const { v4: uuidv4 } = require('uuid');

function seedKnowledgeBase() {
  const db = getDbInstance();

  // 检查是否已经填充
  const existing = db.prepare("SELECT COUNT(*) as count FROM kb_courses").get();
  if (existing && existing.count > 0) {
    console.log('知识库数据已存在，跳过填充');
    return;
  }

  // ===================== 课程数据 =====================
  const courses = [
    {
      id: 'course_java',
      name: 'Java全栈开发',
      category: 'programming',
      description: '从零基础到企业级Java开发，涵盖Spring Boot、MyBatis、微服务架构',
      highlights: JSON.stringify(['零基础入学', '项目实战驱动', '就业推荐服务', '终身技术支持']),
      duration: '6个月',
      level: 'beginner',
      cover_emoji: '☕'
    },
    {
      id: 'course_python',
      name: 'Python人工智能',
      category: 'programming',
      description: '深入学习Python编程与AI技术，涵盖机器学习、深度学习、NLP与大模型应用',
      highlights: JSON.stringify(['AI前沿技术', '企业项目实操', '大厂内推机会', '1v1导师辅导']),
      duration: '8个月',
      level: 'intermediate',
      cover_emoji: '🤖'
    },
    {
      id: 'course_frontend',
      name: 'Web前端开发',
      category: 'programming',
      description: '系统学习HTML/CSS/JS，精通Vue3/React，掌握前端工程化与性能优化',
      highlights: JSON.stringify(['主流框架精讲', '真实项目练习', '作品集打造', '面试技巧培训']),
      duration: '5个月',
      level: 'beginner',
      cover_emoji: '🌐'
    },
    {
      id: 'course_uiux',
      name: 'UI/UX交互设计',
      category: 'design',
      description: '从视觉设计到用户体验，掌握Figma、Adobe全套工具，输出商业级设计作品',
      highlights: JSON.stringify(['商业项目实战', '大厂设计师授课', '作品集指导', '接单变现技能']),
      duration: '4个月',
      level: 'beginner',
      cover_emoji: '🎨'
    },
    {
      id: 'course_product',
      name: '产品经理实战',
      category: 'operation',
      description: '系统学习产品思维与方法论，掌握需求分析、原型设计、数据分析全流程',
      highlights: JSON.stringify(['BAT产品经理授课', '完整产品案例', '产品竞聘辅导', '就业保障']),
      duration: '5个月',
      level: 'intermediate',
      cover_emoji: '📱'
    },
    {
      id: 'course_data',
      name: '数据分析与BI',
      category: 'finance',
      description: '掌握Excel、SQL、Python数据分析，学习Tableau/Power BI可视化，培养数据驱动决策能力',
      highlights: JSON.stringify(['实战数据集', 'SQL从入门到精通', 'BI工具全覆盖', '商业分析思维']),
      duration: '4个月',
      level: 'beginner',
      cover_emoji: '📊'
    }
  ];

  courses.forEach(c => {
    db.prepare(`
      INSERT OR REPLACE INTO kb_courses (id, name, category, description, highlights, duration, level, cover_emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.name, c.category, c.description, c.highlights, c.duration, c.level, c.cover_emoji);
  });

  // ===================== 班型数据 =====================
  const classes = [
    { id: 'class_java_basic', course_id: 'course_java', name: '就业保障班', price: 15800, original_price: 19800, duration: '6个月', features: JSON.stringify(['签订就业协议', '不就业退全款', '简历面试辅导', '企业内推渠道', '终身技术答疑']) },
    { id: 'class_java_vip', course_id: 'course_java', name: 'VIP精英班', price: 22800, original_price: 28800, duration: '6个月', features: JSON.stringify(['1v1专属导师', '小班精英教学(≤15人)', '大厂内推优先', '薪资不达标退差价']) },
    { id: 'class_java_self', course_id: 'course_java', name: '自学就业班', price: 6800, original_price: 9800, duration: '录播6个月使用权', features: JSON.stringify(['录播视频', '社群答疑', '代码审查', '项目作业批改']) },
    { id: 'class_python_pro', course_id: 'course_python', name: 'AI工程师就业班', price: 19800, original_price: 24800, duration: '8个月', features: JSON.stringify(['就业协议保障', 'AI企业实习机会', '大模型应用专项', '算法面试冲刺']) },
    { id: 'class_python_vip', course_id: 'course_python', name: 'VIP大模型方向', price: 28800, original_price: 36800, duration: '8个月', features: JSON.stringify(['LLM应用开发专项', '1v1导师定制路径', 'AI创业孵化资源', '顶级算法团队授课']) },
    { id: 'class_fe_basic', course_id: 'course_frontend', name: '标准就业班', price: 12800, original_price: 16800, duration: '5个月', features: JSON.stringify(['就业推荐', '项目实战', '双师直播', '录播回看']) },
    { id: 'class_fe_vip', course_id: 'course_frontend', name: 'VIP全栈班', price: 18800, original_price: 23800, duration: '7个月', features: JSON.stringify(['前后端全栈能力', '大厂真实项目', '1v1简历优化', '薪资保障']) },
    { id: 'class_ui_basic', course_id: 'course_uiux', name: '就业实战班', price: 11800, original_price: 15800, duration: '4个月', features: JSON.stringify(['作品集打造', '商业项目实操', '接单渠道对接', '就业推荐']) },
    { id: 'class_pm_basic', course_id: 'course_product', name: '产品就业班', price: 13800, original_price: 18800, duration: '5个月', features: JSON.stringify(['BAT产品案例', '需求文档实训', '职场竞聘模拟', '就业推荐服务']) },
    { id: 'class_data_basic', course_id: 'course_data', name: '数据分析就业班', price: 10800, original_price: 14800, duration: '4个月', features: JSON.stringify(['SQL全套', 'Python数分', 'Power BI/Tableau', '数据面试专项']) }
  ];

  classes.forEach(c => {
    db.prepare(`
      INSERT OR REPLACE INTO kb_classes (id, course_id, name, price, original_price, duration, features)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.course_id, c.name, c.price, c.original_price, c.duration, c.features);
  });

  // ===================== 设备故障知识库 =====================
  const deviceIssues = [
    { id: 'di_001', title: '无法登录学习平台', keywords: JSON.stringify(['登录', '账号', '密码', '登不上', '无法登录', '验证码']), problem: '无法登录', solution: '1. 确认使用注册时的手机号或邮箱登录\n2. 点击"忘记密码"，通过手机验证码重置密码\n3. 清除浏览器缓存后重试（Chrome: Ctrl+Shift+Del）\n4. 如账号被锁定，联系客服提供学员ID进行后台处理', category: 'login' },
    { id: 'di_002', title: '视频无法播放或卡顿', keywords: JSON.stringify(['视频', '播放', '卡顿', '加载', '缓冲', '黑屏']), problem: '视频卡顿', solution: '1. 检查网络，推荐20Mbps以上宽带\n2. 切换视频清晰度到720P\n3. 关闭其他占用带宽的应用\n4. 更换Chrome/Edge最新版浏览器\n5. 关闭VPN代理软件后重试\n6. 下载App端离线缓存后观看', category: 'software' },
    { id: 'di_003', title: '直播课无法进入/音视频异常', keywords: JSON.stringify(['直播', '进不去', '没声音', '听不到', '看不见']), problem: '直播无法进入', solution: '1. 确认使用课前30分钟发送的最新直播链接\n2. 确认浏览器已授权摄像头/麦克风权限\n3. 刷新页面或重新进入直播间\n4. 检查系统音量是否静音\n5. 所有直播24小时内会上传录播', category: 'network' },
    { id: 'di_004', title: '作业无法提交', keywords: JSON.stringify(['作业', '提交', '上传', '失败', '作品']), problem: '作业提交失败', solution: '1. 确认文件大小不超过200MB\n2. 检查文件格式（代码用zip，设计稿用PDF）\n3. 使用Chrome浏览器操作\n4. 也可将文件发送到课程专属邮箱', category: 'software' },
    { id: 'di_005', title: '课程到期无法访问', keywords: JSON.stringify(['到期', '过期', '看不了', '权限', '续费']), problem: '课程到期', solution: '1. 登录账号查看课程有效期（个人中心-我的课程）\n2. 就业班学员联系班主任确认协议条款\n3. 录播课可按月/季/年续费\n4. 毕业学员可申请核心课程永久回看权限', category: 'other' },
    { id: 'di_006', title: '编程环境/IDE配置问题', keywords: JSON.stringify(['IDEA', 'VSCode', 'Python', 'Java', '环境', '安装', '配置', 'JDK', '报错']), problem: '环境配置失败', solution: '1. 根据课程讲义中的环境配置文档安装\n2. Java：安装JDK 17+并配置JAVA_HOME环境变量\n3. Python：推荐安装Anaconda避免版本冲突\n4. 遇报错，截图发学员群，助教30分钟内响应', category: 'software' },
    { id: 'di_007', title: '证书无法下载/证书信息有误', keywords: JSON.stringify(['证书', '结业', '毕业', '下载', '错误', '姓名']), problem: '证书问题', solution: '1. 确认已完成所有章节学习（进度需≥80%）\n2. 确认所有作业已提交并通过审核\n3. 证书信息有误：联系客服提交更正申请附身份证照片\n4. 企业认证证书处理周期7-15个工作日', category: 'other' }
  ];

  deviceIssues.forEach(i => {
    db.prepare(`
      INSERT OR REPLACE INTO kb_device_issues (id, title, keywords, problem, solution, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(i.id, i.title, i.keywords, i.problem, i.solution, i.category);
  });

  // ===================== 退费政策知识库 =====================
  const refundPolicies = [
    { id: 'rp_001', title: '报名后7天无理由退款', condition: '报名缴费后7天内，且课程进度未超过10%', policy: '可申请全额退款，退款金额原路退回，处理周期3-5个工作日。无需提供理由。', processing_days: 5, sort_order: 1 },
    { id: 'rp_002', title: '开课后15天内退款', condition: '开课后8-15天内，课程进度未超过30%', policy: '可退还已缴学费的70%。退款金额 = 实缴金额 × 70%。审核通过后7个工作日内退款。', processing_days: 7, sort_order: 2 },
    { id: 'rp_003', title: '开课后30天内退款', condition: '开课后16-30天内，课程进度未超过50%', policy: '可退还已缴学费的40%。退款金额 = 实缴金额 × 40%。审核周期3-7个工作日。', processing_days: 10, sort_order: 3 },
    { id: 'rp_004', title: '特殊情况退款', condition: '因学员突发疾病、重大事故等不可抗力，可在开课后90天内申请', policy: '需提供相关证明材料，由运营主管审核，退款比例根据实际学习进度协商，最高可退70%。', processing_days: 15, sort_order: 4 },
    { id: 'rp_005', title: '就业协议退款', condition: '签订就业保障协议的班型，毕业后6个月内未能就业', policy: '按协议约定可申请退款（全额或差价退还）。需提供完整求职记录（至少投递30份简历），就业部门核实后处理。', processing_days: 20, sort_order: 5 },
    { id: 'rp_006', title: '不可退款情形', condition: '以下情形不支持退款', policy: '1. 开课超过30天且学习进度超过50%\n2. 已下载全部课程资料且进度超过80%\n3. 以虚假信息报名\n4. 违反学员手册被除名\n5. 赠课、免费体验课等活动课程', processing_days: 0, sort_order: 6 }
  ];

  refundPolicies.forEach(p => {
    db.prepare(`
      INSERT OR REPLACE INTO kb_refund_policies (id, title, condition, policy, processing_days, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(p.id, p.title, p.condition, p.policy, p.processing_days, p.sort_order);
  });

  console.log('知识库数据填充完成');
}

module.exports = { seedKnowledgeBase };
