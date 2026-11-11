const { getOrStartPostgres } = require('./db-manager');
const { execSync } = require('child_process');

async function init() {
  console.log('[Init] Ensuring PostgreSQL is running...');
  await getOrStartPostgres();
  console.log('[Init] Pushing Prisma Schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('[Init] Database ready!');
}

init().catch((err) => {
  console.error('[Init] Failed:', err);
  process.exit(1);
});

