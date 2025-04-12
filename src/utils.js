import axios from 'axios';

// Key = chain ID. Value = latest block height
const Heights = new Map();

// A registry of all tested nodes. TODO this might be better as a Map
export const NodeRegistry = [];

const findIndex = (id) => {
  const index = NodeRegistry.findIndex((e) => e.id === id);
  return index;
};

const updateNode = (status, behind) => {
  const { moniker, id } = status.result.node_info;
  const height = parseInt(status.result.sync_info.latest_block_height, 10);

  const index = findIndex(id);
  if (index > -1) {
    NodeRegistry.splice(index, 1);
  }
  NodeRegistry.push({
    id,
    moniker,
    height,
    behind,
    last_updated: new Date().toString(),
  });
};

export const checkNode = async (nodeIp) => {
  let nodeUrl = nodeIp;
  try {
    if (!nodeIp.includes('http' || 'https')) nodeUrl = `http://${nodeIp}`;
    const { data } = await axios.get(`${nodeUrl}/status`, { timeout: 2000 });
    const { moniker, network: chainId } = data.result.node_info;
    const height = parseInt(data.result.sync_info.latest_block_height, 10);

    // Get the highest seen height for this chain ID
    let latest = Heights.get(chainId) || 0;
    let behind = 0;

    if (height > latest) {
      Heights.set(chainId, height);
      latest = height;
    } else {
      behind = latest - height;
    }
    updateNode(data, behind);
    console.log(`${nodeIp} - ${moniker} on ${chainId}:\nHeight: ${height} - Latest: ${latest} - Behind: ${behind}\n`);

    return {
      height,
      behind,
    };
  } catch (err) {
    // Connection errors are handled by the LB, so no need to mark the node as down
    if (!err.toString().includes('ECONNREFUSED')) { console.log(nodeUrl, err.toString()); }

    return {
      height: false,
      behind: 0,
    };
  }
};
