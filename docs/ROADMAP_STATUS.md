# Vue Native Roadmap Status

Tài liệu này là **nguồn tổng hợp duy nhất** cho:
- Những gì đã làm xong
- Những gì đang làm
- Những gì cần làm tiếp

> Cập nhật gần nhất: **2026-03-26**

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
- Primitives core + advanced (`View`, `Text`, `Image`, `ScrollView`, `Pressable`, `TextInput`, `FlatList`, `KeyboardAvoidingView`, `SafeAreaView`, `ActivityIndicator`, `Modal`, `Switch`, `SectionList`, `RefreshControl`): ✅
- Adapter skeleton: ✅
- Adapter implementation cho native target cụ thể (in-memory target): ✅
- Bridge adapter integration tests: ✅
- Native transport adapter contract (ack/error/event receiver): ✅
- Sandbox transport integration (adapter wiring + telemetry): ✅
- Runtime-aware host transport (NativeModules + native event channel + fallback): ✅

---

## 3) Cần làm tiếp (ưu tiên) 🔜

## Phase 6 — Adapter target thực thi native thật

**Mục tiêu:** ngoài in-memory target, thêm adapter cho môi trường native thực tế.

### Việc cần làm
- ✅ Tạo adapter implementation theo target cụ thể: `createNativeTransportBridgeAdapter`
- ✅ Chuẩn hoá contract payload giữa JS mutation record và native execution layer (transport contract)
- ✅ Theo dõi error/ack path cho applyMutations
- ✅ Gắn sandbox transport implementation để kiểm chứng wiring trong host app
- ✅ Bổ sung runtime-aware transport layer ưu tiên native module + event subscription
- ✅ Implement native bridge module source cho Android/iOS (`VueNativeHostBridge`) + integration docs
- ✅ Chuẩn hoá Android-first prebuild integration workflow (sync/check/run scripts + real-device checklist)
- ⏳ Verify end-to-end runtime roundtrip trên app native thật (device/emulator) sau khi tích hợp vào prebuild output

### Done khi
- Adapter chạy được trên target thật với mutation + event roundtrip (đang chờ verify runtime)
- Test integration + typecheck pass

---

## Phase 7 — Primitive expansion nâng cao (tiếp)

### Việc cần làm
- ✅ Feature 7.1: thêm app-level primitives batch 1 (`SafeAreaView`, `ActivityIndicator`, `Modal`)
- ✅ Feature 7.2: thêm input/form/list primitives batch 2 (`Switch`, `SectionList`, `RefreshControl`)
- ✅ Refine mapping: hỗ trợ kebab-case prop/event normalization (`max-length`, `placeholder-text-color`, `@change-text`)
- ✅ Feature 7.3: component-specific mapping edge-cases (`TextInput`/`Switch` v-model aliases, preserve `false` cho một số boolean props)
- ✅ Feature 7.4: event alias normalization cho `TextInput` (`@focus`, `@blur`, `@submit -> onSubmitEditing`)
- ✅ Feature 7.5: interaction alias refinement (`TextInput @change`, `Switch @change`, `Pressable @tap`)
- ✅ Feature 7.6: web-friendly interaction lifecycle aliases (`TextInput @input`, `Switch @input`, `Pressable @longpress/@pressin/@pressout`)
- ✅ Feature 7.7: scroll + pointer lifecycle aliases (`ScrollView @scrollstart/@scrollend/@momentumstart/@momentumend`, `Pressable @click/@pointerdown/@pointerup`)
- ✅ Feature 7.8: app-level primitives batch 3 (`TouchableOpacity`, `TouchableHighlight`, `StatusBar`)
- ✅ Feature 7.9: identifier + accessibility prop aliases (`test-id`, `native-id`, `aria-label`, `role`/`aria-role`)
- ✅ Feature 7.10: finalization batch (`TouchableWithoutFeedback`, `ImageBackground`, touchable-family aliases, preserve `StatusBar.hidden=false`)
- ✅ Primitive set mở rộng đủ cho use case app cơ bản
- ✅ Mapping component-specific ổn định, có test coverage cho edge-cases chính
- ✅ Docs usage đã được bổ sung theo từng nhóm primitive/mapping

### Done khi
- ✅ Primitive set đủ cho use case app cơ bản
- ✅ Mapping ổn định, test pass

**Kết luận Phase 7:** ✅ Hoàn tất.

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
