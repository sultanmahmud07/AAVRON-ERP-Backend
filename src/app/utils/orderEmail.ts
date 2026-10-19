/* eslint-disable @typescript-eslint/no-explicit-any */
import { generatePdf, IInvoiceData } from "./invoice";
import { sendEmail } from "./sendEmail";

export const isValidEmail = (email?: string | null): boolean => {
    if (!email || typeof email !== "string") return false;
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

export const sendOrderConfirmationEmail = async (order: any, payment?: any) => {
    try {
        const rawEmail = order.shippingAddress?.email || order.user?.email || "";
        const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

        // If email is missing or invalid, skip sending without failing the order
        if (!isValidEmail(email)) {
            // eslint-disable-next-line no-console
            console.log(`[Order Confirmation] Skipped sending confirmation email for Order #${order.orderNumber}: No valid email provided.`);
            return;
        }

        const isCOD = order.paymentMethod === "COD" || order.paymentMethod === "Cash on Delivery";
        const transactionId = isCOD ? undefined : (payment?.transactionId || `TXN-${order.orderNumber}`);
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

        const invoiceData: IInvoiceData = {
            orderNumber: order.orderNumber,
            transactionId,
            paymentMethod: isCOD ? "Cash on Delivery" : "Online Payment (SSLCommerz)",
            orderDate,
            userName: order.shippingAddress?.name || order.user?.name || "Valued Customer",
            userEmail: email,
            shippingAddress: `${order.shippingAddress?.address || ""}${order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : ""}`,
            items: (order.items || []).map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                color: item.color,
            })),
            subtotal: order.subtotal ?? 0,
            shippingCost: order.shippingCost ?? 0,
            discount: order.discount ?? 0,
            totalAmount: order.totalAmount ?? payment?.amount ?? 0,
        };

        let pdfBuffer: Buffer | null = null;
        try {
            pdfBuffer = await generatePdf(invoiceData);
        } catch (pdfErr: any) {
            // eslint-disable-next-line no-console
            console.error("Failed to generate PDF for order confirmation email:", pdfErr.message || pdfErr);
        }

        const attachments = pdfBuffer
            ? [
                  {
                      filename: `ARVYNO-Invoice-${order.orderNumber}.pdf`,
                      content: pdfBuffer,
                      contentType: "application/pdf",
                  },
              ]
            : undefined;

        await sendEmail({
            to: email,
            subject: `[ARVYNO] Order Confirmed #${order.orderNumber}`,
            templateName: "orderConfirmation",
            templateData: {
                ...invoiceData,
                paymentMethod: order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment (SSLCommerz)",
                items: order.items || [],
                formattedDate: orderDate.toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka",
                    dateStyle: "medium",
                    timeStyle: "short",
                }),
            },
            attachments,
        });

        // eslint-disable-next-line no-console
        console.log(`[Order Confirmation] Confirmation email sent successfully to ${email} for Order #${order.orderNumber}`);
    } catch (error: any) {
        // Log error safely without throwing, ensuring order completion is never affected
        // eslint-disable-next-line no-console
        console.error(`[Order Confirmation] Failed to send email for Order #${order.orderNumber}:`, error.message || error);
    }
};
