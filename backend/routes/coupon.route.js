import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { grtCoupon, validateCoupon } from '../controllers/coupon.controllers.js';

const router = express.Router();


router.get('/',protectRoute, grtCoupon);
router.get('/validate',protectRoute, validateCoupon);





export default router;
