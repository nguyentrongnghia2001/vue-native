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

### Phase 4.2 — Concrete Adapter Implementation

- Thêm `createInMemoryBridgeAdapter` làm target implementation cụ thể
- Map mutation records vào in-memory target state (node tree/props/listeners)
- Hỗ trợ bridge runtime event emit hook từ adapter

**Kết quả:** adapter cụ thể đầu tiên đã hoạt động và test pass.

---

### Phase 4.3 — Bridge Adapter Integration Tests

- Bổ sung integration tests cho batch order, adapter replacement, event roundtrip
- Nối runtime event dispatcher ổn định sau bridge reset

**Kết quả:** flow adapter end-to-end đã được verify bằng integration tests.

---

### Phase 5 — Primitive Expansion + Prop Mapping Refinement

- Mở rộng primitives: `TextInput`, `FlatList`, `KeyboardAvoidingView`
- Chuẩn hoá prop mapping: `class -> className`, merge style object/array, boolean semantics
- Cập nhật sandbox/docs làm reference cho usage mới

**Kết quả:** primitive coverage nâng cao + mapping behavior nhất quán, đã test/typecheck pass.

---

## 2) Trạng thái hiện tại 📍

- Bridge queue + batching: ✅
- Primitives core + advanced (`View`, `Text`, `Image`, `ScrollView`, `Pressable`, `TextInput`, `FlatList`, `KeyboardAvoidingView`): ✅
- Adapter skeleton: ✅
- Adapter implementation cho native target cụ thể (in-memory target): ✅
- Bridge adapter integration tests: ✅
- Native transport adapter contract (ack/error/event receiver): ✅
- Sandbox transport integration (adapter wiring + telemetry): ✅

---

## 3) Cần làm tiếp (ưu tiên) 🔜

## Phase 6 — Adapter target thực thi native thật

**Mục tiêu:** ngoài in-memory target, thêm adapter cho môi trường native thực tế.

### Việc cần làm
- ✅ Tạo adapter implementation theo target cụ thể: `createNativeTransportBridgeAdapter`
- ✅ Chuẩn hoá contract payload giữa JS mutation record và native execution layer (transport contract)
- ✅ Theo dõi error/ack path cho applyMutations
- ✅ Gắn sandbox transport implementation để kiểm chứng wiring trong host app
- ⏳ Tích hợp transport implementation thật theo từng host app/runtime

### Done khi
- Adapter chạy được trên target thật với mutation + event roundtrip
- Test integration + typecheck pass

---

## Phase 7 — Primitive expansion nâng cao (tiếp)

### Việc cần làm
- Mở rộng thêm primitives app-level (input/form/list sâu hơn)
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
