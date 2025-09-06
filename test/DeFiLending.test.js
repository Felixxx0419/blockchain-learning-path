const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DeFiLending Protocol - 完整测试套件", function () {
  // 我们将使用 loadFixture 来复用部署环境，使测试更高效
  async function deployFixture() {
    const [owner, user1, user2, liquidator] = await ethers.getSigners();
    
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const token = await ERC20Mock.deploy("Test Token", "TEST", owner.address, ethers.utils.parseEther("1000000"));
    
    const DeFiLending = await ethers.getContractFactory("DeFiLending");
    const lending = await DeFiLending.deploy(token.address);
    
    // 给测试用户分配代币
    await token.transfer(user1.address, ethers.utils.parseEther("5000"));
    await token.transfer(user2.address, ethers.utils.parseEther("5000"));
    await token.transfer(liquidator.address, ethers.utils.parseEther("5000"));
    
    return { token, lending, owner, user1, user2, liquidator };
  }

  describe("1. 合约部署与初始化", function () {
    it("1.1 应正确设置代币地址和合约所有者", async function () {
      const { token, lending, owner } = await loadFixture(deployFixture);
      expect(await lending.token()).to.equal(token.address);
      expect(await lending.owner()).to.equal(owner.address);
    });

    it("1.2 初始状态应为零", async function () {
      const { lending } = await loadFixture(deployFixture);
      expect(await lending.totalDeposits()).to.equal(0);
      expect(await lending.totalBorrows()).to.equal(0);
      expect(await lending.utilizationRate()).to.equal(0);
    });
  });

  describe("2. 存款功能测试", function () {
    it("2.1 应允许用户存款并正确更新余额", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");

      await token.connect(user1).approve(lending.address, depositAmount);
      await expect(lending.connect(user1).deposit(depositAmount))
        .to.emit(lending, "Deposited")
        .withArgs(user1.address, depositAmount);

      const userInfo = await lending.users(user1.address);
      expect(userInfo.deposited).to.equal(depositAmount);
      expect(await lending.totalDeposits()).to.equal(depositAmount);
    });

    it("2.2 存款金额为0时应失败", async function () {
      const { lending, user1 } = await loadFixture(deployFixture);
      await expect(lending.connect(user1).deposit(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("2.3 应正确处理多次存款", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const amount1 = ethers.utils.parseEther("50");
      const amount2 = ethers.utils.parseEther("30");

      await token.connect(user1).approve(lending.address, amount1.add(amount2));
      await lending.connect(user1).deposit(amount1);
      await lending.connect(user1).deposit(amount2);

      const userInfo = await lending.users(user1.address);
      // 由于利息计算，允许微小误差
      expect(userInfo.deposited).to.be.closeTo(
        amount1.add(amount2), 
        ethers.utils.parseEther("0.001")
      );
    });
  });

  describe("3. 借款功能测试", function () {
    it("3.1 有足够抵押品时应成功借款", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");
      const borrowAmount = ethers.utils.parseEther("50"); // 50% LTV

      // 先存款
      await token.connect(user1).approve(lending.address, depositAmount);
      await lending.connect(user1).deposit(depositAmount);

      // 再借款
      await expect(lending.connect(user1).borrow(borrowAmount))
        .to.emit(lending, "Borrowed")
        .withArgs(user1.address, borrowAmount);

      const userInfo = await lending.users(user1.address);
      expect(userInfo.borrowed).to.equal(borrowAmount);
      expect(await lending.totalBorrows()).to.equal(borrowAmount);
    });

    it("3.2 抵押不足时应拒绝借款", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");
      const borrowAmount = ethers.utils.parseEther("80"); // 超过70% LTV

      await token.connect(user1).approve(lending.address, depositAmount);
      await lending.connect(user1).deposit(depositAmount);

      await expect(lending.connect(user1).borrow(borrowAmount))
        .to.be.revertedWith("Exceeds borrow limit");
    });

    it("3.3 借款金额为0时应失败", async function () {
      const { lending, user1 } = await loadFixture(deployFixture);
      await expect(lending.connect(user1).borrow(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("4. 还款与取款功能测试", function () {
    it("4.1 应允许用户还款", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");
      const borrowAmount = ethers.utils.parseEther("50");

      // 存款并借款
      await token.connect(user1).approve(lending.address, depositAmount.add(borrowAmount));
      await lending.connect(user1).deposit(depositAmount);
      await lending.connect(user1).borrow(borrowAmount);

      // 还款
      await token.connect(user1).approve(lending.address, borrowAmount);
      await expect(lending.connect(user1).repay(borrowAmount))
        .to.emit(lending, "Repaid")
        .withArgs(user1.address, borrowAmount);

      const userInfo = await lending.users(user1.address);
      expect(userInfo.borrowed).to.equal(0);
    });

    it("4.2 应允许用户取款", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");

      await token.connect(user1).approve(lending.address, depositAmount);
      await lending.connect(user1).deposit(depositAmount);

      const withdrawAmount = ethers.utils.parseEther("30");
      await expect(lending.connect(user1).withdraw(withdrawAmount))
        .to.emit(lending, "Withdrawn")
        .withArgs(user1.address, withdrawAmount);

      const userInfo = await lending.users(user1.address);
      // 由于利息计算，允许微小误差
      expect(userInfo.deposited).to.be.closeTo(
        depositAmount.sub(withdrawAmount),
        ethers.utils.parseEther("0.001")
      );
    });

    it("4.3 借款超过限额时应拒绝取款", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");
      const borrowAmount = ethers.utils.parseEther("50");

      await token.connect(user1).approve(lending.address, depositAmount.add(borrowAmount));
      await lending.connect(user1).deposit(depositAmount);
      await lending.connect(user1).borrow(borrowAmount);

      // 尝试取出超过可用余额的金额
      await expect(lending.connect(user1).withdraw(ethers.utils.parseEther("60")))
        .to.be.revertedWith("Insufficient available balance");
    });
  });

  describe("5. 利息计算测试", function () {
    it("5.1 应正确计算存款利息", async function () {
      this.timeout(10000); // 延长超时时间

      const { token, lending, user1 } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");

      // 1. 用户批准合约使用其代币
      await token.connect(user1).approve(lending.address, depositAmount);
      
      // 2. 用户存款
      await lending.connect(user1).deposit(depositAmount);

      // 3. 获取初始存款信息
      const initialUserInfo = await lending.users(user1.address);
      console.log("初始存款:", ethers.utils.formatEther(initialUserInfo.deposited), "ETH");

      // 4. 时间旅行 - 模拟一年后 (365天)
      const oneYearInSeconds = 365 * 24 * 60 * 60;
      await network.provider.send("evm_increaseTime", [oneYearInSeconds]);
      await network.provider.send("evm_mine"); // 必须挖一个新块来更新时间戳

      // 5. 关键步骤：执行一个会触发_updateInterest的合约操作
      // 提取1 wei来触发利息计算
      await lending.connect(user1).withdraw(1);

      // 6. 检查更新后的余额
      const userInfo = await lending.users(user1.address);
      console.log("最终存款:", ethers.utils.formatEther(userInfo.deposited), "ETH");
      
      // 7. 计算期望值：100 ETH * 3% * 1年 = 103 ETH
      const expectedInterest = depositAmount.mul(3).mul(oneYearInSeconds).div(365 * 24 * 60 * 60 * 100);
      const expectedAmount = depositAmount.add(expectedInterest);
      console.log("期望金额:", ethers.utils.formatEther(expectedAmount), "ETH");

      // 8. 由于Solidity整数除法的特性，可能会有微小的舍入误差
      // 我们允许1 wei的误差范围
      expect(userInfo.deposited).to.be.closeTo(
        expectedAmount, 
        ethers.utils.parseEther("0.000001") // 0.000001 ETH 的误差范围
      );
    });
  }); // 结束第5个测试套件

  describe("6. 清算功能测试", function () {
    it("6.1 应允许清算抵押不足的仓位", async function () {
      const { token, lending, user1, liquidator, owner } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");

      
      // 存款
      await token.connect(user1).approve(lending.address, depositAmount.mul(2));
      await lending.connect(user1).deposit(depositAmount);
      
      // 借款达到70% LTV限额（70个代币）
      const borrowAmount = ethers.utils.parseEther("70");
      await lending.connect(user1).borrow(borrowAmount);
    
      // 使用测试函数直接设置用户为抵押不足状态
      const undercollateralizedBorrow = depositAmount.mul(80).div(100);
      await lending.testSetUndercollateralized(user1.address, undercollateralizedBorrow);

      // 确保合约有足够的代币余额来执行清算
      // 计算需要的抵押品金额：债务的110%
      const collateral = undercollateralizedBorrow.mul(110).div(100);

      // 检查合约余额，如果不足则从所有者转账
      const contractBalance = await token.balanceOf(lending.address);
      if (contractBalance.lt(collateral)) {
        const needed = collateral.sub(contractBalance);
        await token.connect(owner).transfer(lending.address, needed);
      }
    
      // 验证用户现在抵押不足
      const userInfo = await lending.users(user1.address);
      const maxBorrow = userInfo.deposited.mul(70).div(100);
      expect(userInfo.borrowed.gt(maxBorrow)).to.be.true;

      // 清算者执行清算
      await expect(lending.connect(liquidator).liquidate(user1.address))
       .to.emit(lending, "Liquidated");
      const updatedUserInfo = await lending.users(user1.address);
      expect(updatedUserInfo.borrowed).to.equal(0);
      expect(updatedUserInfo.deposited).to.be.lt(depositAmount);
    });

    it("6.2 抵押充足的仓位不应被清算", async function () {
      const { token, lending, user1, liquidator } = await loadFixture(deployFixture);
      const depositAmount = ethers.utils.parseEther("100");
      const borrowAmount = ethers.utils.parseEther("50"); // 50% LTV，低于清算线

      await token.connect(user1).approve(lending.address, depositAmount.add(borrowAmount));
      await lending.connect(user1).deposit(depositAmount);
      await lending.connect(user1).borrow(borrowAmount);

      await expect(lending.connect(liquidator).liquidate(user1.address))
        .to.be.revertedWith("User is not undercollateralized");
    });
  });

  describe("7. 安全测试", function () {
    it("7.1 应防止重入攻击", async function () {
      // 部署一个恶意合约尝试重入攻击
      const MaliciousBorrower = await ethers.getContractFactory("MaliciousBorrower");
      const { token, lending, user1 } = await loadFixture(deployFixture);
      
      const malicious = await MaliciousBorrower.deploy(lending.address, token.address);
      
      // 给恶意合约转账
      await token.connect(user1).transfer(malicious.address, ethers.utils.parseEther("100"));
      
      // 尝试攻击应该失败
      await expect(malicious.attack(ethers.utils.parseEther("100")))
        .to.be.reverted;
    });

    it("7.2 非所有者不应提取协议费用", async function () {
      const { lending, user1 } = await loadFixture(deployFixture);
      await expect(lending.connect(user1).withdrawProtocolFees(ethers.utils.parseEther("1")))
        .to.be.reverted; // 应该因为onlyOwner修饰符而失败
    });
  });

  describe("8. 边界条件测试", function () {
    it("8.1 应处理最大值的存款和借款", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const maxUint = ethers.constants.MaxUint256;
      
      // 这应该失败，因为测试代币没有那么多供应量
      await token.connect(user1).approve(lending.address, maxUint);
      await expect(lending.connect(user1).deposit(maxUint))
        .to.be.reverted;
    });

    it("8.2 应正确处理小数金额", async function () {
      const { token, lending, user1 } = await loadFixture(deployFixture);
      const smallAmount = ethers.utils.parseUnits("0.0001", 18); // 0.0001 代币

      await token.connect(user1).approve(lending.address, smallAmount);
      await lending.connect(user1).deposit(smallAmount);

      const userInfo = await lending.users(user1.address);
      expect(userInfo.deposited).to.equal(smallAmount);
    });
  });
}); // 结束最外层的describe