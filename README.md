# Đại điện · V1.1 — Một khoảng lặng

Một trải nghiệm chiêm bái Phật giáo trên màn hình: **bước vào → thắp hương tượng trưng → ngắm cảnh, dừng chân → rời đi**. Không chiến đấu, kỹ năng, NPC, nhiệm vụ, điểm số hoặc tài khoản.

Phát triển tiếp từ bản V1 trong repo này. Giữ đại điện **12,5 × 16 m = 200 m²**, trần 9 m, tầm mắt 1,65 m và các lối đi bên/sau bệ. Không thay renderer bằng framework khác trong vòng cập nhật này.

**Đây vẫn là prototype trải nghiệm, chưa phải đồ họa AAA.** Tượng Phật Thích Ca là tạo hình hình học sơ bộ; chưa có asset điêu khắc được chuyên gia kiểm duyệt, texture scan hay ánh sáng bake. Âm thanh là bản tổng hợp thử nghiệm, không phải bản ghi tại chùa hoặc tụng kinh.

## Chạy ngay

Giữ `index.html` **cùng thư mục `src/`**, mở bằng trình duyệt có WebGL 2. Không cần npm, Node, backend hay Blender để sử dụng.

Nếu máy không cho mở file cục bộ, phục vụ cả repo bằng máy chủ tĩnh:

```sh
cd buddha
python3 -m http.server 8080 --bind 127.0.0.1
```

Windows có thể dùng `py -m http.server 8080 --bind 127.0.0.1`. Mở `http://localhost:8080`, rồi bấm **Bước vào đại điện**. Tai nghe giúp nghe rõ vị trí chuông và âm nền. Có thể bỏ chọn âm thanh trước khi vào.

**Thay đổi cấu trúc từ V1:** `index.html` hiện là entrypoint dễ sửa, nạp CSS/JS cục bộ trong `src/`, không còn là file đã gộp. Template cũ được bỏ để tránh hai nguồn HTML lệch nhau. Muốn một file duy nhất để chia sẻ offline:

```sh
python3 build.py
```

Lấy `dist/index.html` vừa tạo. Build chỉ dùng Python standard library; không tải tài nguyên, không ghi đè entrypoint và không sửa file gốc. Không cần build để chạy repo.

## Có gì mới trong V1.1?

| Thành phần | Đã triển khai |
|---|---|
| Di chuyển | Đi bộ mặc định 0,95 m/s; điều chỉnh 0,6–1,4 m/s; tăng/giảm tốc nhẹ; không chạy, nhảy hoặc rung đầu |
| Nhịp hình | Mục tiêu 30 FPS mặc định, tùy chọn 60 FPS; không khóa 24 FPS cho tương tác |
| Thắp hương | Đến gần bàn hương, nhìn về tượng, bấm E; đầu hương sáng và tối đa 48 hạt khói; một lượt mỗi lần vào, không có phần thưởng |
| Âm thanh | Gió nhẹ hai bên đại điện, chuông có nguồn phát tại giá chuông, bước chân theo quãng đường, vang phòng tổng hợp |
| Dừng chân | Giữ vị trí, ẩn giao diện; vẫn kéo để nhìn quanh; Esc/H hoặc nút trên cùng để tiếp tục |
| Rời đi | Nút Rời đi; hoặc quay về cửa, nhìn ra ngoài và bấm E; xóa hương và đóng graph âm thanh của lần vào |
| Khả năng tiếp cận | Âm lượng/âm nền riêng, tắt bước chân/khói; tuân theo reduced motion; bảng cài đặt quản lý focus và khóa nền |
| Kiểm thử | Bộ test logic Node, build Python và smoke test trình duyệt có thể chạy lại |

Không tự chạy nhạc, không tự thỉnh chuông, không thêm tiếng cháy hương phóng đại. Không tuyên bố tương tác này mang lại công đức hoặc thay thế nghi lễ thực tế.

## Điều khiển

| Thao tác | Cách dùng |
|---|---|
| Đi bộ | WASD hoặc các phím mũi tên |
| Nhìn quanh | Kéo chuột trái; nút Đi bộ để yêu cầu khóa chuột |
| Thắp hương / rời qua cửa | E khi gợi ý xuất hiện; cũng có nút chạm |
| Thỉnh một tiếng chuông | B hoặc nút chuông; âm thanh phải đang bật |
| Dừng chân / tiếp tục | H; Esc hoặc nút Tiếp tục đi lại để thoát |
| Về cửa / chụp ảnh | R / P |
| Vị trí nhanh | Chiêm bái, Vòng tượng, Về cửa; chuyển mờ ngắn, không phải tự đi bộ |
| Điện thoại | Cần điều khiển trái để đi; vuốt cảnh để nhìn; thanh công cụ có thể cuộn ngang |

Bệ thờ, cột, bàn ghế, đèn và giá chuông có va chạm. Không cho bước lên bệ. Dừng chân không khóa hướng nhìn nhưng khóa di chuyển, tránh vô tình rời vị trí khi ẩn giao diện.

## Hình ảnh, FPS và 4K

Mức **Nhẹ / Cân bằng / Sắc nét / 4K** thay đổi kích thước render buffer; cài đặt hiển thị số pixel thực tế. Mức 4K tương tác giữ tỷ lệ cửa sổ và giới hạn cạnh dài 3840 px; không phải mọi màn hình đều là 3840 × 2160.

Nút **Ảnh 4K** render riêng một PNG **3840 × 2160, 16:9**, không kèm giao diện, rồi phục hồi kích thước tương tác. Không chỉ phóng lớn ảnh chụp màn hình. Crop có thể khác khi cửa sổ không phải 16:9.

**30/60 FPS là mục tiêu/giới hạn, không phải cam kết hiệu năng.** Chuyển sang 30 không tự làm model, vật liệu hoặc shader đẹp hơn. Chuyển động dùng delta-time và tích phân gia tốc; cắt các khoảng stall dài để tránh nhảy vị trí. Khi cảnh tĩnh không có khói, không render liên tục. Khi có khói, cảnh động chịu giới hạn FPS đã chọn.

Không có motion blur, DOF hoặc camera shake áp đặt cho người điều khiển. FOV trong cài đặt là **góc nhìn dọc**, không phải góc ngang.

## Kỹ thuật và quyền riêng tư

HTML/CSS/JavaScript thuần, WebGL 2 và Web Audio. Không CDN, runtime dependency bên ngoài, fetch, analytics, backend, microphone, tài khoản hoặc dữ liệu người chơi gửi lên mạng. Máy chủ tĩnh do bạn chọn vẫn có thể có access log riêng.

Hai batch hình học tĩnh, **186.772 tam giác** sau khi thêm giá chuông; hiệu ứng hương thêm một draw call khi đang cháy. Bóng đổ tĩnh 2048² và shader procedural được giữ từ V1; không gọi xấp xỉ ánh sáng hiện tại là baked GI/Lumen.

Khói có tối đa 48 hạt, không sinh thêm không giới hạn. Hiệu ứng kết thúc sau 300 giây thời gian mô phỏng đang hoạt động; ẩn tab sẽ tạm dừng. Trạng thái thắp hương không lưu qua lần vào. Chỉ cài đặt được lưu cục bộ khi localStorage khả dụng.

Web Audio chỉ khởi tạo sau thao tác vào đại điện/bật âm thanh; ẩn tab thì tạm dừng. Rời đại điện sẽ dừng voice và đóng audio context, không để tiếng chuông cũ sang lần vào mới. Chuông/âm nền/impulse response đều do mã nguồn tạo, chưa được kiểm định về âm học thực tế.

## Cấu trúc

```text
index.html              Entry HTML; mở cùng src/ hoặc phục vụ bằng HTTP
build.py                Tạo dist/index.html tự chứa, tùy chọn
src/
  engine.js             Renderer và hình học từ V1
  scene.js              Đại điện và tượng sơ bộ từ V1
  core.js               Cài đặt, va chạm, đi bộ, frame gate (có unit test)
  audio.js              Âm thanh không gian và quản lý vòng đời
  ritual.js             Giá chuông, đầu hương và khói có giới hạn
  app.js                Phiên tham quan, UI, input và export 4K
  style.css             UI responsive
 tests/                 Logic, build và browser smoke tests
 docs/                  Thiết kế, phạm vi và bằng chứng kiểm thử
```

## Kiểm thử

```sh
node --test tests/core.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Node chỉ cần để kiểm thử, không phải để chạy trải nghiệm. Smoke test tùy chọn cần Python Playwright và Chromium đã cài:

```sh
python3 tests/browser_smoke.py --chromium /path/to/chromium
```

Lần kiểm tra V1.1 trong môi trường phát triển: **18 test logic + 7 test build + 29 smoke checks = 54 kiểm tra qua**. Chromium 144/Linux, GPU phần mềm ANGLE/Mesa; bao gồm mở WebGL, điều khiển, thắp hương, audio graph, giảm chuyển động, xuất PNG 4K, mô phỏng cảm ứng và khôi phục sau mất GPU.

**Giới hạn:** trình duyệt quản lý chặn điều hướng file, nên smoke test nạp bản single-file qua `set_content` (`--inline --headed --software-gl`). Chưa xác nhận đường nạp file/HTTP, native localStorage persistence, hosting, Safari, Mac mini M2 hoặc thiết bị di động thật. Không dùng số FPS từ GPU phần mềm để quảng bá hiệu năng. Âm thanh được kiểm tra ở mức graph/voice, chưa đánh giá chất lượng nghe.

Bằng chứng: `docs/TEST-REPORT-V1.1.json`. `docs/TEST-REPORT.json` là báo cáo V1 lịch sử, không được coi là lần chạy V1.1. Hướng phát triển hình ảnh tiếp theo: `docs/EXPERIENCE-V1.1.md`.
