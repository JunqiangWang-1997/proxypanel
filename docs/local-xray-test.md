# Local Xray Test

本地联调用的最小配置文件在 [xray-test.json](/home/junqiang/code/proxypanel/xray-test.json)。

## 约束

- Xray API gRPC 监听：`127.0.0.1:10085`
- 被管理的入站标签：`main-inbound`
- 被管理的协议：`vless`
- 面板后端默认读取同样的配置值

## 你需要在本机执行的步骤

1. 启动 Xray

```bash
xray run -c /home/junqiang/code/proxypanel/xray-test.json
```

2. 可选：确认 gRPC API 已开启

```bash
grpcurl -plaintext 127.0.0.1:10085 list
```

预期结果里应包含 `xray.app.proxyman.command.HandlerService`。

3. 准备后端环境变量

```bash
cp /home/junqiang/code/proxypanel/backend/.env.example /home/junqiang/code/proxypanel/backend/.env
```

4. 启动后端

```bash
cd /home/junqiang/code/proxypanel
npm run dev:backend
```

5. 创建测试用户

```bash
curl -X POST http://127.0.0.1:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "nodeId": 1,
    "flow": "",
    "level": 0,
    "remark": "local test"
  }'
```

6. 查询用户列表

```bash
curl http://127.0.0.1:3000/api/users
```

7. 删除测试用户

```bash
curl -X DELETE http://127.0.0.1:3000/api/users/1
```

8. 检查节点连通性

```bash
curl -X POST http://127.0.0.1:3000/api/nodes/1/ping
```

返回 `{"data":{"nodeId":1,"ok":true,"checkedAt":"..."}}` 表示后端已成功连上该节点的 Xray gRPC API。

## 如果创建失败

- 返回 `502`：通常是 Xray gRPC 没开、端口不对、tag 不对
- 返回 `400`：通常是请求体有问题，或者节点/协议不匹配
- 返回 `404`：通常是删除时用户不存在
