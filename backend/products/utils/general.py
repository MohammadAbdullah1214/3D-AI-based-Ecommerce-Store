# pyright: reportAttributeAccessIssue=false, reportCallIssue=false
import os
import logging
from products.models import Product, ProductImage
from ai_3d_generation.models import GenerationRequest, GenerationImage
from ai_3d_generation.tasks import process_3d_generation

logger = logging.getLogger(__name__)

def create_generation_request_from_files(product, image_angle_map, detail_level='medium', clothing_type='tshirt'):
    """
    Creates a 3D generation request for a product directly from a map of uploaded files.
    - product: The Product instance.
    - image_angle_map: A dictionary mapping angle names to UploadedFile objects,
      e.g., {'front': <File>, 'back': <File>}.
    - detail_level: The quality of the generation ('low', 'medium', 'high').
    - clothing_type: The type of clothing to generate ('tshirt', 'pants', 'shirts', 'shoes').
    """
    if not (2 <= len(image_angle_map) <= 6):
        logger.warning(f"Incorrect number of images for product {product.id} to start generation. Must be between 2 and 6.")
        return None

    # Check if a generation is already running
    if GenerationRequest.objects.filter(product=product, status__in=['pending', 'processing']).exists():
        logger.warning(f"A 3D model generation is already in progress for product {product.id}.")
        return None

    try:
        generation_request = GenerationRequest.objects.create(
            user=product.seller,
            product=product,
            detail_level=detail_level
        )

        for i, (angle, image_file) in enumerate(image_angle_map.items()):
            GenerationImage.objects.create(
                request=generation_request,
                image=image_file,
                angle=angle,
                order=i
            )

        process_3d_generation.delay(str(generation_request.id), clothing_type)
        logger.info(f"Successfully created 3D generation request {generation_request.id} for product {product.id} ({clothing_type})")
        return generation_request
    except Exception as e:
        logger.error(f"Failed to create 3D generation request for product {product.id}: {str(e)}")
        # Clean up failed request
        if 'generation_request' in locals() and generation_request.pk:
            generation_request.delete()
        return None

def get_generation_status(product):
    """
    Get the current 3D generation status for a product
    """
    latest_request = GenerationRequest.objects.filter(
        product=product
    ).order_by('-created_at').first()
    
    if not latest_request:
        return {
            'has_generation': False,
            'status': None,
            'progress': 0,
            'message': "No generation request found for this product."
        }
    
    return {
        'has_generation': True,
        'status': latest_request.status,
        'progress': latest_request.progress,
        'message': latest_request.message,
        'request_id': str(latest_request.id),
        'created_at': latest_request.created_at,
        'completed_at': latest_request.completed_at,
        'has_3d_model': latest_request.generated_model_file is not None
    } 