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
import random
from .models import CustomUser, PasswordResetToken
from .serializers import (
    CustomUserSerializer, LoginSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, VerifyOTPSerializer, ResetPasswordSerializer
)
from permissions import IsAdmin

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
    subject = "Password Reset OTP"
    message = f"""
    Hello,
    
    You have requested to reset your password. Your OTP is: {otp}
    
    This OTP is valid for 24 hours. If you didn't request this, please ignore this email.
    
    Best regards,
    Your E-commerce Team
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
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    username = serializer.validated_data.get('username')
    password = serializer.validated_data.get('password')
    
    user = CustomUser.objects.filter(username=username).first()
    
    if user is None or not user.check_password(password):
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Update last login time
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'user': CustomUserSerializer(user).data
    })

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
        password = serializer.validated_data.pop('password', None)
        instance = serializer.save()
        if password:
            instance.set_password(password)
            instance.save()
    
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
            # Use a direct SQL approach to delete the user
            # This avoids ORM cascading which might try to access non-existent tables
            with connection.cursor() as cursor:
                # Get the user ID for use in queries
                user_id = instance.id
                
                # List of tables to check and clean up before deleting the user
                # We'll only delete from tables that actually exist
                tables_to_check = [
                    # Format: (table_name, column_name)
                    ('carts_cart', 'customer_id'),
                    ('products_product', 'seller_id'),
                    ('products_category', 'creator_id'),
                    ('products_review', 'user_id'),
                    ('products_productview', 'user_id'),
                    ('orders_order', 'user_id'),
                    ('shipping_shippingmethod', 'creator_id'),
                    ('shipping_shippingaddress', 'user_id'),
                    ('analytics_useractivity', 'user_id'),  # Added this table
                    # Add any other tables that might reference users
                ]
                
                # Check each table and delete related records if the table exists
                for table_name, column_name in tables_to_check:
                    try:
                        # Check if the table exists
                        cursor.execute(f"""
                            SELECT EXISTS (
                                SELECT FROM information_schema.tables 
                                WHERE table_name = %s
                            );
                        """, [table_name])
                        table_exists = cursor.fetchone()[0]
                        
                        if table_exists:
                            # Check if the column exists in the table
                            cursor.execute(f"""
                                SELECT EXISTS (
                                    SELECT FROM information_schema.columns 
                                    WHERE table_name = %s AND column_name = %s
                                );
                            """, [table_name, column_name])
                            column_exists = cursor.fetchone()[0]
                            
                            if column_exists:
                                # Delete records where the user is referenced
                                cursor.execute(f"""
                                    DELETE FROM "{table_name}" 
                                    WHERE "{column_name}" = %s
                                """, [user_id])
                    except Exception as e:
                        # Log the error but continue with other tables
                        print(f"Error handling {table_name}: {str(e)}")
                
                # Finally, delete the user
                cursor.execute('DELETE FROM "users_customuser" WHERE "id" = %s', [user_id])
                
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
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