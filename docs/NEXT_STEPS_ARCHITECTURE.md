# Next-step architecture (vue-native)

Tài liệu này mô tả kiến trúc **giai đoạn product hóa** dựa trên trạng thái hiện tại (Phase 1-7 đã hoàn tất).

## Mục tiêu kiến trúc trung hạn

Biến codebase từ sandbox/runtime demo thành nền tảng phát hành được:

1. App host production rõ ràng, không phụ thuộc debug shell.
2. Runtime SDK có API ổn định, test được, versioning rõ ràng.
3. Pipeline chất lượng + release đủ để chạy alpha/beta/stable.

---

## Trạng thái hiện tại (điểm xuất phát)

- Core runtime đã có bridge queue + batching + adapter contract.
- Native transport flow Android đã verify roundtrip trên emulator/device.
- Primitive coverage và prop/event mapping đã mở rộng đến use case app cơ bản.
- Sandbox authoring đã chạy `.vue` SFC với bootstrap mỏng (`index.js -> src/main.jsx`).
- Vẫn còn vài điểm chưa production-ready: warning NativeEventEmitter contract, thiếu CI e2e smoke, chưa có release host app tách riêng.

---

## Phase A — Product Host App Separation

### Mục tiêu

Tách lớp demo/sandbox khỏi lớp app phát hành.

### Việc cần làm

1. Tạo app host production profile (hoặc app mới trong `apps/`):
   - entrypoint mỏng, không phụ thuộc preview/debug panels.
2. Giữ host preview/debug ở module riêng (`SandboxPreviewHost`) để không rò sang release.
3. Chuẩn hoá cấu trúc Vue authoring:
   - `AppRoot.vue`, `components/`, `pages/`, `composables/`.

### Output kỳ vọng

- Team chỉ viết feature ở SFC/composables.
- Host internals không bị sửa trong luồng phát triển thường ngày.

---

## Phase B — Runtime SDK Stabilization

### Mục tiêu

Khoá contract API của `@vue-native/runtime-native` ở mức v1 RC.

### Việc cần làm

1. Audit API public (`packages/runtime-native/src/index.ts`) và chia rõ:
   - Stable API,
   - Experimental API.
2. Hoàn thiện native event contract:
   - đảm bảo `NativeEventEmitter` compatibility (`addListener`, `removeListeners`).
3. Chuẩn hoá error semantics:
   - ack/error path, retry policy, telemetry fields.

### Output kỳ vọng

- Runtime package có changelog + semver policy rõ ràng.
- Không còn warning platform-level trong flow chạy chuẩn.

---

## Phase C — Quality & Observability Baseline

### Mục tiêu

Tăng độ tin cậy cho internal beta.

### Việc cần làm

1. Bổ sung e2e smoke test cho luồng tương tác cơ bản:
   - launch app,
   - input,
   - switch toggle,
   - press event roundtrip.
2. Bổ sung telemetry runtime:
   - bridge latency,
   - mutation throughput,
   - dispatch failure rate.
3. Thêm crash/error reporting cho host app.

### Output kỳ vọng

- CI có quality gate đủ trước mỗi release candidate.
- Có dashboard vận hành tối thiểu sau deploy.

---

## Phase D — Security & Compliance Hardening

### Mục tiêu

Đáp ứng điều kiện phát hành beta/public.

### Việc cần làm

1. Dependency audit + policy update định kỳ.
2. Chuẩn hoá permission/sensitive API usage theo target store.
3. Thiết lập secrets/signing qua CI vault, không để local leakage.
4. Chuẩn bị privacy text + incident/rollback runbook.

### Output kỳ vọng

- Internal release checklist có thể lặp lại.
- Mỗi bản build có provenance và rollback plan.

---

## Phase E — Release Operations & Distribution

### Mục tiêu

Thiết lập vòng đời phát hành sản phẩm.

### Việc cần làm

1. Thiết lập release channels:
   - `alpha` (dev team),
   - `beta` (internal users),
   - `stable` (public).
2. Chuẩn hoá release automation:
   - build artifacts,
   - changelog,
   - staged rollout.
3. Thiết lập KPI theo cohort beta:
   - crash-free sessions,
   - startup latency,
   - retention baseline.

### Output kỳ vọng

- Có cadence release theo sprint.
- Quyết định roadmap v2 dựa trên data thật.

---

## Test strategy cho các bước tiếp theo

Tối thiểu cần mở rộng trong `packages/runtime-native/__tests__` và host app tests:

1. Bridge/adapter contract tests:
   - batch ordering,
   - adapter attach/detach,
   - error propagation.
2. Interaction conformance tests:
   - TextInput/Switch/Pressable roundtrip.
3. Bootstrap/host tests:
   - entrypoint smoke,
   - mount/unmount consistency.

---

## Định nghĩa Done cho Product Milestone kế tiếp

Done khi thoả đồng thời:

1. `pnpm test` pass.
2. `pnpm typecheck` pass.
3. Android release-host build chạy ổn trên emulator + 1 thiết bị thật.
4. Không còn warning runtime-level nghiêm trọng trong flow chuẩn.
5. Có CI workflow cho alpha/beta release.
