# 使用标准版的Node镜像
FROM node:18

# 安装Python和pip（Slither需要）
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# 设置工作目录
WORKDIR /app

# 复制package文件（利用Docker缓存层）
COPY package*.json ./

# 安装全局工具 - 使用ganache（新）而不是ganache-cli（旧）
RUN npm install -g truffle ganache

# 安装项目依赖
RUN npm install

# 创建Python虚拟环境并安装Slither
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install slither-analyzer

# 复制所有项目文件
COPY . .

# 暴露Ganache端口
EXPOSE 8545

# 启动命令：启动Ganache并运行测试
# CMD ["sh", "-c", "echo '启动Ganache测试网络' && ganache --deterministic --host 0.0.0.0 & sleep 3 && echo '运行Truffle测试..' && truffle test "]


# 设置默认启动命令为bash shell
CMD ["/bin/bash"]