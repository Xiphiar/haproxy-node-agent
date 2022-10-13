import axios from 'axios';

let mainnetLatest = 0;
let testnetLatest = 0;

export const mainnetRegistry = [];
export const testnetRegistry = [];

const findIndex = (registry, id) => {
  const index = registry.findIndex((e) => e.id === id);
  return index;
};

const updateNode = (registry, status, behind) => {
  const { moniker, id } = status.result.node_info;
  const height = parseInt(status.result.sync_info.latest_block_height, 10);

  const index = findIndex(registry, id);
  if (index > -1) {
    registry.splice(index, 1);
  }
  registry.push({
    id,
    moniker,
    height,
    behind,
    last_updated: new Date().toISOString(),
  });
};

export const checkNode = async (nodeIp) => {
  let nodeUrl = nodeIp;
  try {
    if (!nodeIp.includes('http' || 'https')) nodeUrl = `http://${nodeIp}`;
    const { data } = await axios.get(`${nodeUrl}/status`, { timeout: 2000 });
    const { moniker, network: chainId } = data.result.node_info;
    const height = parseInt(data.result.sync_info.latest_block_height, 10);
    let behind = 0;
    let latest = 0;
    switch (chainId) {
      case 'secret-4':
        if (height > mainnetLatest) {
          mainnetLatest = height;
          latest = height;
        } else {
          behind = mainnetLatest - height;
          latest = mainnetLatest;
        }
        updateNode(mainnetRegistry, data, behind);
        break;
      case 'pulsar-2':
        if (height > testnetLatest) {
          testnetLatest = height;
          latest = height;
        } else {
          behind = testnetLatest - height;
          latest = testnetLatest;
        }
        updateNode(testnetRegistry, data, behind);
        break;
      default:
        break;
    }

    console.log(`${nodeIp} - ${moniker} on ${chainId}:\nHeight: ${height} - Latest: ${latest} - Behind: ${behind}\n`);

    return {
      height,
      behind,
    };
  } catch (err) {
    if (!err.toString().includes('ECONNREFUSED')) { console.log(nodeUrl, err.toString()); }

    return {
      height: false,
      behind: 0,
    };
  }
};
