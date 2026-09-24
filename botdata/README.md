# Hướng Dẫn Sử Dụng Playwright MCP Trong botdata

Chương trình **Playwright MCP** (`@playwright/mcp` v0.0.82) từ Microsoft đã được cài đặt và cấu hình hoàn chỉnh tại thư mục này.

---

## 1. Cấu Trúc Thư Mục
```
d:\project\15_webreal\botdata\
├── playwright-mcp\          # Mã nguồn chính thức từ microsoft/playwright-mcp
│   ├── cli.js               # File thực thi MCP Server
│   ├── node_modules\        # Thư viện phụ thuộc (Playwright v1.64.0-alpha, MCP SDK)
│   ├── test_playwright.mjs  # File script kiểm tra tự động
│   └── ...
├── run_mcp_server.bat       # File chạy nhanh MCP Server
└── README.md                # Tài liệu hướng dẫn này
```

---

## 2. Kiểm Tra Hoạt Động (Đã kiểm tra thành công)
Trình duyệt Chromium của Playwright đã được tải về hệ thống:
```powershell
cd d:\project\15_webreal\botdata\playwright-mcp
node test_playwright.mjs
```
Kết quả:
```
Launching browser...
Page title: Example Domain
Playwright test completed successfully!
```

---

## 3. Cấu Hình MCP Server Cho AI Agent / IDE

### A. Dành cho Claude Desktop, Cursor, Antigravity IDE (stdio mode)
Thêm cấu hình sau vào file cấu hình MCP (`mcp.json` hoặc `mcp_config.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "d:/project/15_webreal/botdata/playwright-mcp/cli.js"
      ]
    }
  }
}
```

Nếu muốn chạy ở chế độ ngầm (`headless`):
```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "d:/project/15_webreal/botdata/playwright-mcp/cli.js",
        "--headless"
      ]
    }
  }
}
```

### B. Chạy qua SSE (Server-Sent Events) qua cổng HTTP
Nếu bạn muốn chạy như một web server độc lập:
```powershell
node d:\project\15_webreal\botdata\playwright-mcp\cli.js --port 8931
```
Server sẽ lắng nghe tại: `http://localhost:8931/sse`

---

## 4. Các Tham Số Thường Dùng Khi Cào Dữ Liệu
- `--headless`: Chạy trình duyệt ẩn (không hiện cửa sổ giao diện).
- `--viewport-size "1280x900"`: Thiết lập độ phân giải màn hình.
- `--user-agent "..."`: Giả lập User-Agent của người dùng thật.
- `--user-data-dir "<path>"`: Lưu lại profile/cookie đăng nhập để duy trì phiên cào Facebook không bị checkpoint.
- `--output-dir "<path>"`: Thư mục lưu ảnh chụp màn hình tự động (`screenshot`).
