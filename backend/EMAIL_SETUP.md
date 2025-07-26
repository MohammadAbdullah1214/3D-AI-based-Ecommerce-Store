# Email Setup Guide

## Email Configuration for Gmail

This project is configured to use Gmail SMTP for sending emails for:
- **Email verification** for new user registration
- **Password reset** functionality
- **Account notifications**

### 1. Current Configuration

The system is configured with the following Gmail account:
- **Email**: awami.mail69@gmail.com
- **App Password**: hpwu ebpf zezb xfzz

### 2. Environment Variables

Create a `.env` file in the backend directory with:

```env
# Email Configuration for Gmail
EMAIL_HOST_USER=awami.mail69@gmail.com
EMAIL_HOST_PASSWORD=hpwu ebpf zezb xfzz
DEFAULT_FROM_EMAIL=awami.mail69@gmail.com
FRONTEND_URL=http://localhost:3000
```

### 3. Gmail App Password Setup (if you need to change the account)

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
4. Use this password as `EMAIL_HOST_PASSWORD`

### 4. Email Verification Flow

#### New User Registration:
1. User registers with email and password
2. System sends verification email with unique token
3. User clicks verification link in email
4. Email is marked as verified
5. User can now log in

#### Password Reset:
1. User requests password reset
2. System sends OTP to user's email
3. User enters OTP and new password
4. Password is updated

### 5. API Endpoints

#### Email Verification:
- `POST /api/auth/verify-email/` - Verify email with token
- `POST /api/auth/resend-verification/` - Resend verification email

#### Password Reset:
- `POST /api/auth/forgot-password/` - Request password reset OTP
- `POST /api/auth/verify-otp/` - Verify OTP
- `POST /api/auth/reset-password/` - Reset password with OTP

### 6. Development Testing

For development/testing without real email sending, modify `settings.py`:

```python
# Add to .env file
USE_CONSOLE_EMAIL=true
```

This will print emails to the console instead of sending them.

### 7. Frontend Integration

The frontend should handle:
- Email verification page at `/verify-email?token=<token>`
- Resend verification email functionality
- Password reset flow with OTP

### 8. Security Features

- **Token Expiration**: Email verification tokens expire after 24 hours
- **OTP Expiration**: Password reset OTPs expire after 24 hours
- **One-time Use**: Tokens and OTPs can only be used once
- **Email Verification Required**: Users must verify email before logging in (except admins)

### 9. For Production

Consider using services like:
- SendGrid
- Mailgun
- AWS SES
- Or your own SMTP server

Update the email settings accordingly in `settings.py`. 