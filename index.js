// Include Nodejs' net module.
const Net = require('net');
const { default: axios } = require('axios')
const port = 4000

const controlServer = 'https://rpc.roninventures.io:443'
const apiServer = 'https://secret-4.api.terivium.network:26657'

let latest = 0;

const checkNode = async(nodeIp) => {
    let nodeUrl = nodeIp;
try{
    
    if (!nodeIp.includes('http' || 'https')) nodeUrl = `http://${nodeIp}`
    //console.log(nodeUrl)
    const { data }  = await axios.get(`${nodeUrl}/status`, { timeout: 2000 });
    //console.log(data);
    const moniker = data.result.node_info.moniker
    const height = parseInt(data.result.sync_info.latest_block_height);
    let behind = 0;
    if (height > latest) latest=height
    else behind = latest-height


    console.log(`${nodeIp} - ${moniker}:\nHeight: ${height} - Latest: ${latest} - Behind: ${behind}\n`)

    return {
        height: height,
        behind: behind
    }
} catch (err) {
    console.log(nodeUrl, err)
    return {
        height: false,
        behind: 0
    }
}
}


// Use net.createServer() in your code. This is just for illustration purpose.
// Create a new TCP server.
const server = new Net.Server();
// The server listens to a socket for a client to make a connection request.
// Think of a socket as an end point.
server.listen(port, function() {
    console.log(`Server listening for connection requests on socket localhost:${port}`);
});

// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', function(socket) {
    //console.log('A new connection has been established.');
    //console.log('CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    //console.log(socket)


    // The server can also receive data from the client by reading from its socket.

    socket.on('data', async function(chunk) {
        let ip = chunk.toString().replace('\n','')
        console.log(`Data received from client: ${ip}`);
        const { height, behind }= await checkNode(ip);
        console.log("hghghgh", height, behind)
        if (!height) return;


        if (behind > 15) {
            console.log(`${ip} is behind ${behind} blocks!`)
            socket.write('down\n')
        }
        else socket.write('up\n')
        
        return;
    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on('end', function() {
        //console.log('Closing connection with the client');
    });

    // Don't forget to catch error, for your own sake.
    socket.on('error', function(err) {
        if (!err.toString().includes('ECONNRESET')) console.log(`Caught Error: ${err}`);
    });
});