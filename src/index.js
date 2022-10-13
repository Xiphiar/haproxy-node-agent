// Include Nodejs' net module.
import Net from 'net';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import { checkNode, mainnetRegistry, testnetRegistry } from './utils.js';

const port = 4000;
const statusPort = process.env.STATUS_PORT || 5000;

// Use net.createServer() in your code. This is just for illustration purpose.
// Create a new TCP server.
const server = new Net.Server();

// The server listens to a socket for a client to make a connection request.
// Think of a socket as an end point.
server.listen(port, () => {
  console.log(`Agent listening for connection requests on socket localhost:${port}`);
});

// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', (socket) => {
  // The server can also receive data from the client by reading from its socket.
  socket.on('data', async (chunk) => {
    const ip = chunk.toString().replace('\n', '');
    const { height, behind } = await checkNode(ip);
    if (!height) return;

    if (behind > 15) {
      console.log(`${ip} is behind ${behind} blocks!`);
      socket.write('down\n');
    } else socket.write('up\n');
  });

  // Catch errors
  socket.on('error', (err) => {
    if (!err.toString().includes('ECONNRESET')) console.log(`Caught Error: ${err}`);
  });
});

const statusApp = express();
statusApp.use(helmet());

statusApp.get('/', (req, res) => {
  res.json({ available_routes: [{ '/status': ['/mainnet', '/testnet'] }] });
});

statusApp.get('/status', (req, res) => {
  res.json({ available_routes: ['/mainnet', '/testnet'] });
});

statusApp.get('/status/mainnet', (req, res) => {
  res.json({ mainnet_nodes: mainnetRegistry });
});

statusApp.get('/status/testnet', (req, res) => {
  res.json({ testnet_nodes: testnetRegistry });
});

statusApp.use((err, req, res, next) => {
  console.error('err handler', err);
  res.status(500).json({ message: err });
});

http.createServer(statusApp).listen(statusPort);
console.log(`Status app listening at http://localhost:${statusPort}`);
