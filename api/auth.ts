import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './db.js';

// Demo credentials mapping
const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@vedama.co.ke': 'admin123',
  'finance@vedama.co.ke': 'finance123',
  'landlord@vedama.co.ke': 'landlord123',
  'client@vedama.co.ke': 'client123',
  'provider@vedama.co.ke': 'provider123',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  try {
    const db = await getDb();

    if (req.method === 'POST' && action === 'login') {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const expectedPwd = DEMO_CREDENTIALS[email.toLowerCase()];
      if (!expectedPwd || expectedPwd !== password) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found in database.' });
      }

      return res.status(200).json({ success: true, user });
    }

    return res.status(400).json({ success: false, error: 'Invalid request action or method.' });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error.' });
  }
}
