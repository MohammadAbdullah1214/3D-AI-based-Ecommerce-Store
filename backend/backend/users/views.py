from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from django.db import transaction, connection
from django.utils import timezone
from .models import CustomUser
from .serializers import CustomUserSerializer, LoginSerializer
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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get the current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
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
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(inactive_users, many=True)
        return Response(serializer.data)