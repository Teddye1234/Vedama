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

  const { action } = req.query;

  try {
    const db = await getDb();

    // 1. Standard Login Check
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found in database.' });
      }

      if (user.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      return res.status(200).json({ success: true, user });
    }

    // 2. Request OTP Code (Signup, Reset, or Change)
    if (req.method === 'POST' && action === 'request-otp') {
      const { email, phone, purpose } = req.body || {};

      if (!email || !purpose) {
        return res.status(400).json({ success: false, error: 'Email and purpose are required.' });
      }

      if (purpose === 'signup') {
        const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
          return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
        }
      }

      if (purpose === 'reset') {
        const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (!existingUser) {
          return res.status(400).json({ success: false, error: 'No account found with this email address.' });
        }
      }

      // Generate OTP Code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Clear older OTPs for same user and purpose
      if (!db.otpCodes) db.otpCodes = [];
      db.otpCodes = db.otpCodes.filter((o: any) => 
        !(o.email.toLowerCase() === email.toLowerCase() && o.purpose === purpose)
      );

      // Save new OTP with 10-minute expiry
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      db.otpCodes.push({
        id: `otp_${Math.random().toString(36).substring(2, 9)}`,
        email: email.toLowerCase(),
        phone: phone || '',
        code: otpCode,
        purpose,
        createdAt: new Date().toISOString(),
        expiresAt
      });

      await saveDb(db);

      // Dispatch notification
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const notifyUrl = `${protocol}://${host}/api/notify`;

        let message = `Your Vedama OTP verification code is: ${otpCode}. It expires in 10 minutes.`;
        if (purpose === 'signup') {
          message = `Welcome to Vedama! Use verification code ${otpCode} to complete your Client registration. Expires in 10 minutes.`;
        } else if (purpose === 'reset') {
          message = `Use verification code ${otpCode} to reset your Vedama account password. Expires in 10 minutes.`;
        } else if (purpose === 'change') {
          message = `You requested a password change. Your verification code is ${otpCode}. Expires in 10 minutes.`;
        }

        // Trigger dispatch call
        await fetch(notifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: phone ? 'sms' : 'email',
            recipient: phone || email,
            recipientName: email,
            subject: `Vedama OTP Code: ${otpCode}`,
            message
          })
        });
      } catch (err) {
        console.error('Failed to trigger background OTP notification, printing code directly:', err);
      }

      // Print to system console for high visibility in local development & simulation
      console.log(`[OTP DISPATCH] Destination: ${email} | Purpose: ${purpose.toUpperCase()} | Code: ${otpCode}`);

      return res.status(200).json({ success: true, message: 'OTP verification code dispatched successfully.' });
    }

    // 3. Verify OTP & Sign Up Client
    if (req.method === 'POST' && action === 'verify-otp-signup') {
      const { name, email, phone, password, otp } = req.body || {};

      if (!name || !email || !phone || !password || !otp) {
        return res.status(400).json({ success: false, error: 'All signup fields are required.' });
      }

      if (!db.otpCodes) db.otpCodes = [];

      // Validate OTP
      const validOtp = db.otpCodes.find((o: any) => 
        o.email.toLowerCase() === email.toLowerCase() &&
        o.code === otp &&
        o.purpose === 'signup' &&
        new Date(o.expiresAt).getTime() > Date.now()
      );

      if (!validOtp) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification OTP.' });
      }

      // Remove used OTP
      db.otpCodes = db.otpCodes.filter((o: any) => o.id !== validOtp.id);

      // Re-verify uniqueness
      const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
      }

      const newId = `c_usr_${Math.random().toString(36).substring(2, 9)}`;

      // Insert User
      const newUser = {
        id: newId,
        name,
        email: email.toLowerCase(),
        phone,
        role: 'client',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        password
      };
      db.users.push(newUser);

      // Insert Client
      if (!db.clients) db.clients = [];
      db.clients.push({
        id: newId,
        name,
        email: email.toLowerCase(),
        phone,
        avatar: `https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1494790108377-be9c29b29330', '1507003211169-0a1dd7228f2d', '1580489944761-15a19d654956'][Math.floor(Math.random() * 4)]}?w=150`,
        address: 'Vedama Registered Client',
        otherInfo: `Registered via OTP verification on ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);

      return res.status(200).json({ success: true, user: newUser });
    }

    // 4. Verify OTP & Reset Password (Forgot Password)
    if (req.method === 'POST' && action === 'verify-otp-reset') {
      const { email, password, otp } = req.body || {};

      if (!email || !password || !otp) {
        return res.status(400).json({ success: false, error: 'Email, new password, and OTP are required.' });
      }

      if (!db.otpCodes) db.otpCodes = [];

      // Validate OTP
      const validOtp = db.otpCodes.find((o: any) => 
        o.email.toLowerCase() === email.toLowerCase() &&
        o.code === otp &&
        o.purpose === 'reset' &&
        new Date(o.expiresAt).getTime() > Date.now()
      );

      if (!validOtp) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification OTP.' });
      }

      // Find user
      const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
      }

      // Update password
      user.password = password;

      // Remove used OTP
      db.otpCodes = db.otpCodes.filter((o: any) => o.id !== validOtp.id);

      await saveDb(db);

      return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    }

    // 5. Verify OTP & Change Password (Logged-in User)
    if (req.method === 'POST' && action === 'verify-otp-change') {
      const { email, password, otp } = req.body || {};

      if (!email || !password || !otp) {
        return res.status(400).json({ success: false, error: 'Email, new password, and OTP are required.' });
      }

      if (!db.otpCodes) db.otpCodes = [];

      // Validate OTP
      const validOtp = db.otpCodes.find((o: any) => 
        o.email.toLowerCase() === email.toLowerCase() &&
        o.code === otp &&
        o.purpose === 'change' &&
        new Date(o.expiresAt).getTime() > Date.now()
      );

      if (!validOtp) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification OTP.' });
      }

      // Find user
      const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
      }

      // Update password
      user.password = password;

      // Remove used OTP
      db.otpCodes = db.otpCodes.filter((o: any) => o.id !== validOtp.id);

      await saveDb(db);

      return res.status(200).json({ success: true, message: 'Password has been updated successfully.' });
    }

    return res.status(400).json({ success: false, error: 'Invalid request action or method.' });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error.' });
  }
}
