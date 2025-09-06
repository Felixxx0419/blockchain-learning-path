//require("@nomicfoundation/hardhat-toolbox"); // 替换原来的 require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("solidity-coverage");
require("hardhat-gas-reporter"); // 1. 引入 gas-reporter

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    }
  },
  gasReporter: {
    enabled: true, // 2. 设置为 true 来启用它
    currency: 'USD', // 显示为USD成本（可选）
    gasPrice: 21, // 假设的 gas price（单位是 gwei），用于计算USD成本
    // outputFile: 'gas-report.txt', // 可选：将报告输出到文件
    // noColors: true, // 可选：如果你输出到文件，最好关闭颜色
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};
