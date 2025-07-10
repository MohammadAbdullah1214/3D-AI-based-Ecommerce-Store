from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admin users to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.role == 'admin')

class IsSeller(permissions.BasePermission):
    """
    Permission to only allow seller users to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'seller'

class IsSellerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow sellers or admins to access the view.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_staff or request.user.role in ['admin', 'seller']

class IsProductSeller(permissions.BasePermission):
    """
    Permission to only allow the seller of a product to modify it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request, so we'll always allow GET, HEAD or OPTIONS requests
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Only the seller of the product can modify it
        return request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.role == 'admin' or 
            (request.user.role == 'seller' and obj.seller == request.user)
        )

class IsOrderCustomer(permissions.BasePermission):
    """
    Permission to only allow the customer who placed the order to view or modify it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin and staff can access all orders
        if request.user.is_staff or request.user.role == 'admin':
            return True
            
        # Sellers can view orders that contain their products
        if request.user.role == 'seller':
            return obj.items.filter(product__seller=request.user).exists()
            
        # Customers can only view their own orders
        return request.user.is_authenticated and obj.customer == request.user

class IsCartOwner(permissions.BasePermission):
    """
    Permission to only allow the owner of a cart to view or modify it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin and staff can access all carts
        if request.user.is_staff or request.user.role == 'admin':
            return True
            
        # Users can only access their own cart
        return request.user.is_authenticated and obj.customer == request.user

