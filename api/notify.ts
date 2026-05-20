import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, saveDb } from './db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS Headers
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const { type, recipient, recipientName, subject, message } = req.body || {};

  if (!type || !recipient || !message) {
    return res.status(400).json({ success: false, error: 'Missing type, recipient, or message.' });
  }

  const logPayload = {
    channel: type,
    recipient,
    recipientName: recipientName || 'Client',
    subject: subject || 'Notification Alert',
    message,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    providerResponse: {} as any
  };

  try {
    let delivered = false;
    let providerName = 'Simulator';

    // 1. WHATSAPP GATEWAY (via Twilio)
    if (type === 'whatsapp') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default

      if (accountSid && authToken) {
        providerName = 'Twilio WhatsApp API';
        const cleanRecipient = recipient.startsWith('+') ? recipient : `+${recipient}`;
        const to = `whatsapp:${cleanRecipient}`;

        const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: message
          })
        });

        const twilioData = await twilioRes.json();
        logPayload.providerResponse = twilioData;

        if (twilioRes.ok) {
          delivered = true;
          logPayload.status = 'delivered';
        } else {
          logPayload.status = 'failed';
          throw new Error(`Twilio WhatsApp API error: ${twilioData.message || twilioRes.statusText}`);
        }
      }
    }

    // 2. SMS / NORMAL MESSAGE GATEWAY (via Africa's Talking or Twilio)
    if (type === 'sms') {
      const atUsername = process.env.AFRICASTALKING_USERNAME;
      const atApiKey = process.env.AFRICASTALKING_API_KEY;
      const atFrom = process.env.AFRICASTALKING_FROM;

      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_SMS_FROM;

      // Prioritize Africa's Talking for East African / Kenyan numbers (+254)
      if (atUsername && atApiKey) {
        providerName = 'Africa\'s Talking SMS API';
        const cleanRecipient = recipient.startsWith('+') ? recipient : `+${recipient}`;
        const atUrl = 'https://api.africastalking.com/version1/messaging';

        const atRes = await fetch(atUrl, {
          method: 'POST',
          headers: {
            'apiKey': atApiKey,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            username: atUsername,
            to: cleanRecipient,
            message: message,
            ...(atFrom ? { from: atFrom } : {})
          })
        });

        const atData = await atRes.json();
        logPayload.providerResponse = atData;

        if (atRes.ok && atData.SMSMessageData && atData.SMSMessageData.Recipients) {
          delivered = true;
          logPayload.status = 'delivered';
        } else {
          logPayload.status = 'failed';
          throw new Error(`Africa's Talking SMS API error: ${JSON.stringify(atData)}`);
        }
      }
      // Fallback to Twilio for SMS
      else if (twilioSid && twilioAuth && twilioFrom) {
        providerName = 'Twilio SMS API';
        const cleanRecipient = recipient.startsWith('+') ? recipient : `+${recipient}`;

        const authString = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: cleanRecipient,
            From: twilioFrom,
            Body: message
          })
        });

        const twilioData = await twilioRes.json();
        logPayload.providerResponse = twilioData;

        if (twilioRes.ok) {
          delivered = true;
          logPayload.status = 'delivered';
        } else {
          logPayload.status = 'failed';
          throw new Error(`Twilio SMS API error: ${twilioData.message || twilioRes.statusText}`);
        }
      }
    }

    // 3. EMAIL GATEWAY (via Resend or SMTP)
    if (type === 'email') {
      const resendApiKey = process.env.RESEND_API_KEY;
      const emailFrom = process.env.EMAIL_FROM || 'notifications@vedama.co.ke';

      // 3a. Deliver via Resend
      if (resendApiKey) {
        providerName = 'Resend Email API';
        const resendUrl = 'https://api.resend.com/emails';

        const htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
            <div style="text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 10px; margin-bottom: 20px;">
              <h1 style="color: #2e7d32; margin: 0;">Vedama Company Limited</h1>
              <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Safe & Secure Land Investment</p>
            </div>
            <h3 style="color: #2e7d32;">Hello ${recipientName || 'Valued Client'},</h3>
            <p style="line-height: 1.6; font-size: 15px;">${message.replace(/\n/g, '<br/>')}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">
              This is an automated operational alert from Vedama Co. Ltd. <br/>
              Limuru Road, Farm House 5, Kiambu, Kenya.
            </p>
          </div>
        `;

        const resendRes = await fetch(resendUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `Vedama Platform <${emailFrom}>`,
            to: recipient,
            subject: subject || 'Vedama System Notification',
            html: htmlContent
          })
        });

        const resendData = await resendRes.json();
        logPayload.providerResponse = resendData;

        if (resendRes.ok) {
          delivered = true;
          logPayload.status = 'delivered';
        } else {
          logPayload.status = 'failed';
          throw new Error(`Resend Email API error: ${JSON.stringify(resendData)}`);
        }
      }
      // 3b. Deliver via NodeMailer / SMTP if package installed
      else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          const nodemailer = await import('nodemailer');
          providerName = 'SMTP NodeMailer';
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Vedama Notifications'}" <${emailFrom}>`,
            to: recipient,
            subject: subject || 'Vedama System Notification',
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px;">${message.replace(/\n/g, '<br/>')}</div>`
          });

          delivered = true;
          logPayload.status = 'delivered';
        } catch (e: any) {
          logPayload.status = 'failed';
          throw new Error(`SMTP Mailer error: ${e.message}`);
        }
      }
    }

    // 4. SIMULATOR LOGS (If no real credentials supplied)
    if (!delivered) {
      logPayload.status = 'simulated_delivered';
      console.log('=============== VISUAL NOTIFICATION GATEWAY (SIMULATOR) ===============');
      console.log(`Channel   : ${type.toUpperCase()}`);
      console.log(`To        : ${recipientName} (${recipient})`);
      console.log(`Subject   : ${subject || 'N/A'}`);
      console.log(`Message   : ${message}`);
      console.log(`Provider  : ${providerName} Fallback`);
      console.log('========================================================================');
    }

    // Save notification to the persistent database logs list
    const db = await getDb();
    const newLog = {
      id: `msg_${Math.random().toString(36).substring(2, 9)}`,
      type,
      recipient,
      recipientName: recipientName || 'Client',
      subject: subject || 'System Alert',
      message,
      status: logPayload.status === 'delivered' ? 'delivered' : 'sent',
      category: (subject?.toLowerCase().includes('payment') ? 'payment_reminder' : 
                 subject?.toLowerCase().includes('receipt') || subject?.toLowerCase().includes('clearance') ? 'receipt' : 'alert') as any,
      sentAt: new Date().toISOString()
    };

    db.communicationLogs = [newLog, ...db.communicationLogs];
    await saveDb(db);

    return res.status(200).json({
      success: true,
      delivered: delivered,
      provider: providerName,
      message: delivered ? 'Notification successfully transmitted.' : 'Notification logged and printed to system console (Simulator Mode).',
      log: newLog
    });

  } catch (error: any) {
    console.error('Notification API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Notification transmission failed.' });
  }
}
