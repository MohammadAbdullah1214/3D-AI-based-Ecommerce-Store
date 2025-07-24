import subprocess
import os
import tempfile
import time
import logging
import json
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
        
        raise RuntimeError("Blender executable not found. Please install Blender or check the path.")
    
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
from mathutils import Vector

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
    "low": {{"subdivisions": 1, "resolution": 256}},
    "medium": {{"subdivisions": 2, "resolution": 512}},
    "high": {{"subdivisions": 3, "resolution": 1024}}
}}

current_detail = detail_settings["{detail_level}"]
print(f"Using detail level: {detail_level}")

# Create base mesh based on clothing type
clothing_type = "{clothing_type}"
print(f"Creating {clothing_type} geometry...")

if clothing_type == "tshirt":
    # --- Create a more realistic, curved T-shirt model ---
    
    # 1. Create the torso with enough vertices for curves
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.9, depth=1.8, location=(0, 0, 0))
    torso = bpy.context.active_object
    torso.name = "TShirtBody"

    # 2. Model the torso with curves
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_mode(type="VERT")
    
    # Add edge loops for shaping using bmesh for background compatibility
    bm = bmesh.from_edit_mesh(torso.data)
    bm.edges.ensure_lookup_table()
    
    # Select the vertical edges to create horizontal loops
    edges_to_cut = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 1.5]
    
    bmesh.ops.subdivide_edges(
        bm,
        edges=edges_to_cut,
        cuts=4,
        use_grid_fill=True
    )
    bmesh.update_edit_mesh(torso.data)
    
    # Shoulder flare
    for v in bm.verts:
        if 0.7 < v.co.z < 0.8:
            v.select = True
    bpy.ops.transform.resize(value=(1.1, 1.1, 1), orient_type='GLOBAL')
    
    # Waist taper
    for v in bm.verts:
        if -0.1 < v.co.z < 0.1:
            v.select = True
    bpy.ops.transform.resize(value=(0.9, 0.9, 1), orient_type='GLOBAL')
    bpy.ops.mesh.select_all(action='DESELECT')

    # 3. Create neck and collar
    bm.faces.ensure_lookup_table()
    top_face = max(bm.faces, key=lambda f: f.calc_center_median().z)
    top_face.select = True
    bpy.ops.mesh.delete(type='FACE')
    
    bpy.ops.mesh.select_mode(type="EDGE")
    for edge in bm.edges:
        if all(v.co.z > 0.8 for v in edge.verts) and len(edge.link_loops) == 1:
            edge.select = True
    
    bpy.ops.mesh.extrude_region_move()
    bpy.ops.transform.resize(value=(0.9, 0.9, 1))
    bpy.ops.transform.translate(value=(0, 0, 0.05))
    
    # 4. Create and attach sleeves
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Create a single, more detailed sleeve
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.28, depth=0.8, location=(0.9, 0, 0.6))
    sleeve1 = bpy.context.active_object
    sleeve1.rotation_euler = (0, 0.8, 0) # Angle down
    
    # Use boolean modifier to join
    bool_mod = torso.modifiers.new(name="Sleeve1Bool", type='BOOLEAN')
    bool_mod.operation = 'UNION'
    bool_mod.object = sleeve1
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.modifier_apply(modifier=bool_mod.name)
    sleeve1.hide_set(True) # Hide original sleeve
    
    # Repeat for second sleeve
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.28, depth=0.8, location=(-0.9, 0, 0.6))
    sleeve2 = bpy.context.active_object
    sleeve2.rotation_euler = (0, -0.8, 0)
    
    bool_mod = torso.modifiers.new(name="Sleeve2Bool", type='BOOLEAN')
    bool_mod.operation = 'UNION'
    bool_mod.object = sleeve2
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.modifier_apply(modifier=bool_mod.name)
    sleeve2.hide_set(True)
    
    obj = torso

    # 5. UV Unwrap the final model
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 6. Smooth the model
    bpy.ops.object.shade_smooth()
    
elif clothing_type == "pants":
    # Create pants base (two cylinders for legs)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=2, location=(0.2, 0, 0))
    leg1 = bpy.context.active_object
    leg1.name = "Leg1"
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=2, location=(-0.2, 0, 0))
    leg2 = bpy.context.active_object
    leg2.name = "Leg2"
    
    # Add waistband
    bpy.ops.mesh.primitive_cylinder_add(radius=0.6, depth=0.3, location=(0, 0, 1))
    waist = bpy.context.active_object
    waist.name = "Waist"
    
    # Join all parts
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = leg1
    bpy.ops.object.join()
    
elif clothing_type == "shirts":
    # Create shirt base (similar to t-shirt but with collar)
    bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=2)
    body = bpy.context.active_object
    body.name = "ShirtBody"
    
    # Add sleeves
    bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=1.5, location=(0.8, 0, 0))
    sleeve1 = bpy.context.active_object
    sleeve1.name = "Sleeve1"
    sleeve1.rotation_euler = (0, 1.5708, 0)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=1.5, location=(-0.8, 0, 0))
    sleeve2 = bpy.context.active_object
    sleeve2.name = "Sleeve2"
    sleeve2.rotation_euler = (0, -1.5708, 0)
    
    # Add collar
    bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.1, location=(0, 0, 1.2))
    collar = bpy.context.active_object
    collar.name = "Collar"
    
    # Join all parts
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    
elif clothing_type == "shoes":
    # Create shoe base (foot shape)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    shoe = bpy.context.active_object
    shoe.name = "Shoe"
    
    # Scale to make it more shoe-like
    shoe.scale = (2, 1, 0.5)
    
    # Add sole
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.3))
    sole = bpy.context.active_object
    sole.name = "Sole"
    sole.scale = (2.2, 1.2, 0.1)
    
    # Join all parts
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = shoe
    bpy.ops.object.join()
    
else:
    # Default to cube for unknown types
    bpy.ops.mesh.primitive_cube_add(size=2)
    obj = bpy.context.active_object
    obj.name = "GeneratedModel"

print("Base geometry created")

# Get the main object
obj = bpy.context.active_object

# Enter edit mode and subdivide
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')

# Subdivide using Blender operators (more compatible)
bpy.ops.mesh.subdivide(number_cuts=current_detail["subdivisions"])

print("Mesh subdivided")

bpy.ops.object.mode_set(mode='OBJECT')

# Add subdivision surface modifier
modifier = obj.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = current_detail["subdivisions"]

print("Subdivision modifier added")

# Create material based on clothing type
material = bpy.data.materials.new(name=f"GeneratedMaterial_{clothing_type}")
material.use_nodes = True

# Clear default nodes
material.node_tree.nodes.clear()

# Add principled BSDF
bsdf = material.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
output = material.node_tree.nodes.new(type='ShaderNodeOutputMaterial')

# Set material properties based on clothing type
if clothing_type == "tshirt":
    bsdf.inputs['Base Color'].default_value = (0.8, 0.2, 0.2, 1)  # Red
    bsdf.inputs['Roughness'].default_value = 0.8
    bsdf.inputs['Specular IOR Level'].default_value = 0.1
elif clothing_type == "pants":
    bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.3, 1)  # Dark blue
    bsdf.inputs['Roughness'].default_value = 0.9
    bsdf.inputs['Specular IOR Level'].default_value = 0.05
elif clothing_type == "shirts":
    bsdf.inputs['Base Color'].default_value = (0.9, 0.9, 0.9, 1)  # White
    bsdf.inputs['Roughness'].default_value = 0.7
    bsdf.inputs['Specular IOR Level'].default_value = 0.2
elif clothing_type == "shoes":
    bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1)  # Black
    bsdf.inputs['Roughness'].default_value = 0.6
    bsdf.inputs['Specular IOR Level'].default_value = 0.3
else:
    bsdf.inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1)  # Gray

# Link nodes
material.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

print("Material created")

# Load and apply texture if available
images_data = {images_data}
if images_data:
    try:
        # Create image texture node
        tex_image = material.node_tree.nodes.new('ShaderNodeTexImage')
        
        # Load first image as texture
        first_image_path = images_data[0]['path']
        if os.path.exists(first_image_path):
            blender_image = bpy.data.images.load(first_image_path)
            tex_image.image = blender_image
            
            # Link to base color
            material.node_tree.links.new(tex_image.outputs['Color'], bsdf.inputs['Base Color'])
            print("Texture applied successfully")
        else:
            print(f"Image not found: {{first_image_path}}")
    except Exception as e:
        print(f"Error loading texture: {{e}}")

# Assign material to mesh
obj.data.materials.append(material)

# Optimize mesh
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')

# Remove doubles
bpy.ops.mesh.remove_doubles(threshold=0.01)

bpy.ops.object.mode_set(mode='OBJECT')

print("Mesh optimization complete")

# Export as GLB
output_path = "{temp_dir_forward}/generated_model.glb"
print(f"Exporting to: {{output_path}}")

# Ensure the output directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Export the model
try:
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        use_selection=False,
        export_format='GLB',
        export_texcoords=True,
        export_materials='EXPORT',
        export_colors=True,
        export_cameras=False,
        export_lights=False
    )
    # Verify the file was created
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path)
        print(f"Model exported successfully to: {{output_path}} (size: {{file_size}} bytes)")
    else:
        print(f"GLB export failed: file not created.")
        raise Exception("GLB export failed: file not created.")
except Exception as e:
    print(f"GLB export error: {{e}}")
    raise
'''
        
        # Save script to temp file
        script_path = os.path.join(self.temp_dir, 'blender_script.py')
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        return script_path
    
    def _run_blender_script(self, script_path, progress_callback=None, export_format='GLB'):
        """Run Blender script and return output path. Only allow .glb or .gltf export. Log and raise error if export fails."""
        if export_format.upper() not in ['GLB', 'GLTF']:
            raise ValueError('Only GLB or GLTF export formats are supported.')
        ext = '.glb' if export_format.upper() == 'GLB' else '.gltf'
        output_path = os.path.join(self.temp_dir, f'generated_model{ext}')
        try:
            # Run Blender in background mode
            cmd = [
                self.blender_executable,
                "--background",
                "--python", script_path
            ]
            if progress_callback:
                progress_callback("running_blender", 60, f"Executing Blender script for {export_format} export...")
            logger.info(f"Running Blender command: {' '.join(cmd)}")
            logger.info(f"Script path: {script_path}")
            logger.info(f"Temp directory: {self.temp_dir}")
            # Run the command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                cwd=self.temp_dir
            )
            logger.info(f"Blender stdout:\n{result.stdout}")
            if result.stderr:
                logger.error(f"Blender stderr:\n{result.stderr}")
            if result.returncode != 0:
                logger.error(f"Blender script failed with return code {result.returncode}: {result.stderr}")
                raise RuntimeError(f"Blender script failed with return code {result.returncode}: {result.stderr}")
            # Check for output file
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                logger.info(f"{export_format} file generated successfully: {output_path} (size: {file_size} bytes)")
                return output_path
            else:
                temp_files = os.listdir(self.temp_dir)
                logger.error(f"No {export_format} output file found. Temp directory contents: {temp_files}")
                logger.error(f"Blender stdout:\n{result.stdout}")
                logger.error(f"Blender stderr:\n{result.stderr}")
                raise RuntimeError(f"Blender did not generate {export_format} output file. Checked for: {output_path}")
        except subprocess.TimeoutExpired:
            logger.error("Blender script timed out after 5 minutes")
            raise RuntimeError("Blender script timed out after 5 minutes")
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
