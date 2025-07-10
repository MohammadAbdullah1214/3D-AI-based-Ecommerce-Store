from rest_framework import serializers
from .models import GenerationRequest, GenerationImage, GenerationProgress

class GenerationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationImage
        fields = ['id', 'image', 'angle', 'detected_angle', 'order', 'width', 'height', 'file_size']

class GenerationProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationProgress
        fields = ['stage', 'progress', 'message', 'timestamp']

class GenerationRequestSerializer(serializers.ModelSerializer):
    images = GenerationImageSerializer(many=True, read_only=True)
    progress_logs = GenerationProgressSerializer(many=True, read_only=True)
    
    class Meta:
        model = GenerationRequest
        fields = [
            'id', 'user', 'product', 'detail_level', 'status', 'stage', 
            'progress', 'message', 'estimated_time_remaining', 
            'generated_model_file', 'polygon_count', 'file_size', 
            'generation_time', 'error_message', 'created_at', 
            'started_at', 'completed_at', 'images', 'progress_logs'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'stage', 'progress', 'message',
            'estimated_time_remaining', 'generated_model_file', 
            'polygon_count', 'file_size', 'generation_time', 
            'error_message', 'started_at', 'completed_at'
        ]

class CreateGenerationRequestSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        min_length=2,
        max_length=6
    )
    angles = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        min_length=2,
        max_length=6
    )
    
    class Meta:
        model = GenerationRequest
        fields = ['product', 'detail_level', 'images', 'angles']
    
    def create(self, validated_data):
        images_data = validated_data.pop('images')
        angles_data = validated_data.pop('angles')
        
        # Create the generation request
        request = GenerationRequest.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
        
        # Create associated images
        for i, (image, angle) in enumerate(zip(images_data, angles_data)):
            GenerationImage.objects.create(
                request=request,
                image=image,
                angle=angle,
                order=i
            )
        
        return request
