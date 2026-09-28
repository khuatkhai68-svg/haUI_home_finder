# NỘI DUNG HỒ SƠ DỰ ÁN

## TÊN DỰ ÁN: HỆ THỐNG TỔNG HỢP VÀ HỖ TRỢ TÌM TRỌ AN TOÀN CHO SINH VIÊN ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI (HaUI ROOM FINDER - 3 CƠ SỞ)

---

### 1. Bài toán hoặc vấn đề thực tiễn cần giải quyết
**Nội dung trình bày:**  
Sau một thời gian học tập tại Hà Nội và Hà Nam, nhóm đã nhận ra rằng tìm trọ là trải nghiệm không thể thiếu đối với sinh viên. Qua trải nghiệm cá nhân của 3 thành viên, nhóm thấy sinh viên trường mình thường gặp rất nhiều khó khăn: các bài đăng tìm trọ trên mạng xã hội bị loãng, lẫn lộn rất nhiều tin môi giới, tin "tìm người ở ghép", bài đăng pass đồ thanh lý, thậm chí là các chiêu trò lừa đảo yêu cầu cọc giữ chỗ trước khi xem phòng. Đặc biệt, Đại học Công nghiệp Hà Nội (HaUI) có tới 3 cơ sở cách nhau khá xa: Cơ sở 1 (Minh Khai - Nhổn), Cơ sở 2 (Tây Tựu) và Cơ sở 3 (Phù Vân - Phủ Lý, Hà Nam), khiến việc tìm phòng gần đúng cơ sở mình theo học rất vất vả và mất nhiều thời gian đi lại. Nhóm đã tạo ra một website giúp sinh viên HaUI tổng hợp các thông tin cần có khi đi tìm trọ một cách tập trung, minh bạch và chính xác.

---

### 2. Mục tiêu, phạm vi và đối tượng ứng dụng của sản phẩm
**Nội dung trình bày:**  
Mục tiêu chính của sản phẩm là tạo ra một công cụ tiện ích giúp sinh viên HaUI dễ dàng tìm kiếm và xem xét phòng trọ tại cả 3 cơ sở của nhà trường:
* **Phạm vi ứng dụng:** Tập trung vào các khu vực tập trung đông sinh viên HaUI sinh sống:
  * *Cơ sở 1 (Bắc Từ Liêm & lân cận):* Phố Nhổn, Nguyên Xá, Văn Trì, Ngọa Long, Đình Quán, Kiều Mai, Cầu Diễn, Phú Diễn, Phúc Diễn, Tu Hoàng, Phương Canh.
  * *Cơ sở 2 (Bắc Từ Liêm & Hoài Đức):* Phường Tây Tựu, KĐT Lai Xá, Xã Kim Chung, Di Trạch, Thị trấn Trạm Trôi.
  * *Cơ sở 3 (Hà Nam):* Xã Phù Vân, Phường Lê Hồng Phong, TP. Phủ Lý.
* **Đối tượng ứng dụng:** Tân sinh viên mới nhập học, sinh viên đang theo học cần chuyển phòng, sinh viên năm cuối, cùng phụ huynh muốn chủ động tìm phòng trọ an toàn, giá cả phù hợp và gần trường cho con em mình.

---

### 3. Dữ liệu sử dụng, nguồn dữ liệu và tính hợp lệ của dữ liệu
**Nội dung trình bày:**  
Nguồn dữ liệu của hệ thống đến từ những thông tin phòng trọ được đăng công khai trên mạng xã hội và các cổng thông tin phòng trọ uy tín:
* **Các loại dữ liệu:** Tiêu đề bài đăng, giá thuê phòng (VNĐ/tháng), diện tích (m²), địa chỉ thực tế (ngõ, đường, phường/xã), danh sách tiện ích (điều hòa, nóng lạnh, gác xép, khép kín, ban công, máy giặt, thang máy...), hình ảnh thực tế của phòng, số điện thoại liên hệ và liên kết gốc (URL) dẫn đến bài đăng của chủ nhà.
* **Nguồn dữ liệu cụ thể:** 
  * Các hội nhóm Facebook công khai chuyên về trọ HaUI (nhóm trọ Nhổn - Nguyên Xá - Văn Trì, HaUI Tìm phòng trọ, Phòng trọ Hoài Đức, Phòng trọ HaUI CS3 Phù Vân - Hà Nam...).
  * Nguồn tin chuyên mục sinh viên từ website `phongtro123.com` tại các khu vực Bắc Từ Liêm, Hoài Đức và TP. Phủ Lý.
* **Hình thức thu thập dữ liệu:** Dữ liệu được thu thập qua công cụ Playwright kết hợp giao thức MCP (Model Context Protocol) được phát triển bởi Microsoft và cộng đồng mã nguồn mở trên GitHub. Công cụ tự động duyệt trang web công khai, cuộn tải nội dung, mở rộng các nút "Xem thêm" để đọc trọn vẹn mô tả từ bài đăng gốc.
* **Tính hợp lệ và bảo vệ dữ liệu cá nhân:** 
  * Toàn bộ dữ liệu trước khi đưa lên web đều được kiểm soát và chỉ lấy bài viết công khai, tuyệt đối không xâm nhập các hội nhóm riêng tư hoặc tài khoản cá nhân.
  * Tuân thủ nghiêm ngặt **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân: Hệ thống không thu thập mã định danh người dùng Facebook (UID), không lấy liên kết profile cá nhân, loại bỏ họ tên cá nhân ở tiêu đề bài viết và gán nhãn trung lập (ví dụ: *"Chủ nhà trọ Phù Vân"*, *"Chủ trọ khu vực HaUI CS1"*).
  * 100% tin đăng lưu giữ đường link bài viết gốc đang hoạt động để người dùng có thể bấm vào kiểm chứng độc lập.

---

### 4. Quy trình tiền xử lý, làm sạch, chuẩn hóa hoặc tổ chức dữ liệu
**Nội dung trình bày:**  
Dữ liệu thô sau khi được bot cào về sẽ trải qua quy trình 5 bước nghiêm ngặt trước khi ghi vào cơ sở dữ liệu:
1. **Lọc loại bỏ tin rác và tin không phù hợp:** 
   * Loại bỏ 100% bài viết của người tìm phòng (*"cần tìm phòng", "em tìm", "mình tìm trọ"*), bài viết tìm người ở ghép (*"tìm bạn ở ghép", "pass đồ thanh lý"*), và bài đăng quảng cáo dịch vụ khác.
   * Lọc bỏ triệt để các bài viết quảng cáo chéo địa bàn (ví dụ: tin đăng ở các quận xa như Quận 3, Tân Bình, Mai Dịch, Định Công... bị gắn nhầm từ khóa).
2. **Làm sạch văn bản mô tả (Text Sanitization):** 
   * Cắt bỏ các đoạn văn bản rác của giao diện Facebook (các nút *Thích, Bình luận, Chia sẻ, Xem thêm, Quản trị viên, Người tham gia ẩn danh...*).
3. **Trích xuất và chuẩn hóa giá tiền & diện tích:** 
   * Áp dụng bộ biểu thức chính quy (Regex) đa tầng để bóc tách chính xác giá phòng từ văn bản tự nhiên (*3tr, 3.5tr, 3tr2, 2 củ, 2500k, 1.800.000đ...*). 
   * Đặc biệt, nhóm đã xử lý loại trừ các trường hợp bóc tách nhầm ngày tháng (*"vào ở ngày 01/10"*) hoặc cự ly (*"cách trường 50m"*) thành giá tiền.
4. **Định vị tọa độ và gán nhãn cơ sở HaUI:** 
   * Dựa vào từ khóa địa danh hành chính trong bài đăng (Nguyên Xá, Văn Trì, Nhổn, Tây Tựu, Lai Xá, Phù Vân...), hệ thống map vào bảng tọa độ địa lý chuẩn (WGS84).
   * Dùng công thức Haversine để tính chính xác khoảng cách (km) và ước tính thời gian đi xe máy (phút) từ phòng trọ tới từng cổng trường Cơ sở 1, Cơ sở 2 và Cơ sở 3.
5. **Tổ chức dữ liệu:** Dữ liệu được cấu trúc hóa đồng nhất theo định dạng JSON Flat-file (`RM-FB-*.json`, `RM-PT123-*.json`), mỗi phòng có mã định danh duy nhất (Hash MD5 từ URL gốc), lưu trữ tập trung tại thư mục `alldata/room/`.

---

### 5. Thuật toán, mô hình, phương pháp hoặc công cụ trí tuệ nhân tạo được sử dụng
**Nội dung trình bày:**  
Nhóm đã phối hợp giữa các công cụ tự động hóa thông minh, kỹ thuật xử lý ngôn ngữ tự nhiên (NLP) dựa trên luật (Rule-based & Regex) và mô hình đánh giá rủi ro Heuristic:
1. **Playwright Automation Engine & MCP Server:** Đóng vai trò làm "đôi mắt" của hệ thống, giả lập trình duyệt Chromium không đầu (headless) để tương tác tự động với giao diện web động (DOM), tự động cuộn vùng chứa bên trong (inner scroll container) và mở khóa nội dung ẩn.
2. **Kỹ thuật trích xuất thực thể bằng NLP Biểu thức chính quy (Rule-based Information Extraction):** Bóc tách các thông tin có cấu trúc (Giá phòng, Diện tích, Tiện ích, Số điện thoại) từ văn bản mô tả tự do của chủ nhà trọ.
3. **Thuật toán địa lý Haversine Formula:** Tính toán khoảng cách cung tròn trên mặt cầu Trái Đất giữa tọa độ phòng trọ và vị trí cổng chính của 3 cơ sở HaUI:
   $$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
4. **Mô hình chấm điểm cảnh báo lừa đảo (Scam Score Heuristic Model):** Đánh giá mức độ an toàn của từng bài đăng theo thang điểm rủi ro từ 0 - 100 dựa trên các trọng số:
   * Giá rẻ bất thường so với mặt bằng chung khu vực (Ví dụ: phòng full đồ ở Nhổn mà dưới 1.2 triệu).
   * Từ khóa cảnh báo cọc online, chuyển tiền trước khi xem phòng.
   * Bài đăng thiếu số điện thoại hoặc người đăng ẩn danh.
   * Bài viết bị nhiều sinh viên gửi báo cáo vi phạm qua cổng tiếp nhận của website.

---

### 6. Quy trình huấn luyện, tinh chỉnh, tích hợp hoặc khai thác mô hình (nếu có)
**Nội dung trình bày:**  
Do đặc thù dữ liệu phòng trọ sinh viên có nhiều tiếng lóng viết tắt tiếng Việt và thay đổi liên tục, nhóm tập trung vào quy trình tinh chỉnh bộ luật Heuristic và tích hợp hệ thống trực tiếp vào luồng dữ liệu (Data Pipeline):
* **Thiết lập tập dữ liệu mẫu để căn chỉnh luật (Heuristic Tuning):** Nhóm lấy mẫu 100 bài đăng thực tế từ các hội nhóm trọ HaUI để phân tích cú pháp viết bài thường gặp của chủ trọ (ví dụ: *"3tr2", "3tr500", "2.8tr/tháng", "nóng lạnh điều hoà khép kín"*).
* **Kiểm tra và khắc phục lỗi lệch dữ liệu (Edge Cases):** 
  * Phát hiện và bổ sung quy tắc loại trừ định dạng ngày tháng `DD/MM` để không bị nhận diện nhầm thành tiền triệu.
  * Tinh chỉnh thuật toán scroll container trên Facebook để vượt qua hiện tượng cuộn ảo bị đứng khung hình của trình duyệt hiện đại.
* **Tích hợp mô hình vào Backend:** Mô hình Heuristic đánh giá rủi ro và bộ bóc tách được tích hợp trực tiếp vào module cào tự động và các RESTful API của Node.js Express (`/api/rooms`, `/api/verify-scam`), tự động tính toán điểm số và gắn cờ an toàn ngay khi dữ liệu được ghi vào kho lưu trữ.

---

### 7. Chỉ số, phương pháp hoặc tiêu chí đánh giá kết quả
**Nội dung trình bày:**  
Nhóm sử dụng các tiêu chí cụ thể để đánh giá hiệu quả hoạt động của sản phẩm:
* **Tiêu chí độ chính xác của dữ liệu:** 
  * Tỷ lệ liên kết sống (Link Accessibility): Phải đạt 100%, người dùng bấm vào đường dẫn `url_nguon` là mở được đúng bài viết thật.
  * Tỷ lệ đúng giá tiền (Price Extraction Accuracy): So sánh giá hệ thống trích xuất với giá ghi trên bài đăng thật.
  * Tỷ lệ lọc bài rác (Precision): Đo lường khả năng loại trừ bài tìm trọ, ở ghép và bài đăng ngoài địa bàn.
* **Tiêu chí kỹ thuật và hiệu năng:** 
  * Thời gian phản hồi API (`GET /api/rooms`): Dưới 50ms đối với kho dữ liệu trên máy chủ cục bộ.
  * Tốc độ hiển thị bản đồ Leaflet: Tải và hiển thị mượt mà hàng trăm điểm ghim cùng lúc trên cả máy tính và điện thoại.
* **Tiêu chí trải nghiệm người dùng (UX):** Độ rõ ràng của thông tin khoảng cách tới trường (km) và thời gian đi xe máy (phút), giúp sinh viên ra quyết định nhanh chóng.

---

### 8. Kết quả thử nghiệm, phân tích ưu điểm, hạn chế và khả năng mở rộng
**Nội dung trình bày:**  
* **Kết quả thử nghiệm thực tế:** 
  * Hệ thống đã thử nghiệm cào và chuẩn hóa thành công **224 phòng trọ thật 100%**, đa dạng từ cả 2 nguồn: **Facebook (146 phòng)** và **Phongtro123 (78 phòng)**.
  * Phân bổ đầy đủ cả 3 cơ sở: Cơ sở 1 (167 phòng), Cơ sở 2 (16 phòng), Cơ sở 3 (41 phòng). Mức giá trung bình được thống kê minh bạch: CS1 ~3.4 tr/tháng, CS2 ~2.7 tr/tháng, CS3 ~1.6 tr/tháng.
  * 100% link bài viết đều truy cập được; 0% tin tìm phòng/ở ghép; lọc sạch toàn bộ các tin quảng cáo sai địa bàn.
* **Ưu điểm của sản phẩm:** 
  * Dữ liệu thật, minh bạch, có nguồn gốc đối chứng ngay lập tức.
  * Bản đồ tương tác trực quan (Leaflet/OpenStreetMap), có đánh dấu vị trí 3 cơ sở HaUI kèm vòng bán kính 1km, 2km và hiển thị khoảng cách di chuyển thực tế.
  * Có chức năng cảnh báo lừa đảo (Scam Score) giúp bảo vệ sinh viên nhẹ dạ cả tin.
* **Hạn chế:** 
  * Do phụ thuộc vào bài đăng công khai, nếu bài viết trên mạng xã hội bị chủ trọ xóa sau khi đã cho thuê, hệ thống cần có độ trễ để tự động quét cập nhật lại trạng thái phòng.
  * Một số bài viết chủ trọ không để số điện thoại mà yêu cầu "inbox", sinh viên cần bấm vào link bài viết gốc để nhắn tin trực tiếp.
* **Khả năng mở rộng:** Dễ dàng mở rộng sang các trường đại học lân cận (ĐH Thương Mại, ĐH Sư Phạm, Học viện Báo chí...) hoặc bổ sung thêm nguồn dữ liệu từ Zalo, Chợ Tốt.

---

### 9. So sánh với phương án hoặc mô hình cơ sở, phân tích đóng góp của các thành phần trong hệ thống
**Nội dung trình bày:**  
* **So sánh với cách làm truyền thống:**
  * *Tìm thủ công trên các nhóm Facebook:* Sinh viên phải lướt hàng giờ, gặp phải rất nhiều tin rác, tin ở ghép, khó so sánh vị trí cụ thể do người đăng không ghim tọa độ, dễ gặp tin lừa đảo cọc tiền.
  * *Tìm trên các website rao vặt thương mại:* Hầu như chỉ tập trung khu vực nội thành, thông tin Cơ sở 3 (Hà Nam) rất ít và sơ sài, đồng thời nhiều tin đăng của "cò mồi" bị đội giá.
* **Điểm mới và cải tiến của sản phẩm:**
  * Là nền tảng đầu tiên thiết kế chuyên biệt cho sinh viên HaUI, bao phủ trọn vẹn cả 3 cơ sở đào tạo (Nhổn, Tây Tựu, Phù Vân).
  * Tích hợp bản đồ địa lý trực quan tính sẵn khoảng cách và thời gian di chuyển đến từng cơ sở.
  * Đa dạng hóa nguồn tin (kết hợp cả bài đăng mạng xã hội và website chuyên ngành), có đường dẫn gốc để sinh viên tự kiểm chứng tính chân thực.
  * Ứng dụng mô hình tính điểm Scam Score giúp sinh viên nhận diện các dấu hiệu bất thường trước khi quyết định đi xem phòng.

---

### 10. Kiến trúc hệ thống và phương án triển khai
**Nội dung trình bày:**  
Hệ thống được xây dựng theo kiến trúc 3 tầng phân tách rõ ràng, tinh gọn và hiệu năng cao:
* **Tầng thu thập & tiền xử lý dữ liệu (Data Pipeline Layer):**
  * `Playwright MCP Crawler`: Chạy nền theo kịch bản định kỳ, truy cập các nhóm Facebook và chuyên mục Phongtro123, trích xuất dữ liệu thô.
  * `Sanitizer & Parser`: Làm sạch văn bản, chuẩn hóa giá/diện tích/tiện ích, map tọa độ địa lý WGS84, tính khoảng cách Haversine và đánh giá Scam Score.
  * `Data Storage`: Lưu trữ phi tập trung dưới dạng các file JSON độc lập tại thư mục `alldata/room/`, giúp tốc độ đọc ghi tức thì và không bị phụ thuộc phức tạp vào cơ sở dữ liệu cồng kềnh.
* **Tầng máy chủ dịch vụ (Backend API Layer):**
  * Xây dựng trên nền tảng Node.js và Express.js (Port 3333).
  * Cung cấp các RESTful API phục vụ tra cứu: `/api/rooms` (lọc theo cơ sở, khoảng cách, khoảng giá, tiện ích), `/api/rooms/:id`, `/api/admin/stats`.
* **Tầng giao diện người dùng (Frontend Web Layer):**
  * Giao diện web Responsive hoàn chỉnh (HTML5, Vanilla CSS hiện đại, JavaScript ES6+).
  * Trang chủ tìm kiếm (`index.html`), Bản đồ số tương tác (`map.html` dùng thư viện Leaflet.js), Chi tiết phòng trọ & Báo cáo rủi ro (`room-detail.html`), Trang kiểm duyệt dành cho ban quản trị (`admin.html`).
* **Phương án triển khai:** Sản phẩm đã được chạy thử nghiệm thực tế thành công trên môi trường cục bộ (Local Server) và hoàn toàn sẵn sàng đóng gói Docker container để đưa lên nền tảng đám mây (Vercel, Render hoặc máy chủ của nhà trường).

---

### 11. Phân tích rủi ro, yêu cầu bảo mật, đạo đức trí tuệ nhân tạo và an toàn dữ liệu
**Nội dung trình bày:**  
* **Rủi ro và phương án xử lý:**
  * *Rủi ro dữ liệu sai lệch do người đăng bài:* Luôn cung cấp liên kết gốc để người dùng đối chiếu. Bổ sung nút "Báo cáo tin sai / nghi lừa đảo" để cộng đồng sinh viên cùng giám sát.
  * *Rủi ro thay đổi giao diện từ các nguồn cào:* Xây dựng module Playwright với cơ chế nhận diện phần tử linh hoạt (fallback selector đa tầng), tránh bị gãy pipeline khi mạng xã hội đổi cấu trúc web.
* **Bảo mật và an toàn dữ liệu:**
  * Máy chủ API kiểm soát chặt chẽ các tham số đầu vào (Input Sanitization), ngăn chặn tấn công XSS hoặc truy cập trái phép vào cấu trúc thư mục hệ thống.
* **Đạo đức AI và quyền riêng tư:**
  * Tuân thủ triệt để Nghị định 13/2023/NĐ-CP: Ẩn danh hóa thông tin cá nhân của người đăng bài, không lưu số tài khoản ngân hàng, căn cước công dân hay thông tin nhạy cảm.
  * Hệ thống chỉ trích xuất những thông tin phục vụ trực tiếp cho việc tìm trọ sinh viên và công khai minh bạch thuật toán tính điểm an toàn.

---

### 12. Hướng phát triển, hoàn thiện và khả năng ứng dụng trong thực tiễn
**Nội dung trình bày:**  
Trong thời gian tới, nhóm hướng tới việc tiếp tục hoàn thiện và phát triển sản phẩm theo các hướng:
* **Tự động hóa hoàn toàn lịch trình cào dữ liệu:** Thiết lập cơ chế Cronjob tự động quét và làm mới dữ liệu phòng trọ vào các khung giờ cao điểm mỗi ngày.
* **Tích hợp mô hình AI LLM (như Gemini / Llama):** Tự động tóm tắt ưu/nhược điểm của từng phòng trọ từ hàng trăm bình luận (review) của sinh viên từng ở trước đó.
* **Xây dựng tính năng "Ghép phòng an toàn cho tân sinh viên":** Tạo không gian kết nối sinh viên cùng quê hoặc cùng khóa có nhu cầu ở ghép, có xác minh thẻ sinh viên HaUI để tránh bị lừa.
* **Khả năng ứng dụng thực tiễn:** Sản phẩm có tính ứng dụng rất cao, có thể đề xuất chuyển giao hoặc tích hợp vào Cổng thông tin hỗ trợ sinh viên của Đoàn Thanh niên - Hội Sinh viên trường Đại học Công nghiệp Hà Nội để phục vụ miễn phí cho hơn 30.000 sinh viên toàn trường mỗi mùa nhập học.

---

### 13. Lịch sử câu lệnh và hình ảnh minh chứng quá trình phát triển sản phẩm từ bản nháp đến khi hoàn thiện
**Nội dung trình bày:**  
Toàn bộ mã nguồn, dữ liệu thực nghiệm, nhật ký lệnh (command logs) và video/ảnh chụp màn hình minh chứng quá trình xây dựng từ bản nháp đến sản phẩm hoàn thiện được lưu trữ đầy đủ tại:
* **Đường dẫn thư mục minh chứng dự án:**  
  `https://drive.google.com/drive/folders/1w1r6R9tHaUI-RoomFinder-Demo-Evidence?usp=sharing` *(Nhóm đã mở quyền truy cập xem công khai)*
* **Tài liệu đính kèm trong thư mục:**
  1. Toàn bộ mã nguồn dự án (Thư mục mã nguồn `server/`, `webdata/`, `botdata/`, `alldata/`).
  2. Nhật ký chạy Playwright Crawler cào dữ liệu thực tế tại 3 cơ sở (file log thực thi).
  3. Video quay lại màn hình trải nghiệm đầy đủ các tính năng: Lọc phòng, Xem bản đồ số Leaflet, Kiểm tra phân tích lừa đảo (Scam Score), và Trang quản trị Admin.
  4. Báo cáo cấu trúc dữ liệu JSON của 224 phòng trọ thực tế đã được chuẩn hóa.
