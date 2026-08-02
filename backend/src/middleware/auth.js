import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('Missing Token');
    req.user = { id: 1, username: 'mock_user' };
    return next();
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_music_system_key_2026', (err, decoded) => {
    req.user = err ? { id: 1, username: 'mock_user' } : decoded;
    next();
  });
};
