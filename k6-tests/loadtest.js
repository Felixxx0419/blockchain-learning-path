import http from 'k6/http';
import { check, sleep } from 'k6';

// 配置测试选项
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // 30秒内逐步增加到50个虚拟用户
    { duration: '1m', target: 50 },    // 保持50个用户1分钟
    { duration: '30s', target: 100 },  // 30秒内增加到100个用户
    { duration: '1m', target: 100 },   // 保持100个用户1分钟
    { duration: '30s', target: 0 },    // 30秒内逐步减少到0
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // 请求失败率低于1%
    http_req_duration: ['p(95)<500'],  // 95%的请求响应时间低于500ms
  },
};

// 主测试函数
export default function () {
  // 这里模拟API调用，如果是测试本地节点可以这样：
  const url = 'http://localhost:8545';
  const payload = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_blockNumber",
    params: [],
    id: 1
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  
  // 检查响应是否成功
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has result': (r) => JSON.parse(r.body).result !== undefined,
  });

  sleep(1); // 每个请求间隔1秒
}