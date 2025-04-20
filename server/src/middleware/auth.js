import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    console.log('Token received for verification:', token);
    console.log('JWT_SECRET value and length:', `"${process.env.JWT_SECRET}"`, process.env.JWT_SECRET.length);
    console.log('Type of JWT_SECRET:', typeof process.env.JWT_SECRET);
    const user = jwt.verify(token, process.env.JWT_SECRET.trim());
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification failed:', {
      token,
      jwtSecret: process.env.JWT_SECRET,
      error: error.message
    });
    return res.status(403).json({ error: 'Invalid token', details: error.message });
  }
};
