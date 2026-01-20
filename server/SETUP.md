# Hướng dẫn chạy server

## Bước 1: Tạo file .env

Tạo file `.env` trong thư mục `server` với nội dung:

```
MONGODB_URL_ATLAS=your_mongodb_connection_string_here
TOKEN_SEC_KEY=your_secret_key_here
PORT=3000
```

**Ví dụ:**
- `MONGODB_URL_ATLAS`: Chuỗi kết nối MongoDB Atlas của bạn
- `TOKEN_SEC_KEY`: Một chuỗi bí mật bất kỳ (ví dụ: `mySecretKey123456789`)
- `PORT`: Port server (mặc định 3000)

## Bước 2: Cài đặt dependencies (nếu chưa cài)

```bash
cd server
npm install
```

## Bước 3: Chạy server

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## Bước 4: Truy cập trang đăng nhập

Mở trình duyệt và truy cập: `http://localhost:3000/login.html`

## Lưu ý:

- Đảm bảo bạn đã có tài khoản với role `admin` trong database
- Nếu chưa có, bạn có thể tạo qua API `/api/account/register` với `role: "admin"`

