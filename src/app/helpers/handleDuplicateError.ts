/* eslint-disable @typescript-eslint/no-explicit-any */
import { TGenericErrorResponse } from "../interfaces/error.types";

export const handlerDuplicateError = (err: any): TGenericErrorResponse => {
    let duplicateField = "Field";

    if (err.keyValue && typeof err.keyValue === "object") {
        const keys = Object.keys(err.keyValue);
        duplicateField = keys.map(k => `${k}: '${err.keyValue[k]}'`).join(", ");
    } else if (err.message) {
        const match = err.message.match(/"([^"]*)"/) || err.message.match(/dup key: \{ (.*) \}/);
        duplicateField = match ? match[1] : "Entry";
    }

    return {
        statusCode: 400,
        message: `${duplicateField} already exists!!`,
    };
};