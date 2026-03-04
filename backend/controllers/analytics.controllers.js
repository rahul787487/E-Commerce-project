export const getAnalyticsData = async () => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null,// single group for all documents
                totalSales: { $sum: "$totalAmount" },//
                totalOrders: { $sum: 1 },// count of orders
                totalRevenue: { $sum: "$totalAmount" },// total revenue
            },
        },
    ]);

    const {totalSales,totalRevenue} = salesData[0] || {totalSales:0,totalRevenue:0};
    return {
        users: totalUsers,
        products: totalProducts,
        totalSales,
        totalRevenue,
    };
};

export const getDailySalesData = async (startDate, endDate) => {
try {const dailySales = await Order.aggregate([
        {       $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },  
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: "$totalAmount" },
                sales: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    const dateArray = getDateInRange(startDate, endDate);
    return dateArray.map(date => {
        const foundData = dailySales.find(item => item._id === date);

        return {
            date,
            revenue: foundData ?.revenue|| 0,
            sales: foundData ?.sales|| 0,

           
        };
    });
        
    
} catch (error) {
    console.error("Error fetching daily sales data:", error);
}
}


function getDateInRange(startDate, endDate) {
    const dates= [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}