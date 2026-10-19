import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import { IsActive } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { verifyToken } from "../utils/jwt";

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawToken = req.headers.authorization || req.cookies?.accessToken;
        const accessToken = rawToken?.startsWith("Bearer ") ? rawToken.split(" ")[1] : rawToken;

        if (accessToken) {
            try {
                const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;
                const isUserExist = await User.findOne({ email: verifiedToken.email });
                if (isUserExist && isUserExist.isActive === IsActive.ACTIVE && !isUserExist.isDeleted) {
                    req.user = verifiedToken;
                }
            } catch {
                // If token is invalid or expired, continue gracefully as guest checkout
            }
        }
        next();
    } catch (error) {
        next(error);
    }
};
