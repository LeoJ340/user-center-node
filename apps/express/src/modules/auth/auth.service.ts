import { randomUUID } from "crypto";
import { AppError } from "@/utils/errors";
import { hashToken, verifyPassword } from "@/utils/authCrypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { userRepo } from "@/modules/user/user.repo";
import { refreshStore } from "./refreshStore";

const REFRESH_COOKIE_NAME = "refresh_token";

function sanitizeUser(user: any) {
  const json = typeof user.toJSON === "function" ? user.toJSON() : user;
  const { userPassword, ...rest } = json;
  return rest;
}

export const authService = {
  REFRESH_COOKIE_NAME,

  mapRedisError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("NOAUTH")) return new AppError("Redis鉴权失败（请检查密码/用户名）", 503);
    if (msg.includes("WRONGPASS")) return new AppError("Redis鉴权失败（密码错误）", 503);
    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND") || msg.includes("ETIMEDOUT")) {
      return new AppError("Redis不可用（网络或地址不可达）", 503);
    }
    return new AppError("Redis不可用", 503);
  },

  async login(account: string, password: string) {
    const user = await userRepo.findByLogin(account);
    if (!user) throw new AppError("账号或密码错误", 401);
    if (user.userStatus !== 0) throw new AppError("用户状态异常", 403);
    if (user.deleted !== 0) throw new AppError("用户不存在", 404);

    const ok = await verifyPassword(password, user.userPassword);
    if (!ok) throw new AppError("账号或密码错误", 401);

    const userId = String(user.id);
    // sid 用于把 Access/Refresh 绑定到同一次“登录会话”。
    // 当前方案不做多端管理，但保留 sid 有利于后续扩展（例如踢下线/会话表）。
    const sid = randomUUID();
    const refreshToken = signRefreshToken({ sub: userId, sid });
    const accessToken = signAccessToken({ sub: userId, sid });

    const payload = verifyRefreshToken(refreshToken) as any;
    const nowSec = Math.floor(Date.now() / 1000);
    /**
     * payload.exp：token 过期时间戳（秒）
     * nowSec：当前时间戳（秒）
     * payload.exp - nowSec：token 过期时间减去当前时间（距离过期还剩多少秒）
     * Math.max(1, ...)：最小给 1 秒，避免出现 0 或负数导致 Redis EX 不合法/立即失效
     */
    const ttl = Math.max(1, Number(payload.exp ?? nowSec + 7 * 24 * 3600) - nowSec);
    try {
      /**
       * 服务端只存 refreshToken 的 hash（不存明文），用于：
       * 1) logout 立即失效；
       * 2) refresh 旋转后让旧 token 作废；
       * 3) 降低泄露风险。
       */
      await refreshStore.set(userId, { sid, hash: hashToken(refreshToken) }, ttl);
    } catch (err) {
      throw this.mapRedisError(err);
    }

    return {
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    };
  },

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken) as any;
    } catch {
      throw new AppError("登录已过期", 401);
    }
    if (payload.type !== "refresh") throw new AppError("登录已过期", 401);

    const userId = String(payload.sub);
    let parsed: { sid: string; hash: string } | null;
    try {
      parsed = await refreshStore.get(userId);
    } catch (err) {
      throw this.mapRedisError(err);
    }
    if (!parsed) throw new AppError("登录已过期", 401);

    const incomingHash = hashToken(refreshToken);
    // 任一不匹配都视为 refresh 无效（常见原因：已 logout、已旋转、被篡改、或过期）。
    if (parsed.sid !== payload.sid || parsed.hash !== incomingHash) {
      throw new AppError("登录已过期", 401);
    }

    const sid = String(payload.sid);
    const newRefreshToken = signRefreshToken({ sub: userId, sid });
    const newAccessToken = signAccessToken({ sub: userId, sid });

    const newPayload = verifyRefreshToken(newRefreshToken) as any;
    const nowSec = Math.floor(Date.now() / 1000);
    const ttl = Math.max(1, Number(newPayload.exp ?? nowSec + 7 * 24 * 3600) - nowSec);
    try {
      // Refresh Token 旋转：覆盖存储 hash，使旧 refreshToken 立即失效。
      await refreshStore.set(userId, { sid, hash: hashToken(newRefreshToken) }, ttl);
    } catch (err) {
      throw this.mapRedisError(err);
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken) as any;
      const userId = String(payload.sub);
      try {
        await refreshStore.del(userId);
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  },
};

