import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createSocketServer } from './sockets/index.js';

const app = createApp();
const server = http.createServer(app);
createSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`SoulSync API listening on ${env.PUBLIC_API_URL}`);
});
