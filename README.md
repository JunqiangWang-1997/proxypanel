# ProxyPanel

一个前后端分离的机场面板起步项目。

## 声明

本项目仅用于个人学习、技术研究与本地联调练习，目的是熟悉前后端分离架构、Node.js / Vue 工程组织、SQLite 持久化以及 Xray gRPC API 的调用方式。

项目作者与使用者应严格遵守所在国家和地区的法律法规、服务条款与网络使用规范，不得将本项目用于任何违法违规、侵权、滥用网络资源或规避监管的用途。

如果你打算基于本项目继续开发，请在合法、合规、可审计的前提下进行，并自行承担部署、运营和使用过程中的责任。

## 技术栈

- 后端：Node.js、TypeScript、Express、SQLite
- 前端：Vue 3、Vite、TypeScript
- Xray 集成：gRPC `HandlerService.AlterInbound`

## 已实现内容

- 用户管理 REST API
  - `GET /api/users`
  - `POST /api/users`
  - `DELETE /api/users/:id`
- 节点查询 REST API
  - `GET /api/nodes`
  - `POST /api/nodes`
  - `PATCH /api/nodes/:id`
  - `DELETE /api/nodes/:id`
  - `POST /api/nodes/:id/ping`
- SQLite 初始化与种子数据
  - `nodes`
  - `users`
- Xray 用户操作封装
  - `addUser`
  - `removeUser`
- Vue 管理页面
  - 用户列表
  - 添加用户
  - 删除用户
  - 节点选择

## 目录结构

```text
.
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── db
│   │   ├── repositories
│   │   ├── routes
│   │   ├── services
│   │   └── proto
└── frontend
    └── src
        ├── api
        ├── components
        └── styles
```

## 启动

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
cp backend/.env.example backend/.env
```

3. 一条命令启动前后端

```bash
npm run dev
```

默认会启动：

- 后端：`http://localhost:3000`
- 前端：`http://localhost:5173`

4. 如果本地已经准备好 Xray 二进制，可连同 Xray 一起启动

```bash
npm run dev:stack
```

`dev:stack` 默认读取：

- Xray 二进制：`tools/xray/v26.3.27/xray`
- Xray 配置：`xray-test.json`

如果你的 Xray 路径不同，可临时覆盖：

```bash
XRAY_BIN=/your/path/to/xray npm run dev:stack
```

说明：

- `npm run dev` 会在 `backend/.env` 不存在时自动从 `.env.example` 复制一份
- 前端现在已经可以直接在页面里做节点新增、编辑、删除和 Ping 测试，不必全靠 `curl`

## 默认后端配置

- API 端口：`3000`
- SQLite 文件：`backend/data/proxypanel.sqlite`
- 默认节点：
  - 名称：`Local Xray`
  - gRPC 地址：`127.0.0.1:10085`
  - 入站标签：`main-inbound`
  - 协议：`vless`

## 当前约束

- Xray 用户写入当前只实现 `vless` 账户编码。
- 删除用户时会先调用 Xray，再删除本地数据库记录。
- 多节点已经有表结构和节点接口，后续可以继续补节点增删改查与健康检查。
- 节点管理已支持页面直接新增、编辑、删除和 Xray gRPC 连通性测试。
