# pyright: reportAttributeAccessIssue=false
from celery import shared_task
from django.utils import timezone
from .models import GenerationRequest, GenerationProgress
from .blender_service import BlenderModelGenerator
from .advanced_blender_service import AdvancedBlenderModelGenerator
import logging
import os

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def process_3d_generation(self, request_id, clothing_type='tshirt'):
    """
    Process a 3D generation request using Blender
    """
    logger.info(f"Starting 3D generation task for request {request_id} (clothing type: {clothing_type})")
    
    try:
        generation_request = GenerationRequest.objects.get(id=request_id)
        generation_request.status = 'processing'
        generation_request.started_at = timezone.now()
        generation_request.save()
        
        logger.info(f"Found generation request: {generation_request.id}")
        
        # Choose generator based on detail level
        if generation_request.detail_level == 'high':
            # Use advanced generator for high detail
            generator = AdvancedBlenderModelGenerator()
        else:
            # Use standard generator for low/medium detail
            generator = BlenderModelGenerator()
        
        logger.info(f"Using generator: {type(generator).__name__}")
        
        # Prepare image data
        images = []
        for gen_image in generation_request.images.all():
            image_path = gen_image.image.path
            logger.info(f"Processing image: {image_path}")
            
            # Check if image file exists
            if not os.path.exists(image_path):
                logger.error(f"Image file does not exist: {image_path}")
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            images.append({
                'path': image_path,
                'angle': gen_image.detected_angle or gen_image.angle,
                'order': gen_image.order
            })
        
        logger.info(f"Prepared {len(images)} images for processing")
        
        # Progress callback
        def update_progress(stage, progress, message, estimated_time=None):
            try:
                generation_request.refresh_from_db()
                generation_request.stage = stage
                generation_request.progress = progress
                generation_request.message = message
                generation_request.estimated_time_remaining = estimated_time or ''
                generation_request.save()
                
                # Log progress
                GenerationProgress.objects.create(
                    request=generation_request,
                    stage=stage,
                    progress=progress,
                    message=message
                )
                
                logger.info(f"Progress update: {stage} - {progress}% - {message}")
            except Exception as e:
                logger.error(f"Error updating progress: {e}")
        
        # Generate 3D model with clothing type
        logger.info(f"Starting 3D model generation for {clothing_type}...")
        result = generator.generate_3d_model(
            images=images,
            detail_level=generation_request.detail_level,
            clothing_type=clothing_type,
            progress_callback=update_progress
        )
        
        logger.info(f"Generation result: {result}")
        
        if result['success']:
            # Save generated model
            generation_request.status = 'completed'
            generation_request.progress = 100.0
            generation_request.completed_at = timezone.now()
            generation_request.polygon_count = result.get('polygon_count')
            generation_request.file_size = result.get('file_size')
            generation_request.generation_time = result.get('generation_time')
            
            # Save the generated file
            model_path = result['model_path']
            logger.info(f"Saving generated model from: {model_path}")
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Generated model file not found: {model_path}")
            
            with open(model_path, 'rb') as f:
                from django.core.files import File
                # Determine file extension from the actual file
                file_extension = os.path.splitext(model_path)[1]
                filename = f"{generation_request.id}{file_extension}"
                generation_request.generated_model_file.save(
                    filename,
                    File(f),
                    save=False
                )
            
            generation_request.save()
            
            # Create ProductImage entry for the generated model
            from products.models import ProductImage
            ProductImage.objects.create(
                product=generation_request.product,
                file=generation_request.generated_model_file,
                file_type='model'
            )
            
            logger.info(f"3D generation completed for request {request_id} ({clothing_type})")
        else:
            error_msg = result.get('error', 'Unknown error')
            logger.error(f"3D generation failed for request {request_id} ({clothing_type}): {error_msg}")
            generation_request.status = 'failed'
            generation_request.error_message = error_msg
            generation_request.save()
            
    except Exception as e:
        logger.error(f"Error processing 3D generation {request_id} ({clothing_type}): {str(e)}")
        try:
            generation_request = GenerationRequest.objects.get(id=request_id)
            generation_request.status = 'failed'
            generation_request.error_message = str(e)
            generation_request.save()
        except Exception as save_error:
            logger.error(f"Error saving failed status: {save_error}")
