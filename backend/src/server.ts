import { createApp } from './app.js';
import { env } from './config/env.js';
import { initializeDatabase } from './db/init.js';

const bootstrap = async (): Promise<void> => {
  await initializeDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

