require('dotenv').config();
const { initDatabase } = require('./database');
const { seedKnowledgeBase } = require('./seedData');

(async () => {
  console.log('开始初始化数据库...');
  await initDatabase();
  seedKnowledgeBase();
  console.log('数据库初始化完成！');
  process.exit(0);
})();
