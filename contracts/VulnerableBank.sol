// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // 有重入漏洞的取款函数 - 先转账后更新余额
    function withdraw() public {
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        // 漏洞点：先外部调用再更新状态
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0;
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}