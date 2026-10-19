import { Category } from "../category/category.model";
import { CONTACT_STATUS } from "../contact/contact.interface";
import { Contact } from "../contact/contact.model";
import { Newsletter } from "../newsletter/newsletter.model";
import { ORDER_STATUS } from "../order/order.interface";
import { Order } from "../order/order.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Product } from "../product/product.model";
import { REVIEW_STATUS } from "../review/review.interface";
import { Review } from "../review/review.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const getDateBoundaries = () => {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    return {
        now,
        startOfToday,
        sevenDaysAgo,
        startOfMonth,
        thirtyDaysAgo,
        twelveMonthsAgo,
    };
};

/**
 * Get continuous 7-day sales breakdown (Weekly Sales)
 */
const getWeeklySalesData = async () => {
    const { sevenDaysAgo } = getDateBoundaries();

    const weeklyAgg = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: sevenDaysAgo },
                status: { $ne: ORDER_STATUS.CANCELLED },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                totalRevenue: { $sum: "$totalAmount" },
                paidRevenue: {
                    $sum: {
                        $cond: [{ $eq: ["$paymentStatus", PAYMENT_STATUS.PAID] }, "$totalAmount", 0],
                    },
                },
                orderCount: { $sum: 1 },
            },
        },
    ]);

    const salesMap = new Map<string, { totalRevenue: number; paidRevenue: number; orderCount: number }>();
    weeklyAgg.forEach((item) => {
        salesMap.set(item._id, {
            totalRevenue: item.totalRevenue || 0,
            paidRevenue: item.paidRevenue || 0,
            orderCount: item.orderCount || 0,
        });
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        const dayLabel = dayNames[d.getDay()];
        const displayLabel = `${day} ${monthNames[d.getMonth()]}`;

        const found = salesMap.get(dateStr) || { totalRevenue: 0, paidRevenue: 0, orderCount: 0 };
        result.push({
            date: dateStr,
            day: dayLabel,
            label: displayLabel,
            totalRevenue: found.totalRevenue,
            paidRevenue: found.paidRevenue,
            orderCount: found.orderCount,
        });
    }

    return result;
};

/**
 * Get continuous 12-month sales breakdown (Monthly Sales)
 */
const getMonthlySalesData = async () => {
    const { twelveMonthsAgo } = getDateBoundaries();

    const monthlyAgg = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: twelveMonthsAgo },
                status: { $ne: ORDER_STATUS.CANCELLED },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m", date: "$createdAt" },
                },
                totalRevenue: { $sum: "$totalAmount" },
                paidRevenue: {
                    $sum: {
                        $cond: [{ $eq: ["$paymentStatus", PAYMENT_STATUS.PAID] }, "$totalAmount", 0],
                    },
                },
                orderCount: { $sum: 1 },
            },
        },
    ]);

    const salesMap = new Map<string, { totalRevenue: number; paidRevenue: number; orderCount: number }>();
    monthlyAgg.forEach((item) => {
        salesMap.set(item._id, {
            totalRevenue: item.totalRevenue || 0,
            paidRevenue: item.paidRevenue || 0,
            orderCount: item.orderCount || 0,
        });
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = [];

    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const monthNum = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${year}-${monthNum}`;
        const monthName = monthNames[d.getMonth()];
        const label = `${monthName} ${year}`;

        const found = salesMap.get(key) || { totalRevenue: 0, paidRevenue: 0, orderCount: 0 };
        result.push({
            monthKey: key,
            month: monthName,
            year,
            label,
            totalRevenue: found.totalRevenue,
            paidRevenue: found.paidRevenue,
            orderCount: found.orderCount,
        });
    }

    return result;
};

/**
 * Complete Dashboard Overview Stats
 */
const getDashboardOverview = async () => {
    const { startOfToday, sevenDaysAgo, startOfMonth } = getDateBoundaries();

    const [
        // Revenue & Order Totals
        revenueSummary,
        todayOrdersAgg,
        weeklyOrdersAgg,
        monthlyOrdersAgg,
        totalOrdersCount,
        ordersByStatus,
        paymentMethodBreakdown,
        deliveryZoneBreakdown,

        // Product KPIs
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        lowStockAlertList,

        // Customer & Community KPIs
        totalUsers,
        totalActiveUsers,
        totalSubscribers,
        totalInquiries,
        pendingInquiries,
        reviewSummary,

        // Trends & Insights
        weeklySales,
        monthlySales,
        topSellingProducts,
        recentOrders,
    ] = await Promise.all([
        // 1. Overall Revenue (Excluding cancelled orders)
        Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                    paidSales: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentStatus", PAYMENT_STATUS.PAID] }, "$totalAmount", 0],
                        },
                    },
                    pendingSales: {
                        $sum: {
                            $cond: [{ $ne: ["$paymentStatus", PAYMENT_STATUS.PAID] }, "$totalAmount", 0],
                        },
                    },
                    avgOrderValue: { $avg: "$totalAmount" },
                    totalOrders: { $sum: 1 },
                },
            },
        ]),

        // 2. Today's Sales & Orders
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfToday },
                    status: { $ne: ORDER_STATUS.CANCELLED },
                },
            },
            {
                $group: {
                    _id: null,
                    todaySales: { $sum: "$totalAmount" },
                    todayOrders: { $sum: 1 },
                },
            },
        ]),

        // 3. This Week's Sales & Orders (Last 7 Days)
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    status: { $ne: ORDER_STATUS.CANCELLED },
                },
            },
            {
                $group: {
                    _id: null,
                    weeklySales: { $sum: "$totalAmount" },
                    weeklyOrders: { $sum: 1 },
                },
            },
        ]),

        // 4. This Month's Sales & Orders (Since 1st of current month)
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth },
                    status: { $ne: ORDER_STATUS.CANCELLED },
                },
            },
            {
                $group: {
                    _id: null,
                    monthlySales: { $sum: "$totalAmount" },
                    monthlyOrders: { $sum: 1 },
                },
            },
        ]),

        // 5. Total Order Count
        Order.countDocuments(),

        // 6. Orders by Status
        Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                },
            },
        ]),

        // 7. Payment Methods Breakdown
        Order.aggregate([
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                },
            },
        ]),

        // 8. Delivery Zone Breakdown
        Order.aggregate([
            {
                $group: {
                    _id: "$deliveryZone",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                },
            },
        ]),

        // 9. Product Inventory Counts
        Product.countDocuments(),
        Product.countDocuments({ stock: { $gt: 5 } }),
        Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
        Product.countDocuments({ stock: { $lte: 0 } }),

        // 10. Low Stock Alerts List (stock <= 5)
        Product.find({ stock: { $lte: 5 } })
            .select("name slug images price stock category")
            .sort({ stock: 1 })
            .limit(6)
            .lean(),

        // 11. User / Customer Stats
        User.countDocuments(),
        User.countDocuments({ isActive: IsActive.ACTIVE }),

        // 12. Newsletter Subscribers
        Newsletter.countDocuments({ isSubscribed: true }),

        // 13. Contact Concierge Inquiries
        Contact.countDocuments(),
        Contact.countDocuments({ status: CONTACT_STATUS.PENDING }),

        // 14. Reviews & Rating summary
        Review.aggregate([
            { $match: { status: REVIEW_STATUS.APPROVED } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    avgRating: { $avg: "$rating" },
                },
            },
        ]),

        // 15. Weekly Sales Trend Chart Data (Last 7 Days)
        getWeeklySalesData(),

        // 16. Monthly Sales Trend Chart Data (Last 12 Months)
        getMonthlySalesData(),

        // 17. Top Selling Products
        Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.name" },
                    image: { $first: "$items.image" },
                    price: { $first: "$items.price" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 6 },
        ]),

        // 18. Recent Orders
        Order.find()
            .sort({ createdAt: -1 })
            .limit(8)
            .select("orderNumber shippingAddress items totalAmount paymentMethod status paymentStatus createdAt")
            .lean(),
    ]);

    const revenue = revenueSummary.length > 0 ? revenueSummary[0] : {
        totalSales: 0,
        paidSales: 0,
        pendingSales: 0,
        avgOrderValue: 0,
        totalOrders: 0,
    };

    const today = todayOrdersAgg.length > 0 ? todayOrdersAgg[0] : { todaySales: 0, todayOrders: 0 };
    const thisWeek = weeklyOrdersAgg.length > 0 ? weeklyOrdersAgg[0] : { weeklySales: 0, weeklyOrders: 0 };
    const thisMonth = monthlyOrdersAgg.length > 0 ? monthlyOrdersAgg[0] : { monthlySales: 0, monthlyOrders: 0 };

    const reviewData = reviewSummary.length > 0 ? reviewSummary[0] : { totalReviews: 0, avgRating: 5 };

    return {
        // Core KPI Cards
        summary: {
            totalRevenue: Math.round(revenue.totalSales || 0),
            paidRevenue: Math.round(revenue.paidSales || 0),
            pendingRevenue: Math.round(revenue.pendingSales || 0),
            avgOrderValue: Math.round(revenue.avgOrderValue || 0),

            todayRevenue: Math.round(today.todaySales || 0),
            todayOrders: today.todayOrders || 0,

            weeklyRevenue: Math.round(thisWeek.weeklySales || 0),
            weeklyOrders: thisWeek.weeklyOrders || 0,

            monthlyRevenue: Math.round(thisMonth.monthlySales || 0),
            monthlyOrders: thisMonth.monthlyOrders || 0,

            totalOrders: totalOrdersCount,
            totalProducts,
            inStockProducts,
            lowStockProducts,
            outOfStockProducts,

            totalCustomers: totalUsers,
            totalActiveCustomers: totalActiveUsers,
            totalSubscribers,

            totalInquiries,
            pendingInquiries,

            totalReviews: reviewData.totalReviews || 0,
            avgRating: Number((reviewData.avgRating || 5).toFixed(1)),
        },

        // Charts & Visualizations
        charts: {
            weeklySales,
            monthlySales,
            ordersByStatus,
            paymentMethodBreakdown,
            deliveryZoneBreakdown,
        },

        // Actionable Tables & Lists
        topSellingProducts,
        recentOrders,
        lowStockAlertList,
    };
};

/**
 * User & Customer Analytics
 */
const getUserStats = async () => {
    const { sevenDaysAgo, thirtyDaysAgo } = getDateBoundaries();

    const [
        totalUsers,
        totalActiveUsers,
        totalInActiveUsers,
        totalBlockedUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        usersByRole,
        totalSubscribers,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: IsActive.ACTIVE }),
        User.countDocuments({ isActive: IsActive.INACTIVE }),
        User.countDocuments({ isActive: IsActive.BLOCKED }),
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 },
                },
            },
        ]),
        Newsletter.countDocuments({ isSubscribed: true }),
    ]);

    return {
        totalUsers,
        totalActiveUsers,
        totalInActiveUsers,
        totalBlockedUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        usersByRole,
        totalSubscribers,
    };
};

/**
 * Product & Inventory Analytics
 */
const getProductStats = async () => {
    const [
        totalProducts,
        totalCategories,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        featuredProducts,
        trendingProducts,
        bestSellerProducts,
        productsByCategory,
        lowStockAlerts,
    ] = await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        Product.countDocuments({ stock: { $gt: 5 } }),
        Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
        Product.countDocuments({ stock: { $lte: 0 } }),
        Product.countDocuments({ isFeatured: true }),
        Product.countDocuments({ isTrending: true }),
        Product.countDocuments({ isBestSeller: true }),
        Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    categorySlug: { $first: "$categorySlug" },
                    count: { $sum: 1 },
                    avgPrice: { $avg: "$price" },
                    totalStock: { $sum: "$stock" },
                },
            },
            { $sort: { count: -1 } },
        ]),
        Product.find({ stock: { $lte: 5 } })
            .select("name slug images price stock category")
            .sort({ stock: 1 })
            .limit(10)
            .lean(),
    ]);

    return {
        totalProducts,
        totalCategories,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        featuredProducts,
        trendingProducts,
        bestSellerProducts,
        productsByCategory,
        lowStockAlerts,
    };
};

/**
 * Order Analytics (with Weekly & Monthly Sales)
 */
const getOrderStats = async () => {
    const { startOfToday, sevenDaysAgo, startOfMonth, thirtyDaysAgo } = getDateBoundaries();

    const [
        totalOrders,
        ordersByStatus,
        todayOrdersCount,
        ordersLast7Days,
        ordersLast30Days,
        ordersThisMonth,
        revenueData,
        weeklySales,
        monthlySales,
        topSellingProducts,
    ] = await Promise.all([
        Order.countDocuments(),
        Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalValue: { $sum: "$totalAmount" },
                },
            },
        ]),
        Order.countDocuments({ createdAt: { $gte: startOfToday } }),
        Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    paidRevenue: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentStatus", PAYMENT_STATUS.PAID] }, "$totalAmount", 0],
                        },
                    },
                    pendingRevenue: {
                        $sum: {
                            $cond: [{ $ne: ["$paymentStatus", PAYMENT_STATUS.PAID] }, "$totalAmount", 0],
                        },
                    },
                    avgOrderValue: { $avg: "$totalAmount" },
                },
            },
        ]),
        getWeeklySalesData(),
        getMonthlySalesData(),
        Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.name" },
                    image: { $first: "$items.image" },
                    price: { $first: "$items.price" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
        ]),
    ]);

    const revenue = revenueData.length > 0 ? revenueData[0] : {
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        avgOrderValue: 0,
    };

    return {
        totalOrders,
        totalRevenue: Math.round(revenue.totalRevenue || 0),
        paidRevenue: Math.round(revenue.paidRevenue || 0),
        pendingRevenue: Math.round(revenue.pendingRevenue || 0),
        avgOrderValue: Math.round(revenue.avgOrderValue || 0),
        todayOrdersCount,
        ordersLast7Days,
        ordersThisMonth,
        ordersLast30Days,
        ordersByStatus,
        weeklySales,
        monthlySales,
        topSellingProducts,
    };
};

/**
 * Payment & Transaction Analytics
 */
const getPaymentStats = async () => {
    const [totalPayments, paymentsByStatus, paymentMethodBreakdown] = await Promise.all([
        Payment.countDocuments(),
        Payment.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]),
        Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                },
            },
        ]),
    ]);

    return {
        totalPayments,
        paymentsByStatus,
        paymentMethodBreakdown,
    };
};

export const StatsService = {
    getDashboardOverview,
    getWeeklySalesData,
    getMonthlySalesData,
    getUserStats,
    getProductStats,
    getOrderStats,
    getPaymentStats,
};
