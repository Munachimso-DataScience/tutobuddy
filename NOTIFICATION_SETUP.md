# Notification System Setup Guide

## Overview
Your TutorBuddy application has an automated notification system that sends emails to users:
- **Inactivity Reminders**: Sent to users who haven't been active for 48 hours
- **Weekly Progress Reports**: Sent every 7 days with activity summaries

## What Was Fixed

### 1. **Missing Email Configuration**
   - Added SMTP settings to `backend/.env`
   - Both `SMTP_*` and `EMAIL_*` variables now configured
   - Improved error handling with config validation

### 2. **Better Error Tracking**
   - Notification system now logs success/failure per user
   - Scheduler shows status updates with emojis
   - Missing configuration is detected and reported

### 3. **Graceful Failures**
   - If email not configured, notifications skip gracefully
   - Individual email failures don't stop other notifications
   - Clear error messages in logs for debugging

## How to Configure Email Service

### Option 1: Use Mailtrap (Recommended for Testing)
Mailtrap is free and perfect for development.

1. **Create Mailtrap Account**
   - Go to https://mailtrap.io
   - Sign up for a free account
   - Create an inbox

2. **Get Your Credentials**
   - Go to Inbox Settings → Integrations
   - Select "Nodemailer" from the dropdown
   - Copy your credentials:
     ```
     Host: smtp.mailtrap.io
     Port: 2525
     User: [your_user_id]
     Pass: [your_password]
     ```

3. **Update backend/.env**
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_user_id
   SMTP_PASS=your_mailtrap_password
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_mailtrap_user_id
   EMAIL_PASS=your_mailtrap_password
   ```

4. **Restart Backend**
   ```bash
   cd backend
   npm start
   # or for development
   npm run dev
   ```

### Option 2: Use Gmail (Production)
For a real production setup:

1. **Enable Gmail App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail and Windows Computer
   - Generate app password
   - Copy the 16-character password

2. **Update backend/.env**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

3. **Restart Backend**

### Option 3: Use SendGrid (Enterprise)
1. Create SendGrid account: https://sendgrid.com
2. Get API key from dashboard
3. Update `.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your_sendgrid_api_key
   ```

## Testing Notifications

### Check Backend Health
```bash
curl http://localhost:5000/health
```

### Manually Trigger Notifications (Testing Only)
```bash
# Test inactivity check (requires auth token)
curl -X POST http://localhost:5000/api/notifications/check-inactivity \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"

# Test weekly reports (requires auth token)
curl -X POST http://localhost:5000/api/notifications/weekly-report \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

### View Mailtrap Inbox
- If using Mailtrap, emails appear in your Mailtrap inbox immediately
- Check the "Demo Inbox" tab to see sent emails
- No real emails are sent (safe for testing)

## How Notifications Work

### Inactivity Check
- **Runs**: Every 24 hours (first check 10 seconds after backend starts)
- **Triggers**: For users with no activity in 48 hours
- **Message**: Encouragement to return and continue learning

### Weekly Progress Report
- **Runs**: Every 7 days
- **Triggers**: For all users
- **Message**: Summary of activities, materials studied, and motivational message

### Scheduling
- Handled by Node.js `setInterval()`
- No external scheduler needed
- Works as long as backend process is running

## Troubleshooting

### Emails Not Sending?

1. **Check Backend Logs**
   ```
   ⚠️  Email configuration incomplete. Missing: SMTP_HOST, SMTP_PORT, ...
   Notifications will not be sent. Configure SMTP settings in .env
   ```
   → Add missing SMTP variables to `.env`

2. **Restart Backend After .env Changes**
   ```bash
   # Kill current process and restart
   npm start
   ```

3. **Check Email Credentials**
   - Verify host, port, user, password are correct
   - For Gmail: Make sure app password is used (not regular password)
   - For Mailtrap: Use exact credentials from integration settings

4. **View Detailed Logs**
   - Look for `✓ Sent [email] to user@example.com`
   - Or `✗ Failed to send to user@example.com: [error]`

5. **Test SMTP Connection**
   ```bash
   # Use telnet to test connection
   telnet smtp.mailtrap.io 2525
   # Should connect successfully
   ```

## Email Content

### Inactivity Reminder
```
From: Study Companion <no-reply@studybuddy.ai>
Subject: Don't break your streak! 📚

Hi [User Name], we haven't seen you in 48 hours. 
Keep up the momentum on your courses!
```

### Weekly Progress Report
```
From: Study Companion Reports <reports@studybuddy.ai>
Subject: Your Weekly Progress Report 📈

Weekly Summary for [User Name]
- Activities Logged: [count]
- New Materials Studied: [count]
Keep pushing towards your goals!
```

## Security Notes

⚠️ **Important**: 
- Never commit `.env` file to Git
- Keep SMTP credentials private
- Use app-specific passwords (not main passwords)
- For production, use environment variables from hosting platform

## Next Steps

1. ✅ Configure SMTP credentials in `backend/.env`
2. ✅ Restart backend server
3. ✅ Check console logs for "✓ Scheduler started successfully"
4. ✅ Wait for automatic notifications (or manually trigger for testing)
5. ✅ Monitor email inbox for deliveries

## Support

If notifications still don't work:
1. Check `backend/src/controllers/notificationController.ts` logs
2. Verify SMTP credentials are correct
3. Test email service independently
4. Check firewall/network allows SMTP connections
