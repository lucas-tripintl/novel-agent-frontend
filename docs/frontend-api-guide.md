# 前端 API 对接指南

本文档说明前端如何对接 NovelAgent API 的国际化和统一响应格式。

## 目录

- [响应格式](#响应格式)
- [国际化](#国际化)
- [错误处理](#错误处理)
- [枚举接口](#枚举接口)
- [TypeScript 类型定义](#typescript-类型定义)
- [代码示例](#代码示例)

---

## 响应格式

API 支持两种响应格式，通过 `X-Api-Version` 请求头切换：

### v1 格式（默认，兼容旧版）

**成功响应：**
```json
{
  "success": true,
  "data": { ... }
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "项目不存在",
    "details": {
      "resource": "project",
      "identifier": "123"
    }
  }
}
```

### v2 格式（推荐新项目使用）

通过请求头 `X-Api-Version: v2` 启用。

**成功响应：**
```json
{
  "code": 0,
  "msg": "操作成功",
  "data": { ... }
}
```

**错误响应：**
```json
{
  "code": 20001,
  "msg": "项目不存在",
  "data": {
    "resource": "project",
    "identifier": "123"
  }
}
```

### 分页响应

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### 自动响应包装

所有 `/api/` 路径下的端点响应都会**自动包装**为统一格式，无需前端特殊处理。

**以下情况不会被包装：**

| 类型 | 示例 | 原因 |
|------|------|------|
| 流式响应 | `/chat/sessions/{id}/message`, `/generate/{type}/{id}/start` | SSE 事件流 |
| 204 No Content | DELETE 操作 | 无响应体 |
| 304 Not Modified | `/enums` (ETag 缓存) | 无响应体 |
| 非 API 路径 | `/health`, `/docs` | 系统端点 |

**流式响应 (SSE) 端点：**

```typescript
// 流式端点返回的是 SSE 事件流，不是 JSON
const eventSource = new EventSource('/api/v1/chat/sessions/{id}/message');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理事件数据
};
```

---

## 国际化

### 支持的语言

| 代码 | 语言 |
|------|------|
| `en` | English |
| `zh-CN` | 简体中文（默认） |
| `zh-TW` | 繁體中文 |
| `ja` | 日本語 |
| `ko` | 한국어 |

### 指定语言的方式

**方式 1: URL 参数（优先级最高）**

```
GET /api/v1/enums?lang=en
GET /api/v1/projects?lang=ja
```

**方式 2: Accept-Language 请求头**

```http
Accept-Language: ja
Accept-Language: zh-TW,zh;q=0.9,en;q=0.8
```

### 响应头

API 会在响应头中返回实际使用的语言：

```http
Content-Language: ja
```

### 前端最佳实践

```typescript
// 在 axios 或 fetch 的全局配置中设置
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Accept-Language': getUserLocale(), // 如 'zh-CN'
    'X-Api-Version': 'v2',
  },
});

// 或者在每个请求中动态设置
api.get('/projects', {
  params: { lang: currentLocale },
});
```

---

## 错误处理

### 业务错误码体系

| 范围 | 类别 | 说明 |
|------|------|------|
| `0` | 成功 | 请求处理成功 |
| `10xxx` | 认证错误 | 登录、token 相关 |
| `11xxx` | 授权错误 | 权限不足 |
| `20xxx` | 资源错误 | 资源不存在、冲突 |
| `30xxx` | 验证错误 | 参数验证失败 |
| `40xxx` | 业务错误 | 余额不足、配额超限 |
| `50xxx` | 限流错误 | 请求过于频繁 |
| `90xxx` | 系统错误 | 服务不可用、内部错误 |

### 详细错误码列表

| 错误码 | 含义 | HTTP 状态码 |
|--------|------|-------------|
| `10001` | 认证失败 | 401 |
| `10002` | Token 已过期 | 401 |
| `10003` | Token 无效 | 401 |
| `11001` | 无权访问 | 403 |
| `11002` | 账户已禁用 | 403 |
| `20001` | 资源不存在 | 404 |
| `20002` | 资源冲突 | 409 |
| `30001` | 参数验证失败 | 422 |
| `40001` | 余额不足 | 402 |
| `40002` | 配额超限 | 402 |
| `50001` | 请求过于频繁 | 429 |
| `90001` | 服务不可用 | 503 |
| `90002` | 内部错误 | 500 |

### 错误消息插值

部分错误消息包含动态参数：

```json
{
  "code": 20001,
  "msg": "项目不存在",
  "data": {
    "resource": "project",
    "identifier": "123"
  }
}
```

不同语言的消息模板：

| 语言 | 消息模板 |
|------|----------|
| zh-CN | `{resource}不存在` |
| en | `{resource} not found` |
| ja | `{resource}が見つかりません` |

### 前端错误处理示例

```typescript
import { message, Modal } from 'antd';
import { t } from '@/i18n';  // 前端 i18n 函数

// 统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { code, msg, data } = error.response?.data || {};

    // 后端已返回完整的国际化消息，直接使用 msg 即可
    switch (code) {
      case 10001:
      case 10002:
      case 10003:
        // 认证错误，显示消息并跳转登录
        message.error(msg);
        router.push('/login');
        break;

      case 30001:
        // 验证错误，显示总体消息 + 字段详情
        message.error(msg);
        // 可选：在表单中高亮具体字段
        // data?.errors?.forEach(err => form.setFieldError(err.field, err.message));
        break;

      case 40001:
        // 余额不足，引导充值
        Modal.confirm({
          title: msg,  // 后端已返回完整消息如 "余额不足，需要 100，当前余额 50"
          okText: t('common.recharge'),  // 前端 i18n: "去充值" / "Recharge"
          onOk: () => router.push(data?.recharge_url),
        });
        break;

      case 50001:
        // 限流错误，msg 已包含重试时间
        message.warning(msg);
        break;

      default:
        // 其他错误直接显示后端消息
        if (msg) {
          message.error(msg);
        }
    }

    return Promise.reject(error);
  }
);
```

---

## 枚举接口

### 获取所有枚举映射

```http
GET /api/v1/enums
Accept-Language: zh-CN
```

**响应示例：**

```json
{
  "version": "1.0.0",
  "locale": "zh-CN",
  "enums": {
    "EntityType": {
      "name": "EntityType",
      "label": "实体类型",
      "items": [
        {"value": "character", "label": "角色", "description": "小说中的人物角色"},
        {"value": "location", "label": "地点", "description": "故事发生的场所"}
      ]
    },
    "ProjectStatus": {
      "name": "ProjectStatus",
      "label": "项目状态",
      "items": [
        {"value": "draft", "label": "草稿", "description": "尚未开始"},
        {"value": "in_progress", "label": "进行中", "description": "正在创作"}
      ]
    }
  },
  "field_values": {
    "importance": {
      "field": "importance",
      "label": "重要程度",
      "values": {
        "core": "核心",
        "important": "重要",
        "normal": "普通"
      }
    }
  }
}
```

### 获取单个枚举

```http
GET /api/v1/enums/EntityType?lang=en
```

**响应示例：**

```json
{
  "name": "EntityType",
  "label": "Entity Type",
  "items": [
    {"value": "character", "label": "Character", "description": "Character in the novel"},
    {"value": "location", "label": "Location", "description": "Place where story happens"}
  ]
}
```

### 缓存策略

枚举接口支持 ETag 缓存：

```typescript
// 首次请求
const response = await api.get('/enums');
const etag = response.headers['etag'];
localStorage.setItem('enums_etag', etag);
localStorage.setItem('enums_data', JSON.stringify(response.data));

// 后续请求，检查是否有更新
const cachedEtag = localStorage.getItem('enums_etag');
try {
  await api.get('/enums', {
    headers: { 'If-None-Match': cachedEtag },
  });
  // 304 会被 axios 当作错误抛出
} catch (error) {
  if (error.response?.status === 304) {
    // 使用缓存数据
    return JSON.parse(localStorage.getItem('enums_data'));
  }
  throw error;
}
```

### 前端枚举工具类

```typescript
class EnumService {
  private cache: Map<string, EnumDefinition> = new Map();
  private locale: string = 'zh-CN';

  async init(locale: string) {
    this.locale = locale;
    const { data } = await api.get('/enums', {
      params: { lang: locale },
    });

    Object.entries(data.enums).forEach(([name, def]) => {
      this.cache.set(name, def as EnumDefinition);
    });
  }

  // 获取枚举的显示标签
  getLabel(enumName: string, value: string): string {
    const def = this.cache.get(enumName);
    const item = def?.items.find(i => i.value === value);
    return item?.label || value;
  }

  // 获取枚举的所有选项（用于 Select 组件）
  getOptions(enumName: string): Array<{ value: string; label: string }> {
    const def = this.cache.get(enumName);
    return def?.items.map(i => ({
      value: i.value,
      label: i.label,
    })) || [];
  }
}

export const enumService = new EnumService();
```

---

## TypeScript 类型定义

```typescript
// ============ 响应类型 ============

/** v2 统一响应格式 */
interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T | null;
}

/** 分页数据 */
interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/** 分页响应 */
type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ============ 错误码 ============

enum ErrorCode {
  SUCCESS = 0,

  // 认证错误
  AUTHENTICATION_ERROR = 10001,
  TOKEN_EXPIRED = 10002,
  TOKEN_INVALID = 10003,

  // 授权错误
  AUTHORIZATION_ERROR = 11001,
  ACCOUNT_DISABLED = 11002,

  // 资源错误
  NOT_FOUND = 20001,
  CONFLICT = 20002,

  // 验证错误
  VALIDATION_ERROR = 30001,

  // 业务错误
  INSUFFICIENT_BALANCE = 40001,
  QUOTA_EXCEEDED = 40002,

  // 限流错误
  RATE_LIMIT_EXCEEDED = 50001,

  // 系统错误
  SERVICE_UNAVAILABLE = 90001,
  INTERNAL_ERROR = 90002,
}

// ============ 枚举类型 ============

interface EnumItem {
  value: string;
  label: string;
  description: string;
}

interface EnumDefinition {
  name: string;
  label: string;
  items: EnumItem[];
}

interface FieldValueMapping {
  field: string;
  label: string;
  values: Record<string, string>;
}

interface EnumsResponse {
  version: string;
  locale: string;
  enums: Record<string, EnumDefinition>;
  field_values: Record<string, FieldValueMapping>;
}

// ============ 验证错误详情 ============

interface ValidationErrorDetail {
  field: string;
  message: string;
  type: string;
}

interface ValidationErrorData {
  errors: ValidationErrorDetail[];
}

// ============ 特定错误的 data 类型 ============

interface InsufficientBalanceData {
  required: number;
  current_balance: number;
  recharge_url: string;
}

interface RateLimitData {
  retry_after: number;
}

interface NotFoundData {
  resource: string;
  identifier: string;
}
```

---
## 常见问题

### Q: 如何在开发环境快速测试不同语言？

使用 URL 参数最方便：

```
http://localhost:5173/projects?lang=ja
```

### Q: 枚举数据应该什么时候加载？

建议在应用初始化时加载一次，后续使用缓存：

```typescript
// main.ts
async function bootstrap() {
  const locale = localStorage.getItem('locale') || 'zh-CN';
  await enumService.init(locale);

  app.mount('#app');
}
```

### Q: v1 和 v2 格式可以混用吗？

可以。每个请求可以通过 `X-Api-Version` 请求头独立指定格式。建议新项目统一使用 v2。

### Q: 错误消息会根据语言变化吗？

是的。错误消息会根据 `Accept-Language` 或 `?lang=` 参数返回对应语言。

---

## 更新日志

- **2026-01-08**: 自动响应包装
  - 所有 API 端点自动包装为统一格式
  - 无需前端手动处理响应格式
  - 流式响应、204/304 等特殊情况自动跳过

- **2024-01-08**: 初始版本
  - 添加 v2 响应格式支持
  - 添加 5 种语言国际化支持
  - 添加业务错误码体系
