import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, saveDb } from './db.js';

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

  try {
    if (req.method === 'GET') {
      const db = await getDb();
      return res.status(200).json({ success: true, data: db });
    }

    if (req.method === 'POST') {
      const { state } = req.body || {};

      if (!state) {
        return res.status(400).json({ success: false, error: 'Database state body is required.' });
      }

      // Basic structure validation
      if (!Array.isArray(state.properties) || !Array.isArray(state.transactions) || !Array.isArray(state.tenants)) {
        return res.status(400).json({ success: false, error: 'Malformed database state payload.' });
      }

      await saveDb(state);
      return res.status(200).json({ success: true, message: 'Database successfully persisted.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  } catch (error: any) {
    console.error('Data Sync API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error.' });
  }
}
