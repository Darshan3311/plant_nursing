import User from '../models/User.js';
import { generateToken } from '../utils/token.js';

export const loginUser = async (req, res) => {
  const { staffId, password } = req.body;
  console.log('Login Request:', staffId, password);

  try {
    const user = await User.findOne({ staffId });
    console.log('User found:', user);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);
    console.log('Generated token:', token);

    res.json({
      _id: user._id,
      staffId: user.staffId,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
