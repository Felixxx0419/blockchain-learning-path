# 使用更轻量的Node.js Alpine版本
FROM node:18-alpine

# 安装必要的系统库（修复µWS兼容性问题）
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 复制package文件（利用Docker缓存层）
COPY package*.json ./

# 安装全局工具 - 使用ganache（新）而不是ganache-cli（旧）
RUN npm install -g truffle ganache

# 安装项目依赖
RUN npm install

# 复制所有项目文件
COPY . .

# 暴露Ganache端口
EXPOSE 8545

# 启动命令：启动Ganache并运行测试
CMD ["sh", "-c", "echo '启动Ganache测试网络' && ganache --deterministic --host 0.0.0.0 & sleep 3 && echo '运行Truffle测试..' && truffle test "]
