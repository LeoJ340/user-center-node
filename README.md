# user-server-node

TypeScript + Express + Sequelize + MySQL 的后端工程骨架。

## 环境要求

- Node.js 18+（建议 20+）
- MySQL 8+（或兼容版本）

## 快速开始

安装依赖：

```bash
pnpm i
```

准备环境变量（已内置示例文件）：

- 开发：`.env.development`
- 测试：`.env.test`

启动开发：

```bash
pnpm run dev
```

示例接口：

- `POST /api/v1/users`
- `GET /api/v1/users/:id`

## 路径别名（@）

TS 编译期：`tsconfig.json` 中 `paths: { "@/*": ["src/*"] }`

运行期：

- 开发：`ts-node-dev -r tsconfig-paths/register`
- 构建：`tsc` 后运行 `tsc-alias` 把 dist 里的 `@/` 引用改写为相对路径

