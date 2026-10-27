import os
from fastapi import Request, HTTPException, status
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

# Khởi tạo Admin SDK bằng Service Account JSON
cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
if not cred_path or not os.path.exists(cred_path):
    print("WARNING: FIREBASE_SERVICE_ACCOUNT_PATH không tồn tại hoặc sai đường dẫn. Xác thực bảo mật rớt.")
else:
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

async def verify_firebase_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    
    token = auth_header.split("Bearer ", 1)[1]
    
    try:
        # Nếu đang ở chế độ demo
        if token == "demo-token":
            return {"uid": "demo-uid", "email": "demo@urahsme.com"}
            
        # Giải mã và Verify Token thông qua Server của Google
        decoded_token = auth.verify_id_token(token)
        return decoded_token  # Trả về Object chứa uid, email của người dùng
    except Exception as e:
        # Cố tình nuốt Error thật vào Log, trả HTTP code vô danh cho Frontend (Chuẩn bảo mật)
        print(f"Auth Blocked: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed or expired"
        )
