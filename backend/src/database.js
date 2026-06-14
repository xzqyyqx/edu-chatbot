const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/edu_chatbot.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;
let SQL = null;

async function getDB() {
  if (db) return db;
  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// 同步包装器 - 把sql.js的API包装成类似better-sqlite3的接口
class SyncDB {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  exec(sql) {
    this._db.run(sql);
    saveDB();
    return this;
  }

  pragma(sql) {
    // sql.js不需要pragma
    return this;
  }

  prepare(sql) {
    const db = this._db;
    return {
      run: (...params) => {
        db.run(sql, params);
        saveDB();
        return { changes: 1 };
      },
      get: (...params) => {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: (...params) => {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }
}

let dbInstance = null;

async function initDatabase() {
  const sqlDb = await getDB();
  dbInstance = new SyncDB(sqlDb);

  // 用户表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'prospect',
      name TEXT,
      phone TEXT,
      email TEXT,
      course_id TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  // 会话表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_type TEXT NOT NULL DEFAULT 'prospect',
      status TEXT NOT NULL DEFAULT 'active',
      title TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now')),
      archived_at DATETIME
    )
  `);

  // 消息表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      card_data TEXT,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  // 工单表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      assigned_to TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now')),
      resolved_at DATETIME
    )
  `);

  // 知识库-课程表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS kb_courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      highlights TEXT,
      duration TEXT,
      level TEXT,
      cover_emoji TEXT DEFAULT '📚',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  // 知识库-班型表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS kb_classes (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      duration TEXT,
      features TEXT,
      max_students INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  // 知识库-设备故障表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS kb_device_issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      keywords TEXT,
      problem TEXT NOT NULL,
      solution TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  // 知识库-退费政策表
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS kb_refund_policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      condition TEXT NOT NULL,
      policy TEXT NOT NULL,
      processing_days INTEGER DEFAULT 7,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  saveDB();
  console.log('数据库初始化完成');
  return dbInstance;
}

function getDbInstance() {
  return dbInstance;
}

module.exports = { initDatabase, getDbInstance, saveDB };
