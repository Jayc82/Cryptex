import { Server as HTTPServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketClient extends WebSocket {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

let wss: WebSocketServer;
const clients = new Map<string, WebSocketClient>();

export function initializeWebSocket(server: HTTPServer) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', handleConnection);

  // Heartbeat mechanism
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as WebSocketClient;
      if (!client.isAlive) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'));

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('WebSocket server initialized');
}

function handleConnection(ws: WebSocket) {
  const client = ws as WebSocketClient;
  client.id = uuidv4();
  client.subscriptions = new Set();
  client.isAlive = true;

  clients.set(client.id, client);

  client.on('pong', () => {
    client.isAlive = true;
  });

  client.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(client, message);
    } catch (error) {
      client.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  client.on('close', () => {
    clients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  });

  client.send(JSON.stringify({ 
    type: 'connected', 
    clientId: client.id 
  }));
}

function handleMessage(client: WebSocketClient, message: any) {
  switch (message.type) {
    case 'authenticate':
      handleAuthentication(client, message.token);
      break;
    case 'subscribe':
      handleSubscribe(client, message.channels);
      break;
    case 'unsubscribe':
      handleUnsubscribe(client, message.channels);
      break;
    case 'ping':
      client.send(JSON.stringify({ type: 'pong' }));
      break;
    default:
      client.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

function handleAuthentication(client: WebSocketClient, token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, secret) as { userId: string };
    client.userId = decoded.userId;
    
    client.send(JSON.stringify({ 
      type: 'authenticated', 
      userId: client.userId 
    }));
  } catch (error) {
    client.send(JSON.stringify({ 
      type: 'error', 
      error: 'Authentication failed' 
    }));
  }
}

function handleSubscribe(client: WebSocketClient, channels: string[]) {
  channels.forEach(channel => {
    client.subscriptions.add(channel);
  });
  
  client.send(JSON.stringify({ 
    type: 'subscribed', 
    channels 
  }));
}

function handleUnsubscribe(client: WebSocketClient, channels: string[]) {
  channels.forEach(channel => {
    client.subscriptions.delete(channel);
  });
  
  client.send(JSON.stringify({ 
    type: 'unsubscribed', 
    channels 
  }));
}

// Broadcast to all clients subscribed to a channel
export function broadcast(channel: string, data: any) {
  const message = JSON.stringify({
    type: 'update',
    channel,
    data
  });

  clients.forEach(client => {
    if (client.subscriptions.has(channel) && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Send to specific user
export function sendToUser(userId: string, data: any) {
  const message = JSON.stringify(data);
  
  clients.forEach(client => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
