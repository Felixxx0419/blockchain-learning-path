const Token = artifacts.require("Token"); //这行代码从合约文件中获取合约抽象

module.exports = function (deployer) {
    //这行代码是真正复杂将合约部署到区块链的命令
    deployer.deploy(
        Token,
        "MyToken", // _name (string): 代币名称
        "MTK",   // _symbol (string): 代币符号
        18,  // _decimals (uint8): 代币精度，例如 18 (像ETH一样，1个代币 = 10^18 个最小单位)
        "1000000"  // _initialSupply (uint256): 初始发行量，例如 1000000 (个代币)。注意：这里用字符串表示大数，避免JS精度问题。
    );
};
