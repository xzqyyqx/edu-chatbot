const fetch = require('node-fetch');

const LLM_API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-3.5-turbo';

/**
 * 调用大模型API
 * @param {Array} messages - 消息历史
 * @param {Object} options - 额外选项
 */
async function callLLM(messages, options = {}) {
  // Demo模式：直接返回模拟回复
  if (!LLM_API_KEY || LLM_API_KEY === 'demo_mode') {
    return generateDemoReply(messages, options);
  }

  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        stream: false
      }),
      timeout: 30000
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '抱歉，我暂时无法回应，请稍后再试。',
      usage: data.usage
    };
  } catch (error) {
    console.error('LLM API调用失败:', error.message);
    // 降级到demo模式
    return generateDemoReply(messages, options);
  }
}

/**
 * Demo模式 - 根据关键词生成智能模拟回复
 */
function generateDemoReply(messages, options) {
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const isEnrolled = systemMessage.includes('售后安抚');
  const msg = lastUserMessage.toLowerCase();

  let reply = '';

  // 招生话术场景
  if (!isEnrolled) {
    if (msg.includes('java') || msg.includes('后端') || msg.includes('后台')) {
      reply = `很高兴您对Java方向感兴趣！☕\n\nJava是目前企业级开发的主流语言，就业岗位多、薪资稳定。我们的**Java全栈开发课程**非常适合您：\n\n**课程亮点：**\n• 零基础友好，系统从入门到精通\n• Spring Boot + 微服务全栈技术栈\n• 6个真实企业项目练手\n• **就业保障班签订协议，不就业退全款**\n\n请问您目前是完全零基础，还是有一些编程经验呢？了解一下更好为您推荐合适的班型~ 😊`;
    } else if (msg.includes('python') || msg.includes('ai') || msg.includes('人工智能') || msg.includes('机器学习')) {
      reply = `Python + AI方向现在可是最火热的赛道！🤖\n\n我们的**Python人工智能课程**在行业内口碑极佳：\n\n**为什么选择我们：**\n• 覆盖机器学习、深度学习、大模型应用全链路\n• 配备大厂AI工程师授课\n• 提供企业AI项目实习机会\n• VIP班包含LLM应用开发专项\n\n目前AI岗位薪资普遍在20-40K，市场需求旺盛。\n\n请问您的数学基础怎么样？Python之前有接触过吗？`;
    } else if (msg.includes('前端') || msg.includes('html') || msg.includes('vue') || msg.includes('react')) {
      reply = `前端开发是非常好的入门选择！🌐\n\n我们的**Web前端开发课程**：\n• 5个月系统学习HTML/CSS/JS→Vue3/React\n• 真实商业项目练习，打造作品集\n• **双师教学**（主讲老师+助教），学习效果有保障\n• 标准就业班12800元，VIP全栈班包含Node.js\n\n前端岗位上手相对较快，适合想要快速转型的同学。\n\n您希望做纯前端，还是考虑全栈方向呢？`;
    } else if (msg.includes('价格') || msg.includes('多少钱') || msg.includes('费用') || msg.includes('贵')) {
      reply = `关于课程费用，我来帮您梳理一下 💰\n\n不同课程和班型价格有所不同：\n• **前端/数据分析**：约10,800-18,800元\n• **Java/产品经理**：约13,800-22,800元\n• **Python AI**：约19,800-28,800元\n\n**价值对比：**\n- 一线城市程序员平均薪资：15-30K/月\n- 课程投入相当于1-2个月薪资\n- 就业班签协议，不就业可退款\n\n我们近期有活动优惠，具体班型可以聊一下，帮您选最适合的方案。请问您对哪个方向比较感兴趣？`;
    } else if (msg.includes('时间') || msg.includes('上班') || msg.includes('在职') || msg.includes('兼顾')) {
      reply = `在职学习完全没问题！我们特别考虑了上班族的需求 ⏰\n\n**灵活学习安排：**\n• 直播课安排在**晚上8点-10点**或**周末**\n• 所有直播均有录播回看，永久有效\n• 自学班可以完全按自己节奏来\n• 手机端随时随地学习\n\n很多同学都是白天上班、晚上学习，3-6个月后成功转型。\n\n您每周大概有多少时间可以投入学习呢？我来帮您规划学习路径 📅`;
    } else if (msg.includes('你好') || msg.includes('hello') || msg.includes('嗨') || msg.includes('在吗')) {
      reply = `你好呀！👋 我是小慧，您的专属职业教育顾问~\n\n我可以帮您：\n• 📚 了解我们的热门课程（Java/Python AI/前端/UI设计/产品/数据分析）\n• 💼 分析您的情况，推荐最适合的学习路径\n• 💰 解答课程费用和班型选择\n• 🎯 了解就业保障政策\n\n请问您对哪个方向感兴趣，或者有什么想了解的呢？😊`;
    } else {
      reply = `感谢您的咨询！😊\n\n我是职业教育顾问小慧，专门帮助想要提升技能、实现职业转型的朋友找到最适合的学习路径。\n\n我们有以下热门课程方向：\n☕ **Java全栈开发** - 就业岗位最多\n🤖 **Python AI方向** - 最热门赛道\n🌐 **Web前端开发** - 入门友好\n🎨 **UI/UX设计** - 创意与技术结合\n📱 **产品经理** - 互联网核心岗位\n📊 **数据分析** - 适合转型\n\n请问您目前从事什么行业，希望往哪个方向发展呢？`;
    }
  } else {
    // 售后安抚场景
    if (msg.includes('登录') || msg.includes('密码') || msg.includes('账号')) {
      reply = `我理解这个问题很着急，登不上去确实影响学习！让我帮您一步步解决 🔧\n\n**请按以下步骤操作：**\n\n1️⃣ 确认登录账号是注册时的**手机号或邮箱**（不是微信昵称）\n2️⃣ 点击登录页的**"忘记密码"**，通过手机验证码重置\n3️⃣ 如果手机号变了，请告诉我您的**学员ID**，我帮您后台核实\n4️⃣ 尝试**清除浏览器缓存**（Chrome按Ctrl+Shift+Del）后重试\n\n操作完后麻烦告诉我结果，我一直在这里 💪`;
    } else if (msg.includes('视频') || msg.includes('播放') || msg.includes('卡') || msg.includes('看不了')) {
      reply = `视频卡顿确实很影响学习体验，这个问题我们来解决！😊\n\n**排查步骤：**\n\n1️⃣ 先测试一下网速（搜索"网速测试"），推荐20Mbps以上\n2️⃣ 视频右下角点⚙️，把清晰度**降到720P**\n3️⃣ 暂时关闭其他占网速的软件（迅雷/直播等）\n4️⃣ 换成**Chrome或Edge最新版**浏览器试试\n5️⃣ 如果用的是WiFi，试试切换**手机热点**\n\n如果以上都试了还是卡，可以下载**App端**离线缓存来看，完全不受网速影响 📱\n\n请问是哪节课卡顿呢？`;
    } else if (msg.includes('退费') || msg.includes('退款') || msg.includes('退钱') || msg.includes('退课')) {
      reply = `我完全理解您的心情，有退费需求是很正常的，我会认真帮您处理 🙏\n\n为了能准确告诉您可以退多少，能麻烦您告诉我：\n\n1. 您报名是什么时候？（大概几月几号）\n2. 目前课程学了多少内容（大概百分比）？\n3. 是哪个班型（就业保障班/VIP班/录播班）？\n\n我们的退费政策：\n• **7天内**：全额退款\n• **8-15天，进度<30%**：退70%\n• **16-30天，进度<50%**：退40%\n• **特殊情况**（突发疾病等）：可特殊申请\n\n您的情况我会认真核实，请放心 💪`;
    } else if (msg.includes('直播') || msg.includes('进不去') || msg.includes('没声音')) {
      reply = `哎呀，直播进不去太影响学习了，我来帮您快速解决！⚡\n\n**请立即试试：**\n\n1️⃣ 刷新页面，重新点击直播链接（确认是最新链接，课前30分钟会发到群里）\n2️⃣ 检查浏览器是否允许了**麦克风和摄像头权限**（地址栏左边的锁🔒图标）\n3️⃣ 检查电脑**系统音量**是否静音\n4️⃣ 尝试用**腾讯会议**或其他客户端进入（如果课程有提供）\n\n**紧急情况**：如果现在正在上课，所有直播**24小时内会上传录播**，不会影响您的学习进度！\n\n有问题立刻回复我，我陪您搞定 💪`;
    } else if (msg.includes('投诉') || msg.includes('气') || msg.includes('骗') || msg.includes('态度')) {
      reply = `非常抱歉给您带来了不好的体验，我真诚地向您道歉 🙇\n\n您的感受我完全理解，发生这样的情况确实令人沮丧。请您相信，我们非常重视每一位学员的体验，您反馈的问题对我们来说非常重要。\n\n**接下来我会这样处理：**\n\n1. 我立即为您**创建优先处理工单**，标记为高优先级\n2. 请您告诉我具体发生了什么，以便我准确记录\n3. 相关负责人会在**2小时内**联系您跟进处理\n\n能告诉我具体遇到了什么问题吗？我们一定会认真解决 💙`;
    } else if (msg.includes('你好') || msg.includes('hello') || msg.includes('在吗') || msg.includes('客服')) {
      reply = `您好！我是小慧，在读学员专属服务助手 🎓\n\n很高兴为您服务！我可以帮您解决：\n\n🔧 **技术问题**：登录、视频播放、直播、作业提交\n📋 **学习问题**：课程进度、作业疑问、证书申请\n💰 **退费咨询**：了解退费政策、发起退款申请\n🎫 **工单处理**：复杂问题升级、投诉反馈\n\n请问有什么需要帮助的吗？😊`;
    } else {
      reply = `您好！我是学员服务助手小慧 🌟\n\n我理解您可能遇到了一些问题，请不用担心，我们一起来解决。\n\n**您可以告诉我：**\n• 遇到的具体问题是什么\n• 是什么课程或班型\n• 问题什么时候开始出现的\n\n有了这些信息，我能更快帮您找到解决方案。请告诉我详细情况吧 😊`;
    }
  }

  return {
    content: reply || '您好！请问有什么可以帮助您的？',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
}

module.exports = { callLLM };
