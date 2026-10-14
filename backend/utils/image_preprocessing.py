import io
from typing import Tuple
from PIL import Image, ImageOps, ImageEnhance
import numpy as np

def safe_exif_transpose(image: Image.Image) -> Image.Image:
    """
    Corrects camera orientation using EXIF metadata without modifying coordinates erroneously.
    """
    try:
        return ImageOps.exif_transpose(image)
    except Exception:
        return image

def resize_maintaining_aspect_ratio(image: Image.Image, max_dim: int = 1280) -> Tuple[Image.Image, float]:
    """
    Resizes image if its largest dimension exceeds max_dim, preserving the exact aspect ratio.
    Returns (resized_image, scale_factor).
    """
    width, height = image.size
    if max(width, height) <= max_dim:
        return image, 1.0
    
    scale = max_dim / float(max(width, height))
    new_w = max(1, int(round(width * scale)))
    new_h = max(1, int(round(height * scale)))
    resized = image.resize((new_w, new_h), Image.Resampling.BILINEAR)
    return resized, scale

def enhance_for_ocr(image: Image.Image, contrast_factor: float = 1.25) -> np.ndarray:
    """
    Applies gentle contrast enhancement and RGB numpy conversion for OCR pipelines.
    Avoids aggressive binarization that may destroy colored text on signs.
    """
    img = safe_exif_transpose(image)
    try:
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(contrast_factor)
    except Exception:
        pass
    return np.array(img.convert("RGB"))

def estimate_blur_and_lighting(image: Image.Image) -> dict:
    """
    Assesses image luminance and contrast to warn low-vision users if photo is too dark or washed out.
    """
    rgb_img = image.convert("RGB")
    gray_img = rgb_img.convert("L")
    stat = np.array(gray_img)
    avg_luminance = float(np.mean(stat))
    std_contrast = float(np.std(stat))
    
    is_too_dark = avg_luminance < 45.0
    is_washed_out = avg_luminance > 220.0
    is_low_contrast = std_contrast < 18.0
    
    recommendation = "Image lighting is adequate for visual recognition."
    if is_too_dark:
        recommendation = "Scene appears very dark. Turn on a room light or flashlight for better accuracy."
    elif is_washed_out:
        recommendation = "Scene has strong glare or overexposure. Avoid pointing directly at light bulbs."
    elif is_low_contrast:
        recommendation = "Low contrast detected. Hold the camera steady and bring it closer to the subject."
        
    return {
        "average_luminance": round(avg_luminance, 1),
        "contrast_std": round(std_contrast, 1),
        "is_too_dark": is_too_dark,
        "is_washed_out": is_washed_out,
        "recommendation": recommendation
    }
