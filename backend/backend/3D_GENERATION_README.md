# 3D Model Generation Feature

This document describes the 3D model generation feature that automatically creates 3D models from 2D images when sellers add products to the e-commerce store.

## Overview

The 3D generation system uses Blender to automatically create 3D models from multiple 2D images uploaded by sellers. The system supports different detail levels and uses advanced photogrammetry techniques for high-quality results.

## Features

### Automatic 3D Generation
- **Triggered automatically** when a seller uploads 2+ images to a product
- **Background processing** using Celery for non-blocking operation
- **Progress tracking** with real-time status updates
- **Multiple detail levels**: Low, Medium, High

### Manual 3D Generation
- **Manual trigger** for existing products (when no 3D model exists)
- **Cancel generation** requests
- **Generation history** tracking
- **Status monitoring** for ongoing requests

### Advanced Features
- **Photogrammetry-based generation** for high detail levels
- **Texture mapping** from uploaded images
- **GLB format export** for web compatibility
- **Specific angle mapping** from frontend upload fields

## API Endpoints

### Product 3D Generation Endpoints

#### Get 3D Generation Status
```
GET /api/products/{product_id}/generation-status/
```
Returns the current 3D generation status for a product.

#### Manually Trigger 3D Generation
```
POST /api/products/{product_id}/generate-3d-model/
Content-Type: application/json

{
    "detail_level": "medium"  // "low", "medium", or "high"
}
```

#### Cancel 3D Generation
```
POST /api/products/{product_id}/cancel-3d-generation/
```

#### Upload Product Images (with 3D generation trigger)
```
POST /api/products/{product_id}/upload-files/
Content-Type: multipart/form-data

{
    "front_view_image": [file],
    "back_view_image": [file],
    "top_view_image": [file],
    "bottom_view_image": [file],
    "left_view_image": [file],
    "right_view_image": [file]
}
```

### 3D Generation Management Endpoints

#### Create Generation Request
```
POST /api/3d-generation/requests/
Content-Type: multipart/form-data

{
    "product": 123,
    "detail_level": "medium",
    "images": [file1, file2, ...],
    "angles": ["front", "back", ...]
}
```

#### Get Request Status
```
GET /api/3d-generation/requests/{request_id}/status/
```

#### Cancel Request
```
POST /api/3d-generation/requests/{request_id}/cancel/
```

#### Get Queue Status
```
GET /api/3d-generation/requests/queue_status/
```

## Frontend Integration

### Product Creation with 3D Generation

When creating a new product, the frontend should send a multipart form with specific field names for each image angle:

```javascript
// Frontend JavaScript/TypeScript example
const formData = new FormData();

// Product details
formData.append('name', 'My Product');
formData.append('description', 'Product description');
formData.append('price', '99.99');
formData.append('stock', '10');
formData.append('category', '1');
formData.append('detail_level', 'medium'); // Optional: 3D generation quality

// Image files with specific field names
formData.append('front_view_image', frontImageFile);
formData.append('back_view_image', backImageFile);
formData.append('top_view_image', topImageFile);
formData.append('bottom_view_image', bottomImageFile);
formData.append('left_view_image', leftImageFile);
formData.append('right_view_image', rightImageFile);

// Additional gallery images (optional)
formData.append('files', galleryImage1);
formData.append('files', galleryImage2);

// Make the request
const response = await fetch('/api/products/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: formData
});

const result = await response.json();
console.log('Product created:', result);
console.log('3D Generation status:', result.3d_generation_status);
```

### Product Editing with Manual 3D Generation

For existing products, sellers can:

1. **Upload additional images** using the upload-files endpoint
2. **Manually trigger 3D generation** if no 3D model exists
3. **Monitor generation progress** and cancel if needed

```javascript
// Upload additional images to existing product
const uploadFormData = new FormData();
uploadFormData.append('front_view_image', newFrontImage);
uploadFormData.append('back_view_image', newBackImage);

const uploadResponse = await fetch(`/api/products/${productId}/upload-files/`, {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: uploadFormData
});

// Manually trigger 3D generation (if no 3D model exists)
const generationResponse = await fetch(`/api/products/${productId}/generate-3d-model/`, {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        detail_level: 'high'
    })
});

// Check generation status
const statusResponse = await fetch(`/api/products/${productId}/generation-status/`, {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    }
});

const status = await statusResponse.json();
console.log('Generation status:', status);
```

### Frontend UI Requirements

The frontend should provide:

1. **Six specific upload slots** for different angles:
   - Front view
   - Back view
   - Top view
   - Bottom view
   - Left view
   - Right view

2. **3D Generation controls**:
   - Manual generation button (only if no 3D model exists)
   - Generation status indicator
   - Cancel generation button (if in progress)
   - Progress bar for ongoing generation

3. **Error handling**:
   - Display appropriate error messages
   - Handle insufficient images
   - Show when 3D model already exists

### Response Format

The API returns detailed information about 3D generation:

```json
{
    "id": 123,
    "name": "My Product",
    "description": "Product description",
    "price": "99.99",
    "3d_generation_status": {
        "has_generation": true,
        "status": "processing",
        "progress": 45,
        "message": "Generating 3D model...",
        "request_id": "uuid-here",
        "created_at": "2024-01-01T12:00:00Z",
        "completed_at": null,
        "has_3d_model": false
    }
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Blender Configuration
BLENDER_EXECUTABLE_PATH=C:\Users\Abdul Rehman\Downloads\blender-4.0.2-windows-x64\blender-4.0.2-windows-x64\blender.exe

# Generation Settings
MAX_GENERATION_QUEUE_SIZE=10
GENERATION_TIMEOUT_MINUTES=30

# Celery Configuration (for background processing)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Django Settings

The following settings are automatically configured in `core/settings.py`:

```python
# 3D Generation Settings
BLENDER_EXECUTABLE_PATH = env('BLENDER_EXECUTABLE_PATH', default=r'C:\Users\Abdul Rehman\Downloads\blender-4.0.2-windows-x64\blender-4.0.2-windows-x64\blender.exe')
MAX_GENERATION_QUEUE_SIZE = env('MAX_GENERATION_QUEUE_SIZE', default=10)
GENERATION_TIMEOUT_MINUTES = env('GENERATION_TIMEOUT_MINUTES', default=30)
```

## Installation Requirements

### 1. Blender Installation

Download and install Blender from [blender.org](https://www.blender.org/download/).

**Windows:**
- Download Blender 4.0 or later
- Extract to a directory (e.g., `C:\Users\Abdul Rehman\Downloads\blender-4.0.2-windows-x64\`)
- Update `BLENDER_EXECUTABLE_PATH` in your `.env` file

**Linux/macOS:**
- Install via package manager or download from blender.org
- Ensure `blender` command is available in PATH

### 2. Python Dependencies

Install additional dependencies:

```bash
pip install Pillow scipy numpy
```

### 3. Celery Setup

Install and configure Redis for Celery:

**Windows:**
```bash
# Install Redis for Windows (WSL recommended)
# Or use Docker:
docker run -d -p 6379:6379 redis:alpine
```

**Linux/macOS:**
```bash
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                 # macOS
```

### 4. Run Celery Worker

Start the Celery worker for background processing:

```bash
# Windows
celery -A core worker --pool=solo -l info

# Linux/macOS
celery -A core worker -l info
```

## Usage

### Automatic Generation

1. **Seller creates a product** with 2+ images using specific field names
2. **System automatically detects** sufficient images
3. **3D generation starts** in background
4. **Progress updates** available via API
5. **Generated model** automatically added to product

### Manual Generation

1. **Seller uploads additional images** to existing product
2. **System checks conditions** (2+ images, no existing model)
3. **Generation triggered manually** via API
4. **Monitor progress** via generation status endpoint

### API Integration

```python
import requests

# Create product with specific image field names
files = {
    'front_view_image': open('front.jpg', 'rb'),
    'back_view_image': open('back.jpg', 'rb'),
    'left_view_image': open('side.jpg', 'rb')
}

data = {
    'name': 'My Product',
    'description': 'Product description',
    'price': '99.99',
    'stock': '10',
    'category': '1',
    'detail_level': 'medium'
}

response = requests.post(
    'http://localhost:8000/api/products/',
    data=data,
    files=files,
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

# Check generation status
product_id = response.json()['id']
status_response = requests.get(
    f'http://localhost:8000/api/products/{product_id}/generation-status/',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

print(status_response.json())
```

## Testing

Run the test script to verify your setup:

```bash
python test_3d_generation.py
```

This will test:
- Blender detection and configuration
- Django settings
- Celery setup

## Troubleshooting

### Common Issues

1. **Blender not found**
   - Verify Blender installation
   - Check `BLENDER_EXECUTABLE_PATH` in `.env`
   - Ensure Blender is in system PATH

2. **Generation fails**
   - Check Celery worker is running
   - Verify Redis is accessible
   - Check Blender script permissions

3. **Timeout errors**
   - Increase `GENERATION_TIMEOUT_MINUTES`
   - Check system resources
   - Verify Blender performance

4. **Memory issues**
   - Reduce detail level
   - Process fewer images
   - Increase system memory

5. **Frontend integration issues**
   - Ensure correct field names are used
   - Check multipart form data format
   - Verify authentication headers

### Debug Mode

Enable debug logging in Django settings:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'ai_3d_generation': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Performance Considerations

### Optimization Tips

1. **Image Processing**
   - Use optimized image sizes (1024px max)
   - Compress images before upload
   - Use JPEG format for faster processing

2. **Generation Settings**
   - Use 'low' detail for testing
   - Use 'medium' for production
   - Use 'high' only when needed

3. **System Resources**
   - Ensure adequate RAM (8GB+ recommended)
   - Use SSD for faster I/O
   - Monitor CPU usage during generation

### Scaling

For production deployment:

1. **Multiple Celery workers**
   ```bash
   celery -A core worker --concurrency=4 -l info
   ```

2. **Redis clustering** for high availability

3. **Load balancing** for multiple servers

4. **Monitoring** with tools like Flower

## Security Considerations

1. **File validation** - Only allow image files
2. **Size limits** - Restrict upload sizes
3. **Authentication** - Require seller permissions
4. **Rate limiting** - Prevent abuse
5. **Temporary files** - Clean up after processing

## Future Enhancements

- **AI-powered angle detection**
- **Multiple model formats** (OBJ, FBX, etc.)
- **Texture optimization**
- **Batch processing**
- **Cloud rendering** integration
- **Real-time preview** generation

## New Features

- The system requires between **2 and 6 images** of a clothing item to generate a 3D model. Each image should be from a distinct angle (e.g., front, back, side, 45-degree angle).
- The generation process uses **Blender 4.0+** running in a headless environment.
- **Advanced Base Meshes:** Instead of primitive shapes, the service programmatically models a high-quality, curved base mesh for each clothing type (e.g., a T-shirt with a proper collar, sleeves, and torso curves).
- **UV Unwrapping & Texture Projection:** The script performs a smart UV unwrap on the generated base model and intelligently projects the user-provided images onto the UV map. This ensures the texture wraps realistically around the 3D model, preserving the design.
- **Asynchronous Processing:** 3D generation is a heavy task, so it is handled asynchronously by Celery workers. The API will accept a request and return a task ID, which can be used to poll for status updates.

## Supported Clothing Types
The system currently supports the following clothing types, each with its own unique base model generation logic:
- `tshirt`
- **`image_ids`**: A list of `ProductImage` primary keys that you want to use for generation. Must contain between 2 and 6 IDs.
- **`angle_mapping`**: A dictionary mapping an angle name (string) to an `image_id`. Must contain between 2 and 6 entries. Example: `{"front": 101, "back": 102}`.
- **`clothing_type`**: A string specifying the type of clothing. Must be one of the supported types listed above.
- **`detail_level`**: (Optional) The desired level of detail. Can be `low`, `medium`, or `high`. Defaults to `medium`.

#### Example Request Body
```json
{
  "image_ids": [101, 102, 103, 104],
  "angle_mapping": {
    "front": 101,
    "back": 102,
    "left_side": 103,
    "right_side": 104
  },
  "clothing_type": "tshirt",
  "detail_level": "medium"
} 