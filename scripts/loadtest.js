import http from 'k6/http';
import { check, sleep } from 'k6';

// 配置选项
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 30秒内逐步增加至20个虚拟用户
    { duration: '1m', target: 20 },   // 维持20个用户1分钟
    { duration: '30s', target: 0 },   // 逐步停止
  ],
  thresholds: {
    http_req_failed: ['rate < 0.01'], // 失败率应低于1%
    http_req_duration: ['p(95) < 2000'], // 95%的请求应在2秒内完成
  },
};

// 初始化变量（使用你找到的合约地址）
const tokenAddress = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab'; // 你的Token合约地址
const rpcUrl = 'http://localhost:8545'; // Ganache默认RPC地址

// Ganache -d 参数提供的默认账户地址
const accounts = [
  '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
  '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
  '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
  '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d',
  '0xd03ea8624C8C5987235048901fB614fDcA89b117',
  '0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC',
  '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9',
  '0x28a8746e75304c0780E011BEd21C72cD78cd535E',
  '0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E',
  '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
];

// 自定义函数：构造JSON-RPC请求
function createTransferRequest(from, to, value) {
  return {
    method: 'POST',
    url: rpcUrl,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_sendTransaction',
      params: [{
        from: from,
        to: tokenAddress,
        gas: '0x7a120', // 500000 Gas
        data: `0xa9059cbb${to.slice(2).padStart(64, '0')}${value.toString(16).padStart(64, '0')}`, // transfer函数编码
      }],
      id: Math.floor(Math.random() * 1000), // 随机ID
    }),
  };
}

export default function () {
  // 随机选择发送者和接收者
  const fromIndex = __VU % accounts.length; // 虚拟用户ID取模
  const toIndex = (fromIndex + 1) % accounts.length;
  const value = 1; // 转账1个wei（最小单位）

  const request = createTransferRequest(
    accounts[fromIndex],
    accounts[toIndex],
    value
  );

  // 发送请求
  const res = http.post(rpcUrl, request.body, { headers: request.headers });

  // 检查结果
  check(res, {
    '交易成功': (r) => {
      const body = JSON.parse(r.body);
      return body.result !== null && body.result !== undefined;
    },
    '交易失败': (r) => {
      const body = JSON.parse(r.body);
      return body.error !== null && body.error !== undefined;
    },
  });

  sleep(1); // 每个用户执行完一次请求后暂停1秒
}