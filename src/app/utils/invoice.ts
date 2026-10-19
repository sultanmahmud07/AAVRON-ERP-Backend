/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";

export interface IInvoiceItem {
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
}

export interface IInvoiceData {
    transactionId?: string;
    paymentMethod?: string;
    orderNumber: string;
    orderDate: Date;
    userName: string;
    userEmail: string;
    shippingAddress: string;
    items: IInvoiceItem[];
    subtotal: number;
    shippingCost: number;
    discount: number;
    totalAmount: number;
}

export const generatePdf = async (invoiceData: IInvoiceData): Promise<Buffer<ArrayBufferLike>> => {
    try {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", margin: 40 });
            const buffer: Uint8Array[] = [];

            doc.on("data", (chunk) => buffer.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffer)));
            doc.on("error", (err) => reject(err));

            // Header & Branding
            doc.fillColor("#0a0a0a")
                .fontSize(22)
                .text("ARVYNO", { align: "center" });
            doc.fontSize(10)
                .fillColor("#666666")
                .text("LUXURY ATELIER & SARTORIAL ESSENTIALS", { align: "center" });
            doc.moveDown(1.5);

            doc.strokeColor("#d8c5aa")
                .lineWidth(1)
                .moveTo(40, doc.y)
                .lineTo(555, doc.y)
                .stroke();
            doc.moveDown(1);

            // Order & Customer Details Grid
            doc.fillColor("#0a0a0a").fontSize(11);
            const startY = doc.y;

            doc.text(`Order Number: ${invoiceData.orderNumber}`, 40, startY);
            if (invoiceData.transactionId) {
                doc.text(`Transaction ID: ${invoiceData.transactionId}`, 40, startY + 16);
            } else {
                doc.text(`Payment Method: ${invoiceData.paymentMethod || "Cash on Delivery"}`, 40, startY + 16);
            }
            doc.text(`Order Date: ${new Date(invoiceData.orderDate).toLocaleDateString()}`, 40, startY + 32);

            doc.text(`Customer: ${invoiceData.userName}`, 320, startY);
            doc.text(`Email: ${invoiceData.userEmail}`, 320, startY + 16);
            doc.text(`Shipping: ${invoiceData.shippingAddress}`, 320, startY + 32, { width: 235 });

            doc.y = startY + 65;
            doc.moveDown(1);

            // Table Header
            doc.strokeColor("#eeeeee")
                .lineWidth(1)
                .moveTo(40, doc.y)
                .lineTo(555, doc.y)
                .stroke();
            doc.moveDown(0.5);

            const tableTop = doc.y;
            doc.fontSize(10).fillColor("#333333");
            doc.text("Item / Description", 40, tableTop, { width: 240 });
            doc.text("Variant", 280, tableTop, { width: 100 });
            doc.text("Qty", 380, tableTop, { width: 40, align: "center" });
            doc.text("Price", 430, tableTop, { width: 50, align: "right" });
            doc.text("Total", 490, tableTop, { width: 65, align: "right" });

            doc.moveDown(0.5);
            doc.strokeColor("#dddddd")
                .moveTo(40, doc.y)
                .lineTo(555, doc.y)
                .stroke();
            doc.moveDown(0.5);

            // Items Rows
            invoiceData.items.forEach((item) => {
                const rowY = doc.y;
                const variant = [item.size, item.color].filter(Boolean).join(" / ") || "—";
                const itemTotal = item.price * item.quantity;

                doc.fontSize(9).fillColor("#222222");
                doc.text(item.name, 40, rowY, { width: 235 });
                doc.text(variant, 280, rowY, { width: 95 });
                doc.text(item.quantity.toString(), 380, rowY, { width: 40, align: "center" });
                doc.text(`BDT ${item.price.toLocaleString()}`, 430, rowY, { width: 50, align: "right" });
                doc.text(`BDT ${itemTotal.toLocaleString()}`, 490, rowY, { width: 65, align: "right" });

                doc.moveDown(0.8);
            });

            doc.moveDown(0.5);
            doc.strokeColor("#eeeeee")
                .moveTo(40, doc.y)
                .lineTo(555, doc.y)
                .stroke();
            doc.moveDown(1);

            // Summary
            const summaryY = doc.y;
            doc.fontSize(10).fillColor("#444444");
            doc.text("Subtotal:", 380, summaryY, { width: 90, align: "right" });
            doc.text(`BDT ${invoiceData.subtotal.toLocaleString()}`, 480, summaryY, { width: 75, align: "right" });

            doc.text("Shipping Fee:", 380, summaryY + 16, { width: 90, align: "right" });
            doc.text(`BDT ${invoiceData.shippingCost.toLocaleString()}`, 480, summaryY + 16, { width: 75, align: "right" });

            if (invoiceData.discount > 0) {
                doc.text("Discount:", 380, summaryY + 32, { width: 90, align: "right" });
                doc.text(`- BDT ${invoiceData.discount.toLocaleString()}`, 480, summaryY + 32, { width: 75, align: "right" });
            }

            const totalY = summaryY + (invoiceData.discount > 0 ? 48 : 32);
            doc.strokeColor("#0a0a0a")
                .lineWidth(1)
                .moveTo(380, totalY)
                .lineTo(555, totalY)
                .stroke();

            doc.fontSize(11).fillColor("#0a0a0a");
            doc.text("Total Paid:", 380, totalY + 8, { width: 90, align: "right" });
            doc.text(`BDT ${invoiceData.totalAmount.toLocaleString()}`, 480, totalY + 8, { width: 75, align: "right" });

            doc.moveDown(3);
            doc.fontSize(9)
                .fillColor("#555555")
                .text("Thank you for choosing ARVYNO. Engineered for architectural elegance.", { align: "center" });
            doc.moveDown(0.3);
            doc.fontSize(8)
                .fillColor("#888888")
                .text("House-50, Block-F, Road-2, Eastern Housing, Pallabi, Dhaka, Bangladesh, 1216", { align: "center" });
            doc.text("Hotline: +880 1886-957897 | www.arvynobd.com", { align: "center" });

            doc.end();
        });
    } catch (error: any) {
        console.error("PDF creation error:", error);
        throw new AppError(401, `PDF creation error: ${error.message}`);
    }
};