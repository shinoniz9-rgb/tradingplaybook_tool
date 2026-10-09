# TRADING PLAYBOOK - MÔ HÌNH GIÁ & RSI ĐA KHUNG THỜI GIAN

Hệ thống web lưu trữ và ôn tập các thiết lập giao dịch (Trading Setups), mô hình Giá và phân kỳ RSI theo tiến trình phân tích đa khung thời gian (Top-Down Analysis).

---

## 1. CẤU TRÚC PHÂN TÍCH 4 TẦNG

Mỗi mô hình được chuẩn hóa thành 4 chiếc hộp khép kín (Khung ảnh 16:9 + Ô Điều kiện & Ghi chú nằm ngay bên dưới ảnh, mép căn thẳng hàng tuyệt đối):

1. **1. Xu Hướng** (`1D`, `H4`...): Nhận diện xu hướng vĩ mô, Key Level lớn, cản tuần/ngày.
2. **2. Mô Hình** (`H4`, `H2`, `H1`...): Mô hình Giá (Vai đầu vai, 2 đáy, Nêm...) và Mô hình Phân kỳ RSI chính.
3. **3. Liền Kề** (`H1`, `M30`, `M15`...): Cầu nối xác nhận, phản ứng quanh mốc RSI 50, kiểm tra lại cản (Retest).
4. **4. Cấu Trúc** (`M15`, `M10`, `M5`...): Vi cấu trúc (BOS, CHoCH), nến kích hoạt vào lệnh (Trigger Entry), tối ưu điểm dừng lỗ (SL).

---

## 2. CÁCH KHỞI ĐỘNG VÀ SỬ DỤNG

### A. Trên Máy Tính (PC / Laptop)
Có 3 cách cực kỳ đơn giản:

* **Cách 1 (Nhanh nhất):** Nhấp đúp chuột vào file **`start.bat`**. Trình duyệt sẽ tự động mở trang web tại `http://localhost:3000`.
* **Cách 2 (Dùng Terminal):** Mở terminal tại thư mục này và gõ:
  ```bash
  npm start
  ```
* **Cách 3 (Mở trực tiếp):** Nhấp đúp trực tiếp vào file **`index.html`** để mở ngay trên trình duyệt mà không cần bật server.

### B. Trên iPad và iPhone (Mobile)
1. Đảm bảo máy tính và iPad/iPhone đang kết nối **chung một mạng Wi-Fi**.
2. Khởi động server trên máy tính (bằng file `start.bat` hoặc lệnh `npm start`). Terminal sẽ thông báo địa chỉ IP mạng nội bộ, ví dụ:
   ```text
   > iPad & iPhone (Chung mạng Wi-Fi):
     http://192.168.1.4:3000
   ```
3. Mở trình duyệt **Safari** hoặc **Chrome** trên iPad / iPhone và truy cập địa chỉ IP đó.
4. *(Mẹo hay)* Trên Safari iOS, bấm nút **Chia sẻ (Share)** -> chọn **"Thêm vào Màn hình chính (Add to Home Screen)"** để mở ứng dụng toàn màn hình như một App độc lập!

---

## 3. CÁC TÍNH NĂNG VÀ THAO TÁC NỔI BẬT

* **Nạp ảnh siêu tốc:**
  * **Trên Máy tính:** Bấm vào ô ảnh rồi ấn tổ hợp phím **`Ctrl + V`** để dán ảnh chụp màn hình trực tiếp từ TradingView mà không cần lưu file về máy.
  * **Trên iPad / iPhone:** Bấm nút **`Chọn ảnh từ Thư viện`** để lấy ảnh từ Photo Library.
* **Tối ưu hiển thị cho từng thiết bị:**
  * **Máy tính & iPad:** Hiển thị dạng **Lưới 2x2 đối xứng 50% - 50% cân đối tuyệt đối**. Ô ghi chú nằm ngay dưới ảnh, viền căn thẳng hàng tắp.
  * **Mobile (iPhone):** Hiển thị 1 khung to bản, hỗ trợ **vuốt ngang ngón tay trái / phải** để chuyển đổi mượt mà giữa 4 khung, hoặc bấm hàng 4 nút Tab ở đầu trang.
* **Soi chi tiết nến & RSI:**
  * Chạm hoặc bấm vào bất kỳ biểu đồ nào để mở **Chế độ phóng to toàn màn hình (Lightbox Zoom)**. Hỗ trợ phóng to đến 400%, thu nhỏ, rê chuột kéo ảnh để soi rõ từng cây nến và chỉ số RSI.
* **Bộ lọc thông minh:**
  * Tìm kiếm tức thì theo từ khóa (tiêu đề, nội dung ghi chú).
  * Lọc theo Cặp giao dịch: **`XAU`** hoặc **`BTC`**.
  * Lọc theo Vị thế: **`BUY`** hoặc **`SELL`**.
  * Lọc theo Kết quả lệnh: **`Thắng`**, **`Thua`**, **`Hòa`**, **`Quan sát`**.
* **Đồng bộ đám mây tức thì (Firebase Realtime Cloud Sync):**
  * Tự động đồng bộ 2 chiều qua Firebase Realtime Database (Singapore).
  * Thêm/sửa mô hình trên Máy tính ➔ Tự động cập nhật ngay trên iPhone / iPad mà không cần thao tác thủ công.
  * Hỗ trợ lưu trữ ngoại tuyến thông minh (Offline-First) qua IndexedDB.
* **Lưu trữ bền vững & Sao lưu (Backup):**
  * Dữ liệu và hình ảnh được lưu trữ trực tiếp vào **IndexedDB** của trình duyệt, không lo bị giới hạn dung lượng 5MB như LocalStorage.
  * Nút **`Xuất file sao lưu (JSON)`**: Tải về một file sao lưu chứa toàn bộ biểu đồ và ghi chú.
  * Nút **`Nhập file sao lưu (JSON)`**: Khôi phục hoặc chuyển đổi dữ liệu giữa các máy tính, iPad và điện thoại.

---

## 4. CẤU TRÚC MÃ NGUỒN

```
tradingplaybook_tool/
├── index.html          # Giao diện chính (Danh sách, Chi tiết, Thêm/Sửa mẫu, Lightbox Zoom)
├── css/
│   └── style.css       # Hệ thống giao diện Dark Theme tối giản, Responsive Lưới 2x2 & Mobile Swipe
├── js/
│   ├── db.js           # Xử lý cơ sở dữ liệu IndexedDB nội bộ
│   ├── sync.js         # Động cơ đồng bộ Firebase Cloud thời gian thực (Singapore)
│   └── app.js          # Bộ điều khiển sự kiện, dán Ctrl+V, cử chỉ vuốt chạm và bộ lọc
├── server.js           # Máy chủ tĩnh siêu nhẹ phát hiện địa chỉ IP nội bộ cho iPad / iPhone
├── start.bat           # Phím tắt nhấp đúp chuột để khởi chạy web trên Windows
├── package.json        # Thông tin gói và câu lệnh khởi động
└── README.md           # Tài liệu hướng dẫn sử dụng chi tiết
```
