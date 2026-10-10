# Đại điện · V1

Một bản tham quan 3D góc nhìn thứ nhất, dựa trên mặt bằng của Vũ: tượng Phật ở phía trong, khoảng sàn trống phía trước, có lối đi hai bên và phía sau.

**Đây là prototype bố cục và trải nghiệm, không phải bản đồ họa chân thực hoàn thiện.** Tượng là mô hình hình học sơ bộ do mã nguồn tạo ra, không phải một mô hình điêu khắc hoặc bản quét bảo tàng. Những chi tiết khuôn mặt, bàn tay, y phục và đài sen cần được thay bằng asset được kiểm duyệt trong giai đoạn tiếp theo.

## Mở V1

Mở `index.html` bằng trình duyệt có WebGL 2. Nội dung nằm hoàn toàn trong file HTML; không cần npm, Node.js, backend, tài khoản hay kết nối Internet để tải tài nguyên.

Bấm **Bắt đầu tham quan**. Trên máy tính, sử dụng WASD và chuột. Nếu trình duyệt không cho khóa chuột, giữ chuột trái và kéo để nhìn quanh. Trên điện thoại, dùng cần điều khiển bên trái và vuốt vùng cảnh bên phải.

Nếu trình duyệt hoặc chính sách máy tính chặn chạy file cục bộ, có thể phục vụ thư mục bằng một máy chủ HTTP tĩnh. Ví dụ, với Python 3 đã được cài:

```sh
cd dai-dien-v1
python3 -m http.server 8080 --bind 127.0.0.1
```

Trên Windows, lệnh tương đương thường là:

```powershell
py -m http.server 8080 --bind 127.0.0.1
```

Sau đó mở `http://localhost:8080`. Máy chủ này chỉ phục vụ các file tĩnh, không phải backend của game.

## Điều khiển

| Thao tác | Cách dùng |
|---|---|
| Đi lại | WASD hoặc các phím mũi tên |
| Nhìn quanh | Chuột khi được khóa, hoặc giữ chuột trái và kéo |
| Thả chuột / đóng bảng | Esc |
| Trở lại cửa | R hoặc nút Cửa vào |
| Tới trước tượng | Nút Chiêm bái |
| Tới lối phía sau | Nút Vòng tượng |
| Chụp ảnh 4K | P hoặc nút Chụp ảnh |
| Ẩn / hiện giao diện | H; có nút hiện lại khi đã ẩn |
| Một tiếng chuông | B hoặc nút chuông |
| Điện thoại | Cần điều khiển trái để đi; vuốt cảnh để nhìn |

Nút chuyển vị trí dùng đổi góc nhìn kèm chuyển mờ ngắn, không phải tự động đi bộ theo tuyến. Sau khi tới vị trí mới, vẫn có thể tự do di chuyển.

## Không gian

- Lòng đại điện: **12,5 × 16 m = 200 m²**; trần cao **9 m**.
- Camera ở cao độ **1,65 m**, không nhảy, không rung đầu.
- Vùng bệ: **6 × 5 m**; đặt lùi về phía sau, không tạo một phòng kín quanh tượng.
- Khoảng cách danh nghĩa hai bên bệ: **3,25 m** mỗi bên, trước khi trừ chân cột và đồ phụ.
- Lối sau bệ: **1,6 m** tới tường sau; mặc định được phép đi vòng.
- Cụm tượng và đài sen lên tới khoảng **5 m** so với mặt sàn.
- Sáu cột, trần dầm gỗ, cửa lấy sáng, hai đèn, bàn lễ nhỏ, hai ghế và vài đệm ngồi.
- Vật liệu mang sắc đá sáng, gỗ ấm, kim loại vàng. Không dùng tia hào quang hoặc sương giả tưởng.

## Hiển thị và ảnh 4K

Có bốn mức hiển thị: **Nhẹ, Cân bằng, Sắc nét, 4K**. Giao diện cài đặt hiện đúng kích thước bộ đệm đang render.

Mức 4K giữ tỷ lệ cửa sổ, cạnh dài không vượt 3840 px và số điểm ảnh xấp xỉ tối đa 8,29 triệu. Vì vậy, cửa sổ 16:10 hoặc màn hình dọc không nhất thiết có bộ đệm 3840 × 2160. Đây không phải lỗi.

Nút **Chụp ảnh** render riêng một khung hình **3840 × 2160, tỷ lệ 16:9**, không có giao diện, rồi trả độ phân giải tương tác về mức trước đó. Góc cắt ngang có thể khác cửa sổ nếu tỷ lệ cửa sổ không phải 16:9. Không dùng nội suy phóng lớn ảnh chụp màn hình.

**4K chỉ mô tả số điểm ảnh.** V1 chưa có texture chụp thực tế 4K, lightmap bake hay mô hình tượng điêu khắc hoàn thiện. Vật liệu hiện là shader procedural. Không cam kết 60 FPS hoặc native 4K trên mọi thiết bị.

## Kỹ thuật

HTML, CSS và JavaScript thuần; renderer WebGL 2 tự chứa. Không đóng gói Three.js hoặc thư viện bên ngoài.

- Hình học tĩnh gộp thành **2 batch hiển thị**, khoảng **183.396 tam giác** trong build này.
- Ánh sáng trực tiếp và bóng đổ shadow map tĩnh 2048 × 2048; phản xạ và ánh sáng gián tiếp là xấp xỉ phục vụ prototype, không phải GI vật lý hoàn chỉnh.
- Camera di chuyển trên mặt phẳng; kiểm tra va chạm với biên phòng, chân cột, bệ, bậc phía trước, ghế và đèn.
- Chỉ render lại khi góc nhìn, vị trí hoặc cài đặt thay đổi. Không render lại cảnh tĩnh liên tục chỉ để tạo chuyển động giả.
- Tiếng chuông tổng hợp bằng Web Audio, chỉ phát sau thao tác của người dùng. Không sử dụng bản ghi bên ngoài.
- Cài đặt lưu cục bộ trong localStorage khi trình duyệt cho phép. Không thu thập thông tin và không gửi dữ liệu lên mạng.
- Có thông báo lỗi khi không khởi tạo được WebGL hoặc mất kết nối GPU.

API tham khảo: WebGL 2 — https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext ; Pointer Lock — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API .

## Sửa mã nguồn

```text
dai-dien-v1/
  index.html             Bản đã build, tự chứa, dùng ngay
  README.md              Hướng dẫn này
  DESIGN-NOTES.md        Giới hạn V1 và bàn giao cho vòng tiếp theo
  TEST-REPORT.json       Kết quả kiểm tra tự động
  preview.jpg            Ảnh chụp trực tiếp từ bản chạy
  build.py               Gộp source thành index.html; chỉ cần Python 3
  src/
    template.html        Cấu trúc HTML và biểu tượng SVG
    style.css            Giao diện và bố cục responsive
    engine.js            Toán 3D, hình học, shader, WebGL renderer
    scene.js             Đại điện và tạo hình tượng
    app.js               Di chuyển, va chạm, giao diện, ảnh 4K, âm thanh
```

Sau khi sửa file trong `src`, chạy:

```sh
python3 build.py
```

Trên Windows có thể dùng `py build.py`. Không cần bước build nếu chỉ sử dụng file `index.html` đã có sẵn.

## Phạm vi đã kiểm tra

25 kiểm tra tự động đã qua trên Chromium 144/Linux với GPU phần mềm ANGLE/Mesa, gồm khởi tạo WebGL, WASD, kéo chuột, các vị trí nhanh, kiểm tra va chạm, mức hiển thị, cài đặt góc nhìn, nút ẩn giao diện, thông tin, handler chuông và ảnh PNG 3840 × 2160. Không có lỗi JavaScript được ghi nhận và không có yêu cầu HTTP/HTTPS ra ngoài trong phiên kiểm tra.

Điện thoại được **mô phỏng** ở 390 × 844 và 844 × 390; đường xử lý pointer cho joystick và nhìn quanh đã được kiểm tra. Đây **không phải** phép thử trên iPhone/Android thật, Mac mini M2, Safari hay phép đo hiệu năng phần cứng mục tiêu. Âm thanh được kiểm tra ở mức xử lý thao tác, không phải đánh giá chất lượng nghe.

Môi trường kiểm tra chặn điều hướng file/HTTP nên HTML được nạp trực tiếp vào tài liệu trình duyệt để chạy kiểm thử. Chưa xác nhận thao tác mở file bằng nhấp đúp trong môi trường đó. Source không dùng fetch, import module hay tài nguyên ngoài; bản HTML được thiết kế để mở trực tiếp. Khóa chuột/toàn màn hình phụ thuộc quyền của trình duyệt; có cách kéo chuột thay thế.

Xem `TEST-REPORT.json` để biết từng kiểm tra và các giới hạn của môi trường.
