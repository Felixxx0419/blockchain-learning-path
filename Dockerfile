# 使用标准版的Node镜像
FROM node:18

# 安装Python和pip（Slither需要）
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# 设置工作目录
WORKDIR /app

# 复制package文件（利用Docker缓存层）
COPY package*.json ./

# 安装全局工具
RUN npm install -g truffle ganache

# 安装项目依赖（使用经过验证的稳定版本）
 RUN npm install --save-dev \
     hardhat@2.19.0 \
     ethers@5.8.0 \
     @nomiclabs/hardhat-waffle@2.0.6 \
     @nomiclabs/hardhat-ethers@2.2.3 \
     ethereum-waffle@3.4.4 \
     chai@4.3.10

# 先用这个试试，上面的先注释
#COPY package*.json ./
#RUN npm install

# 安装gas reporter
RUN npm install --save-dev hardhat-gas-reporter

# 安装OpenZeppelin合约（关键修复）  npm忽略peer dependencies的冲突，继续安装
RUN npm install @openzeppelin/contracts --legacy-peer-deps


# 创建Python虚拟环境并安装Slither
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install slither-analyzer

# 复制所有项目文件
COPY . .

# 暴露Ganache端口
EXPOSE 8545

# 设置默认启动命令为bash shell
CMD ["/bin/bash"]