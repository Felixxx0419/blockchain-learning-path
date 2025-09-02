// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MaliciousBorrower {
    address public lendingPool;
    IERC20 public token;
    
    constructor(address _lendingPool, address _token) {
        lendingPool = _lendingPool;
        token = IERC20(_token);
    }
    
    // 恶意函数，尝试进行重入攻击
    function attack(uint256 amount) external {
        // 先存款
        token.approve(lendingPool, amount);
        (bool success, ) = lendingPool.call(
            abi.encodeWithSignature("deposit(uint256)", amount)
        );
        require(success, "Deposit failed");
        
        // 然后尝试借款并进行重入攻击
        (success, ) = lendingPool.call(
            abi.encodeWithSignature("borrow(uint256)", amount)
        );
        require(success, "Borrow failed");
    }
    
    // 添加一个 receive 函数来处理纯 ETH 转账
    receive() external payable {
        // 这个合约本不预期接收ETH，所以我们可以选择什么都不做，
        // 或者为了“恶意”，在这里也尝试重入
        // 但为了测试清晰，我们留空或revert
        // 留空意味着合约可以接受ETH（虽然在这个测试场景里用不到）
    }
    
    // 回退函数 - 尝试在借款过程中进行重入
    fallback() external payable {
        // 这里可以尝试进行重入攻击，但应该被ReentrancyGuard阻止
        (bool success, ) = lendingPool.call(
            abi.encodeWithSignature("borrow(uint256)", 1 ether)
        );
        if (success) {
            // 如果重入成功，继续尝试更多操作
        }
    }
}