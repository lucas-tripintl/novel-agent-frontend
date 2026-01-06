# 认证配置

## Token 存储说明

项目使用 Zustand persist 存储认证信息：
- **localStorage key**: `novel-agent-auth`

## 配置方法

### 1. 获取认证数据

在已登录的浏览器控制台执行：

```javascript
console.log(localStorage.getItem('novel-agent-auth'))
```

### 2. 创建 `.env.local`

在项目根目录创建 `.env.local`（已在 .gitignore 中）：

```bash
AUTH_DATA='{"state":{"token":"xxx","refreshToken":"xxx","user":{"id":"xxx","username":"xxx","email":"xxx"},"isAuthenticated":true},"version":0}'
```

将控制台输出的完整 JSON 字符串粘贴替换上面的值。

## Playwright 注入脚本

执行测试前使用以下脚本注入认证状态：

```javascript
// mcp__playwright__browser_evaluate
// 读取 .env.local 中的 AUTH_DATA，然后注入
{
  "function": "() => { localStorage.setItem('novel-agent-auth', AUTH_DATA); location.reload(); }"
}
```
