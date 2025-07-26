from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from django.db import transaction, connection
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Q
import random
from .models import CustomUser, PasswordResetToken, EmailVerificationToken
from .serializers import (
    CustomUserSerializer, LoginSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, VerifyOTPSerializer, ResetPasswordSerializer
)
from permissions import IsAdmin
import uuid
from datetime import timedelta

# Custom permission class defined directly in views.py
class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission to only allow owners of an account or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        # Allow admins to edit any profile
        if request.user.is_staff or request.user.role == 'admin':
            return True
        # Allow users to edit their own profile
        return obj.id == request.user.id

def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp):
    """Send OTP email"""
    subject = "Password Reset OTP - E-commerce Platform"
    message = f"""
    Hello,
    
    You have requested to reset your password for your e-commerce account.
    
    Your OTP (One-Time Password) is: {otp}
    
    This OTP is valid for 24 hours. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
    
    For security reasons, please do not share this OTP with anyone.
    
    Best regards,
    E-commerce Team
    awami.mail69@gmail.com
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_verification_email(user):
    """Send email verification email"""
    subject = "Verify Your Email Address"
    message = f"""
    Hello {user.username},
    
    Thank you for registering with our e-commerce platform! Please verify your email address by clicking the link below:
    
    {settings.FRONTEND_URL}/verify-email?token={user.email_verification_token}
    
    This link is valid for 24 hours. If you didn't create an account, please ignore this email.
    
    Best regards,
    Your E-commerce Team
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        user.email_verification_sent_at = timezone.now()
        user.save()
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False

def send_resend_verification_email(user):
    """Send a new verification email"""
    # Generate new token
    user.email_verification_token = uuid.uuid4()
    user.save()
    
    return send_verification_email(user)

@extend_schema(
    responses={
        200: OpenApiResponse(
            description="User statistics",
            response={
                "type": "object",
                "properties": {
                    "total_users": {"type": "integer"},
                    "active_users": {"type": "integer"},
                    "inactive_users": {"type": "integer"},
                    "verified_users": {"type": "integer"},
                    "unverified_users": {"type": "integer"},
                    "users_by_role": {
                        "type": "object",
                        "properties": {
                            "customer": {"type": "integer"},
                            "seller": {"type": "integer"},
                            "admin": {"type": "integer"}
                        }
                    },
                    "recent_registrations": {"type": "integer"}
                }
            }
        ),
        403: OpenApiResponse(description="Permission denied"),
    },
    description="Get user statistics for admin dashboard"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def user_stats(request):
    """
    Get user statistics for admin dashboard
    """
    try:
        # Get basic user counts
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(is_active=True).count()
        inactive_users = CustomUser.objects.filter(is_active=False).count()
        verified_users = CustomUser.objects.filter(email_verified=True).count()
        unverified_users = CustomUser.objects.filter(email_verified=False).count()
        
        # Get users by role
        users_by_role = CustomUser.objects.values('role').annotate(count=Count('role'))
        role_counts = {
            'customer': 0,
            'seller': 0,
            'admin': 0
        }
        
        for role_data in users_by_role:
            role_counts[role_data['role']] = role_data['count']
        
        # Get recent registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_registrations = CustomUser.objects.filter(
            date_joined__gte=thirty_days_ago
        ).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'verified_users': verified_users,
            'unverified_users': unverified_users,
            'users_by_role': role_counts,
            'recent_registrations': recent_registrations
        })
        
    except Exception as e:
        print(f"Error in user_stats: {e}")
        return Response(
            {'error': 'Failed to fetch user statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    parameters=[
        OpenApiParameter(
            name="username",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Username to check availability",
            required=True
        )
    ],
    responses={
        200: OpenApiResponse(
            description="Username availability check",
            response={"type": "object", "properties": {
                "available": {"type": "boolean"},
                "message": {"type": "string"}
            }}
        ),
        400: OpenApiResponse(description="Bad request - username parameter missing"),
    },
    description="Check if a username is available for registration"
)
@api_view(['GET'])
@permission_classes([AllowAny])
def check_username_availability(request):
    """
    Check if a username is available for registration
    """
    username = request.query_params.get('username')
    
    if not username:
        return Response(
            {'error': 'Username parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if username exists
    exists = CustomUser.objects.filter(username=username).exists()
    
    return Response({
        'available': not exists,
        'message': 'Username is available' if not exists else 'Username is already taken'
    })

@extend_schema(
    request=ForgotPasswordSerializer,
    responses={
        200: OpenApiResponse(
            description="OTP sent successfully",
            response={"type": "object", "properties": {
                "message": {"type": "string"},
                "email": {"type": "string"}
            }}
        ),
        400: OpenApiResponse(description="Bad request"),
        404: OpenApiResponse(description="Email not found"),
    },
    description="Request password reset OTP"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Request password reset OTP
    """
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    try:
        # Handle multiple users with the same email by getting the first active user
        users = CustomUser.objects.filter(email=email, is_active=True)
        if not users.exists():
            return Response({
                'email': ['No user found with this email address.']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use the first active user
        user = users.first()
        
        # Generate OTP
        otp = generate_otp()
        
        # Create or update reset token
        reset_token, created = PasswordResetToken.objects.get_or_create(
            user=user,
            defaults={'otp': otp}
        )
        
        if not created:
            # Update existing token
            reset_token.otp = otp
            reset_token.is_used = False
            reset_token.created_at = timezone.now()
            reset_token.save()
        
        # Send OTP email
        if send_otp_email(email, otp):
            return Response({
                'message': 'OTP sent successfully to your email',
                'email': email
            })
        else:
            return Response({
                'error': 'Failed to send OTP email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        print(f"Error in forgot_password: {e}")
        return Response({
            'error': 'An error occurred while processing your request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    request=VerifyOTPSerializer,
    responses={
        200: OpenApiResponse(
            description="OTP verified successfully",
            response={"type": "object", "properties": {
                "message": {"type": "string"},
                "email": {"type": "string"}
            }}
        ),
        400: OpenApiResponse(description="Invalid OTP"),
        404: OpenApiResponse(description="Email not found"),
    },
    description="Verify OTP for password reset"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP for password reset
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']
    
    try:
        # Handle multiple users with the same email by getting the first active user
        users = CustomUser.objects.filter(email=email, is_active=True)
        if not users.exists():
            return Response({
                'error': 'No user found with this email address'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Use the first active user
        user = users.first()
        reset_token = PasswordResetToken.objects.filter(
            user=user,
            otp=otp,
            is_used=False
        ).first()
        
        if not reset_token or not reset_token.is_valid():
            return Response({
                'error': 'Invalid or expired OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'OTP verified successfully',
            'email': email
        })
        
    except Exception as e:
        print(f"Error in verify_otp: {e}")
        return Response({
            'error': 'An error occurred while processing your request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    request=ResetPasswordSerializer,
    responses={
        200: OpenApiResponse(
            description="Password reset successfully",
            response={"type": "object", "properties": {
                "message": {"type": "string"}
            }}
        ),
        400: OpenApiResponse(description="Invalid OTP or password"),
        404: OpenApiResponse(description="Email not found"),
    },
    description="Reset password with OTP"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset password with OTP
    """
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']
    new_password = serializer.validated_data['new_password']
    
    try:
        # Handle multiple users with the same email by getting the first active user
        users = CustomUser.objects.filter(email=email, is_active=True)
        if not users.exists():
            return Response({
                'error': 'No user found with this email address'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Use the first active user
        user = users.first()
        reset_token = PasswordResetToken.objects.filter(
            user=user,
            otp=otp,
            is_used=False
        ).first()
        
        if not reset_token or not reset_token.is_valid():
            return Response({
                'error': 'Invalid or expired OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.save()
        
        return Response({
            'message': 'Password reset successfully'
        })
        
    except Exception as e:
        print(f"Error in reset_password: {e}")
        return Response({
            'error': 'An error occurred while processing your request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(
            description="Login successful",
            response={"type": "object", "properties": {
                "access": {"type": "string"},
                "user": {"type": "object"}
            }}
        ),
        400: OpenApiResponse(description="Bad request"),
        401: OpenApiResponse(description="Invalid credentials"),
    },
    examples=[
        OpenApiExample(
            'Login Example',
            value={
                'username': 'testuser',
                'password': 'password123'
            },
            request_only=True,
        )
    ],
    description="Authenticate user and return JWT access token"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    """
    Authenticate user and return JWT access token
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        try:
            user = CustomUser.objects.get(username=username)
            
            # Check if user is active
            if not user.is_active:
                return Response(
                    {'error': 'Account is deactivated. Please contact support.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if email is verified (for non-admin users)
            if user.role != 'admin' and not user.is_staff and not user.email_verified:
                return Response(
                    {
                        'error': 'Please verify your email address before logging in.',
                        'email_verification_required': True,
                        'email': user.email
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check password
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': user.role,
                        'email_verified': user.email_verified,
                        'is_staff': user.is_staff,
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Use IsOwnerOrAdmin for update operations
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        elif self.action == 'list':
            # Only admins can list all users
            if self.request.user.is_authenticated and self.request.user.role == 'admin':
                return [IsAuthenticated()]
            return [IsAuthenticated(), IsAdmin()]
        elif self.action == 'retrieve':
            # Use IsOwnerOrAdmin for retrieve operations
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return CustomUser.objects.none()
        
        # Admin can see all users
        if user.is_staff or user.role == 'admin':
            return CustomUser.objects.all()
        
        # Regular users can only see themselves
        return CustomUser.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        """Override to handle email verification"""
        user = serializer.save()
        
        # Set email verification token
        user.email_verification_token = uuid.uuid4()
        user.save()
        
        # Send verification email
        if user.email:
            send_verification_email(user)
        
        return user
    
    def perform_update(self, serializer):
        password = serializer.validated_data.pop('password', None)
        instance = serializer.save()
        if password:
            instance.set_password(password)
            instance.save()
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check permissions
        if not request.user.is_staff and not request.user.role == 'admin' and request.user.id != instance.id:
            return Response(
                {'error': 'You do not have permission to delete this user'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            with transaction.atomic():
                user_id = instance.id
                
                # Get all table names that might reference the user
                with connection.cursor() as cursor:
                    # Get all foreign key constraints that reference the users table
                    cursor.execute("""
                        SELECT DISTINCT
                            tc.table_name,
                            kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                            ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage ccu
                            ON ccu.constraint_name = tc.constraint_name
                        WHERE tc.constraint_type = 'FOREIGN KEY'
                            AND ccu.table_name = 'users_customuser'
                            AND tc.table_schema = 'public';
                    """)
                    
                    foreign_key_tables = cursor.fetchall()
                    
                    # Delete from each table that references the user
                    for table_name, column_name in foreign_key_tables:
                        try:
                            cursor.execute(f'DELETE FROM "{table_name}" WHERE "{column_name}" = %s', [user_id])
                            print(f"Deleted records from {table_name} where {column_name} = {user_id}")
                        except Exception as e:
                            print(f"Error deleting from {table_name}: {str(e)}")
                            # Continue with other tables even if one fails
                    
                    # Also handle some common tables that might not show up in the query
                    additional_tables = [
                        ('auth_user_groups', 'user_id'),
                        ('auth_user_user_permissions', 'user_id'),
                        ('django_admin_log', 'user_id'),
                    ]
                    
                    for table_name, column_name in additional_tables:
                        try:
                            cursor.execute(f"""
                                SELECT EXISTS (
                                    SELECT FROM information_schema.tables 
                                    WHERE table_name = %s
                                );
                            """, [table_name])
                            
                            if cursor.fetchone()[0]:  # Table exists
                                cursor.execute(f'DELETE FROM "{table_name}" WHERE "{column_name}" = %s', [user_id])
                                print(f"Deleted records from {table_name} where {column_name} = {user_id}")
                        except Exception as e:
                            print(f"Error deleting from {table_name}: {str(e)}")
                
                # Finally, delete the user
                instance.delete()
                
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            print(f"Error deleting user: {str(e)}")
            return Response(
                {'error': f'Failed to delete user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or update the current user's profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            print(f"PATCH request data: {request.data}")
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                print(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def active(self, request):
        """Get all active users"""
        active_users = CustomUser.objects.filter(is_active=True)
        page = self.paginate_queryset(active_users)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(active_users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def inactive(self, request):
        """Get all inactive users"""
        inactive_users = CustomUser.objects.filter(is_active=False)
        page = self.paginate_queryset(inactive_users)
        if page is not None:
            serializer = self.get_serializer(inactive_users, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(inactive_users, many=True)
        return Response(serializer.data)

@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'token': {'type': 'string', 'description': 'Email verification token'}
            },
            'required': ['token']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Email verified successfully",
            response={"type": "object", "properties": {
                "message": {"type": "string"},
                "user": {"type": "object"}
            }}
        ),
        400: OpenApiResponse(description="Invalid or expired token"),
        404: OpenApiResponse(description="Token not found"),
    },
    description="Verify email address with token"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify email address with token
    """
    token = request.data.get('token')
    
    if not token:
        return Response(
            {'error': 'Token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Find user with this verification token
        user = CustomUser.objects.get(email_verification_token=token)
        
        # Check if token is still valid (24 hours)
        if user.email_verification_sent_at:
            time_diff = timezone.now() - user.email_verification_sent_at
            if time_diff > timedelta(hours=24):
                return Response(
                    {'error': 'Verification token has expired. Please request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Mark email as verified
        user.email_verified = True
        user.email_verification_token = None
        user.email_verification_sent_at = None
        user.save()
        
        return Response({
            'message': 'Email verified successfully! You can now log in to your account.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'email_verified': user.email_verified
            }
        }, status=status.HTTP_200_OK)
        
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Invalid verification token'},
            status=status.HTTP_404_NOT_FOUND
        )

@extend_schema(
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'description': 'User email address'}
            },
            'required': ['email']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Verification email sent successfully",
            response={"type": "object", "properties": {
                "message": {"type": "string"},
                "email": {"type": "string"}
            }}
        ),
        400: OpenApiResponse(description="Bad request"),
        404: OpenApiResponse(description="Email not found"),
    },
    description="Resend email verification"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    """
    Resend email verification
    """
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = CustomUser.objects.get(email=email)
        
        if user.email_verified:
            return Response(
                {'error': 'Email is already verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send new verification email
        if send_resend_verification_email(user):
            return Response({
                'message': 'Verification email sent successfully',
                'email': email
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to send verification email'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Email not found'},
            status=status.HTTP_404_NOT_FOUND
        )
