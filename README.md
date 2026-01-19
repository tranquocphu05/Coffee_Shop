# ☕ Coffee_Shop

**Dự án 1 (PRO1122)** — Ứng dụng Bán Cà Phê

---

## 🛍️ Giới thiệu

**Coffee_Shop** là ứng dụng **bán và quản lý sản phẩm cà phê**, giúp người dùng dễ dàng **xem menu, đặt hàng và quản lý đơn hàng** ngay trên điện thoại.
Ứng dụng hướng đến trải nghiệm mua sắm tiện lợi, hiện đại, phù hợp với các quán cà phê hoặc cá nhân kinh doanh đồ uống.

---

## ✨ Tính năng chính

### 📱 App Mobile (Người dùng) — **React Native**

- 👤 **Quản lý tài khoản**: Đăng ký, đăng nhập, cập nhật thông tin cá nhân
- ☕ **Xem sản phẩm**: Danh sách đồ uống, theo danh mục, top bán chạy, chi tiết sản phẩm
- 🔍 **Tìm kiếm & lọc**: Tìm theo tên, lọc theo danh mục
- ❤️ **Yêu thích**: Thêm/xóa đồ uống yêu thích
- 🛒 **Giỏ hàng**: Thêm, cập nhật số lượng, xóa sản phẩm
- 💳 **Đặt hàng**: Đặt hàng và xem lịch sử đơn hàng
- 💰 **Ví điện tử**: Tạo ví, nạp/rút tiền, lịch sử giao dịch, đổi PIN

### 💻 Web Admin Panel

- 📊 **Dashboard**: Tổng quan hệ thống
- 📦 **Quản lý sản phẩm**: Thêm, sửa, xóa sản phẩm và biến thể (size, giá)
- 📁 **Quản lý danh mục**: Thêm, xóa danh mục đồ uống
- 📋 **Quản lý đơn hàng**: Xem danh sách, cập nhật trạng thái
- 👥 **Quản lý khách hàng**: Danh sách & chi tiết khách hàng
- 🎨 **Quản lý banner**: Thêm, sửa, xóa banner khuyến mãi
- 📈 **Thống kê**: Doanh thu theo thời gian, top bán chạy, biểu đồ

---

## 🧩 Cấu trúc dự án

Dự án gồm **3 phần chính**:

### 1. 📱 App Mobile (Coffee_Shop Mobile)

- Phát triển bằng **React Native (TypeScript/JavaScript)**
- Giao diện thân thiện, dùng chung cho Android & iOS
- Kết nối server qua **RESTful API**
- Thư mục: `frontend/`

### 2. 💻 Server (Coffee_Shop API)

- **Giữ nguyên**: Node.js + Express + MongoDB
- Quản lý dữ liệu sản phẩm, tài khoản, giỏ hàng, đơn hàng
- Cung cấp **RESTful API** cho Mobile App & Web Admin
- Thư mục: `server/`
- Cấu trúc:

  - `controllers/` — Logic nghiệp vụ
  - `models/` — Schema MongoDB
  - `routes/` — API routes
  - `middleware/` — Auth & phân quyền
  - `views/` — EJS cho Web Admin
  - `public/` — Static (images, CSS, JS)

### 3. 🌐 Web Admin Panel

- Xây dựng bằng **EJS Templates + Tailwind CSS**
- Quản trị toàn bộ hệ thống
- Truy cập: `http://localhost:3000/login`
- Thư mục: `server/views/`

---

## 🧠 Công nghệ sử dụng

| Thành phần     | Công nghệ               |
| -------------- | ----------------------- |
| **Ngôn ngữ**   | JavaScript / TypeScript |
| **Mobile App** | React Native            |
| **Backend**    | Node.js + Express       |
| **CSDL**       | MongoDB                 |
| **Web Admin**  | EJS + Tailwind CSS      |
| **API**        | RESTful API             |
| **Auth**       | JWT                     |
| **Upload**     | Multer                  |
| **Charts**     | Chart.js                |

---

## 🚀 Mục tiêu dự án

- Xây dựng ứng dụng bán cà phê tiện lợi
- Hỗ trợ quán quản lý sản phẩm & đơn hàng hiệu quả
- Trải nghiệm người dùng mượt mà, dữ liệu đồng bộ real-time

---

## ⚙️ Hướng dẫn cài đặt

### 🔹 1. Clone dự án

```bash
npm install -g nodemon
# cài global cho máy
git clone https://github.com/Longlv003/coffee_shop.git
cd closethub/server
```

### 🔸 2. Server (Giữ nguyên)

```bash
cd server
npm install
npm i jsonwebtoken dotenv bcrypt mongoose multer
npm start
# hoặc
nodemon npm start
```

- Server: `http://localhost:3000/login`

### 🔹 3. App React Native

```bash
npx @react-native-community/cli init Coffee_Shop
# chỉ cài trong project
```

- Cấu hình base URL API (DEV_NGROK)
- Chạy app trên emulator hoặc thiết bị thật

### 🔸 4. Web Admin Panel

- Đăng nhập: `http://localhost:3000/login`
- Dashboard: `/admin/dashboard`
- Products: `/admin/products`
- Orders: `/admin/orders`
- Statistics: `/admin/statistics`
- Customers: `/admin/customers`
- Banners: `/admin/banners`

## 👥 Tác giả

PRO1122 — Dự án 1

---

## 📄 License

Dùng cho mục đích học tập
