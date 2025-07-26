import subprocess
import os
import tempfile
import time
import logging
import json
import sys
from PIL import Image, ImageEnhance
import numpy as np
from scipy import ndimage
from django.conf import settings


logger = logging.getLogger(__name__)

# pyright: reportCallIssue=false

class BlenderModelGenerator:
    """
    Real Blender-based 3D model generator using subprocess calls
    """
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.blender_executable = self._get_blender_executable()
        
    def _get_blender_executable(self):
        """Get Blender executable path from settings or find it"""
        # First try the path from settings/environment
        if hasattr(settings, 'BLENDER_EXECUTABLE_PATH'):
            blender_path = settings.BLENDER_EXECUTABLE_PATH
            if os.path.exists(blender_path):
                return blender_path
        
        # Try environment variable
        env_path = os.environ.get('BLENDER_EXECUTABLE_PATH')
        if env_path and os.path.exists(env_path):
            return env_path
        
        # Your specific path
        specific_path = r"/home/abdullah/Applications/blender-4.0.2-linux-x64/blender"
        if os.path.exists(specific_path):
            return specific_path
        
        # Fallback to common paths
        possible_paths = [
            r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 3.6\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender\blender.exe",
            "/usr/bin/blender",
            "/usr/local/bin/blender",
            "/Applications/Blender.app/Contents/MacOS/Blender",
            "blender"
        ]
        
        for path in possible_paths:
            try:
                if os.path.exists(path):
                    return path
                # Try to run it to see if it's in PATH
                subprocess.run([path, "--version"], 
                             capture_output=True, 
                             timeout=10, 
                             check=True)
                return path
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                continue
        
        raise RuntimeError("Blender executable not found. Please install Blender or set BLENDER_EXECUTABLE_PATH environment variable.")
    
    def generate_3d_model(self, images, detail_level='medium', clothing_type='tshirt', progress_callback=None):
        """
        Generate a 3D model from multiple 2D images using Blender
        """
        try:
            start_time = time.time()
            
            if progress_callback:
                progress_callback("initializing", 5, f"Setting up Blender environment for {clothing_type}...")
            
            # Verify Blender is accessible
            self._verify_blender()
            
            # Process images
            if progress_callback:
                progress_callback("processing_images", 15, "Analyzing input images...")
            
            processed_images = self._process_images(images)
            
            if progress_callback:
                progress_callback("creating_geometry", 30, f"Creating {clothing_type} geometry...")
            
            # Create Blender script with clothing type
            blender_script = self._create_blender_script(processed_images, detail_level, clothing_type)
            
            if progress_callback:
                progress_callback("running_blender", 50, f"Running Blender 3D generation for {clothing_type}...")
            
            # Run Blender
            output_path = self._run_blender_script(blender_script, progress_callback)
            
            if progress_callback:
                progress_callback("finalizing", 95, f"Finalizing {clothing_type} 3D model...")
            
            # Get statistics
            stats = self._get_model_stats(output_path)
            
            generation_time = time.time() - start_time
            
            if progress_callback:
                progress_callback("complete", 100, f"{clothing_type} 3D model generation completed!")
            
            return {
                'success': True,
                'model_path': output_path,
                'polygon_count': stats['polygon_count'],
                'file_size': stats['file_size'],
                'generation_time': generation_time,
                'clothing_type': clothing_type
            }
            
        except Exception as e:
            logger.error(f"Error generating 3D model for {clothing_type}: {str(e)}")
            if progress_callback:
                progress_callback("error", 0, f"Generation failed for {clothing_type}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'clothing_type': clothing_type
            }
    
    def _verify_blender(self):
        """Verify Blender is accessible and working"""
        try:
            result = subprocess.run(
                [self.blender_executable, "--version"],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"Blender version check failed: {result.stderr}")
            
            logger.info(f"Blender verified: {result.stdout.split()[0:3]}")
            
        except subprocess.TimeoutExpired:
            raise RuntimeError("Blender version check timed out")
        except Exception as e:
            raise RuntimeError(f"Cannot access Blender: {str(e)}")
    
    def _process_images(self, images):
        """Process and analyze input images"""
        processed = []
        
        for img_data in images:
            try:
                # Load image
                pil_image = Image.open(img_data['path'])
                
                # Resize if too large
                max_size = 1024
                if max(pil_image.size) > max_size:
                    pil_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Convert to RGB if needed
                if pil_image.mode != 'RGB':
                    pil_image = pil_image.convert('RGB')
                
                # Enhance image
                enhancer = ImageEnhance.Contrast(pil_image)
                pil_image = enhancer.enhance(1.2)
                
                # Save processed image to temp directory
                temp_image_path = os.path.join(self.temp_dir, f"processed_{img_data['order']}.jpg")
                pil_image.save(temp_image_path, 'JPEG', quality=90)
                
                processed.append({
                    'path': temp_image_path,
                    'angle': img_data['angle'],
                    'order': img_data['order'],
                    'width': pil_image.width,
                    'height': pil_image.height
                })
                
            except Exception as e:
                logger.warning(f"Error processing image {img_data['path']}: {str(e)}")
                continue
        
        return processed
    
    def _create_blender_script(self, images, detail_level, clothing_type='tshirt'):
        """Create Blender Python script for 3D generation with clothing-specific models"""
        
        # Use forward slashes for Blender paths (works on Windows too)
        temp_dir_forward = self.temp_dir.replace('\\', '/')
        
        # Prepare images data for the script
        images_data = []
        for img in images:
            # Convert Windows path to forward slashes for Blender
            img_path = img['path'].replace('\\', '/')
            images_data.append({
                'path': img_path,
                'angle': img['angle'],
                'order': img['order']
            })
        
        script_content = f'''
import bpy
import bmesh
import os
import sys
from mathutils import Vector, Euler
from math import radians

print("Starting Blender 3D generation script for {clothing_type}...")

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Set up scene
scene = bpy.context.scene
scene.render.engine = 'CYCLES'

print("Scene setup complete")

# Detail level settings
detail_settings = {{
    "low": {{"subdivisions": 1, "resolution": 256, "vertices": 16}},
    "medium": {{"subdivisions": 2, "resolution": 512, "vertices": 32}},
    "high": {{"subdivisions": 3, "resolution": 1024, "vertices": 64}}
}}

current_detail = detail_settings["{detail_level}"]
print(f"Using detail level: {detail_level}")

# Create base mesh based on clothing type
clothing_type = "{clothing_type}"
print(f"Creating {{clothing_type}} geometry...")

def create_tshirt():
    """Create a realistic T-shirt model"""
    # Create the main body
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=current_detail["vertices"], 
        radius=1.0, 
        depth=1.8, 
        location=(0, 0, 0)
    )
    body = bpy.context.active_object
    body.name = "TShirtBody"
    
    # Enter edit mode for body shaping
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode='EDIT')
    
    # Get bmesh representation
    bm = bmesh.from_edit_mesh(body.data)
    bm.faces.ensure_lookup_table()
    bm.verts.ensure_lookup_table()
    
    # Shape the torso - taper at waist, flare at shoulders
    for vert in bm.verts:
        z = vert.co.z
        # Shoulder area - slight flare
        if 0.6 < z < 0.9:
            scale_factor = 1.0 + (z - 0.6) * 0.2
            vert.co.x *= scale_factor
            vert.co.y *= scale_factor
        # Waist area - taper
        elif -0.2 < z < 0.2:
            scale_factor = 0.85 + abs(z) * 0.3
            vert.co.x *= scale_factor
            vert.co.y *= scale_factor
    
    # Create neck opening
    top_faces = [f for f in bm.faces if f.calc_center_median().z > 0.8]
    for face in top_faces:
        face.select = True
    bmesh.ops.delete(bm, geom=top_faces, type='FACE')
    
    # Create collar
    neck_edges = [e for e in bm.edges if len(e.link_faces) == 1 and e.calc_center_median().z > 0.8]
    if neck_edges:
        bmesh.ops.extrude_edge_only(bm, edges=neck_edges)
        for edge in neck_edges:
            for vert in edge.verts:
                vert.co.z += 0.05
                vert.co *= 0.95
    
    bmesh.update_edit_mesh(body.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Create sleeves
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=current_detail["vertices"]//2,
            radius=0.25,
            depth=0.6,
            location=(side * 0.85, 0, 0.5)
        )
        sleeve = bpy.context.active_object
        sleeve.name = f"Sleeve_{{side}}"
        sleeve.rotation_euler = (0, side * radians(15), 0)
        
        # Join sleeve to body
        bpy.ops.object.select_all(action='DESELECT')
        body.select_set(True)
        sleeve.select_set(True)
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.join()
    
    return body

def create_pants():
    """Create pants model"""
    # Create waistband
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=current_detail["vertices"],
        radius=0.7,
        depth=0.2,
        location=(0, 0, 0.8)
    )
    waist = bpy.context.active_object
    waist.name = "Waistband"
    
    # Create legs
    for side in [-0.25, 0.25]:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=current_detail["vertices"]//2,
            radius=0.35,
            depth=1.8,
            location=(side, 0, -0.1)
        )
        leg = bpy.context.active_object
        leg.name = f"Leg_{{side}}"
        
        # Taper the leg
        bpy.context.view_layer.objects.active = leg
        bpy.ops.object.mode_set(mode='EDIT')
        bm = bmesh.from_edit_mesh(leg.data)
        for vert in bm.verts:
            if vert.co.z < -0.5:  # Lower part of leg
                scale = 0.7 + (vert.co.z + 1.0) * 0.3
                vert.co.x *= scale
                vert.co.y *= scale
        bmesh.update_edit_mesh(leg.data)
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Join to waist
        bpy.ops.object.select_all(action='DESELECT')
        waist.select_set(True)
        leg.select_set(True)
        bpy.context.view_layer.objects.active = waist
        bpy.ops.object.join()
    
    return waist

def create_shirt():
    """Create dress shirt model"""
    # Start with t-shirt base
    shirt = create_tshirt()
    shirt.name = "DressShirt"
    
    # Make sleeves longer
    bpy.context.view_layer.objects.active = shirt
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(shirt.data)
    
    # Extend sleeve vertices
    for vert in bm.verts:
        if abs(vert.co.x) > 0.6 and abs(vert.co.y) < 0.3:  # Sleeve area
            vert.co.x *= 1.3  # Make sleeves longer
    
    bmesh.update_edit_mesh(shirt.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Add collar
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.35,
        minor_radius=0.08,
        location=(0, 0, 0.9)
    )
    collar = bpy.context.active_object
    collar.name = "Collar"
    
    # Join collar to shirt
    bpy.ops.object.select_all(action='DESELECT')
    shirt.select_set(True)
    collar.select_set(True)
    bpy.context.view_layer.objects.active = shirt
    bpy.ops.object.join()
    
    return shirt

def create_shoes():
    """Create shoe model"""
    # Create main shoe body
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(0, 0.2, 0)
    )
    shoe = bpy.context.active_object
    shoe.name = "Shoe"
    shoe.scale = (1.8, 2.2, 0.6)
    
    # Create sole
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(0, 0.1, -0.35)
    )
    sole = bpy.context.active_object
    sole.name = "Sole"
    sole.scale = (1.9, 2.4, 0.15)
    
    # Create heel
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(0, -0.8, -0.2)
    )
    heel = bpy.context.active_object
    heel.name = "Heel"
    heel.scale = (1.5, 0.8, 0.4)
    
    # Join all parts
    bpy.ops.object.select_all(action='DESELECT')
    shoe.select_set(True)
    sole.select_set(True)
    heel.select_set(True)
    bpy.context.view_layer.objects.active = shoe
    bpy.ops.object.join()
    
    return shoe

def create_dress():
    """Create dress model"""
    # Create main body (longer than t-shirt)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=current_detail["vertices"],
        radius=1.0,
        depth=2.5,
        location=(0, 0, 0)
    )
    dress = bpy.context.active_object
    dress.name = "Dress"
    
    # Shape the dress
    bpy.context.view_layer.objects.active = dress
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(dress.data)
    
    for vert in bm.verts:
        z = vert.co.z
        # Flare at bottom
        if z < -0.5:
            scale_factor = 1.0 + abs(z + 0.5) * 0.3
            vert.co.x *= scale_factor
            vert.co.y *= scale_factor
        # Taper at waist
        elif -0.2 < z < 0.2:
            scale_factor = 0.8
            vert.co.x *= scale_factor
            vert.co.y *= scale_factor
    
    bmesh.update_edit_mesh(dress.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    return dress

def create_jacket():
    """Create jacket model"""
    # Start with shirt base but make it bulkier
    jacket = create_shirt()
    jacket.name = "Jacket"
    
    # Make it slightly larger
    jacket.scale = (1.1, 1.1, 1.0)
    
    return jacket

def create_generic():
    """Create generic clothing item"""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=current_detail["vertices"],
        radius=1,
        depth=2,
        location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = "GenericClothing"
    return obj

# Create the appropriate model based on clothing type
clothing_lower = clothing_type.lower()
if clothing_lower in ["tshirt", "t-shirt", "tee"]:
    obj = create_tshirt()
elif clothing_lower in ["pants", "trousers", "jeans"]:
    obj = create_pants()
elif clothing_lower in ["shirt", "shirts", "dress_shirt"]:
    obj = create_shirt()
elif clothing_lower in ["shoes", "shoe", "sneakers", "boots"]:
    obj = create_shoes()
elif clothing_lower in ["dress", "dresses"]:
    obj = create_dress()
elif clothing_lower in ["jacket", "coat", "blazer"]:
    obj = create_jacket()
else:
    print(f"Unknown clothing type: {{clothing_type}}, creating generic model")
    obj = create_generic()

print(f"Base {{clothing_type}} geometry created")

# Apply subdivision if needed
if current_detail["subdivisions"] > 0:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.subdivide(number_cuts=current_detail["subdivisions"])
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Add subdivision surface modifier for smoothness
    modifier = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    modifier.levels = min(current_detail["subdivisions"], 2)  # Limit to prevent excessive geometry

print("Mesh subdivision applied")

# Create material
material = bpy.data.materials.new(name=f"Material_{{clothing_type}}")
material.use_nodes = True
nodes = material.node_tree.nodes
links = material.node_tree.links

# Clear default nodes
nodes.clear()

# Add principled BSDF and output
bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
output = nodes.new(type='ShaderNodeOutputMaterial')
links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

# Set material properties based on clothing type
clothing_lower = clothing_type.lower()
if clothing_lower in ["tshirt", "t-shirt", "tee"]:
    bsdf.inputs['Base Color'].default_value = (0.8, 0.3, 0.2, 1.0)  # Orange-red
    bsdf.inputs['Roughness'].default_value = 0.8
elif clothing_lower in ["pants", "trousers", "jeans"]:
    bsdf.inputs['Base Color'].default_value = (0.2, 0.2, 0.4, 1.0)  # Dark blue
    bsdf.inputs['Roughness'].default_value = 0.9
elif clothing_lower in ["shirt", "shirts", "dress_shirt"]:
    bsdf.inputs['Base Color'].default_value = (0.9, 0.9, 0.95, 1.0)  # Light blue
    bsdf.inputs['Roughness'].default_value = 0.7
elif clothing_lower in ["shoes", "shoe", "sneakers", "boots"]:
    bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1.0)  # Black
    bsdf.inputs['Roughness'].default_value = 0.4
    bsdf.inputs['Specular IOR Level'].default_value = 0.8
elif clothing_lower in ["dress", "dresses"]:
    bsdf.inputs['Base Color'].default_value = (0.7, 0.2, 0.4, 1.0)  # Pink/Red
    bsdf.inputs['Roughness'].default_value = 0.6
elif clothing_lower in ["jacket", "coat", "blazer"]:
    bsdf.inputs['Base Color'].default_value = (0.3, 0.3, 0.3, 1.0)  # Dark gray
    bsdf.inputs['Roughness'].default_value = 0.5
else:
    bsdf.inputs['Base Color'].default_value = (0.6, 0.6, 0.6, 1.0)  # Gray

# Apply texture if available
images_data = {images_data}
if images_data and len(images_data) > 0:
    try:
        first_image_path = images_data[0]['path']
        if os.path.exists(first_image_path):
            # Create image texture node
            tex_image = nodes.new('ShaderNodeTexImage')
            
            # Load image
            blender_image = bpy.data.images.load(first_image_path)
            tex_image.image = blender_image
            
            # Connect to base color
            links.new(tex_image.outputs['Color'], bsdf.inputs['Base Color'])
            
            print("Texture applied successfully")
        else:
            print(f"Image file not found: {{first_image_path}}")
    except Exception as e:
        print(f"Error applying texture: {{e}}")

# Assign material to object
if obj.data.materials:
    obj.data.materials[0] = material
else:
    obj.data.materials.append(material)

# UV unwrap for proper texture mapping
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# Final mesh cleanup
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.remove_doubles(threshold=0.001)
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

# Apply smooth shading
bpy.ops.object.shade_smooth()

print("Material and UV mapping applied")

# Export as GLB
output_path = "{temp_dir_forward}/generated_model.glb"
print(f"Exporting to: {{output_path}}")

# Ensure output directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

try:
    # Select only our object for export
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    # Export GLB
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        use_selection=True,  # Only export selected objects
        export_format='GLB',
        export_texcoords=True,
        export_materials='EXPORT',
        export_colors=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False
    )
    
    # Verify export
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path)
        print(f"Successfully exported {{clothing_type}} model to: {{output_path}} ({{file_size}} bytes)")
    else:
        raise Exception("GLB file was not created")
        
except Exception as e:
    print(f"Export error: {{e}}")
    import traceback
    traceback.print_exc()
    raise

print("3D model generation completed successfully!")
'''
        
        # Save script to temp file
        script_path = os.path.join(self.temp_dir, 'blender_script.py')
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        return script_path
    
    def _run_blender_script(self, script_path, progress_callback=None, export_format='GLB'):
        """Run Blender script and return output path. Only allow .glb or .gltf export."""
        if export_format.upper() not in ['GLB', 'GLTF']:
            raise ValueError('Only GLB or GLTF export formats are supported.')
        
        ext = '.glb' if export_format.upper() == 'GLB' else '.gltf'
        output_path = os.path.join(self.temp_dir, f'generated_model{ext}')
        
        try:
            # Run Blender in background mode
            cmd = [
                self.blender_executable,
                "--background",
                "--python", script_path,
                "--python-exit-code", "1"  # Exit with error code if Python script fails
            ]
            
            if progress_callback:
                progress_callback("running_blender", 60, f"Executing Blender script for {export_format} export...")
            
            logger.info(f"Running Blender command: {' '.join(cmd)}")
            logger.info(f"Script path: {script_path}")
            logger.info(f"Temp directory: {self.temp_dir}")
            
            # Set environment variables for Blender
            env = os.environ.copy()
            env['PYTHONPATH'] = os.pathsep.join(sys.path)
            
            # Run the command with extended timeout
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,  # 10 minute timeout
                cwd=self.temp_dir,
                env=env
            )
            
            logger.info(f"Blender return code: {result.returncode}")
            logger.info(f"Blender stdout:\n{result.stdout}")
            
            if result.stderr:
                logger.warning(f"Blender stderr:\n{result.stderr}")
            
            if result.returncode != 0:
                error_msg = f"Blender script failed with return code {result.returncode}"
                if result.stderr:
                    error_msg += f": {result.stderr}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)
            
            # Check for output file
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                if file_size > 0:
                    logger.info(f"{export_format} file generated successfully: {output_path} (size: {file_size} bytes)")
                    return output_path
                else:
                    raise RuntimeError(f"Generated {export_format} file is empty")
            else:
                # List temp directory contents for debugging
                temp_files = os.listdir(self.temp_dir)
                logger.error(f"No {export_format} output file found. Temp directory contents: {temp_files}")
                logger.error(f"Expected file: {output_path}")
                raise RuntimeError(f"Blender did not generate {export_format} output file")
                
        except subprocess.TimeoutExpired:
            error_msg = "Blender script timed out after 10 minutes"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        except Exception as e:
            logger.error(f"Error running Blender: {str(e)}")
            raise RuntimeError(f"Error running Blender: {str(e)}")
    
    def _get_model_stats(self, file_path):
        """Get model statistics"""
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        # Estimate polygon count based on file size (rough estimate)
        # GLB files are typically more compressed than OBJ files
        if file_path.endswith('.glb'):
            estimated_polygons = max(100, file_size // 30)  # GLB is more compressed
        else:
            estimated_polygons = max(100, file_size // 50)  # OBJ is less compressed
        
        return {
            'polygon_count': estimated_polygons,
            'file_size': file_size
        }
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temporary directory: {self.temp_dir}")
        except Exception as e:
            logger.warning(f"Error cleaning up temporary directory: {str(e)}")
    
    def __del__(self):
        """Destructor to ensure cleanup"""
        self.cleanup()
