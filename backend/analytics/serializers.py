from rest_framework import serializers
from .models import Analytics

class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = '__all__'
        read_only_fields = ('seller',)