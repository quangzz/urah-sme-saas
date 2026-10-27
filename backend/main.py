from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import time
from collections import defaultdict
from firebase_admin import firestore
from security import verify_firebase_token
from ai_service import ai_manager
from image_service import generate_social_image, generate_logo_image

app = FastAPI(title="URAH SME AI Core Service")

# ── Rate Limiter cho các endpoint không yêu cầu Auth ──────────────────────────
class InMemoryRateLimiter:
    """Simple IP-based rate limiter. Giới hạn số request mỗi IP trong 1 khoảng thời gian."""
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str) -> bool:
        now = time.time()
        self._requests[key] = [t for t in self._requests[key] if now - t < self.window_seconds]
        if len(self._requests[key]) >= self.max_requests:
            return False
        self._requests[key].append(now)
        return True

# 10 requests / phút / IP — đủ cho onboarding flow bình thường
rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)
# 30 requests / phút / authenticated user
auth_rate_limiter = InMemoryRateLimiter(max_requests=30, window_seconds=60)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://urahsme.web.app"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Models ────────────────────────────────────────────────────────────

class BrandkitRequest(BaseModel):
    businessName: str
    industry: str
    colorStyle: str
    slogan: str = ""
    rawDescription: Optional[str] = None

class LogoRequest(BaseModel):
    businessName: str
    primaryColor: str
    secondaryColor: str
    shape: str

class SocialPostRequest(BaseModel):
    workspaceId: str
    projectId: str
    topic: str
    platform: str = "facebook"
    tone: str = "professional"

class SocialGenerateRequest(BaseModel):
    """Request mới cho Social Content generation (platform-specific)"""
    workspaceId: str
    projectId: str
    platform: str  # facebook, instagram, linkedin, tiktok, twitter
    topic: str
    tone: str = "professional"
    requirements: Optional[str] = ""

class WebsiteGenerateRequest(BaseModel):
    """Request cho Website Content generation (SEO + JSON-LD)"""
    workspaceId: str
    projectId: str
    topic: str
    targetAudience: str = ""
    requirements: Optional[str] = ""
    pageType: str = "Landing Page"  # Landing Page, About Us, Contact, Product

class PRGenerateRequest(BaseModel):
    """Request cho PR/Blog Article generation (Long-form E-E-A-T)"""
    workspaceId: str
    projectId: str
    topic: str
    focusKeywords: str
    requirements: Optional[str] = ""

# ── Helper: Verify workspace access & build brand context ─────────────────────

async def _verify_and_build_context(workspace_id: str, project_id: str, uid: str):
    """Helper dùng chung cho các endpoint authenticated: verify access + build brand context."""
    db_client = firestore.client()
    
    if uid == "demo-uid":
        # Bypass check cho Demo Mode
        project_ref = db_client.collection("workspaces").document(workspace_id).collection("projects").document(project_id)
        project_data = project_ref.get().to_dict() if project_ref.get().exists else {"brandName": "Demo Brand"}
        return project_ref, project_data, "Brand: Demo Brand"
        
    workspace_doc = db_client.collection("workspaces").document(workspace_id).get()
    if not workspace_doc.exists:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if uid not in workspace_doc.to_dict().get("memberIds", []):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    project_ref = db_client.collection("workspaces").document(workspace_id) \
                    .collection("projects").document(project_id)
    project_doc = project_ref.get()
    if not project_doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
    project_data = project_doc.to_dict()
    
    # Xây dựng brand context
    brand_context = f"""
    Brand Name: {project_data.get('brandName', '')}
    Slogan: {project_data.get('slogan', '')}
    Industry: {project_data.get('industry', '')}
    Target Audience: {project_data.get('targetAudience', '')}
    """
    
    # Fetch brandkit bổ sung
    try:
        brandkits = project_ref.collection("brandkits").limit(1).get()
        if brandkits:
            bk = brandkits[0].to_dict()
            brand_context += f"\nBrand Voice: {bk.get('brandVoice', '')}"
            brand_context += f"\nVisual Style: {bk.get('visualContext', '')}"
    except Exception:
        pass
    
    return project_ref, project_data, brand_context

# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "ok", "service": "URAH SME Backend API v2.0"}

# ── Brandkit Generation (Public — rate limited by IP) ─────────────────────────

@app.post("/api/generate-brandkit")
async def generate_brandkit(payload: BrandkitRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.check(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait and try again.")
    
    prompt = f"""
    You are an expert brand designer AI.
    Generate a JSON object containing a brand styling configuration based on these choices:
    Business Name: '{payload.businessName}'
    Industry: '{payload.industry}'
    Color Style preference: '{payload.colorStyle}'
    Slogan: '{payload.slogan}'
    Additional User Raw Description (IMPORTANT: Focus heavily on this if provided to conceptualize the logoConceptShape and choose appropriate typography): '{payload.rawDescription or "N/A"}'
    
    Return pure JSON with ONLY these keys: 
    primaryColor (hex string), secondaryColor (hex string), typographyScheme (string description), logoConceptShape (string).
    Do not wrap the text in Markdown blocks (like ```json), just output the raw JSON format string.
    """
    
    try:
        result = ai_manager.generate_brandkit(prompt)
        return {"success": True, "data": result, "uid": None}
    except Exception as e:
        print(f"Backend Crash: {e}")
        raise HTTPException(status_code=500, detail="Internal AI generation issue. Please contact Support.")

# ── Logo Generation (Public — rate limited by IP) ─────────────────────────────

@app.post("/api/generate-logo")
async def generate_logo_api(payload: LogoRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.check(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait and try again.")
    try:
        import datetime
        with open("debug_log.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- {datetime.datetime.now()} ---\n")
            f.write(f"Received from frontend: {payload.model_dump()}\n")
            
        base64_logo = generate_logo_image(
            payload.businessName,
            payload.primaryColor,
            payload.secondaryColor,
            payload.shape
        )
        
        with open("debug_log.txt", "a", encoding="utf-8") as f:
            f.write(f"Generated logo length: {len(base64_logo)}\n")
            
        return {"success": True, "logo_base64": base64_logo}
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        with open("debug_log.txt", "a", encoding="utf-8") as f:
            f.write(f"EXCEPTION: {err_msg}\n")
        print(f"Logo Generation Error: {e}")
        raise HTTPException(status_code=500, detail="Could not generate logo.")

# ── Social Post Generation (Auth required) ────────────────────────────────────

@app.post("/api/generate-social-post")
async def generate_social_post(payload: SocialPostRequest, user_token: dict = Depends(verify_firebase_token)):
    uid = user_token.get("uid")
    
    # Rate limit per-user
    if not auth_rate_limiter.check(uid):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for authenticated user.")
    
    db = firestore.client()
    
    try:
        # Subcollection path: workspaces/{wId}/projects/{pId}
        project_ref = db.collection("workspaces").document(payload.workspaceId) \
                        .collection("projects").document(payload.projectId)
        project_doc = project_ref.get()
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")
        project_data = project_doc.to_dict()
        
        # Verify RBAC access
        workspace_ref = db.collection("workspaces").document(payload.workspaceId)
        workspace_doc = workspace_ref.get()
        if workspace_doc.exists:
            memberIds = workspace_doc.to_dict().get("memberIds", [])
            if uid not in memberIds:
                raise HTTPException(status_code=403, detail="Unauthorized for this workspace")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG][main] Firestore Error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching brand data")

    # Tạo brandkit context từ project data
    brand_name = project_data.get("brandName", "")
    industry = project_data.get("industry", "")
    context = f"Brand: {brand_name}. Industry: {industry}."
    
    # Fetch brandkit nếu có (từ subcollection)
    try:
        brandkits = project_ref.collection("brandkits").limit(1).get()
        if brandkits:
            bk = brandkits[0].to_dict()
            colors = bk.get("colorPalette", [])
            typo = bk.get("typography", {})
            context += f" Colors: {', '.join(colors)}. Typography: heading={typo.get('heading','')}, body={typo.get('body','')}."
            context += f" Brand Voice: {bk.get('brandVoice', '')}."
    except Exception as e:
        print(f"[DEBUG][main] Error fetching brandkit: {e}")

    # Generate AI copy
    try:
        ai_response_text = ai_manager.generate_social_copy(payload.topic, context)
        parsed = json.loads(ai_response_text.strip(' \n`').replace('json\n','', 1))
        caption = parsed.get("caption", "")
        hashtags = parsed.get("hashtags", [])
        banner_quote = parsed.get("banner_quote", "")
    except Exception as e:
        print(f"[DEBUG][main] AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail="Could not generate copy.")

    # Generate Image
    try:
        primary_color = "#2D3748"
        secondary_color = "#FFFFFF"
        
        # Lấy màu từ brandkit nếu có
        try:
            brandkits_snap = project_ref.collection("brandkits").limit(1).get()
            if brandkits_snap:
                bk_data = brandkits_snap[0].to_dict()
                palette = bk_data.get("colorPalette", [])
                if len(palette) >= 2:
                    primary_color = palette[0]
                    secondary_color = palette[1]
        except Exception:
            pass
        
        base64_image = generate_social_image("", primary_color, secondary_color, banner_quote)
    except Exception as e:
        print(f"[DEBUG][main] Image Rendering Error: {e}")
        raise HTTPException(status_code=500, detail="Error composing image.")

    return {
        "success": True,
        "caption": caption,
        "hashtags": hashtags,
        "banner_quote": banner_quote,
        "base64_image": base64_image
    }

# ── Social Content Generation V2 (Platform-specific) ─────────────────────────

@app.post("/api/v2/generate-social")
async def generate_social_v2(payload: SocialGenerateRequest, user_token: dict = Depends(verify_firebase_token)):
    """Endpoint mới cho Social Content - platform-specific generation"""
    uid = user_token.get("uid")
    
    if not auth_rate_limiter.check(uid):
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    
    try:
        _, project_data, brand_context = await _verify_and_build_context(payload.workspaceId, payload.projectId, uid)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG][main] Firestore Error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

    # Generate
    try:
        result_text = ai_manager.generate_social_post(payload.platform, brand_context, payload.topic, payload.tone, payload.requirements)
        parsed = json.loads(result_text.strip(' \n`').replace('json\n','', 1), strict=False)
        return {"success": True, "data": parsed}
    except Exception as e:
        print(f"[DEBUG][main] Social Gen Error: {e}")
        raise HTTPException(status_code=500, detail="Could not generate social content.")

# ── Website Content Generation V2 (SEO + JSON-LD) ────────────────────────────

@app.post("/api/v2/generate-website")
async def generate_website_v2(payload: WebsiteGenerateRequest, user_token: dict = Depends(verify_firebase_token)):
    """Endpoint tạo nội dung Website kèm JSON-LD Schema chuẩn SEO"""
    uid = user_token.get("uid")
    
    if not auth_rate_limiter.check(uid):
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    
    try:
        _, project_data, brand_context = await _verify_and_build_context(payload.workspaceId, payload.projectId, uid)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG][main] Firestore Error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

    # Lấy target audience từ project nếu không truyền
    target_audience = payload.targetAudience or project_data.get("targetAudience", "General audience")

    # Generate Website Copy
    try:
        result_text = ai_manager.generate_website_copy(payload.topic, target_audience, brand_context, payload.pageType, payload.requirements)
        parsed = json.loads(result_text.strip(' \n`').replace('json\n','', 1), strict=False)
        return {"success": True, "data": parsed}
    except Exception as e:
        print(f"[DEBUG][main] Website Gen Error: {e}")
        raise HTTPException(status_code=500, detail="Could not generate website content.")

# ── PR / Blog Article Generation V2 (Long-form E-E-A-T) ──────────────────────

@app.post("/api/v2/generate-pr")
async def generate_pr_v2(payload: PRGenerateRequest, user_token: dict = Depends(verify_firebase_token)):
    """Endpoint tạo bài PR/Blog dài chuẩn E-E-A-T cho SEO"""
    uid = user_token.get("uid")
    
    if not auth_rate_limiter.check(uid):
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    
    try:
        _, project_data, brand_context = await _verify_and_build_context(payload.workspaceId, payload.projectId, uid)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG][main] Firestore Error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

    # Generate PR Article
    try:
        result_text = ai_manager.generate_pr_article(payload.topic, payload.focusKeywords, brand_context, payload.requirements)
        parsed = json.loads(result_text.strip(' \n`').replace('json\n','', 1), strict=False)
        return {"success": True, "data": parsed}
    except Exception as e:
        import traceback
        error_msg = f"[DEBUG][main] PR Gen Error: {e}\n{traceback.format_exc()}\nResult text: {result_text if 'result_text' in locals() else 'None'}"
        print(error_msg)
        with open("error.log", "a", encoding="utf-8") as f:
            f.write(error_msg + "\n---\n")
        raise HTTPException(status_code=500, detail="Could not generate PR article.")
