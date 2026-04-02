# Vue Native Roadmap Status

Tài liệu này là **nguồn tổng hợp duy nhất** cho:
- Những gì đã làm xong
- Những gì đang làm
- Những gì cần làm tiếp

> Cập nhật gần nhất: **2026-04-02**

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

## Strategic Pivot (2026-03-31) — Hướng #2

**Quyết định kiến trúc:** ưu tiên tiến tới runtime/app host **không lock-in Expo + React Native**.

- `apps/product-host` hiện tại được xem là lớp chuyển tiếp để giữ khả năng chạy native trong khi tách contract.
- Từ mốc này, mọi feature mới cần ưu tiên **host-agnostic contract** trước khi thêm logic phụ thuộc platform.

---

## Phase 8A — Transitional Product Host (giữ tương thích hiện tại)

**Mục tiêu:** tách rõ sandbox demo và app host cho product, để flow release không phụ thuộc debug shell.

### Việc cần làm
- ⏳ Tạo `apps/product-host` (hoặc profile product trong sandbox) với entry tối giản, không phụ thuộc panel debug.
- ⏳ Chuẩn hoá cấu trúc authoring theo Vue-like: `AppRoot.vue`, `components/`, `pages/`, `composables/`.
- ⏳ Chốt bootstrap contract: một file khởi động mỏng (`index.js -> src/main.jsx`) + host nội bộ riêng.
- ⏳ Thiết lập env config theo build type: `dev`, `staging`, `prod`.

### Done khi
- App host product chạy được Android emulator/device với cùng runtime-native package.
- Team có template tạo màn hình mới theo SFC flow mà không cần sửa host internals.

---

## Phase 8B — Host-Agnostic Runtime Foundation (ưu tiên cao nhất)

**Mục tiêu:** biến `runtime-native` thành runtime đa host, không bắt buộc Expo/RN để phát triển feature chính.

### Tiến độ hiện tại
- ✅ Feature 8B.1: Host transport contract extraction đã hoàn tất (`Host*` adapter contract + compatibility wrapper cho API cũ).
- ✅ Feature 8B.2: App-layer transport decoupling đã hoàn tất (factory host-agnostic + RN module isolation + in-memory host transport).
- ✅ Feature 8B.3: Non-RN host runner baseline đã hoàn tất (`productRuntimeSession` + `dualHostAppRootRunner` + dual transport integration test).
- ✅ Feature 8B.4: Scheduler/lifecycle contract và deep parity smoke đã hoàn tất (`HostRuntimeSession` + normalized snapshot parity assertion).

### Việc cần làm
- ✅ Trích xuất platform contract mới (render target + event bridge + scheduler hooks) thành interface rõ ràng.
- ✅ Tách transport/event channel khỏi `react-native` API trong lớp host runtime.
- ✅ Tạo adapter theo host: `react-native` (legacy/transitional) và 1 host không-RN để chứng minh portability.
- ✅ Chuẩn hoá bootstrap contract để cùng một `AppRoot.vue` chạy trên nhiều host adapter.

### Trạng thái Phase 8B
- ✅ Baseline hoàn tất. Có thể chuyển trọng tâm sang Phase 9 (Runtime SDK Stabilization).

### Done khi
- `packages/runtime-native` không còn import trực tiếp `react-native` ở runtime package core.
- Cùng một flow authoring (`AppRoot.vue`) chạy được qua ít nhất 2 host adapters (RN + non-RN).
- Test contract cho host adapter pass trong `pnpm test` + `pnpm typecheck`.

---

## Phase 9 — Runtime SDK Stabilization (v1 RC)

**Mục tiêu:** khoá API public cho runtime-native trước khi phát hành nội bộ.

### Tiến độ hiện tại
- ✅ Feature 9.1: Public API audit + stable/compat/experimental manifest đã hoàn tất (kèm contract test).
- ✅ Feature 9.2: Critical public API contract tests đã hoàn tất (`createNativeApp`, bridge adapter, `dispatchEventToNativeNode`).
- ✅ Feature 9.3: Runtime host transport warning hardening đã hoàn tất (`NativeEventEmitter` contract guard + fallback semantics).
- ✅ Feature 9.4: Migration notes + breaking-change policy (semver) đã hoàn tất.
- ✅ Feature 9.5: RC baseline checklist + version baseline `v1.0.0-rc.0` đã hoàn tất (implementation).
- ✅ Feature 9.6: Shared native event-channel utility + fallback contract tests đã hoàn tất (runtime helper + app transport integration).

### Việc cần làm
- ✅ Audit API export hiện tại (`index.ts`) và chốt danh sách stable APIs. *(đã có manifest code-level + README policy)*
- ✅ Thêm test contract cho các API public quan trọng (`createNativeApp`, bridge adapter, event dispatch).
- ✅ Loại warning còn lại ở runtime host transport (`NativeEventEmitter` add/remove listener contract).
- ✅ Viết tài liệu migration notes cho breaking-change policy (semver).

### Trạng thái Phase 9
- ✅ Hoàn tất implementation và automated gates cho Feature 9.1 -> 9.6.
- ✅ Automated validation mới nhất: `pnpm test` (65/65) + `pnpm typecheck` (runtime-native/sandbox/product-host pass).
- ⚠ Gate thủ công ngoài phạm vi code: verify warning runtime trên emulator/device trong flow chạy chuẩn.
- Trạng thái gate thủ công hiện tại: **BLOCKED do Java/JDK không được cài đặt trên local environment**. Android build yêu cầu JAVA_HOME được set, nhưng hệ thống không có JDK. Này là infrastructure blocker, không phải code issue. Đề xuất: defer manual android smoke testing đến CI/CD pipeline hoặc máy đã setup Android toolchain đủ đủ. Code logic đã sẵn sàng.

### Done khi
- ✅ Có baseline `v1.0.0-rc` cho runtime-native với test + typecheck pass.
- ⚠ Manual android smoke gate: blocked by environment (cần setup Java/Android SDK trước).

---

## Phase 10 — Quality, Observability, Performance

**Mục tiêu:** nâng độ tin cậy để thử nghiệm nội bộ ở quy mô team.

### Tiến độ hiện tại
- ✅ Feature 10.1: E2E smoke test baseline đã hoàn tất (launch app + input + toggle + press event roundtrip) trong `packages/runtime-native/__tests__/e2e-smoke.spec.ts`.
- ✅ Feature 10.2: Telemetry baseline cho host transport adapter đã hoàn tất (throughput + errorRate + ack latency metrics) với contract test trong `packages/runtime-native/__tests__/host-transport-adapter.spec.ts`.
- ✅ Feature 10.3: Crash/error reporting pipeline cho app host đã hoàn tất (runtime reporter + global handler install + product-host transport/runtime integration) với contract test trong `packages/runtime-native/__tests__/error-reporting.spec.ts`.
- ✅ Feature 10.4: Performance baseline đã hoàn tất (startup time + first interaction latency + memory sampling) với contract test trong `packages/runtime-native/__tests__/performance-baseline.spec.ts` và product-host integration.

### Việc cần làm
- ✅ Bổ sung e2e smoke test (launch app, input, toggle, press event roundtrip).
- ✅ Thêm telemetry chuẩn cho bridge throughput, error rate, latency. *(baseline ở host transport adapter stats)*
- ✅ Thêm crash/error reporting pipeline cho app host.
- ✅ Thiết lập performance baseline (startup time, first interaction latency, memory).
- ⏳ Nối telemetry + error + performance baseline vào dashboard runtime health tối thiểu cho beta gate.

### Done khi
- CI có quality gate rõ ràng cho unit/integration/e2e smoke.
- Có dashboard tối thiểu cho runtime health sau khi phát hành beta.

---

## Phase 11 — Security & Release Readiness

**Mục tiêu:** sẵn sàng phát hành beta/public mà không thiếu compliance cơ bản.

### Việc cần làm
- ⏳ Dependency audit + secret handling + policy cho network/storage.
- ⏳ Chuẩn hoá manifest/permission theo scope product.
- ⏳ Chuẩn bị release checklist Android/iOS (assets, app id, signing, privacy text).
- ⏳ Chuẩn hoá rollback plan + release notes template.

### Done khi
- Có thể phát hành internal beta theo checklist lặp lại được.
- Mọi biến môi trường/signing được quản lý qua CI secrets.

---

## Phase 12 — Distribution & Product Iteration

**Mục tiêu:** chạy beta thật với người dùng nội bộ, đo được KPI sản phẩm.

### Việc cần làm
- ⏳ Thiết lập kênh phát hành: `alpha -> beta -> stable`.
- ⏳ Thu thập feedback loop (issue template, crash triage, product analytics).
- ⏳ Chạy pilot 1-2 sprint để chốt backlog sau beta.
- ⏳ Lập kế hoạch support matrix theo OS/device.

### Done khi
- Có release cadence ổn định và số liệu quyết định cho roadmap v2.

---

## Legacy Completed Phases

- Phase 6: ✅ Adapter target native thực đã hoàn tất (bao gồm verify runtime roundtrip trên emulator/device).
- Phase 7: ✅ Primitive expansion + prop/event mapping refinement đã hoàn tất.

---

## Sandbox web authoring

- ✅ Sandbox demo đã hỗ trợ authoring bằng `AppRoot.vue` (browser preview)
- ✅ Có custom Metro transformer cho `.vue` trong `apps/sandbox`
- ✅ Bootstrap sandbox đã chuyển sang `index.js -> src/main.jsx` với host nội bộ tách riêng (`src/SandboxPreviewHost.jsx`)

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
