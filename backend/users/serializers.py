from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import CustomUser, PasswordResetToken

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    joining_date = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'address', 
                  'is_active', 'last_login', 'joining_date')
        extra_kwargs = {
            'password': {'write_only': True},
            'last_login': {'read_only': True},
            'is_active': {'read_only': True}
        }
    
    def validate_password(self, value):
        """Validate password using Django's password validation"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate_username(self, value):
        """Check if username is available"""
        # If this is an update and the username hasn't changed, allow it
        if self.instance and self.instance.username == value:
            return value
            
        # Check if username is taken by another user
        if CustomUser.objects.filter(username=value).exclude(id=self.instance.id if self.instance else 0).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_email(self, value):
        """Check if email is available"""
        # If this is an update and the email hasn't changed, allow it
        if self.instance and self.instance.email == value:
            return value
            
        # Check if email is taken by another user
        if value and CustomUser.objects.filter(email=value).exclude(id=self.instance.id if self.instance else 0).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    
    def validate_new_password(self, value):
        """Validate new password using Django's password validation"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Validate that current password is correct"""
        user = self.context['request'].user
        if not user.check_password(attrs['current_password']):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        return attrs

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, max_length=6)
    
    def validate(self, attrs):
        """Validate OTP"""
        email = attrs['email']
        otp = attrs['otp']
        
        try:
            # Handle multiple users with the same email by getting the first active user
            users = CustomUser.objects.filter(email=email, is_active=True)
            if not users.exists():
                raise serializers.ValidationError("No user found with this email address.")
            
            # Use the first active user
            user = users.first()
            reset_token = PasswordResetToken.objects.filter(
                user=user,
                otp=otp,
                is_used=False
            ).first()
            
            if not reset_token or not reset_token.is_valid():
                raise serializers.ValidationError("Invalid or expired OTP.")
            
            attrs['user'] = user
            attrs['reset_token'] = reset_token
            return attrs
        except Exception as e:
            raise serializers.ValidationError(f"Error validating OTP: {str(e)}")

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, max_length=6)
    new_password = serializers.CharField(required=True, write_only=True)
    
    def validate_new_password(self, value):
        """Validate new password using Django's password validation"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Validate OTP and user"""
        email = attrs['email']
        otp = attrs['otp']
        
        try:
            # Handle multiple users with the same email by getting the first active user
            users = CustomUser.objects.filter(email=email, is_active=True)
            if not users.exists():
                raise serializers.ValidationError("No user found with this email address.")
            
            # Use the first active user
            user = users.first()
            reset_token = PasswordResetToken.objects.filter(
                user=user,
                otp=otp,
                is_used=False
            ).first()
            
            if not reset_token or not reset_token.is_valid():
                raise serializers.ValidationError("Invalid or expired OTP.")
            
            attrs['user'] = user
            attrs['reset_token'] = reset_token
            return attrs
        except Exception as e:
            raise serializers.ValidationError(f"Error validating OTP: {str(e)}")
