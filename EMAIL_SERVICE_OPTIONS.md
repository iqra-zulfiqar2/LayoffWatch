# Email Service Options for Magic Link Authentication

Your LayoffTracker app now supports multiple email services. Here are your options:

## 1. SendGrid (Recommended for Production)
- **Free tier**: 100 emails/day
- **Setup**: 
  1. Create account at https://sendgrid.com
  2. Get API key from Settings > API Keys
  3. Add `SENDGRID_API_KEY=SG.your_key_here` to secrets
- **Pros**: Reliable, good deliverability, detailed analytics
- **Cons**: Requires account setup

## 2. Gmail (Easy Setup)
- **Free tier**: 500 emails/day
- **Setup**:
  1. Enable 2-factor authentication on your Gmail
  2. Generate App Password: Google Account > Security > App passwords
  3. Add these secrets:
     - `GMAIL_USER=your.email@gmail.com`
     - `GMAIL_APP_PASSWORD=your_16_char_password`
- **Pros**: Quick setup if you have Gmail
- **Cons**: Lower sending limits, may go to spam

## 3. Resend (Developer-Friendly)
- **Free tier**: 3,000 emails/month
- **Setup**:
  1. Create account at https://resend.com
  2. Get API key from dashboard
  3. Add `RESEND_API_KEY=re_your_key_here` to secrets
- **Pros**: Modern, great for developers, good deliverability
- **Cons**: Newer service

## 4. Custom SMTP (Any Email Provider)
- **Setup**: Add these secrets:
  - `SMTP_HOST=smtp.your-provider.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=your_username`
  - `SMTP_PASS=your_password`
  - `SMTP_SECURE=false` (true for port 465)
- **Pros**: Works with any email provider
- **Cons**: Requires technical setup

## 5. Development Mode (Current)
- No setup required
- Emails are logged to console instead of sent
- Perfect for testing the magic link flow

## Quick Recommendations:

**For testing/development**: Use current console logging (no setup needed)

**For personal projects**: Gmail (easiest setup)

**For professional apps**: SendGrid or Resend (best deliverability)

**For corporate**: Custom SMTP with your company's email service

## Currently Active
Your app is in **development mode** - emails are logged to the console. You can test the magic link flow by:
1. Requesting a magic link
2. Checking the console logs for the magic link URL
3. Copying the URL to your browser to sign in

Would you like me to help you set up any of these email services?