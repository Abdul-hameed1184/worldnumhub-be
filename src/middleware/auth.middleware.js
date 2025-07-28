import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectedRoute = async (req, res, next) => {
    // export const protectedRoute = async (req, res, next) =>{
    if (!req.cookies) {
        return res.status(400).json({ message: 'Cookies are not enabled or missing' });
    }

    try {
        const token = req.cookies.jwt;
        console.log(token)

        if(!token) return res.status(401).json({message: 'Unauthorized- No token provided'});

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if(!decoded) return res.status(401).json({message: 'Unauthorized-No token provided'});

        const user = await User.findById(decoded.userId).select("-password")
        console.log(user)

        if(!user) return res.status(404).json({message: 'User not found'});
        req.user = user;
        // console.log(user)
        next();
    } catch (error) {
        console.log('error in protected  route middleware', error.message);
        res.status(401).json({message: 'Unauthorized'});
    }
}