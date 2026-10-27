import os
import json
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, InvalidArgument, GoogleAPIError
from dotenv import load_dotenv

from dotenv import load_dotenv

class GeminiKeyManager:
    """Quản lý multi-key rotation cho Gemini API (google-generativeai 0.8.x)"""
    
    def __init__(self):
        # Reload .env every time to ensure fresh keys (e.g. if modified while uvicorn is running)
        load_dotenv(override=True)
        # Lấy Key từ .env, hỗ trợ mảng (chia bằng dấu ,)
        keys_str = os.getenv("GEMINI_KEYS", "")
        self.keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        self.current_index = 0
        
        if not self.keys:
            print("WARNING: GEMINI_KEYS env variable is empty!")

    def get_current_key(self):
        if not self.keys:
            return None
        return self.keys[self.current_index]

    def rotate_key(self):
        if not self.keys:
            return
        self.current_index = (self.current_index + 1) % len(self.keys)
        print(f"[*] AUTO ROTATION: Switched to API Key index: {self.current_index}")

    def _generate(self, prompt: str, model_name: str = "gemini-2.5-flash") -> str:
        """Generic generate method với key rotation fallback"""
        if not self.keys:
            raise Exception("No Gemini keys available in server pool.")
            
        attempts = 0
        max_attempts = len(self.keys)
        
        while attempts < max_attempts:
            current_key = self.get_current_key()
            genai.configure(api_key=current_key)
            
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={"response_mime_type": "application/json"}
            )
            
            try:
                response = model.generate_content(prompt)
                return response.text
                
            except (ResourceExhausted, InvalidArgument, GoogleAPIError) as e:
                print(f"[!] Failed with Key (Index: {self.current_index}): {str(e)}")
                self.rotate_key()
                attempts += 1
            except Exception as e:
                raise Exception(f"Internal generation crash: {str(e)}")
                
        raise Exception("All Gemini API keys in the rotation pool have been exhausted or are invalid.")

    def generate_brandkit(self, prompt: str) -> str:
        """Tạo brandkit từ prompt"""
        try:
            return self._generate(prompt)
        except Exception as e:
            print(f"[MOCK FALLBACK] Brandkit API failed: {e}")
            return '{"primaryColor": "#2563EB", "secondaryColor": "#F59E0B", "typographyScheme": "Inter for Headers, Roboto for Body", "logoConceptShape": "Geometric Circle"}'

    def generate_social_copy(self, topic: str, context: str) -> str:
        """Tạo social media content (caption + banner quote)"""
        prompt = f"""
        # NHIỆM VỤ
        Bạn là chuyên gia Social Media Marketing. Khách hàng có thông tin Brandkit: [{context}].
        Chủ đề bài đăng: "{topic}".
        
        # YÊU CẦU ĐẦU RA (JSON format):
        {{
          "caption": "Viết 1 bài đăng chuẩn SEO, có emoji, có Hook hấp dẫn, CTA rõ ràng",
          "hashtags": ["hashtag1", "hashtag2", "..."],
          "banner_quote": "1 câu headline cực ngắn (dưới 8 từ) giật gân cho ảnh banner"
        }}
        
        Return pure JSON only. NO MARKDOWN formatting. NO code blocks.
        """
        try:
            return self._generate(prompt)
        except Exception as e:
            print(f"[MOCK FALLBACK] Social Copy API failed: {e}")
            return '{"caption": "Khám phá ngay bộ sưu tập đỉnh cao mới nhất của chúng tôi! 🌟 Thiết kế hiện đại, chất lượng vượt trội. Mua ngay hôm nay để nhận ưu đãi đặc biệt. 👇", "hashtags": ["#marketing", "#trending", "#viral"], "banner_quote": "Bứt Phá Giới Hạn!"}'

    def generate_social_post(self, platform: str, brand_context: str, topic: str, tone: str = "professional", requirements: str = "") -> str:
        """Tạo social post cho platform cụ thể (Facebook, Instagram, LinkedIn, TikTok)"""
        platform_guidelines = {
            "facebook": "Tối đa 2000 ký tự, sử dụng emoji vừa phải, CTA rõ ràng",
            "instagram": "Caption ngắn gọn 150-300 ký tự, nhiều hashtag (15-30), visual-first",
            "linkedin": "Chuyên nghiệp, 600-1200 ký tự, ít hashtag (3-5), thought leadership",
            "tiktok": "Gen-Z vibe, ngắn gọn, trend-driven, hook trong 3 giây đầu",
            "twitter": "Dưới 280 ký tự, hashtag 1-2, provocative/engaging"
        }
        
        guideline = platform_guidelines.get(platform, platform_guidelines["facebook"])
        req_text = f"\n        # YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG\n        {requirements}" if requirements else ""
        
        prompt = f"""
        # NHIỆM VỤ
        Bạn là chuyên gia Social Media Marketing cho nền tảng {platform.upper()}.
        
        # THÔNG TIN THƯƠNG HIỆU
        {brand_context}{req_text}
        
        # CHỦ ĐỀ
        {topic}
        
        # TONE OF VOICE
        {tone}
        
        # HƯỚNG DẪN PLATFORM
        {guideline}
        
        # YÊU CẦU ĐẦU RA (JSON format):
        {{
          "caption": "Nội dung bài đăng đầy đủ",
          "hashtags": ["hashtag1", "hashtag2"],
          "imagePrompt": "Mô tả ảnh minh họa phù hợp bằng tiếng Anh cho AI image generation",
          "bestPostingTime": "Thời điểm đăng bài tốt nhất",
          "engagementTips": "1-2 mẹo tăng tương tác"
        }}
        
        Return pure JSON only. NO MARKDOWN. NO code blocks.
        """
        try:
            return self._generate(prompt)
        except Exception as e:
            print(f"[MOCK FALLBACK] Social Post API failed: {e}")
            return '{"caption": "Hey everyone! 👋 Check out our latest updates. We have been working hard to bring you the best experience possible! 🚀 Stay tuned for more. #growth #innovation", "hashtags": ["#startup", "#growth", "#tech"], "imagePrompt": "A minimalist, high-quality photograph showing innovation and modern lifestyle, bright lighting.", "bestPostingTime": "10:00 AM", "engagementTips": "Ask a relevant question at the end to boost comments."}'

    def generate_website_copy(self, topic: str, target_audience: str, brand_context: str, page_type: str = "Landing Page", requirements: str = "") -> str:
        """Tạo cấu trúc nội dung Website (Landing Page, About Us,...) kèm JSON-LD Schema"""
        
        req_text = f"\\n        # YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG\\n        {requirements}" if requirements else ""
        
        prompt = f"""
        # NHIỆM VỤ
        Bạn là chuyên gia Copywriting và SEO Website. Hãy thiết kế nội dung cho một trang web loại: {page_type}.
        Chủ đề chính: {topic}.
        Tệp khách hàng: {target_audience}.{req_text}
        
        # THÔNG TIN THƯƠNG HIỆU
        {brand_context}
        
        # YÊU CẦU ĐẦU RA (Strict JSON format):
        {{
          "heroSection": {{
            "headline": "Tiêu đề chính kích thích",
            "subheadline": "Tiêu đề phụ giải thích giá trị cốt lõi",
            "cta": "Lời kêu gọi hành động (VD: Khám phá ngay)"
          }},
          "features": [
            {{ "title": "Tính năng 1", "description": "Mô tả tính năng 1" }},
            {{ "title": "Tính năng 2", "description": "Mô tả tính năng 2" }},
             {{ "title": "Tính năng 3", "description": "Mô tả tính năng 3" }}
          ],
          "socialProof": "1 câu trích dẫn chứng thực (Testimonial) từ khách hàng giả định",
          "metaTitle": "Tiêu đề SEO (< 60 ký tự)",
          "metaDescription": "Mô tả SEO (< 160 ký tự)",
          "jsonLdSchema": "Mã JSON-LD nguyên bản (String) dùng để gắn thẻ `<script type='application/ld+json'>` chuẩn schema.org cho {page_type}"
        }}
        
        Return pure JSON only. NO MARKDOWN. NO code blocks.
        """
        try:
            return self._generate(prompt)
        except Exception as e:
            print(f"[MOCK FALLBACK] Website API failed: {e}")
            return '{"heroSection": {"headline": "Giải pháp toàn diện cho doanh nghiệp", "subheadline": "Tối ưu quy trình, bứt phá doanh thu với bộ công cụ hiện đại", "cta": "Bắt đầu miễn phí"}, "features": [{"title": "Nhanh chóng", "description": "Tích hợp chỉ trong 5 phút"}, {"title": "Bảo mật", "description": "An toàn dữ liệu tuyệt đối"}, {"title": "Hỗ trợ 24/7", "description": "Luôn đồng hành cùng bạn"}], "socialProof": "Sản phẩm này đã thay đổi cách chúng tôi kinh doanh! - Nguyễn Văn A", "metaTitle": "Giải pháp doanh nghiệp hàng đầu", "metaDescription": "Nền tảng tối ưu hoá vận hành doanh nghiệp của bạn nhanh chóng và hiệu quả.", "jsonLdSchema": "{}"}'

    def generate_pr_article(self, topic: str, focus_keywords: str, brand_context: str, requirements: str = "") -> str:
        """Tạo bài viết SEO / PR / Blog (Super Long Form) chuẩn E-E-A-T"""
        
        req_text = f"\\n        # YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG\\n        {requirements}" if requirements else ""
        
        prompt = f"""
        # NHIỆM VỤ
        Bạn là chuyên gia Content Marketing cấp cao, một nhà báo (Journalist) với phong cách viết chuyên nghiệp, chuyên sâu.
        Hãy viết một bài PR/Blog CỰC KỲ DÀI VÀ CHI TIẾT (SUPER LONG FORM - ÍT NHẤT 2000 TỪ), tối ưu chuẩn SEO (E-E-A-T) cho Google.
        
        Chủ đề bài viết: {topic}
        Từ khóa tập trung (Focus Keywords): {focus_keywords}
        
        # THÔNG TIN THƯƠNG HIỆU
        {brand_context}{req_text}
        
        # YÊU CẦU NỘI DUNG (Super Long Form & E-E-A-T):
        1. Bài viết phải có cấu trúc phân mảnh rõ rệt, đào sâu vào từng khía cạnh của chủ đề.
        2. Bắt đầu với một "Hook" mở đầu mạnh mẽ, nêu lên nỗi đau của độc giả và hứa hẹn đưa ra giải pháp toàn diện.
        3. Phân chia rõ ràng bằng H2, H3, H4 (Subheadings).
        4. Sử dụng bullet points, trích dẫn chuyên gia (Expert Quotes).
        5. Đưa ra lập luận logic, số liệu thống kê (có thể giả định theo ngữ cảnh), phân tích sâu sắc.
        6. Kết hợp từ khóa "{focus_keywords}" một cách tự nhiên khắp bài (LSI keywords).
        7. Đề xuất vị trí thích hợp để thêm các External/Outbound links uy tín.
        8. Đoạn kết đúc kết giá trị và chèn khéo léo thông tin thương hiệu vào (Soft Sell).
        
        # YÊU CẦU ĐẦU RA (Strict JSON format):
        {{
          "title": "Tiêu đề bài viết H1 lôi cuốn",
          "metaTitle": "SEO Meta Title",
          "metaDescription": "SEO Meta Description chứa ngữ cảnh lôi kéo click",
          "focusKeyword": "{focus_keywords}",
          "suggestedOutboundLinks": ["Tên tổ chức/trang web gợi ý 1", "Tên trang web 2"],
          "articleBody": "NỘI DUNG BÀI VIẾT (Markdown string). Sử dụng ## cho H2, ### cho H3, trích dẫn khối (>), danh sách (-, 1.)... Bài viết BẮT BUỘC phải rất dài, chi tiết, văn phong báo chí sâu sắc (Hơn 2000 từ)."
        }}
        
        Return pure JSON only. NO MARKDOWN framing the JSON. NO code blocks.
        """
        # For very long form, recommend using Gemini 1.5 Pro to avoid heavy context limits and short-cutting, 
        # but 2.5 flash is default. We will use the model that can generate long context.
        try:
            return self._generate(prompt)
        except Exception as e:
            print(f"[MOCK FALLBACK] PR API failed: {e}")
            return '{"title": "Bí Quyết Đột Phá Doanh Thu Nhờ Công Nghệ", "metaTitle": "Bí Quyết Đột Phá", "metaDescription": "Tìm hiểu cách công nghệ giúp doanh nghiệp bạn vươn xa.", "focusKeyword": "Công nghệ", "suggestedOutboundLinks": ["Google", "Forbes"], "articleBody": "## Khởi Đầu Mới\\nTrong kỷ nguyên số, công nghệ đóng vai trò then chốt...\\n\\n### Tối Ưu Hóa\\nCải thiện quy trình là bước đầu tiên.\\n\\n> Công nghệ không bao giờ dừng lại.\\n\\n1. Đầu tư hạ tầng\\n2. Đào tạo nhân sự\\n\\nTóm lại, sự thay đổi là bắt buộc."}'

# Khởi tạo instance Singleton toàn cục
ai_manager = GeminiKeyManager()
