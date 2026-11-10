import { Response } from "express";
import { envVars } from "../config/env";

export interface AuthTokens {
    accessToken?: string;
    refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
    const isProd = envVars.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax") as "none" | "lax",
        path: "/",
    };

    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
    }

    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions);
    }
};

export const clearAuthCookie = (res: Response) => {
    const isProd = envVars.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax") as "none" | "lax",
        path: "/",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
};