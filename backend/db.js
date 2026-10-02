import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import "dotenv/config";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "3306", 10),
};

const dbName = process.env.DB_NAME || "ada";

let pool;

export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

export const get = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

export const run = async (sql, params = []) => {
  const [result] = await pool.query(sql, params);
  return { id: result.insertId, changes: result.affectedRows };
};

export const initDb = async () => {
  // First connect without specifying database to create 'ada' if it doesn't exist
  const initConn = await mysql.createConnection(dbConfig);
  await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await initConn.end();

  // Create pool connected to the target database
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log(`Connected to MySQL database '${dbName}' at ${dbConfig.host}:${dbConfig.port}`);

  const currentYear = new Date().getFullYear().toString();

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      employee VARCHAR(255),
      position VARCHAR(255),
      username VARCHAR(100) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS ada_list (
      ada_id INT AUTO_INCREMENT PRIMARY KEY,
      ada_no VARCHAR(100) UNIQUE,
      count VARCHAR(50),
      ada_date VARCHAR(50),
      addressee VARCHAR(255),
      bank VARCHAR(255),
      account_no VARCHAR(100),
      year_beg VARCHAR(10)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS office (
      office_id INT AUTO_INCREMENT PRIMARY KEY,
      ada_no VARCHAR(100),
      office VARCHAR(255),
      reference VARCHAR(255),
      nop VARCHAR(255),
      cafoa VARCHAR(100),
      amount DECIMAL(15, 2)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS radai_list (
      radai_id INT AUTO_INCREMENT PRIMARY KEY,
      report_no VARCHAR(100) UNIQUE,
      count VARCHAR(50),
      date_range VARCHAR(50),
      one_date VARCHAR(50),
      two_date VARCHAR(50),
      fund VARCHAR(100),
      account_no VARCHAR(100),
      year_beg VARCHAR(10)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS default_value (
      default_id INT PRIMARY KEY DEFAULT 0,
      addressee VARCHAR(255),
      bank VARCHAR(255),
      account_no VARCHAR(100),
      left_name VARCHAR(255),
      left_title VARCHAR(255),
      right_name VARCHAR(255),
      right_title VARCHAR(255),
      radai_name VARCHAR(255),
      radai_position VARCHAR(255),
      year_beg VARCHAR(10)
    )
  `);

  // Helper to create index safely if not exists
  const createIndexSafely = async (indexName, tableName, columns) => {
    try {
      await run(`CREATE INDEX ${indexName} ON ${tableName} (${columns})`);
    } catch (err) {
      // Ignore ER_DUP_KEYNAME (index already exists)
      if (!err.message.includes("Duplicate key name")) {
        console.warn(`Note on index ${indexName}:`, err.message);
      }
    }
  };

  // Ensure performance indexes exist
  await createIndexSafely("idx_office_ada_no", "office", "ada_no");
  await createIndexSafely("idx_ada_date_acct", "ada_list", "ada_date, account_no");
  await createIndexSafely("idx_ada_year_beg", "ada_list", "year_beg");
  await createIndexSafely("idx_radai_dates_acct", "radai_list", "one_date, two_date, account_no");
  await createIndexSafely("idx_radai_year_beg", "radai_list", "year_beg");

  // Seed default_value if empty
  const defaultRow = await get("SELECT * FROM default_value LIMIT 1");
  if (!defaultRow) {
    await run(
      `INSERT INTO default_value (default_id, addressee, bank, account_no, left_name, left_title, right_name, right_title, radai_name, radai_position, year_beg)
       VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "TARHATA S. BANDARA",
        "Land Bank of the Philippines",
        "2012-1001-78",
        "TEDDY U. INTA, MPA",
        "City Treasurer",
        "LYNLEY L. BABAYEN-ON",
        "Supervising Administrative Officer",
        "TEDDY U. INTA, MPA",
        "City Treasurer",
        currentYear
      ]
    );
  }

  // Seed users if empty
  const userCount = await get("SELECT COUNT(*) as cnt FROM users");
  if (userCount.cnt === 0) {
    const adminPass = bcrypt.hashSync("admin", 10);
    const encoderPass = bcrypt.hashSync("encoder", 10);
    const reviewerPass = bcrypt.hashSync("reviewer", 10);

    await run(
      `INSERT INTO users (employee, position, username, password, role) VALUES (?, ?, ?, ?, ?)`,
      ["Abu Jahhil L. Modiarat, CPA, MPA", "Chief, Fund Management Division", "admin", adminPass, "Admin"]
    );
    await run(
      `INSERT INTO users (employee, position, username, password, role) VALUES (?, ?, ?, ?, ?)`,
      ["Jeff", "Information Officer I", "encoder", encoderPass, "Encoder"]
    );
    await run(
      `INSERT INTO users (employee, position, username, password, role) VALUES (?, ?, ?, ?, ?)`,
      ["Jeff", "Clerk", "reviewer", reviewerPass, "Reviewer"]
    );
  }
};

export default { query, get, run, initDb };

