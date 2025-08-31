// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureBank {
    mapping(address => uint) public balances;
    bool private locked;
    
    // 防重入锁修饰器
    modifier noReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // 修复后的取款函数 - 使用Checks-Effects-Interactions模式
    function withdraw() public noReentrant {
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        // 先更新状态再外部调用（CEI模式）
        balances[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}