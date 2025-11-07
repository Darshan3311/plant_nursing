import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Protect middleware – only logged-in users
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  return res.status(401).json({ message: 'No token, authorization denied' });
};

// ✅ Admin-only access
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

// ✅ Staff or Admin access
export const staffOrAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
    return res.status(403).json({ message: 'Access denied: Staff or Admin only' });
  }
  next();
};
