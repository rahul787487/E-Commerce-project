import express from 'express';
import { getAllProducts, adminRoute,getFeaturedProducts,deleteProduct,getRecommendedProducts,getProductsByCategory,toggeleFEaturedProduct} from '../controllers/product.controllers.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createProduct } from '../controllers/product.controllers.js';


const router = express.Router();


router.get('/', protectRoute, adminRoute, getAllProducts);
router.get('/featured',  getFeaturedProducts);
router.get('/category/:category',  getProductsByCategory);
router.get('/recommendations' ,getRecommendedProducts);
router.post('/', protectRoute, adminRoute, createProduct)
router.patch('/:id', protectRoute, adminRoute, toggeleFEaturedProduct)
router.delete('/:id', protectRoute, adminRoute, deleteProduct)






export default router;