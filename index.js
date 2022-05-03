const { default: axios } = require('axios')
const express = require('express')
const app = express()
const port = 4000

const controlServer = 'https://rpc.roninventures.io:443'
const apiServer = 'https://secret-4.api.terivium.network:26657'

const checkNode = async(nodeIp) => {
try{
    let nodeUrl = nodeIp;
    if (!nodeIp.includes('http' || 'https')) nodeUrl = `http://${nodeIp}`
    console.log(nodeUrl)
    const { data }  = await axios.get(`${nodeUrl}/status`);
    console.log(data);
} catch (err) {
    null;
}
}

app.get('/', (req, res) => {
  res.send('Hello World!\n')
})

app.post('/', (req, res) => {
    console.log(req.body)
    res.send('Hello World!\n')
  })

app.get('/node/:ip', async function(req, res, next) {
    try {
        console.log(req.params.ip);

        //check servers with promise.all
        const resolves = Promise.all([
            checkNode(controlServer),
            checkNode(apiServer),
            checkNode(req.params.ip)
        ])
        //console.log(resolves)

        // process and remove control node response
        if (resolves[0].data){
            try{
                const {data: { result: {node_info: {moniker}, sync_info: {latest_block_height}}}} = resolves[0];
                if (parseInt(latest_block_height) > highest) highest = parseInt(latest_block_height);
                console.log("Control: ", moniker, parseInt(latest_block_height));
            } catch(error){
                console.log(`Error processing control result`, error)
            }
        }
        resolves.shift();

        res.send('up\n');
    } catch (err) {
      console.error(`Error while getting contract `, err.message);
      //do something
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
