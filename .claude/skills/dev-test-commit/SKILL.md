---
name: dev-test-commit
description: 自动化开发流程。执行开发、Playwright测试、修复、提交循环。当用户需要自动化完整开发工作流时使用。
allowed-tools: Bash(pnpm:*), Bash(git:*), mcp__playwright__*
---

# Dev-Test-Commit 自动化开发流程

自动化执行：开发 → 测试 → 修复 → 提交 的完整循环。

## 使用方式

```
/dev-test-commit <开发任务描述>
```

## 执行流程

### 1. 任务规划

- 使用 TodoWrite 创建任务清单
- 分析需求，拆解为具体开发步骤
- 明确需要测试的验收标准

### 2. 开发实现

- 按照任务清单逐步实现功能
- 遵循项目现有的代码风格和架构
- 每完成一个子任务，更新 todo 状态

### 3. 启动开发服务器

- 检查是否已在运行：`pgrep -f "next dev"`
- 如未运行，后台启动：`pnpm dev`（run_in_background: true）
- 等待服务器就绪（http://localhost:3000）

### 4. Playwright 自动测试

使用 MCP Playwright 工具执行测试：

```
4.1 启动浏览器并注入认证 Token
    - mcp__playwright__browser_navigate 访问目标页面
    - 读取 .env.local 中的 AUTH_DATA（完整的认证 JSON）
    - mcp__playwright__browser_evaluate 注入到 localStorage:
      function: "() => { localStorage.setItem('novel-agent-auth', AUTH_DATA); location.reload(); }"

4.2 执行测试检查
    - mcp__playwright__browser_screenshot 截图查看页面状态
    - mcp__playwright__browser_snapshot 获取页面可访问性快照
    - 根据任务需求执行点击、输入等交互测试

4.3 验证结果
    - 检查页面元素是否正确渲染
    - 验证交互行为是否符合预期
    - 检查控制台是否有错误（mcp__playwright__browser_console_messages）
```

**Token 注入示例代码：**

项目使用 Zustand persist，localStorage key 为 `novel-agent-auth`。

从 `.env.local` 读取 `AUTH_DATA`（完整 JSON），然后注入：

```javascript
// mcp__playwright__browser_evaluate
{
  "function": "() => { localStorage.setItem('novel-agent-auth', 'AUTH_DATA的值'); location.reload(); }"
}
```

配置方法见 `auth-config.md`。

### 5. 测试结果处理

**如果测试通过：**
- 更新 todo 状态为 completed
- 进入提交流程

**如果测试失败：**
- 分析失败原因（截图、错误信息）
- 修复代码
- 重新执行测试（最多重试 3 次）
- 如果 3 次后仍失败，暂停并向用户报告问题

### 6. Git 提交

测试全部通过后：

```bash
# 查看变更
git status
git diff

# 提交代码（使用 HEREDOC 格式）
git add -A
git commit -m "$(cat <<'EOF'
feat: <功能描述>

- <变更点1>
- <变更点2>

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## 测试检查清单

根据开发内容自动生成测试项：

- [ ] 页面能正常加载
- [ ] 新增组件正确渲染
- [ ] 交互功能正常工作
- [ ] 响应式布局正确
- [ ] 无控制台错误
- [ ] 样式符合设计规范

## 重要约束

1. **最大重试次数**: 3 次测试失败后停止，请求用户介入
2. **超时限制**: 单次测试最长等待 30 秒
3. **回滚机制**: 如果修复导致更多问题，回滚到上一个工作版本
4. **用户确认**: 提交前展示变更摘要，等待用户确认（可选）

## 示例

```
用户: /dev-test-commit 在导航栏添加一个"关于我们"链接

Claude 执行:
1. 分析需求，创建 todo
2. 在 AppSidebar 中添加"关于我们"导航项
3. 启动开发服务器
4. Playwright 打开页面，截图验证导航项存在
5. 点击链接，验证跳转正常
6. 测试通过，执行 git commit
7. 完成，展示提交结果
```
