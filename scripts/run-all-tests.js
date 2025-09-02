const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 创建测试报告目录
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 运行测试的函数
function runTest(command, args, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== 开始运行 ${name} ===\n`);
    
    const testProcess = spawn(command, args, { stdio: 'inherit' });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${name} 完成\n`);
        resolve();
      } else {
        console.log(`\n❌ ${name} 失败，退出码: ${code}\n`);
        reject(new Error(`${name} 失败，退出码: ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// 主函数
async function runAllTests() {
  try {
    console.log('🚀 开始运行完整测试套件...\n');
    
    // 1. 编译合约
    console.log('📦 编译智能合约...');
    await runTest('npx', ['hardhat', 'compile'], '合约编译');
    
    // 2. 运行DeFi协议主要测试
    await runTest('npx', ['hardhat', 'test', 'test/DeFiLending.test.js'], 'DeFi协议主要测试');
    
    // 3. 运行安全测试（如果存在）
    const securityTestPath = path.join(__dirname, '..', 'test', 'SecurityTest.test.js');
    if (fs.existsSync(securityTestPath)) {
      await runTest('npx', ['hardhat', 'test', 'test/SecurityTest.test.js'], '安全测试');
    }
    
    // 4. 运行其他测试（如果存在）
    const tokenTestPath = path.join(__dirname, '..', 'test', 'Token.hardhat.test.js');
    if (fs.existsSync(tokenTestPath)) {
      await runTest('npx', ['hardhat', 'test', 'test/Token.hardhat.test.js'], '代币合约测试');
    }
    
    // 5. 运行安全扫描（Slither）
    console.log('🛡️  运行安全扫描（Slither）...');
    try {
      await runTest('slither', ['.', '--exclude-dependencies', '--checklist', '--json', 'reports/slither-report.json'], 'Slither安全扫描');
    } catch (error) {
      console.log('⚠️  安全扫描发现漏洞（继续执行）...');
    }
    
    // 6. 性能测试提示
    console.log('\n⚡ 性能测试提示：');
    console.log('   请先在一个终端运行: npm run node');
    console.log('   然后在另一个终端运行: k6 run k6-tests/loadtest.js');
    
    console.log('\n🎉 所有核心测试已完成！');
    console.log('📊 查看测试报告: file://' + path.join(__dirname, '..', 'reports'));
    
  } catch (error) {
    console.error('💥 测试失败:', error.message);
    process.exit(1);
  }
}

// 只在直接运行时执行
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };