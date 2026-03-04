 import User from '../models/user.model.js';
 import jwt from 'jsonwebtoken';
 import { redis } from '../lib/redis.js';
import e from 'express';

// generate access and refresh tokens for a given userId
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    // Logic to store refresh token in Redis or database
    // Example using Redis:
    await redis.set(`refreshToken:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60); // Expires in 7 days
}

const setcookie = (res, accessToken,refreshToken) => {
    res.cookie("accessToken",accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // set to true in production
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
     res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // set to true in production
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

export const signup =  async (req, res) => {
   // ensure body parser ran and body exists
   if (!req.body) {
       return res.status(400).json({ message: 'Request body is required' });
   }

   const { name, email, password } = req.body;
   if (!name || !email || !password) {
       return res.status(400).json({ message: 'name, email and password are required' });
   }
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // create user directly from the validated request fields
        const user = await User.create({ name, email, password });

        // generate tokens and store refresh token
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        // set cookies with the real token values
        setcookie(res, accessToken, refreshToken);

        // return a safe user object (do not include password)
        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        return res.status(201).json({ message: 'User created successfully', user: safeUser });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });    
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(user && await user.comparePassword(password)){
            // generate tokens and store refresh token
            const { accessToken, refreshToken } = generateTokens(user._id);
            await storeRefreshToken(user._id, refreshToken);

            // set cookies with the real token values
            setcookie(res, accessToken, refreshToken);
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            return  res.status(401).json({ message: 'Invalid email or password' });
        } 
        
    } catch (error) {
        console.error('Login error:', error);
        
        return res.status(500).json({ message: 'Server error', error: error.message });
        
    }
};
export const logout = async (req, res) => {
    try {
        // Correctly read the refresh token value from cookies
        const refreshToken = req.cookies && req.cookies.refreshToken;

        // Clear cookies for the client in all cases
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        if (!refreshToken) {
            // nothing to remove from redis
            return res.status(200).json({ message: 'Logged out successfully' });
        }

        // Verify token to extract userId
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            // token invalid/expired — already cleared cookies, so treat as logged out
            console.warn('Refresh token verify failed on logout:', err.message);
            return res.status(200).json({ message: 'Logged out successfully' });
        }

        const userId = decoded && decoded.userId;
        if (!userId) {
            return res.status(200).json({ message: 'Logged out successfully' });
        }

        try {
            // Optional: check stored token matches the cookie (prevents deleting unrelated keys)
            const key = `refreshToken:${userId}`;
            const stored = await redis.get(key);
            if (stored && stored === refreshToken) {
                await redis.del(key);
                console.log(`Removed refresh token for user ${userId} from redis`);
            } else {
                // token mismatch or already removed
                console.warn(`No matching refresh token in redis for user ${userId} (may already be removed)`);
            }
        } catch (err) {
            console.error('Error removing refresh token from redis:', err.message);
            // don't fail logout just because redis had an issue
        }

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        // clear cookies as a safety measure
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
 // generate new access and refresh tokens using a valid refresh token
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies && req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token missing' });
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);
        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });
        res.json({ message: 'Access token refreshed' });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

//later profile route
export const getProfile = async (req, res) => {
    try {
        res.json(req.user);
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}    
