# Vue Native Roadmap Status

Tài liệu này là **nguồn tổng hợp duy nhất** cho:
- Những gì đã làm xong
- Những gì đang làm
- Những gì cần làm tiếp

> Cập nhật gần nhất: **2026-03-24**

---

## 1) Đã hoàn thành ✅

### Phase 1 — Host Contract Stabilization

- Chuẩn hoá `patchProp` cho props/events
- Chuẩn hoá snapshot model (JSON-safe, loại bỏ function khỏi snapshot props)
- Tách debug instrumentation khỏi host business flow
- Tài liệu đầy đủ cho từng feature trong `docs/PHASE_1_FEATURE_*.md`

**Kết quả:** nền tảng host contract ổn định và test được.

---

### Phase 2 — Mutation Bridge Foundation

- Tạo bridge queue contract (`enqueue`, `flush`, dispatcher/sink)
- Chuyển host ops + `patchProp` sang emit mutation records
- Thêm batching flush theo microtask tick

**Kết quả:** mutation flow có queue + batching, sẵn sàng để gắn adapter thật.

---

### Phase 3 — Primitives & Authoring Experience

- Thêm primitives: `Image`, `ScrollView`, `Pressable`
- Global register primitives trong `createNativeApp`
- Cập nhật sandbox + docs usage
- Chốt rule kiến trúc:
  - Runtime layer (`packages/runtime-native/**`) **không** dùng trực tiếp React Native built-ins
  - Sandbox shell (`apps/sandbox/App.tsx`) **được phép** dùng `react-native` để demo/debug UI

**Kết quả:** DX gần Vue web hơn, primitive coverage tốt hơn.

---

### Phase 4.1 — Native Bridge Adapter Skeleton

- Thêm `NativeBridgeAdapter` contract trong `bridge.ts`
- Hỗ trợ lifecycle `register/unregister`, `onAttach/onDetach`
- Expose adapter active state
- Hỗ trợ runtime hook `dispatchEvent` từ adapter về bridge

**Kết quả:** đã có khung adapter để triển khai theo từng native target.

---

## 2) Trạng thái hiện tại 📍

- Bridge queue + batching: ✅
- Primitives core (`View`, `Text`, `Image`, `ScrollView`, `Pressable`): ✅
- Adapter skeleton: ✅
- Adapter implementation cho native target cụ thể: ⏳ chưa làm

---

## 3) Cần làm tiếp (ưu tiên) 🔜

## Phase 4.2 — Adapter implementation (target cụ thể)

**Mục tiêu:** biến adapter skeleton thành adapter chạy thật cho target đang dùng.

### Việc cần làm
- Tạo adapter implementation module riêng (ví dụ: `bridgeAdapterSandbox` hoặc `bridgeAdapterRN`)
- Map mutation records (`create/insert/remove/setText/patchProp`) sang thao tác host tương ứng
- Wire event native -> `dispatchNativeEvent`

### Done khi
- Adapter nhận được mutation batch và apply ổn định
- Event round-trip hoạt động (`@press` -> native -> Vue handler)
- Test + typecheck pass

---

## Phase 4.3 — Integration tests cho bridge adapter

### Việc cần làm
- Test thứ tự mutation theo batch
- Test behavior khi thay adapter runtime (`registerBridgeAdapter` replace)
- Test event dispatch qua runtime hook

### Done khi
- Có test integration riêng cho adapter flow
- Giảm phụ thuộc vào debug snapshot để xác nhận logic bridge

---

## Phase 5 — Primitive expansion nâng cao

### Việc cần làm
- Thêm primitives nâng cao: `TextInput`, list wrappers, layout wrappers
- Chuẩn hoá prop/event mapping chi tiết hơn
- Bổ sung docs usage theo từng primitive

### Done khi
- Primitive set đủ cho use case app cơ bản
- Mapping ổn định, test pass

---

## 4) Quy tắc làm việc bắt buộc (đang áp dụng)

- Trước mỗi Phase/Feature mới:
  1. Overview phần đã làm
  2. Log vào `docs/PHASE_FEATURE_LOG.md`
  3. Gửi checkpoint review
- Mỗi feature:
  - implement -> `pnpm test` (và `pnpm typecheck` khi cần) -> commit riêng
- Runtime layer không dùng trực tiếp React Native built-ins

---

## 5) Tài liệu liên quan

- Log chi tiết theo mốc: `docs/PHASE_FEATURE_LOG.md`
- Roadmap kiến trúc ban đầu: `docs/NEXT_STEPS_ARCHITECTURE.md`
- Tổng quan Phase 1: `docs/PHASE_1_OVERVIEW.md`
