import os
import base64
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

def hex_to_rgb(hex_color: str):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def wrap_text(text: str, font, max_width: int):
    """Word break cho text không bị tràn Canvas."""
    lines = []
    words = text.split()
    current_line = []
    
    for word in words:
        test_line = " ".join(current_line + [word])
        # get length of the test_line
        test_width = font.getbbox(test_line)[2]
        if test_width <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
            
    if current_line:
        lines.append(" ".join(current_line))
    return lines

def generate_social_image(logo_url: str, primary_color: str, secondary_color: str, overlay_text: str):
    """
    Vẽ 1 banner 1080x1080 chuẩn vuông Facebook/Insta.
    Trả về định dạng base64 string.
    """
    width, height = 1080, 1080
    bg_color = hex_to_rgb(primary_color) if primary_color else (30, 30, 40)
    text_color = hex_to_rgb(secondary_color) if secondary_color else (255, 255, 255)
    
    # 1. Tạo Canvas
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # 2. Xử lý Logo (Download & Paste)
    if logo_url:
        try:
            # Fake User-Agent để bypass các server chặn scraping
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(logo_url, headers=headers, timeout=5)
            if response.status_code == 200:
                logo_img = Image.open(BytesIO(response.content)).convert("RGBA")
                # Resize logo cho vừa khung (Max width 300px)
                logo_img.thumbnail((300, 300), Image.Resampling.LANCZOS)
                
                # Tính toán vị trí dán logo (Góc trái trên cách viền 80px)
                logo_x, logo_y = 80, 80
                img.paste(logo_img, (logo_x, logo_y), logo_img)
        except Exception as e:
            print(f"Warning: Không thể nhúng Logo. Chi tiết lỗi: {e}")
            
    # 3. Phủ Text lên giữa Banner
    font_path = os.path.join(os.path.dirname(__file__), "assets", "fonts", "Roboto-Bold.ttf")
    try:
        font = ImageFont.truetype(font_path, size=80) # Size lớn tạo impact
    except IOError:
        font = ImageFont.load_default()
        
    lines = wrap_text(overlay_text, font, max_width=920) # Cách lề 2 bên 80px
    
    # Tính tổng chiều cao của khối Text để Center Vertical
    line_height = font.getbbox("A")[3] + 20
    total_text_height = len(lines) * line_height
    start_y = (height - total_text_height) // 2
    
    for i, line in enumerate(lines):
        # Center Horizontal cho từng dòng
        line_width = font.getbbox(line)[2]
        x = (width - line_width) // 2
        y = start_y + (i * line_height)
        
        # Vẽ viền đen mỏng (Stroke) để nổi chữ nếu nền quá sáng
        stroke_color = (0, 0, 0)
        draw.text((x-2, y-2), line, font=font, fill=stroke_color)
        draw.text((x+2, y-2), line, font=font, fill=stroke_color)
        draw.text((x-2, y+2), line, font=font, fill=stroke_color)
        draw.text((x+2, y+2), line, font=font, fill=stroke_color)
        
        # In chữ thật
        draw.text((x, y), line, fill=text_color, font=font)
        
    # 4. Xuất ảnh ra chuỗi Base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return f"data:image/png;base64,{img_str}"

def load_image_prompt(template_type: str, variables: dict) -> str:
    """Reads the JSON prompt template and injects dynamic variables."""
    import json
    import random
    import os
    
    prompt_file = os.path.join(os.path.dirname(__file__), "prompts", f"{template_type}_prompts.json")
    try:
        with open(prompt_file, 'r', encoding='utf-8') as f:
            templates = json.load(f)
            
        # Pick a random style from the template file
        style_key = random.choice(list(templates.keys()))
        template = templates[style_key]
        
        # Inject variables
        for key, value in variables.items():
            template = template.replace(f"{{{key}}}", str(value) if value else "")
            
        return template
    except Exception as e:
        print(f"Error loading prompt {prompt_file}: {e}")
        # Very robust fallback logic
        return f"A highly professional, minimalist flat vector logo on a pure solid white background. Business: {variables.get('business_name')}. Color: {variables.get('primary_color')}."

def generate_logo_image(business_name: str, primary_color: str, secondary_color: str, shape: str):
    """
    Generate a logo using Google Imagen API via GenAI HTTP Endpoint.
    Falls back to a simple pillow-based shape generation.
    Returns base64 string.
    """
    # 1. Load Dynamic Prompt
    prompt_text = load_image_prompt("logo", {
        "business_name": business_name or "Urah",
        "primary_color": primary_color or "#0A192F",
        "secondary_color": secondary_color or "#112240",
        "industry": "Business",
        "shape": shape or "geometric abstract shape"
    })
    
    print(f"[*] Generated Target Prompt for Imagen: {prompt_text}")
    
    # 2. Try calling Google Imagen 3 API via REST
    import requests
    from ai_service import GeminiKeyManager
    
    try:
        key_mgr = GeminiKeyManager()
        api_key = key_mgr.get_current_key()
        
        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={api_key}"
            payload = {
                "instances": [{"prompt": prompt_text}],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": "1:1"
                }
            }
            
            headers = {"Content-Type": "application/json"}
            res = requests.post(url, json=payload, headers=headers, timeout=25)
            
            if res.status_code == 200:
                data = res.json()
                if "predictions" in data and len(data["predictions"]) > 0:
                    b64_img = data["predictions"][0].get("bytesBase64Encoded")
                    if b64_img:
                        print("[*] Imagen 3 generated successfully.")
                        return f"data:image/png;base64,{b64_img}"
            else:
                print(f"[!] Imagen API Error: {res.status_code} - {res.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[!] Imagen request failed: {e}. Falling back to Pillow Mockup.")

    # FALLBACK to Pillow Geometric Mockup
    print("[*] Using Pillow geometry fallback...")
    width, height = 500, 500
    bg_color = hex_to_rgb(primary_color) if primary_color else (255, 255, 255)
    text_color = hex_to_rgb(secondary_color) if secondary_color else (0, 0, 0)
    
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw shape
    center_x, center_y = width // 2, height // 2
    radius = 150
    if "circle" in shape.lower() or "round" in shape.lower():
        draw.ellipse([center_x - radius, center_y - radius, center_x + radius, center_y + radius], fill=text_color)
        text_color = bg_color
    elif "square" in shape.lower() or "box" in shape.lower():
        draw.rectangle([center_x - radius, center_y - radius, center_x + radius, center_y + radius], fill=text_color)
        text_color = bg_color
    elif "triangle" in shape.lower():
        draw.polygon([center_x, center_y - radius, center_x - radius, center_y + radius, center_x + radius, center_y + radius], fill=text_color)
        text_color = bg_color
    
    # Draw first letter
    first_letter = business_name[0].upper() if business_name else "U"
    
    font_path = os.path.join(os.path.dirname(__file__), "assets", "fonts", "Roboto-Bold.ttf")
    try:
        font = ImageFont.truetype(font_path, size=200)
    except IOError:
        font = ImageFont.load_default()
        
    text_bbox = font.getbbox(first_letter)
    text_width = text_bbox[2] - text_bbox[0]
    
    ascent, descent = font.getmetrics()
    y = (height - ascent) // 2
    x = (width - text_width) // 2
    
    draw.text((x, y), first_letter, fill=text_color, font=font)
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return f"data:image/png;base64,{img_str}"
