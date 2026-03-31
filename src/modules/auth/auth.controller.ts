import type { Request, Response } from "express";
import { config } from "@/config";
import { success } from "@/utils/response";
import { AppError } from "@/utils/errors";
import { authService } from "./auth.service";
import { userService } from "@/modules/user/user.service";
import { User } from '@/modules/user/user.schema'

function cookieOptions() {
  return {
    // Refresh Token 仅通过 HttpOnly Cookie 传输，降低 XSS 直接读取的风险。
    httpOnly: true,
    secure: config.cookie.secure,
    // Web 场景下配合 CORS credentials 使用；同站点下刷新体验更好。
    sameSite: "lax" as const,
    // 缩小 Cookie 作用域：只有 refresh 接口会带上该 Cookie。
    path: "/api/v1/auth/refresh",
  };
}

export const authController = {
  async login(req: Request, res: Response) {
    const { account, password } = req.body as { account: string; password: string };
    const result = await authService.login(account, password);

    // Refresh Token 不返回给前端 JS（避免落到 localStorage 等），只通过 Cookie 下发。
    res.cookie(authService.REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions());
    return success(res, { accessToken: result.accessToken, user: result.user as User }, "登录成功");
  },

  async refresh(req: Request, res: Response) {
    // 浏览器端默认从 Cookie 取；Body 兜底主要用于非浏览器客户端/调试。
    const refreshToken =
      (req.cookies?.[authService.REFRESH_COOKIE_NAME] as string | undefined) ??
      (req.body?.refreshToken as string | undefined) ??
      undefined;
    if (!refreshToken) throw new AppError("未登录", 401);

    const result = await authService.refresh(refreshToken);
    // Refresh Token 旋转：每次刷新都会下发新的 Refresh Token（旧的立即失效）。
    res.cookie(authService.REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions());
    return success(res, { accessToken: result.accessToken }, "刷新成功");
  },

  async logout(req: Request, res: Response) {
    const refreshToken =
      (req.cookies?.[authService.REFRESH_COOKIE_NAME] as string | undefined) ??
      (req.body?.refreshToken as string | undefined) ??
      undefined;
    await authService.logout(refreshToken);
    res.clearCookie(authService.REFRESH_COOKIE_NAME, cookieOptions());
    return success(res, null, "退出成功");
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw new AppError("未登录", 401);
    const user = await userService.getUserById(req.user.userId);
    const json = typeof (user as any).toJSON === "function" ? (user as any).toJSON() : user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userPassword, ...rest } = json as any;
    return success(res, rest, "获取成功");
  },
};

