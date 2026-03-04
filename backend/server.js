import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import { connectDB } from './lib/db.js';
import couponsRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js'
import analyticsRoutes from './routes/analytics.route.js';


dotenv.config();


const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 5000;
console.log(PORT);
 
// parse JSON bodies first so req.body is available to routes
app.use(express.json());    
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:`+PORT);

    connectDB();
});









