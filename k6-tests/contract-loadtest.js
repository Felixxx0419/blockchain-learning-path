import { check, sleep } from 'k6';
import { ethers } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.esm.min.js';

// 配置测试选项
export const options = {
  stages: [
    { duration: '1m', target: 10 },    // 1分钟内逐步增加到10个虚拟用户
    { duration: '2m', target: 10 },    // 保持10个用户2分钟
    { duration: '30s', target: 0 },    // 30秒内逐步减少到0
  ],
  thresholds: {
    checks: ['rate>0.9'],  // 90%的检查应该通过
  },
};

// 模拟的用户行为：存款和查询余额
export default function () {
  // 注意：这是一个模拟测试，实际测试需要连接到运行的节点
  const randomAmount = Math.random() * 10;
  
  // 模拟操作延迟
  const depositLatency = Math.random() * 1000 + 200;
  const queryLatency = Math.random() * 500 + 100;
  
  // 模拟存款操作
  const depositSuccess = Math.random() > 0.1; // 90%成功率
  
  check(depositSuccess, {
    'deposit operation successful': (success) => success === true,
  });

  // 模拟查询操作
  sleep(depositLatency / 1000);
  
  const querySuccess = Math.random() > 0.05; // 95%成功率
  check(querySuccess, {
    'query operation successful': (success) => success === true,
  });

  sleep(queryLatency / 1000);
  
  console.log(`Virtual user completed operations with ${randomAmount.toFixed(2)} ETH`);
}