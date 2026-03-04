import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { adminRoute } from '../controllers/product.controllers.js';
import { get } from 'mongoose';
import { getAnalyticsData, getDailySalesData } from '../controllers/analytics.controllers.js';

const router = express.Router();


router.get("/", protectRoute, adminRoute, async (req, res) => {
    {
        try {
            const analyticsData = await getAnalyticsData();


            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // last 7 days

            const dailySales = await getDailySalesData(startDate, endDate);
            res.json({ analyticsData, dailySales });

        } catch (error) {
            console.error("Error fetching analytics data:", error);
            res.status(500).json({ message: "Server error", error: error.message });

        }
    }
}



)


export default router;