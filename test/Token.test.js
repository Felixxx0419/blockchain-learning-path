// // Truffle 风格
// const Token = artifacts.require("Token");

// contract("Token", accounts => {
//   let token;
//   const [owner, addr1, addr2] = accounts;

//   beforeEach(async () => {
//     token = await Token.new("Test Token", "TEST", 18, web3.utils.toWei("1000", "ether"));
//   });

//   describe("部署", () => {
//     it("应该正确设置代币信息", async () => {
//       assert.equal(await token.name(), "Test Token");
//       assert.equal(await token.symbol(), "TEST");
//       assert.equal(await token.decimals(), 18);
//     });

//     it("应该将初始供应量分配给所有者", async () => {
//       const ownerBalance = await token.balanceOf(owner);
//       assert.equal(ownerBalance.toString(), web3.utils.toWei("1000", "ether"));
//     });
//   });

//   describe("交易", () => {
//     it("应该允许账户之间转账", async () => {
//       // 转账100个代币
//       await token.transfer(addr1, web3.utils.toWei("100", "ether"), { from: owner });
      
//       // 检查余额
//       const addr1Balance = await token.balanceOf(addr1);
//       assert.equal(addr1Balance.toString(), web3.utils.toWei("100", "ether"));
//     });

//     it("应该失败当发送者余额不足时", async () => {
//       try {
//         await token.transfer(owner, web3.utils.toWei("1", "ether"), { from: addr1 });
//         assert.fail("应该抛出错误");
//       } catch (error) {
//         assert(error.message.includes("Insufficient balance"), "应该返回余额不足错误");
//       }
//     });
//   });

//   describe("铸币", () => {
//     it("应该允许所有者铸造新代币", async () => {
//       const initialBalance = await token.balanceOf(owner);
//       await token.mint(owner, web3.utils.toWei("500", "ether"), { from: owner });
      
//       const newBalance = await token.balanceOf(owner);
//       const expectedBalance = web3.utils.toBN(initialBalance).add(web3.utils.toBN(web3.utils.toWei("500", "ether")));
//       assert.equal(newBalance.toString(), expectedBalance.toString());
//     });

//     it("应该禁止非所有者铸造代币", async () => {
//       try {
//         await token.mint(addr1, web3.utils.toWei("100", "ether"), { from: addr1 });
//         assert.fail("应该抛出错误");
//       } catch (error) {
//         assert(error.message.includes("Only owner can call this"), "应该返回权限错误");
//       }
//     });
//   });
// });
// 

//Hardhat 风格
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  let token;
  let owner, addr1, addr2;

  beforeEach(async function () {
    // 获取签名者账户
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // 部署合约
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Test Token", "TEST", 18, ethers.utils.parseEther("1000"));
    await token.deployed();
  });

  describe("部署", function () {
    it("应该正确设置代币信息", async function () {
      expect(await token.name()).to.equal("Test Token");
      expect(await token.symbol()).to.equal("TEST");
      expect(await token.decimals()).to.equal(18);
    });

    it("应该将初始供应量分配给所有者", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.utils.parseEther("1000"));
    });
  });

  describe("交易", function () {
    it("应该允许账户之间转账", async function () {
      // 转账100个代币
      await token.transfer(addr1.address, ethers.utils.parseEther("100"));
      
      // 检查余额
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther("100"));
    });

    it("应该失败当发送者余额不足时", async function () {
      // 使用 Hardhat 的异常断言
      await expect(
        token.connect(addr1).transfer(owner.address, ethers.utils.parseEther("1"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("铸币", function () {
    it("应该允许所有者铸造新代币", async function () {
      const initialBalance = await token.balanceOf(owner.address);
      await token.mint(owner.address, ethers.utils.parseEther("500"));
      
      const newBalance = await token.balanceOf(owner.address);
      const expectedBalance = initialBalance.add(ethers.utils.parseEther("500"));
      expect(newBalance).to.equal(expectedBalance);
    });

    it("应该禁止非所有者铸造代币", async function () {
      // 使用 Hardhat 的异常断言
      await expect(
        token.connect(addr1).mint(addr1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Only owner can call this");
    });
  });
});