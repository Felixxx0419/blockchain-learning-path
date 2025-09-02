// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DeFiLending is ReentrancyGuard, Ownable {
    IERC20 public token;
    
    struct UserInfo {
        uint256 deposited;
        uint256 borrowed;
        uint256 lastUpdated;
    }
    
    mapping(address => UserInfo) public users;
    uint256 public totalDeposits;
    uint256 public totalBorrows;
    uint256 public utilizationRate;
    uint256 public constant DEPOSIT_RATE = 3; // 3% APY
    uint256 public constant BORROW_RATE = 5; // 5% APY
    
    event Deposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 amount);
    event InterestCalculated(address indexed user, uint256 deposited, uint256 timePassed, uint256 interest);
    
    constructor(address _token) {
        token = IERC20(_token);
        _transferOwnership(msg.sender);
    }
    
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        _updateInterest(msg.sender);
        
        UserInfo storage user = users[msg.sender];
        user.deposited += amount;
        totalDeposits += amount;
        
        _updateUtilizationRate();
        
        emit Deposited(msg.sender, amount);
    }
    
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        _updateInterest(msg.sender);
        
        UserInfo storage user = users[msg.sender];
        // 使用更新后的存款余额计算借款限额
        uint256 maxBorrow = (user.deposited * 70) / 100;
        require(user.borrowed + amount <= maxBorrow, "Exceeds borrow limit");
        
        user.borrowed += amount;
        totalBorrows += amount;
        
        _updateUtilizationRate();
        require(token.transfer(msg.sender, amount), "Transfer failed");
        
        emit Borrowed(msg.sender, amount);
    }
    
    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        _updateInterest(msg.sender);
        
        UserInfo storage user = users[msg.sender];
        require(amount <= user.borrowed, "Repay amount exceeds debt");
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        user.borrowed -= amount;
        totalBorrows -= amount;
        
        _updateUtilizationRate();
        
        emit Repaid(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        _updateInterest(msg.sender);
        
        UserInfo storage user = users[msg.sender];
        uint256 available = user.deposited - user.borrowed;
        require(amount <= available, "Insufficient available balance");
        
        user.deposited -= amount;
        totalDeposits -= amount;
        
        _updateUtilizationRate();
        require(token.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    function liquidate(address userAddress) external nonReentrant {
        UserInfo storage user = users[userAddress];
        _updateInterest(userAddress);
        
        uint256 maxBorrow = (user.deposited * 70) / 100;
        require(user.borrowed > maxBorrow, "User is not undercollateralized");
        
        uint256 debt = user.borrowed;
        uint256 collateral = (debt * 110) / 100; // 110% of debt as collateral
        
        user.borrowed = 0;
        user.deposited -= collateral;
        totalBorrows -= debt;
        totalDeposits -= collateral;
        
        // Transfer collateral to liquidator
        require(token.transfer(msg.sender, collateral), "Liquidation transfer failed");
        
        emit Liquidated(userAddress, msg.sender, collateral);
    }
    
    function _updateInterest(address userAddress) internal {
        UserInfo storage user = users[userAddress];
        if (user.lastUpdated == 0) {
            user.lastUpdated = block.timestamp;
            return;
        }
        
        uint256 timePassed = block.timestamp - user.lastUpdated;
        if (timePassed > 0 && user.deposited > 0) {
            // 使用更高精度的计算方式
            uint256 annualInterest = (user.deposited * DEPOSIT_RATE) / 100;
            uint256 interest = (annualInterest * timePassed) / 365 days;
            
            user.deposited += interest;
            totalDeposits += interest;
            
            // 触发调试事件
            emit InterestCalculated(userAddress, user.deposited, timePassed, interest);
        }
        
        user.lastUpdated = block.timestamp;
    }
    
    function _updateUtilizationRate() internal {
        if (totalDeposits > 0) {
            utilizationRate = (totalBorrows * 100) / totalDeposits;
        } else {
            utilizationRate = 0;
        }
    }
    
    function getUserInfo(address userAddress) external view returns (uint256 deposited, uint256 borrowed, uint256 available) {
        UserInfo memory user = users[userAddress];
        deposited = user.deposited;
        borrowed = user.borrowed;
        available = deposited - borrowed;
    }
    
    // 仅管理员可调用：提取协议费用
    function withdrawProtocolFees(uint256 amount) external onlyOwner {
        uint256 protocolBalance = token.balanceOf(address(this)) - totalDeposits;
        require(amount <= protocolBalance, "Insufficient protocol fees");
        require(token.transfer(owner(), amount), "Transfer failed");
    }
}