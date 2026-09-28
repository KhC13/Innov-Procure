import 'dotenv/config';
import net from 'net';
import { createApp } from './app.js';

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, HOST);
  });
}

async function getAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 25; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  return startPort;
}

async function startServer() {
  const app = await createApp();
  const port = await getAvailablePort(DEFAULT_PORT);
  if (port !== DEFAULT_PORT) {
    console.warn(`Port ${DEFAULT_PORT} is busy; using fallback port ${port} instead.`);
  }

  app.listen(port, HOST, () => {
    console.log(`InnovProcure Server running on http://${HOST}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting InnovProcure server:', err);
  process.exit(1);
});