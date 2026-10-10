# Đại điện: định hướng trải nghiệm và bàn giao V1.1

## Phạm vi được chốt

Đưa một không gian chiêm bái Phật giáo qua màn hình. Không combat, skill, NPC, nhiệm vụ hay mục tiêu thắng/thua. Người dùng được phép chỉ đứng yên nghe, nhìn và rời đi. Không yêu cầu đăng nhập, không tạo điểm công đức hoặc hệ thống thưởng.

Giữ mặt bằng 200 m² và chiều cao 9 m của V1. Cảm giác rộng đến từ tỷ lệ người–cột–tượng, khoảng trống và ánh sáng, không phải thêm sương hoặc không gian vô tận. Tượng Thích Ca là tâm điểm; đường đi hai bên/sau giữ nguyên, không cho bước lên bệ.

## Lát cắt đã làm ở V1.1

Chu trình vào → thắp hương → dừng chân → rời đi hoạt động. Tương tác bàn hương kiểm tra khoảng cách và hướng nhìn; không cần chính xác trỏ vào một que hương rất nhỏ. Một lần thắp mỗi lượt vào là giới hạn hiệu ứng, không phải giới hạn nghi lễ. Không tạo tay người giả hoặc ép cúi camera.

Camera mặc định đi 0,95 m/s, có gia tốc và hãm nhẹ, không sprint/head-bob/shake. Nhìn chuột phản hồi trực tiếp, không thêm bộ lọc gây trễ để giả điện ảnh. Chế độ Dừng chân giữ vị trí nhưng vẫn cho nhìn; không phải cutscene cưỡng bức.

30 FPS mặc định, 60 FPS tùy chọn. Không có chế độ 24 FPS tương tác. Frame pacing và chuyển động là hai lớp riêng; FPS thấp không được dùng để che thiếu tối ưu. Hiện không tự tăng chất lượng bóng/vật liệu khi chọn 30.

Âm thanh tổng hợp gồm gió nhẹ, chuông tại giá chuông và bước chân theo quãng đường. Dry sound có vị trí, reverb khuếch tán là xấp xỉ. Không dùng tiếng tụng kinh chưa được xác minh bối cảnh hoặc bản ghi không rõ quyền. Không tự động thỉnh chuông. Vòng đời audio khép kín khi rời đi.

## Chưa hoàn thiện

Tượng còn là blockout procedural. Không gọi mẫu này là scan, điêu khắc chuẩn hoặc đồ họa ngang Black Myth: Wukong. Các phần cần thay: khuôn mặt, bàn tay, nếp áo, tai, đài sen và mối nối. Số tam giác cao hoặc ảnh xuất 4K không chứng minh chất lượng asset.

Ánh sáng/kim loại/vân đá vẫn là shader và xấp xỉ từ V1, chưa có lightmap, HDR environment hoặc PBR texture scan. Renderer hiện chưa có glTF/GLB loader. Việc chuyển sang Three.js và đưa asset Blender vào phải là vòng nâng cấp riêng, không giả định đã hoàn tất.

Âm thanh chưa có kiểm tra nghe trên tai nghe/loa, chưa đo mô hình vang của một đại điện thực. Không có cam kết tác dụng trị liệu hoặc tâm linh.

## Vòng kế tiếp: ưu tiên chất lượng asset và nghe nhìn

1. Chọn hoặc đặt làm tượng Thích Ca có quyền sử dụng rõ ràng; nhờ người am hiểu kiểm tra tư thế, tạo hình và bối cảnh. Không lấy asset từ game thương mại.
2. Chốt mặt bằng và tỷ lệ trong Blender; tách mesh kiến trúc, tượng, đồ lễ; thống nhất đơn vị mét, pivot, collider và UV dành cho lightmap.
3. Quyết định pipeline GLB + lightmap với một thư viện render được ghim phiên bản. Giữ lại core movement/interaction/audio đã kiểm thử; benchmark trước khi bỏ renderer hiện tại.
4. Dựng lighting study sáng vàng–trắng, bảo toàn chi tiết vùng sáng. Bake ánh sáng tĩnh khi cấu trúc chốt; chỉ dùng bóng/khói động có mục đích.
5. Thay âm thanh tổng hợp bằng bản thu tự sản xuất/được cấp phép và thử nghe A/B. Ưu tiên âm lượng thấp, không loop lộ hoặc bất ngờ; vẫn có chế độ im lặng.
6. Đo trên Mac mini M2 và một máy phổ thông: frame-time p50/p95/p99, GPU memory, tải ban đầu, phản hồi camera; thử Chrome/Safari và điện thoại thật. Chỉ chốt 1080p/1440p/4K sau phép đo.

## Điều kiện nghiệm thu vòng hình ảnh tiếp theo

Tượng được kiểm duyệt trước khi tăng trang trí. Không làm lối đi hẹp đi. Không làm camera trễ hoặc ép lia. Không âm thanh trước đồng ý, không âm thanh còn sót sau khi rời đi. Không kéo từ CDN lúc chạy nếu vẫn quảng bá offline. Ghi riêng giới hạn asset, renderer và hiệu năng phần cứng.

## Bảo trì source

`index.html` là HTML nguồn duy nhất; bỏ template cũ và các placeholder build. Source chia file cục bộ để review/commit không phải lặp toàn bộ renderer trong HTML. `build.py` tạo bản single-file tùy chọn vào `dist/`, không ghi đè source. Giữ engine/scene V1 nguyên trạng trong commit V1.1 này; giá chuông và hương nằm ở ritual module.

Báo cáo V1 cũ giữ để truy vết. Chạy tests mới; không đổi tên một báo cáo cũ thành bằng chứng mới.
