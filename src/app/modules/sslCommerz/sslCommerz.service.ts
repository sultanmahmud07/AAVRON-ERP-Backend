/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { Payment } from "../payment/payment.model";
import { ISSLCommerz } from "./sslCommerz.interface";

const sslPaymentInit = async (payload: ISSLCommerz) => {
    try {
        const data = {
            store_id: envVars.SSL.STORE_ID,
            store_passwd: envVars.SSL.STORE_PASS,
            total_amount: payload.amount,
            currency: "BDT",
            tran_id: payload.transactionId,
            success_url: `${envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
            fail_url: `${envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
            cancel_url: `${envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
            ipn_url: envVars.SSL.SSL_IPN_URL,
            shipping_method: "Courier",
            product_name: "ARVYNO Luxury Apparel",
            product_category: "Clothing",
            product_profile: "general",
            cus_name: payload.name || "Customer",
            cus_email: payload.email || "guest@arvyno.com",
            cus_add1: payload.address || "Dhaka, Bangladesh",
            cus_add2: "N/A",
            cus_city: "Dhaka",
            cus_state: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: payload.phoneNumber || "01700000000",
            cus_fax: "N/A",
            ship_name: payload.name || "Customer",
            ship_add1: payload.address || "Dhaka, Bangladesh",
            ship_add2: "N/A",
            ship_city: "Dhaka",
            ship_state: "Dhaka",
            ship_postcode: 1000,
            ship_country: "Bangladesh",
        };

        const response = await axios({
            method: "POST",
            url: envVars.SSL.SSL_PAYMENT_API,
            data: data,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        if (response.data.status !== "SUCCESS" || !response.data.GatewayPageURL) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                response.data.failedreason || "Failed to initialize SSLCommerz gateway session."
            );
        }

        return response.data;
    } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error("SSLCommerz Payment Init Error:", error.response?.data || error.message);
        throw new AppError(httpStatus.BAD_REQUEST, error.response?.data?.failedreason || error.message);
    }
};

const validatePayment = async (payload: any) => {
    try {
        const response = await axios({
            method: "GET",
            url: `${envVars.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVars.SSL.STORE_ID}&store_passwd=${envVars.SSL.STORE_PASS}`,
        });

        await Payment.updateOne(
            { transactionId: payload.tran_id },
            { paymentGatewayData: response.data },
            { runValidators: true }
        );
    } catch (error: any) {
        throw new AppError(httpStatus.BAD_REQUEST, `Payment Validation Error: ${error.message}`);
    }
};

export const SSLService = {
    sslPaymentInit,
    validatePayment,
};