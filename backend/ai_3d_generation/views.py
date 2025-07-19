from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import GenerationRequest, GenerationProgress
from .serializers import (
    GenerationRequestSerializer, 
    CreateGenerationRequestSerializer,
    GenerationProgressSerializer
)
from .tasks import process_3d_generation

class GenerationRequestViewSet(viewsets.ModelViewSet):
    serializer_class = GenerationRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return GenerationRequest.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateGenerationRequestSerializer
        return GenerationRequestSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the generation request
        generation_request = serializer.save()
        
        # Start the background task
        process_3d_generation.delay(str(generation_request.id))
        
        # Return the created request
        response_serializer = GenerationRequestSerializer(generation_request)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get the current status of a generation request"""
        generation_request = self.get_object()
        serializer = self.get_serializer(generation_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a generation request"""
        generation_request = self.get_object()
        
        if generation_request.status in ['pending', 'processing']:
            generation_request.status = 'cancelled'
            generation_request.save()
            return Response({'message': 'Generation request cancelled'})
        else:
            return Response(
                {'error': 'Cannot cancel request in current status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def queue_status(self, request):
        """Get the current queue status"""
        pending_count = GenerationRequest.objects.filter(status='pending').count()
        processing_count = GenerationRequest.objects.filter(status='processing').count()
        
        return Response({
            'pending_requests': pending_count,
            'processing_requests': processing_count,
            'estimated_wait_time': f"{pending_count * 2} minutes"  # Rough estimate
        })

class GenerationProgressViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = GenerationProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        request_id = self.request.query_params.get('request_id')
        if request_id:
            # Verify the user owns this request
            generation_request = get_object_or_404(
                GenerationRequest, 
                id=request_id, 
                user=self.request.user
            )
            return GenerationProgress.objects.filter(request=generation_request)
        return GenerationProgress.objects.none()
