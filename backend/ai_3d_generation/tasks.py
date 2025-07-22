# pyright: reportAttributeAccessIssue=false
from celery import shared_task
from django.utils import timezone
from .models import GenerationRequest, GenerationProgress
from .blender_service import BlenderModelGenerator
from .advanced_blender_service import AdvancedBlenderModelGenerator
import logging
import os
import tempfile
import shutil
import subprocess
from products.utils.image_processing import remove_background, extract_largest_contour
import numpy as np
import requests

def download_image(url, dest_path):
    r = requests.get(url)
    r.raise_for_status()
    with open(dest_path, 'wb') as f:
        f.write(r.content)

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def process_3d_generation(self, request_id, clothing_type='tshirt'):
    """
    Process a 3D generation request using Blender (new pipeline: background removal, contour extraction, mesh generation)
    """
    logger.info(f"Starting 3D generation task for request {request_id} (clothing type: {clothing_type})")
    temp_dir = tempfile.mkdtemp()
    try:
        generation_request = GenerationRequest.objects.get(id=request_id)
        generation_request.status = 'processing'
        generation_request.started_at = timezone.now()
        generation_request.save()

        logger.info(f"Found generation request: {generation_request.id}")

        images = []
        for gen_image in generation_request.images.all():

            image_url = gen_image.image.url  # Use the public URL
            local_image_path = os.path.join(temp_dir, f"downloaded_{gen_image.id}.png")
            logger.info(f"Downloading image from: {image_url}")
            download_image(image_url, local_image_path)

            # Remove background and extract contour
            cleaned_img, mask = remove_background(local_image_path, method='auto')
            contour = extract_largest_contour(mask)
            if not contour or len(contour) < 3:
                logger.error(f"No valid contour found in image: {local_image_path}")
                raise ValueError(f"No valid contour found in image: {local_image_path}")

            # Save cleaned image and contour as temp files
            cleaned_img_path = os.path.join(temp_dir, f"cleaned_{gen_image.id}.png")
            contour_path = os.path.join(temp_dir, f"contour_{gen_image.id}.npy")
            cleaned_img.save(cleaned_img_path)
            np_contour = np.array(contour)
            np.save(contour_path, np_contour)

            images.append({
                'cleaned_img_path': cleaned_img_path,
                'contour_path': contour_path,
                'angle': gen_image.detected_angle or gen_image.angle,
                'order': gen_image.order
            })

        logger.info(f"Prepared {len(images)} cleaned images and contours for Blender processing")

        # For now, use the first image for mesh generation (can be extended for multi-view)
        img_info = images[0]
        export_path = os.path.join(temp_dir, f"generated_{request_id}.obj")
        blender_script = os.path.join(os.path.dirname(__file__), "blender_mesh_from_contour.py")
        blender_exe = os.environ.get('BLENDER_EXECUTABLE_PATH') or getattr(
            __import__('django.conf').conf.settings, 'BLENDER_EXECUTABLE_PATH', 'blender')

        env = os.environ.copy()
        env.update({
            'CLEANED_IMAGE_PATH': img_info['cleaned_img_path'],
            'EXPORT_PATH': export_path,
            'HEIGHT': '5',
            'SCALE': '1',
            'CONTOUR_PATH': img_info['contour_path']
        })

        logger.info(f"Calling Blender for mesh generation: {blender_exe}")
        result = subprocess.run([
            blender_exe, '--background', '--python', blender_script
        ], env=env, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            logger.error(f"Blender failed: {result.stderr}")
            raise RuntimeError(f"Blender failed: {result.stderr}")
        logger.info(f"Blender output: {result.stdout}")

        # Save generated model
        if not os.path.exists(export_path):
            raise FileNotFoundError(f"Generated model file not found: {export_path}")
        with open(export_path, 'rb') as f:
            from django.core.files import File
            file_extension = os.path.splitext(export_path)[1]
            filename = f"{generation_request.id}{file_extension}"
            generation_request.generated_model_file.save(
                filename,
                File(f),
                save=False
            )
        generation_request.status = 'completed'
        generation_request.progress = 100.0
        generation_request.completed_at = timezone.now()
        generation_request.save()

        # Create ProductImage entry for the generated model(s)
        from products.models import ProductImage
        # Register .glb if it exists
        glb_path = export_path.replace('.obj', '.glb') if export_path.endswith('.obj') else export_path
        if os.path.exists(glb_path) and glb_path.endswith('.glb'):
            with open(glb_path, 'rb') as glb_file:
                ProductImage.objects.create(
                    product=generation_request.product,
                    file=File(glb_file, name=os.path.basename(glb_path)),
                    file_type='model',  # or 'model_3d' if you want to distinguish
                    angle_tag=None
                )
        # Register .obj if it exists and is not the same as glb
        if export_path.endswith('.obj') and os.path.exists(export_path):
            with open(export_path, 'rb') as obj_file:
                ProductImage.objects.create(
                    product=generation_request.product,
                    file=File(obj_file, name=os.path.basename(export_path)),
                    file_type='model',
                    angle_tag=None
                )
        logger.info(f"3D generation completed for request {request_id} ({clothing_type})")
    except Exception as e:
        logger.error(f"Error processing 3D generation {request_id} ({clothing_type}): {str(e)}")
        try:
            generation_request = GenerationRequest.objects.get(id=request_id)
            generation_request.status = 'failed'
            generation_request.error_message = str(e)
            generation_request.save()
        except Exception as save_error:
            logger.error(f"Error saving failed status: {save_error}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
