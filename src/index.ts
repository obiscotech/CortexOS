import dotenv from 'dotenv';
import { buildServer } from './api/server';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000');

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`CortexOS running on port ${PORT}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
