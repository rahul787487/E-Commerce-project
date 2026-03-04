import express from 'express';
import { login, logout, signup,refreshToken, getProfile } from '../controllers/auth.controllers.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();


router.post('/signup', signup)

router.post('/login',login);               
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);


//later profile route
router.get("/profile", protectRoute, getProfile);

export default router;
//b0AKN3nOP2A9Dthm  