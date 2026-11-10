import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { generateToken, verifyToken } from "./jwt";

const getNormalizedExpires = (expires: string): string => {
    if (!expires) return "30d";
    // If it's purely digits (e.g. "30"), treat as days ("30d") to prevent ms library interpreting it as 30 milliseconds
    return /^\d+$/.test(expires) ? `${expires}d` : expires;
};

export const createUserTokens = (user: Partial<IUser>) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
    }
    const accessExpires = getNormalizedExpires(envVars.JWT_ACCESS_EXPIRES || "1d");
    const refreshExpires = getNormalizedExpires(envVars.JWT_REFRESH_EXPIRES || "30d");

    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, accessExpires)
    const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, refreshExpires)

    return {
        accessToken,
        refreshToken
    }
}

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload

    const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })

    if (!isUserExist) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist")
    }
    if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.UNAUTHORIZED, `User is ${isUserExist.isActive}`)
    }
    if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User is deleted")
    }

    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }
    const accessExpires = getNormalizedExpires(envVars.JWT_ACCESS_EXPIRES || "1d");
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, accessExpires)

    return accessToken
}