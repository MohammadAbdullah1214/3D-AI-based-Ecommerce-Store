import cv2
import numpy as np
from rembg import remove
from PIL import Image
import io


def remove_background(image_path, method='auto'):
    """
    Remove background from image using either green screen or AI-based method.
    method: 'green' for green screen, 'auto' for AI (rembg)
    Returns: cleaned_image (PIL.Image), mask (np.ndarray)
    """
    image = cv2.imread(image_path)
    if method == 'green':
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        lower_green = np.array([40 - 30, 40, 40])
        upper_green = np.array([40 + 30, 255, 255])
        mask = cv2.inRange(hsv, lower_green, upper_green)
        mask_inv = cv2.bitwise_not(mask)
        result = cv2.bitwise_and(image, image, mask=mask_inv)
        cleaned = Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))
        return cleaned, mask_inv
    else:
        # Use rembg for arbitrary backgrounds
        with open(image_path, 'rb') as f:
            input_bytes = f.read()
        output_bytes = remove(input_bytes)
        cleaned = Image.open(io.BytesIO(output_bytes)).convert('RGBA')
        # Create mask from alpha channel
        mask = np.array(cleaned.split()[-1])
        return cleaned, mask

def extract_largest_contour(mask):
    """
    Extract the largest contour from a binary mask.
    Returns: list of (x, y) points
    """
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        return largest.reshape(-1, 2).tolist()
    return [] 