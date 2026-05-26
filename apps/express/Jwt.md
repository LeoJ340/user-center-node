# 双 Token 登录鉴权架构设计图（当前工程版）

> 适用工程：`user-server_node`  
> 设计基线：`Access Token + Refresh Token + Redis 会话状态（sid + hash）`

---

## 1. 架构总览（Context）

该图描述系统参与者与边界：浏览器持有内存 Access Token，Refresh Token 仅在 HttpOnly Cookie 中流转；服务端依赖 Redis 管理可撤销会话状态。

```mermaid
flowchart LR
    U[用户/浏览器] --> FE[前端应用 SPA]
    FE <-->|HTTPS JSON + Cookie| API[Node.js API Server]
    API --> REDIS[(Redis<br/>Refresh会话状态)]
    API --> MYSQL[(MySQL<br/>用户表)]
    API --> JWTLIB[JWT签发/验签]

    subgraph TrustBoundary[服务端可信边界]
      API
      REDIS
      MYSQL
      JWTLIB
    end

    FE -. 内存保存 .-> AT[Access Token]
    U -. JS不可读 .-> RTC[HttpOnly Refresh Cookie]
```

---

## 2. 后端组件关系图（Component）

该图用于理解代码模块职责划分与调用方向。

```mermaid
flowchart TB
    ROUTER[auth.route.ts] --> CTRL[auth.controller.ts]
    CTRL --> SVC[auth.service.ts]
    SVC --> JWTU[src/utils/jwt.ts]
    SVC --> CRYPTO[src/utils/authCrypto.ts]
    SVC --> STORE[refreshStore.ts]
    SVC --> UREPO[user.repo.ts]
    STORE --> REDIS[(Redis)]
    UREPO --> MYSQL[(MySQL user)]

    AUTHMW[middlewares/auth.ts] --> JWTU
    AUTHMW --> REQUSER[req.user 注入]

    APP[app.ts] --> CORS[credentials=true]
    APP --> COOKIE[cookie-parser]
    APP --> ROUTER
```

---

## 3. 登录时序图（`POST /api/v1/auth/login`）

说明：
- 输入：`account/password`
- 输出：`accessToken`（响应体）+ `refresh_token`（HttpOnly Cookie）
- Redis：写入 `auth:rt:user:{userId}`，值为 `{sid, hash}` + TTL

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as auth.controller
    participant S as auth.service
    participant DB as MySQL(user)
    participant J as jwt.ts
    participant R as Redis

    B->>C: POST /api/v1/auth/login {account,password}
    C->>S: login(account,password)
    S->>DB: findByLogin(account/email/phone)
    DB-->>S: user
    S->>S: verifyPassword(bcrypt)

    alt 用户或密码/状态异常
      S-->>C: AppError(401/403/404)
      C-->>B: {code:xxx,message}
    else 校验通过
      S->>S: sid = randomUUID()
      S->>J: signRefreshToken({sub:userId,sid})
      J-->>S: refreshToken
      S->>J: signAccessToken({sub:userId,sid})
      J-->>S: accessToken
      S->>J: verifyRefreshToken(refreshToken) 取exp
      J-->>S: payload{exp,...}
      S->>S: ttl = max(1, exp-nowSec)
      S->>R: SET auth:rt:user:{userId} {"sid","hash"} EX ttl
      R-->>S: OK
      S-->>C: {accessToken,refreshToken,user}
      C-->>B: Set-Cookie refresh_token=... HttpOnly path=/api/v1/auth/refresh
      C-->>B: Body {code:200,data:{accessToken,user}}
    end
```

---

## 4. 受保护接口鉴权时序（`Authorization: Bearer <AT>`）

说明：
- 鉴权中间件只接受 `Bearer`
- 仅接受 `type=access` 的 token
- 验签通过后将 `req.user = { userId, sid }`

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser/FE
    participant M as authenticate中间件
    participant J as jwt.ts
    participant API as 业务Controller

    B->>M: GET /api/v1/auth/me + Authorization: Bearer accessToken
    alt Header缺失/格式错误
      M-->>B: {code:401,message:"未登录"}
    else Header合法
      M->>J: verifyAccessToken(token)
      alt 验签失败/过期/type错误
        M-->>B: {code:401,message:"登录已过期/未登录"}
      else 通过
        M->>M: req.user={userId:sub,sid}
        M->>API: next()
        API-->>B: {code:200,data:...}
      end
    end
```

---

## 5. 刷新时序图（`POST /api/v1/auth/refresh`，含旋转）

说明：
- Refresh 优先从 Cookie 读取，Body 仅兜底
- 必须同时通过：JWT 验签 + Redis `sid/hash` 比对
- 成功后旋转：`newRT + newAT`，并覆盖 Redis 中 hash

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as auth.controller
    participant S as auth.service
    participant J as jwt.ts
    participant R as Redis

    B->>C: POST /api/v1/auth/refresh (Cookie自动携带refresh_token)
    C->>S: refresh(refreshToken)
    S->>J: verifyRefreshToken(refreshToken)
    alt JWT无效/过期/type非refresh
      S-->>C: AppError(401)
      C-->>B: {code:401}
    else JWT通过
      S->>R: GET auth:rt:user:{sub}
      R-->>S: {"sid","hash"} / null
      alt Redis无记录
        S-->>C: AppError(401)
        C-->>B: {code:401}
      else 有记录
        S->>S: 比对 sid + hash(incomingRefresh)
        alt 不匹配
          S-->>C: AppError(401)
          C-->>B: {code:401}
        else 匹配通过
          S->>J: signRefreshToken({sub,sid}) => newRT
          S->>J: signAccessToken({sub,sid}) => newAT
          S->>J: verifyRefreshToken(newRT) 取newExp
          S->>S: newTtl = max(1, newExp-nowSec)
          S->>R: SET auth:rt:user:{sub} {"sid","hash(newRT)"} EX newTtl
          S-->>C: {accessToken:newAT,refreshToken:newRT}
          C-->>B: Set-Cookie refresh_token=newRT (旧RT立即无效)
          C-->>B: Body {code:200,data:{accessToken:newAT}}
        end
      end
    end
```

---

## 6. 登出时序图（`POST /api/v1/auth/logout`）

说明：
- 解析 refreshToken 获取 `sub`
- 删除 Redis key 后，清除 Cookie
- 由于 Access Token 是自包含 JWT，若尚未过期仍可能短时间可用（直到 exp）

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as auth.controller
    participant S as auth.service
    participant J as jwt.ts
    participant R as Redis

    B->>C: POST /api/v1/auth/logout
    C->>S: logout(refreshToken?)
    alt 未提供refreshToken
      S-->>C: return
    else 提供refreshToken
      S->>J: verifyRefreshToken(refreshToken)
      alt 解析失败
        S-->>C: ignore
      else 解析成功
        S->>R: DEL auth:rt:user:{sub}
        R-->>S: OK
      end
    end
    C-->>B: clearCookie(refresh_token)
    C-->>B: {code:200,message:"退出成功"}
```

---

## 7. 会话状态机图（State）

```mermaid
stateDiagram-v2
    state "未登录" as S_UNAUTH
    state "已登录有效" as S_ACTIVE
    state "Access过期" as S_AT_EXPIRED

    [*] --> S_UNAUTH
    S_UNAUTH --> S_ACTIVE: login成功
    S_ACTIVE --> S_AT_EXPIRED: 时间流逝
    S_AT_EXPIRED --> S_ACTIVE: refresh成功
    S_AT_EXPIRED --> S_UNAUTH: refresh失败
    S_ACTIVE --> S_UNAUTH: logout
    S_ACTIVE --> S_UNAUTH: Redis记录失效或Refresh过期
```

---

## 8. 数据模型图（Token 与 Redis 存储）

```mermaid
classDiagram
    class AccessTokenPayload {
      +sub: string
      +sid: string
      +type: string
      +exp: number
      +iat: number
    }

    class RefreshTokenPayload {
      +sub: string
      +sid: string
      +type: string
      +exp: number
      +iat: number
    }

    class RedisStored {
      +sid: string
      +hash: string
      +ttlSec: number
    }

    class RedisKey {
      +keyPattern: string
    }

    RefreshTokenPayload --> RedisStored : hash(refreshToken)比对
    RedisKey --> RedisStored : JSON值（sid,hash）+ EX(ttlSec)
```

---

## 9. 威胁建模图（STRIDE 简化）

该图用于安全评审，标出主要风险面与当前防护点。

```mermaid
flowchart TB
    T_XSS["XSS 窃取前端状态"] --> R_AT["Access Token 泄露风险"]
    T_CSRF["跨站请求伪造"] --> A_REFRESH["/api/v1/auth/refresh 接口"]
    T_MITM["中间人窃听"] --> R_TRAFFIC["网络传输风险"]
    T_REDIS_LEAK["Redis 数据泄露"] --> R_RT_HASH["Refresh 哈希泄露风险"]
    T_REPLAY["重放旧 Refresh Token"] --> A_REFRESH

    D_HTTPONLY["防护: Refresh 仅在 HttpOnly Cookie"] --> T_XSS
    D_HTTPS["防护: HTTPS + Secure Cookie"] --> T_MITM
    D_HASH_STORE["防护: Redis 仅存 hash 不存明文"] --> T_REDIS_LEAK
    D_ROTATE["防护: Refresh 旋转 + sid/hash 比对"] --> T_REPLAY
    D_SHORT_AT["防护: Access Token 短时效"] --> R_AT
```

### 安全说明
- `HttpOnly` 降低 JS 读取 Refresh Token 风险，但不能替代输入防护，仍需做 XSS 防护。
- 建议生产环境启用 `COOKIE_SECURE=true`，并仅在 HTTPS 传输。
- 若前后端跨站部署，建议补充 CSRF 策略（如 double-submit token 或 Origin/Referer 校验）。

---

## 10. 并发刷新与单飞（Single-Flight）设计图

问题：多个请求同时 401 时，若每个都去刷新，会造成并发 refresh 冲突和风暴。  
方案：前端只允许一个 refresh 在飞，其余请求等待该 Promise。

```mermaid
sequenceDiagram
    autonumber
    participant R1 as 请求A
    participant R2 as 请求B
    participant FE as 前端拦截器
    participant API as /auth/refresh

    R1->>FE: 业务请求返回401
    FE->>FE: 若refreshPromise为空，创建refreshPromise
    FE->>API: POST /auth/refresh

    R2->>FE: 业务请求返回401
    FE->>FE: 发现refreshPromise存在，等待它

    API-->>FE: refresh成功(newAT)
    FE->>FE: 更新内存AT，resolve refreshPromise
    FE-->>R1: 重放请求A
    FE-->>R2: 重放请求B
```

### 前端落地要点
- 全局变量 `refreshPromise: Promise<void> | null`
- 401 时：
  1) 有 `refreshPromise` 就 `await`  
  2) 没有就创建并执行 refresh  
- refresh 失败统一清理登录态并跳转登录页

---

## 11. 调用时序总览（端到端）

```mermaid
flowchart LR
    A[登录/login] --> B[内存保存AT + Cookie保存RT]
    B --> C[携带Bearer访问业务接口]
    C -->|AT有效| D[业务成功]
    C -->|AT过期| E[调用/refresh]
    E -->|成功| F[更新AT并重放请求]
    E -->|失败| G[清理状态并跳登录]
    B --> H[主动/logout]
    H --> I[删除Redis会话 + 清Cookie]
```

---

## 12. 评审清单（建议）

- 是否所有受保护路由都挂载 `authenticate`。
- 是否确认前端仅内存保存 AT，不持久化到 localStorage。
- 是否开启 `withCredentials`，并与 `CORS origin` 白名单一致。
- 是否在生产强制 HTTPS + `COOKIE_SECURE=true`。
- 是否实现前端单飞 refresh，避免并发刷新风暴。
- 是否定义登录失效后的统一 UX（清状态、跳转、提示）。

