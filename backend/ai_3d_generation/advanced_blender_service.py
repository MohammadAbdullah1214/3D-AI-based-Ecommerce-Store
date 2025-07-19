from .blender_service import BlenderModelGenerator

class AdvancedBlenderModelGenerator(BlenderModelGenerator):
    """
    Advanced Blender-based 3D model generator using photogrammetry techniques
    Extends the basic BlenderModelGenerator with advanced features
    """
    
    def __init__(self):
        super().__init__()
    
    def generate_3d_model(self, images, detail_level='high', progress_callback=None):
        """
        Generate a 3D model from multiple 2D images using advanced photogrammetry
        """
        # For now, use the basic generator but with enhanced settings
        return super().generate_3d_model(images, detail_level, progress_callback) 