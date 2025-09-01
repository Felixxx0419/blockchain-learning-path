const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contract (Hardhat + Waffle)", function () {
  let Token;
  let hardhatToken;
  let owner;
  let addr1;
  let addr2;

  // 在每个测试用例之前运行
  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // 部署合约 - 现在提供全部4个参数
    Token = await ethers.getContractFactory("Token");
    hardhatToken = await Token.deploy(
      "Test Token",  // _name
      "TST",         // _symbol
      18,            // _decimals (通常ERC20代币使用18位小数)
      1000000        // _initialSupply
    );
    await hardhatToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
    
    it("Should have the correct decimals", async function () {
      expect(await hardhatToken.decimals()).to.equal(18);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // 转账 50 tokens from owner to addr1
      await hardhatToken.transfer(addr1.address, 50);
      const addr1Balance = await hardhatToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // 转账 50 tokens from addr1 to addr2
      await hardhatToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await hardhatToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);
      
      // 尝试从没有余额的地址转账
      await expect(
        hardhatToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Insufficient balance");

      // 确认owner余额没有变化
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);
      
      // 转账 100 tokens to addr1
      await hardhatToken.transfer(addr1.address, 100);
      
      // 再转账 50 tokens to addr2
      await hardhatToken.transfer(addr2.address, 50);

      // 检查最终余额
      const finalOwnerBalance = await hardhatToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);

      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(100);
      expect(await hardhatToken.balanceOf(addr2.address)).to.equal(50);
    });
  });
});