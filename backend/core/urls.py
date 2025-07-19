from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from users.views import UserViewSet, user_login
from products.views import WishlistViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/login/', user_login, name='user_login'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/cart/', include('carts.urls')),
    path('api/shipping/', include('shipping.urls')),
    path('api/qna/', include('qna.urls')),  
    path('api/ai-3d-generation/', include('ai_3d_generation.urls')),  # Add this line
    path('api/chatbot/', include('chatbot.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)