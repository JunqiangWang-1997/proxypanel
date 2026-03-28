# ProxyPanel

一个前后端分离的 Xray 节点纳管面板原型。

## 声明

本项目仅用于个人学习、技术研究与本地联调练习。请严格遵守所在地法律法规、服务条款与网络使用规范，不得将本项目用于违法违规、侵权或滥用网络资源的用途。

## 现在的核心思路

这个版本不再要求你先在远端手动准备 gRPC 节点，再回来填 `grpcHost/inboundTag`。

现在的流程是：

1. 在前端定义协议模板
2. 在前端填写服务器 IP、`root`、密码或私钥
3. 后端通过 SSH 登录远端服务器
4. 后端生成 Xray 配置、安装 Xray、重启服务
5. 后端把部署状态、控制端口和可管理状态回写给前端

## 技术栈

- 后端：Node.js、TypeScript、Express、SQLite
- 前端：Vue 3、Vite、TypeScript
- 节点部署：后端调用本机 `ssh` / `scp`
- Xray 控制：gRPC `HandlerService.AlterInbound`

## 已实现内容

- 协议模板管理 REST API
  - `GET /api/protocol-profiles`
  - `POST /api/protocol-profiles`
  - `PATCH /api/protocol-profiles/:id`
  - `DELETE /api/protocol-profiles/:id`
- 节点接入与部署 REST API
  - `GET /api/nodes`
  - `POST /api/nodes`
  - `PATCH /api/nodes/:id`
  - `DELETE /api/nodes/:id`
  - `POST /api/nodes/:id/ping`：验证 SSH 凭据
  - `POST /api/nodes/:id/deploy`：远端部署模板
- 用户管理 REST API
  - `GET /api/users`
  - `POST /api/users`
  - `DELETE /api/users/:id`
- SQLite 持久化
  - `protocol_profiles`
  - `nodes`
  - `users`
- Vue 管理页面
  - 协议模板编辑
  - 服务器接入
  - SSH 验证
  - 节点部署状态
  - 已部署 VLESS 节点的用户管理

## 目录结构

```text
.
├── backend
│   └── src
│       ├── controllers
│       ├── db
│       ├── repositories
│       ├── routes
│       ├── services
│       └── proto
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

3. 启动前后端

```bash
npm run dev
```

默认地址：

- 后端：`http://localhost:3000`
- 前端：`http://localhost:5173`

## 部署能力说明

- 后端部署节点时依赖本机存在 `ssh` 和 `scp`
- 如果你要用密码认证，后端所在机器还需要安装 `sshpass`
- 节点部署脚本会在远端尝试安装 `curl`、`unzip`、`xray`
- 默认种子里带了两个协议模板：
  - `VLESS TCP Baseline`
  - `VMess WS Baseline`

## 当前边界

- 用户增删目前仍以 Xray gRPC 为控制面，实际只对 `vless` 节点开放
- 自定义协议模板已经支持用 JSON 模板定义和部署，但不同协议的“用户下发”能力需要分别补充
- 默认部署脚本为了让控制后端能连上节点，会把 Xray API 端口暴露在服务器控制地址上；生产环境应自行增加防火墙或专网隔离
