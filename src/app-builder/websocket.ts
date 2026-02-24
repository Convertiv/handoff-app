import { WebSocket } from 'ws';
import { Logger } from '../utils/logger';

export interface HandoffWebSocket extends WebSocket {
  isAlive: boolean;
}

/**
 * Creates a WebSocket server that broadcasts messages to connected clients.
 * Designed for development mode to help with hot-reloading.
 *
 * @param port - Optional port number for the WebSocket server; defaults to 3001.
 * @returns A function that accepts a message string and broadcasts it to all connected clients.
 */
export const createWebSocketServer = async (port: number = 3001) => {
  const wss = new WebSocket.Server({ port });

  // Heartbeat function to mark a connection as alive.
  const heartbeat = function (this: HandoffWebSocket) {
    this.isAlive = true;
  };

  // Setup a new connection
  wss.on('connection', (ws) => {
    const extWs = ws as HandoffWebSocket;
    extWs.isAlive = true;
    extWs.send(JSON.stringify({ type: 'WELCOME' }));
    extWs.on('error', (error) => Logger.error('WebSocket error:', error));
    extWs.on('pong', heartbeat);
  });

  // Periodically ping clients to ensure they are still connected
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as HandoffWebSocket;
      if (!extWs.isAlive) {
        Logger.warn('Terminating inactive client');
        return client.terminate();
      }
      extWs.isAlive = false;
      client.ping();
    });
  }, 30000);

  // Clean up the interval when the server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  Logger.success(`WebSocket server listening on ws://localhost:${port}`);

  // Return a function to broadcast a message to all connected clients
  return (message: string) => {
    Logger.success(`Broadcasting message to ${wss.clients.size} client(s)`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
};
