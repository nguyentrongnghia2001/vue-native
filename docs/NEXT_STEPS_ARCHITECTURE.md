# Next-step architecture (vue-native)

Tài liệu này mô tả kiến trúc **giai đoạn product hóa** dựa trên trạng thái hiện tại (Phase 1-7 đã hoàn tất).

## Mục tiêu kiến trúc trung hạn

Biến codebase từ sandbox/runtime demo thành nền tảng phát hành được:

1. App host production rõ ràng, không phụ thuộc debug shell.
2. Runtime SDK có API ổn định, test được, versioning rõ ràng.
3. Runtime core có thể chạy đa host, không lock-in vào Expo + React Native.
4. Pipeline chất lượng + release đủ để chạy alpha/beta/stable.

---

## Trạng thái hiện tại (điểm xuất phát)

- Core runtime đã có bridge queue + batching + adapter contract.
- Native transport flow Android đã verify roundtrip trên emulator/device.
- Primitive coverage và prop/event mapping đã mở rộng đến use case app cơ bản.
- Sandbox authoring đã chạy `.vue` SFC với bootstrap mỏng (`index.js -> src/main.jsx`).
- Vẫn còn vài điểm chưa production-ready: warning NativeEventEmitter contract, thiếu CI e2e smoke, chưa có release host app tách riêng.

---

## Checkpoint quyết định (2026-03-31)

Team chốt hướng phát triển: **không phụ thuộc Expo + React Native như một ràng buộc kiến trúc dài hạn**.

- Host Expo/RN hiện tại vẫn giữ như lớp chuyển tiếp để không gián đoạn verify native.
- Ưu tiên cao nhất từ checkpoint này: tách host contract để runtime có thể chạy trên host backend khác.

---

## Phase A — Host-Agnostic Contract Extraction (priority)

### Mục tiêu

Tách các contract phụ thuộc host ra khỏi runtime core.

### Việc cần làm

1. Định nghĩa `HostPlatformAdapter` cho render target + lifecycle + event channel.
2. Tách transport layer khỏi API `react-native` và đưa về contract chung.
3. Bổ sung contract tests cho adapter attach/detach, event roundtrip, error semantics.

### Output kỳ vọng

- Runtime core không cần import trực tiếp `react-native`.
- Mọi host backend chỉ giao tiếp qua adapter contract.

---

## Phase A1 — Transitional Dual Host Operation

### Mục tiêu

Giữ host Expo/RN chạy ổn định trong lúc mở thêm host backend không-RN.

### Việc cần làm

1. Duy trì `apps/product-host` (Expo/RN) như baseline verify hiện tại.
2. Tạo host backend non-RN đầu tiên (ví dụ web/in-memory host runner) dùng cùng runtime contract.
3. Chuẩn hoá bootstrap để cùng `AppRoot.vue` mount được trên cả hai host.

### Output kỳ vọng

- Có chế độ chạy kép (RN + non-RN) với cùng authoring flow.
- Giảm rủi ro migration một lần gây gián đoạn product.

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
