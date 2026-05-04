import { type Request, type Response, type NextFunction } from "express";
import { User } from "../models/User.js";
import { getTokenFromRequest, verifyToken } from "../lib/auth.js";

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
}

declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): this is AuthenticatedRequest;
      user?: AuthUser;
    }
    interface AuthenticatedRequest extends Request {
      user: AuthUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  req.isAuthenticated = function (this: Request): this is Express.AuthenticatedRequest {
    return this.user != null;
  };

  const token = getTokenFromRequest(req);
  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    next();
    return;
  }

  try {
    const user = await User.findById(payload.userId).lean();
    if (!user) {
      next();
      return;
    }
    req.user = {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
    };
  } catch {
    // ignore db errors in middleware
  }

  next();
}
