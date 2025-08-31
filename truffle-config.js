module.exports = {
  networks: {
    development: {
      host:"127.0.0.1",
      port:8545,
      network_id: "*" //匹配任何网络ID
    }
  },
  compilers: {
    solc: {
      version: "0.8.0", //根据你的solidity合约版本调整
    }
  }
};
