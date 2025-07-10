from django.http import HttpResponseForbidden
from django.urls import resolve

class RoleMiddleware:
    """
    Middleware to enforce role-based access control at the URL level.
    This provides an additional layer of security beyond DRF permissions.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define URL patterns that require specific roles
        self.admin_only_urls = [
            '/admin/',
            '/api/users/',
        ]
        
        self.seller_or_admin_urls = [
            '/api/analytics/',
        ]
        
    def __call__(self, request):
        # Skip middleware for unauthenticated users - let DRF handle authentication
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return self.get_response(request)
        
        path = request.path
        
        # Check admin-only URLs
        if any(path.startswith(url) for url in self.admin_only_urls):
            if not (request.user.is_staff or request.user.role == 'admin'):
                return HttpResponseForbidden("You don't have permission to access this resource")
        
        # Check seller-or-admin URLs
        if any(path.startswith(url) for url in self.seller_or_admin_urls):
            if not (request.user.is_staff or request.user.role in ['admin', 'seller']):
                return HttpResponseForbidden("You don't have permission to access this resource")
        
        # If all checks pass, continue with the request
        return self.get_response(request)

