import bpy
import bmesh
import mathutils
import numpy as np
import sys
import os
from math import radians

# --- PARAMETERS ---
# These should be set by the caller (e.g., via sys.argv or environment)
IMAGE_PATH = os.environ.get('CLEANED_IMAGE_PATH')
EXPORT_PATH = os.environ.get('EXPORT_PATH')
HEIGHT = float(os.environ.get('HEIGHT', 5))
SCALE = float(os.environ.get('SCALE', 1))
CONTOUR_PATH = os.environ.get('CONTOUR_PATH')  # npy file with Nx2 array

# --- LOAD CONTOUR POINTS ---
points = np.load(CONTOUR_PATH)  # shape (N, 2)

# --- CREATE MESH FROM CONTOUR ---
mesh = bpy.data.meshes.new("ProductMesh")
obj = bpy.data.objects.new("ProductObj", mesh)
bpy.context.collection.objects.link(obj)
bm = bmesh.new()
verts = [bm.verts.new((x, y, 0)) for x, y in points]

if len(verts) > 2:
    for i in range(len(verts)):
        bm.edges.new((verts[i], verts[(i + 1) % len(verts)]))

bm.to_mesh(mesh)
bm.free()
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.edge_face_add()

# --- EXTRUDE ---
bpy.ops.mesh.extrude_region_move(
    MESH_OT_extrude_region={"use_normal_flip":False},
    TRANSFORM_OT_translate={"value":(0, 0, -HEIGHT)}
)
bpy.ops.object.mode_set(mode='OBJECT')

# --- UV UNWRAP ---
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.uv.smart_project()
bpy.ops.object.mode_set(mode='OBJECT')

# --- TEXTURE MAPPING ---
mat = bpy.data.materials.new(name="ProductMaterial")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
tex_image = mat.node_tree.nodes.new('ShaderNodeTexImage')
tex_image.image = bpy.data.images.load(IMAGE_PATH)
mat.node_tree.links.new(bsdf.inputs['Base Color'], tex_image.outputs['Color'])
obj.data.materials.append(mat)

# --- SCALE & CENTER ---
obj.scale /= SCALE
center = mathutils.Vector((0, 0, 0))
for v in obj.data.vertices:
    center += v.co
center /= len(obj.data.vertices)
obj.location = -center

# --- EXPORT ---
print('=== GLB ONLY EXPORT SCRIPT ===')
EXPORT_PATH_GLB = EXPORT_PATH
if EXPORT_PATH_GLB.endswith('.obj'):
    EXPORT_PATH_GLB = EXPORT_PATH_GLB[:-4] + '.glb'

bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH_GLB,
    use_selection=False,
    export_format='GLB',
    export_texcoords=True,
    export_materials='EXPORT',
    export_colors=True,
    export_cameras=False,
    export_lights=False
)
print(f"Exported GLB to: {EXPORT_PATH_GLB}") 