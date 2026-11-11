const path = require('path');
const fs = require('fs');
const net = require('net');
const EmbeddedPostgres = require('embedded-postgres').default;

const DB_PORT = parseInt(process.env.PG_PORT || '5433', 10);
const DB_USER = process.env.PG_USER || 'clinic_admin';
const DB_PASSWORD = process.env.PG_PASSWORD || 'clinic_secure_pwd_2026';
const DB_NAME = process.env.PG_DB_NAME || 'clinic_db';
const DB_DIR = path.resolve(__dirname, '../data/postgres');

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

let instance = null;

async function getOrStartPostgres() {
  const isOpen = await isPortOpen(DB_PORT);
  if (isOpen) {
    console.log(`[DB Manager] PostgreSQL is already running and listening on port ${DB_PORT}.`);
    return null;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  console.log(`[DB Manager] Initializing Embedded PostgreSQL in ${DB_DIR} on port ${DB_PORT}...`);
  instance = new EmbeddedPostgres({
    databaseDir: DB_DIR,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    persistent: true,
    autoRehydrateSymlinks: true,
  });

  const isClusterInit = fs.existsSync(path.join(DB_DIR, 'PG_VERSION'));
  if (!isClusterInit) {
    console.log('[DB Manager] Creating new cluster config...');
    await instance.initialise();
  }

  console.log('[DB Manager] Starting PostgreSQL server...');
  await instance.start();
  console.log(`[DB Manager] PostgreSQL started successfully on port ${DB_PORT}!`);

  try {
    await instance.createDatabase(DB_NAME);
    console.log(`[DB Manager] Database "${DB_NAME}" created or already verified.`);
  } catch (err) {
    // Database might already exist
    console.log(`[DB Manager] Database "${DB_NAME}" ready.`);
  }

  return instance;
}

if (require.main === module) {
  (async () => {
    try {
      await getOrStartPostgres();
      console.log(`DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}?schema=public"`);
    } catch (e) {
      console.error('[DB Manager] Error:', e);
      process.exit(1);
    }
  })();
}

module.exports = { getOrStartPostgres, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME };

