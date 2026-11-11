const { getOrStartPostgres, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } = require('./db-manager');

async function main() {
  const instance = await getOrStartPostgres();
  console.log('----------------------------------------------------');
  console.log(` PostgreSQL Server Running`);
  console.log(` URL: postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}`);
  console.log('----------------------------------------------------');

  if (instance) {
    const shutdown = async () => {
      console.log('\n[DB] Stopping PostgreSQL gracefully...');
      try {
        await instance.stop();
        console.log('[DB] PostgreSQL stopped cleanly.');
      } catch (err) {
        console.error('[DB] Error during stop:', err);
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep process alive
    setInterval(() => {}, 10000);
  }
}

main().catch(console.error);

