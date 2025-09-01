// Truffle 框架
// const VulnerableBank = artifacts.require("VulnerableBank");
// const ReentrancyAttack = artifacts.require("ReentrancyAttack");

// contract("SecurityTest", (accounts) => {
//     let bank;
//     const [owner, attacker] = accounts;
    
//     beforeEach(async () => {
//         bank = await VulnerableBank.new();
//     });
    
//     it("CVE-2023-001: 重入漏洞攻击演示", async () => {
//         console.log("=== 开始重入攻击测试 ===");
        
//         // 部署攻击合约
//         const attackContract = await ReentrancyAttack.new(bank.address, {from: attacker});
        
//         // 初始存款 - 银行有5ETH
//         await bank.deposit({from: owner, value: web3.utils.toWei("5", "ether")});
        
//         const initialBankBalance = await web3.eth.getBalance(bank.address);
//         console.log("初始银行余额:", web3.utils.fromWei(initialBankBalance, "ether"), "ETH");
        
//         // 执行攻击 - 攻击者只存入1ETH
//         console.log("开始攻击...");
//         await attackContract.attack({
//             from: attacker,
//             value: web3.utils.toWei("1", "ether")
//         });
        
//         // 攻击者窃取资金
//         await attackContract.stealFunds({from: attacker});
        
//         const finalBankBalance = await web3.eth.getBalance(bank.address);
//         console.log("攻击后银行余额:", web3.utils.fromWei(finalBankBalance, "ether"), "ETH");
        
//         // 验证攻击成功（银行余额远少于预期）
//         assert.isBelow(
//             Number(web3.utils.fromWei(finalBankBalance, "ether")), 
//             4, 
//             "银行余额应被大量盗取，证明重入漏洞存在"
//         );
        
//         console.log("✅ 重入攻击演示成功！");
//     });
// });

//hardhat 框架
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("SecurityTest", function () {
    let bank;
    let attackContract;
    let owner, attacker;

    beforeEach(async function () {
        // 获取测试账户
        [owner, attacker] = await ethers.getSigners();
        
        // 部署漏洞银行合约
        const VulnerableBank = await ethers.getContractFactory("VulnerableBank");
        bank = await VulnerableBank.deploy();
        await bank.deployed();
    });
    
    it("CVE-2023-001: 重入漏洞攻击演示", async function () {
        console.log("=== 开始重入攻击测试 ===");
        
        // 部署攻击合约
        const ReentrancyAttack = await ethers.getContractFactory("ReentrancyAttack");
        attackContract = await ReentrancyAttack.connect(attacker).deploy(bank.address);
        await attackContract.deployed();
        
        // 初始存款 - 银行有5ETH
        await bank.connect(owner).deposit({ value: ethers.utils.parseEther("5") });
        
        const initialBankBalance = await ethers.provider.getBalance(bank.address);
        console.log("初始银行余额:", ethers.utils.formatEther(initialBankBalance), "ETH");
        
        // 执行攻击 - 攻击者只存入1ETH
        console.log("开始攻击...");
        await attackContract.connect(attacker).attack({
            value: ethers.utils.parseEther("1")
        });
        
        // 攻击者窃取资金
        await attackContract.connect(attacker).stealFunds();
        
        const finalBankBalance = await ethers.provider.getBalance(bank.address);
        console.log("攻击后银行余额:", ethers.utils.formatEther(finalBankBalance), "ETH");
        
        // 验证攻击成功（银行余额远少于预期）
        expect(Number(ethers.utils.formatEther(finalBankBalance))).to.be.below(
            4, 
            "银行余额应被大量盗取，证明重入漏洞存在"
        );
        
        console.log("✅ 重入攻击演示成功！");
    });
});