# Bàn giao thiết kế V1

## Mục tiêu đã chọn

Thiết kế một không gian tương tác thật, không phải tấm panorama dán vào mặt cầu. Người xem đứng ở cao độ mắt người, đi từ cửa tới khu vực chiêm bái, sang hai bên và vòng sau bệ.

Mặt bằng gọn, trục trung tâm rõ. Không cố tạo đại điện vô tận: giới hạn 200 m² được giữ ở hình học. Cảm giác lớn đến từ chiều cao, tỷ lệ tượng, khoảng lùi trước bệ và ánh sáng.

## Quyết định tạm thời

Cho phép đi sau tượng vì mục tiêu là tự do khám phá. Giữ bệ thờ là vùng không được bước lên. Nút Vòng tượng chỉ chuyển tới lối sau; không phải orbit camera qua vật cản.

Phong cách màu sáng, ấm, ít trang trí. Vòng sau tượng là một vòng kim loại có hình học, không phải nguồn phát sáng thần thoại. Cửa lấy sáng và dầm trần chủ yếu giúp đọc chiều sâu và quy mô.

Không thêm NPC, thành tích, vật phẩm thu thập, quảng cáo hoặc các tương tác có thể làm loãng trải nghiệm chiêm bái.

## Điều cần đánh giá bằng V1

1. Khoảng cách từ cửa tới bệ và độ lớn của tượng có tạo cảm giác phù hợp không?
2. Tầm mắt 1,65 m, FOV mặc định 62° trên desktop và tốc độ đi bộ có dễ chịu không?
3. Các lối bên/sau có đủ thoáng cho trải nghiệm, đặc biệt trên điện thoại?
4. Giao diện có che khuất tượng hoặc làm mất sự yên tĩnh không?

## Những gì chưa phải “đồ họa 4K hoàn thiện”

Tượng hiện gồm các mặt cong và khối hình học ghép. Dù nhiều đa giác, đây không phải điêu khắc giải phẫu chuẩn. Chi tiết bàn tay, khuôn mặt, y phục, bệ sen và các mối nối chưa đủ cho cận cảnh của một sản phẩm hoàn thiện.

Shader có màu vật liệu, độ nhám, kim loại, bóng đổ và vân thủ tục. Chưa có material scan/PBR texture pack, normal map điêu khắc, contact shadow tinh chỉnh, phản xạ môi trường từ dữ liệu HDR thật hay baked GI. Tăng độ phân giải không tự giải quyết các giới hạn này.

## Vòng phát triển kế tiếp

Ưu tiên thay mô hình tượng trước khi tăng trang trí kiến trúc. Chuẩn bị một mô hình GLB được phép sử dụng, có người kiểm tra tạo hình Phật Thích Ca, tỷ lệ và tư thế. Đừng dùng tượng Bố Đại hoặc mô hình không rõ danh tính thay thế rồi gọi là Phật Thích Ca.

Sau khi chốt tượng và mặt bằng: làm vật liệu đá/gỗ/kim loại có chọn lọc; bake ánh sáng tĩnh; kiểm tra mức chi tiết khi tới gần. Chỉ đưa thêm hiệu ứng khi không phá sự tự nhiên hoặc ngân sách khung hình.

Renderer tối giản hiện tại không có glTF loader. Chuyển sang pipeline Three.js/Babylon.js hoặc thêm loader là công việc riêng, chưa được hứa là đã có trong V1. Camera, bố cục UI, quy ước mét và va chạm có thể giữ lại.

Benchmark trên chính thiết bị mục tiêu ở 1080p/1440p/4K; đo thời gian khung hình, bộ nhớ và nhiệt khi đi lại. Tách rõ chất lượng đồ họa với kích thước framebuffer. Chưa có cơ sở để cam kết native 4K 60 FPS.
