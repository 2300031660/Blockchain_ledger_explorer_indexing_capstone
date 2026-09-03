const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(
  "http://127.0.0.1:8545"
);

async function testBlockchainConnection() {
  try {
    const blockNumber =
      await provider.getBlockNumber();

    console.log(
      "Connected to Ganache successfully"
    );

    console.log(
      "Latest block number:",
      blockNumber
    );

    return true;
  } catch (error) {
    console.error(
      "Blockchain connection failed:",
      error.message
    );

    return false;
  }
}

module.exports = {
  provider,
  testBlockchainConnection,
};