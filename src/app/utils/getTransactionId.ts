export const getTransactionId = () => {
    return `ARV_TXN_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;
};