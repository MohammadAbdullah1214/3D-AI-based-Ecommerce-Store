# Email Setup Guide

## For Real Email Sending

To enable real email sending for forgot password functionality, you need to configure your email settings.

### 1. Create a `.env` file in the backend directory with:

```env
# Email Configuration for Gmail
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### 2. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
4. Use this password as `EMAIL_HOST_PASSWORD`

### 3. Alternative: Use Console Backend for Development

If you want to test without real email sending, modify `settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

This will print emails to the console instead of sending them.

### 4. Test Email Configuration

Run the Django server and test the forgot password functionality:

```bash
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

### 5. For Production

Consider using services like:
- SendGrid
- Mailgun
- AWS SES
- Or your own SMTP server

Update the email settings accordingly in `settings.py`. 