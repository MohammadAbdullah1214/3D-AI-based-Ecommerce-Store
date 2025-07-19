from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    joining_date = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password', 'role', 'address', 
                  'is_active', 'last_login', 'joining_date')
        extra_kwargs = {
            'password': {'write_only': True},
            'last_login': {'read_only': True},
            'is_active': {'read_only': False}
        }

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
