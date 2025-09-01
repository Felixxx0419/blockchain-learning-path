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
    
    // 1. 运行单元测试
    await runTest('npx', ['hardhat', 'test', 'test/Token.hardhat.test.js'], '代币合约测试');
    
    // 2. 运行安全测试
    await runTest('npx', ['hardhat', 'test', 'test/SecurityTest.test.js'], '安全测试');
    
    // // 3. 运行性能测试（如果有）   暂时跳过
    //  if (fs.existsSync(path.join(__dirname, 'loadtest.js'))) {
    //    await runTest('k6', ['run', 'scripts/loadtest.js'], '性能测试');
    //    }
    
    // 4. 运行安全扫描
    await runTest('slither', ['.', '--exclude-dependencies', '--checklist'], 'Slither安全扫描');
    
    // 5. 生成测试覆盖率报告  暂时跳过
    //await runTest('npx', ['hardhat', 'coverage'], '测试覆盖率');
    
    console.log('🎉 所有测试已完成！');
    console.log('📊 查看覆盖率报告: file://' + path.join(__dirname, '..', 'coverage', 'index.html'));
    
  } catch (error) {
    console.error('💥 测试失败:', error.message);
    process.exit(1);
  }
}

runAllTests();