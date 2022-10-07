// Include Nodejs' net module.
const Net = require('net');
const { default: axios } = require('axios')
const port = 4000

let mainnetLatest = 0;
let testnetLatest = 0;

const checkNode = async(nodeIp) => {
    let nodeUrl = nodeIp;
try{
    
    if (!nodeIp.includes('http' || 'https')) nodeUrl = `http://${nodeIp}`
    //console.log(nodeUrl)
    const { data }  = await axios.get(`${nodeUrl}/status`, { timeout: 2000 });
    //console.log(data);
    const moniker = data.result.node_info.moniker;
    const chainId = data.result.node_info.network;
    const height = parseInt(data.result.sync_info.latest_block_height);
    let behind = 0;
    let latest = 0
    switch (chainId) {
        case "secret-4":
            if (height > mainnetLatest) {
                mainnetLatest = height;
                latest = height;
            } else {
                behind = mainnetLatest - height;
                latest = mainnetLatest;
            }
            break;
        case "pulsar-2":
            if (height > testnetLatest) {
                testnetLatest = height;
                latest = height;
            } else {
                behind = testnetLatest - height;
                latest = testnetLatest;
            }
            break;
        default:
            break;
    }

    console.log(`${nodeIp} - ${moniker} on ${chainId}:\nHeight: ${height} - Latest: ${latest} - Behind: ${behind}\n`)

    return {
        height: height,
        behind: behind
    }
} catch (err) {
    console.log(nodeUrl, err.toString())
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

    // The server can also receive data from the client by reading from its socket.
    socket.on('data', async function(chunk) {
        let ip = chunk.toString().replace('\n','')
        console.log(`Data received from client: ${ip}`);
        const { height, behind }= await checkNode(ip);
        if (!height) return;

        if (behind > 15) {
            console.log(`${ip} is behind ${behind} blocks!`)
            socket.write('down\n')
        }
        else socket.write('up\n')
        
        return;
    });

    // Catch errors
    socket.on('error', function(err) {
        if (!err.toString().includes('ECONNRESET')) console.log(`Caught Error: ${err}`);
    });
});