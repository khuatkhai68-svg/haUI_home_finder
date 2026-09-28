# 📜 BỘ LUẬT THÉP VẬN HÀNH & KIỂM SOÁT DỮ LIỆU
### Hệ Thống Tìm Trọ Sinh Viên HaUI (3 Cơ Sở: CS1 - CS2 - CS3)
*Trạng thái: **ĐÃ PHÊ DUYỆT & CHÍNH THỨC BAN HÀNH BỞI CHỦ DỰ ÁN***
*Thời điểm phê duyệt: **25/09/2026***

---

> [!NOTE]
> **Văn bản này đã được Chủ dự án kiểm tra và chính thức phê duyệt thông qua 100%.**
> Mọi quy chuẩn dưới đây là hiến pháp điều hành bắt buộc đối với toàn bộ mã nguồn, bot tự động và cơ sở dữ liệu của hệ thống.

## PHẦN I: NGUYÊN TẮC PHÁP LÝ & BẢO VỆ DỮ LIỆU CÁ NHÂN (PII)

### Điều 1. Tuân thủ Nghị định 13/2023/NĐ-CP của Chính phủ
1. **100% Nguồn dữ liệu công khai:** Hệ thống chỉ được phép thu thập dữ liệu từ các Nhóm Facebook công khai (Public Groups) và các cổng thông tin phòng trọ niêm yết công khai (như Phongtro123.com). Tuyệt đối không cào dữ liệu từ nhóm kín, tin nhắn riêng tư hoặc tài khoản cá nhân riêng.
2. **Khử tuyệt đối thông tin định danh cá nhân (De-identification):**
   - **CẤM** lưu trữ Facebook User ID (UID) của người đăng.
   - **CẤM** lưu trữ URL trang cá nhân (Personal Profile Link) của người đăng.
   - **CẤM** lưu trữ họ tên thật của tài khoản Facebook cá nhân.
3. **Chuẩn hóa thông tin liên hệ:**
   - Tên người đăng trên toàn bộ hệ thống luôn hiển thị ẩn danh chuẩn hóa: `"Chủ phòng / Người đăng (ẩn danh)"`.
   - Chỉ lưu trữ số điện thoại hotline/Zalo cho thuê phòng được chủ nhà công khai chủ động trong bài viết phục vụ sinh viên liên hệ xem phòng.

---

## PHẦN II: TIÊU CHUẨN LỌC RÁC & KIỂM ĐỊNH NỘI DUNG ĐẦU VÀO

### Điều 2. Bộ lọc loại bỏ 100% tin tìm phòng và ở ghép
1. **Tuyệt đối không lưu tin tìm trọ:** Mọi bài viết của sinh viên, người thuê đăng tin tìm kiếm phòng trọ (`cần tìm phòng`, `tìm trọ quanh Nhổn`, `tài chính 1tr5 cần tìm`, `ai có phòng quanh CS3 inbox`...) phải bị loại bỏ ngay lập tức tại cổng thu thập.
2. **Loại bỏ tin ở ghép và sang nhượng:** Loại bỏ toàn bộ bài đăng tìm người ở ghép (`tìm bạn ở cùng`, `share phòng`, `ở ghép bao điện nước`), pass đồ dùng cá nhân, thanh lý đồ đạc sinh viên.

### Điều 3. Loại bỏ triệt để rác thương mại và spam ngoài ngành
1. **Danh mục cấm lưu trữ:**
   - Quảng cáo nội thất, đồ gỗ, sofa, rèm cửa, máy in chuyển nhiệt.
   - Quảng cáo y tế, thuốc nam, spa, thẩm mỹ, mỹ phẩm, thực phẩm chức năng.
   - Mua bán bất động sản thổ cư, đất nền phân lô, biệt thự, dự án nghỉ dưỡng.
   - Tuyển dụng việc làm thêm, cộng tác viên, đa cấp, cho vay tín dụng, mở thẻ ngân hàng.
2. **Điều kiện công nhận bài đăng hợp lệ:**
   - Bắt buộc phải là bài **CHÀO CHO THUÊ** phòng trọ sinh viên, phòng trọ khép kín, chung cư mini (CCMN), căn hộ dịch vụ, nhà nguyên căn chia phòng, phòng studio trong bán kính phục vụ sinh viên HaUI.

---

## PHẦN III: TIÊU CHUẨN ĐA DẠNG HÓA DỮ LIỆU (DIVERSITY MANDATE)

### Điều 4. Phân bổ công bằng và đầy đủ 3 cơ sở đào tạo HaUI
Hệ thống không được phép tập trung lệch về một khu vực duy nhất, mà bắt buộc phải phân bổ thu thập đồng đều theo tỷ lệ đại diện:

| Cơ sở đào tạo | Khu vực địa bàn bắt buộc quét | Bán kính ưu tiên |
| :--- | :--- | :--- |
| **Cơ sở 1 (Minh Khai)** | Nhổn, Nguyên Xá, Văn Trì, Ngọa Long, Đình Quán, Kiều Mai, Phú Diễn, Cầu Diễn | ≤ 5.0 km |
| **Cơ sở 2 (Tây Tựu)** | Tây Tựu, Trung Tựu, Lai Xá, Kim Chung, Di Trạch, Vân Canh, Hoài Đức | ≤ 5.0 km |
| **Cơ sở 3 (Hà Nam)** | Phù Vân, Lê Hồng Phong, Trường Thi, Minh Khai, Lam Hạ, Châu Sơn, TP. Phủ Lý | ≤ 7.0 km |

### Điều 5. Đa dạng hóa phân khúc giá và loại hình phòng
1. **Phân khúc giá:**
   - *Phân khúc giá rẻ:* Dưới 1.8 triệu VNĐ/tháng (phòng trọ truyền thống, phù hợp tân sinh viên hoặc sinh viên ở 1 mình).
   - *Phân khúc tầm trung:* 1.8 triệu – 3.2 triệu VNĐ/tháng (phòng khép kín, có gác xép, điều hòa, ban công).
   - *Phân khúc cao cấp:* 3.5 triệu – 6.0 triệu VNĐ/tháng (CCMN full đồ, studio, căn hộ mini).
2. **Trích xuất thuộc tính tiện ích đầy đủ:**
   - Bắt buộc phân tích và gắn nhãn các tiện ích: `dieu_hoa`, `nong_lanh`, `may_giat`, `tu_lanh`, `thang_may`, `ban_cong`, `bep`, `giuong`, `tu_quan_ao`, `wifi`, `gac_xep`.
   - Phải phát hiện và đánh dấu tiêu chí: **Không chung chủ** và **Giờ giấc tự do (24/24)**.

---

## PHẦN IV: TÍNH TOÀN VẸN & CHỐNG TRÙNG LẶP DỮ LIỆU

### Điều 6. Cơ chế băm SHA-256 chống nhân bản
1. **Định danh duy nhất:** Mỗi bài đăng trước khi lưu trữ phải được trích xuất đoạn mô tả cốt lõi và tính toán chuỗi băm mật mã học **SHA-256** kết hợp đối soát URL nguồn chuẩn hóa.
2. **Quy tắc ngăn chặn trùng lặp:** Nếu mã băm nội dung hoặc URL bài đăng đã tồn tại trong cơ sở dữ liệu `alldata/room/`, hệ thống lập tức bỏ qua, không được phép ghi đè hay tạo bản ghi nhân bản rác.
3. **Mã phòng chuẩn hóa:** Tạo mã định danh độc bản duy nhất theo format chuẩn:
   - Phòng từ Facebook: `RM-FB-XXXXXX` (với XXXXXX là 6 ký tự hex ngẫu nhiên an toàn).
   - Phòng từ Phongtro123: `RM-PT123-XXXXXX`.

### Điều 7. Tọa độ địa lý và thời gian di chuyển thực tế
1. **Geocoding chuẩn xác:** Mỗi phòng trọ phải được định vị tọa độ (Vĩ độ Lat, Kinh độ Lng) dựa trên địa danh, ngõ, phố thực tế.
2. **Khoảng cách 3 cơ sở:** Tự động tính khoảng cách Haversine (km) đến đồng thời cả 3 cơ sở HaUI (CS1, CS2, CS3) và gán cơ sở gần nhất cùng ước tính thời gian đi xe máy (phút).

---

## PHẦN V: QUY CHUẨN VẬN HÀNH BOT TỰ ĐỘNG

### Điều 8. Chu kỳ và nhiệm vụ của Auto Crawl Bot
1. **Tần suất hoạt động:** Tự động kích hoạt định kỳ **mỗi 4 tiếng một lần** (`4 * 60 * 60 * 1000 ms`).
2. **Định mức mỗi đợt cào:**
   - Quét bổ sung tối đa **50 phòng Facebook mới** hợp lệ từ danh sách các nhóm công khai quanh HaUI CS1, CS2, CS3.
   - Quét bổ sung **15 - 20 phòng từ nguồn Phongtro123** đa cơ sở.
3. **Quản lý bộ nhớ:** Trình duyệt Playwright bắt buộc phải đóng hoàn toàn (`browser.close()`) ngay sau khi kết thúc đợt quét để không tiêu tốn RAM của server.
4. **Nhật ký kiểm toán (Audit Trail):** Mọi đợt cào bắt buộc ghi chép chi tiết vào `alldata/logs/crawl_bot.log` gồm: Thời gian bắt đầu, số bài quét, số phòng hợp lệ thu nhận, số bài rác bị loại, số bài tìm phòng bị loại, số bài trùng bị loại bỏ.

### Điều 9. Chu kỳ và nhiệm vụ của Link Health Bot
1. **Tần suất hoạt động:** Tự động kích hoạt định kỳ **mỗi 6 tiếng một lần**.
2. **Quy tắc xử lý link chết tuyệt đối an toàn:**
   - **CHỈ ĐƯỢC XÓA** phòng khi máy chủ nguồn trả về mã HTTP `404 Not Found` (bài viết đã bị xóa vĩnh viễn) hoặc `410 Gone`.
   - **TUYỆT ĐỐI KHÔNG XÓA** phòng khi gặp mã `403 Forbidden` (do máy chủ Facebook hoặc Phongtro123 chặn IP cloud/chống bot) hoặc các lỗi mạng tạm thời `5xx`.
