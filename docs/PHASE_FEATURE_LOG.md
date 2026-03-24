# PHASE / FEATURE LOG

Mục đích: Ghi lại phần đã làm để review nhanh trước khi vào Phase/Feature mới.

---

## [2026-03-24 10:55] Phase 1 (Host Contract Stabilization)

### Overview
- Hoàn thành toàn bộ **Phase 1** theo roadmap.
- 3 feature đã triển khai:
  1. Chuẩn hoá `patchProp` (event key normalization + cleanup listener bucket rỗng)
  2. Chuẩn hoá snapshot model (JSON-serializable, loại bỏ function khỏi snapshot)
  3. Tách debug instrumentation sang module riêng (`instrumentation.ts`)

### Files changed
- `packages/runtime-native/src/patchProp.ts`
- `packages/runtime-native/src/types.ts`
- `packages/runtime-native/src/host.ts`
- `packages/runtime-native/src/instrumentation.ts` (new)
- `packages/runtime-native/__tests__/runtime-native.spec.ts`
- `docs/PHASE_1_OVERVIEW.md`
- `docs/PHASE_1_FEATURE_1_patchProp.md`
- `docs/PHASE_1_FEATURE_2_snapshot_model.md`
- `docs/PHASE_1_FEATURE_3_instrumentation.md`
- `README.md`

### Validation
- Test: ✅ `pnpm test` → 4/4 tests pass
- Typecheck: ✅ `pnpm typecheck` clean cho `runtime-native` + `sandbox`

### Decision / Next
- Sẵn sàng vào **Phase 2 (Mutation Bridge)**.
- Rule bắt buộc từ bây giờ: trước mỗi Phase/Feature mới phải overview + log lại trong file này để review.

---

## [2026-03-24 11:20] Phase 2 / Kickoff Checkpoint

### Overview
- Trước khi triển khai Phase 2, đã review lại toàn bộ đầu ra Phase 1.
- Scope Phase 2 sẽ gồm 3 feature chính:
  1. Bridge interface + queue (`bridge.ts`)
  2. Host ops/patchProp emit mutation vào bridge
  3. Batching flush theo tick để giảm chattering

### Files changed
- `.github/copilot-instructions.md` (update rule bắt buộc test + commit mỗi feature)
- `docs/PHASE_FEATURE_LOG.md` (entry checkpoint này)

### Validation
- Trạng thái hiện tại trước khi code Phase 2: Phase 1 test pass ổn định.

### Decision / Next
- Bắt đầu **Phase 2 - Feature 2.1**.
- Quy trình bắt buộc: mỗi feature phải `pnpm test` rồi commit riêng.

---

## [2026-03-24 11:21] Phase 2 / Feature 2.1 (Bridge interface + queue)

### Overview
- Tạo bridge adapter contract cơ bản cho mutation flow JS -> Native.
- Hoàn thành API: `enqueue`, `flush`, `setMutationSink`, `setEventDispatcher`, `dispatchNativeEvent`.
- Thêm utility reset/inspect queue để test ổn định.

### Files changed
- `packages/runtime-native/src/bridge.ts` (new)
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/__tests__/bridge.spec.ts` (new)

### Validation
- Test: ✅ `pnpm test` → 7/7 tests pass.

### Decision / Next
- Tiếp tục **Feature 2.2**: chuyển host ops/patchProp sang emit mutation vào bridge queue.

---

## [2026-03-24 11:22] Phase 2 / Feature 2.2 (Host + patchProp emit mutations)

### Overview
- Nối `host.ts` vào bridge queue để phát mutation records từ các host ops chính.
- Nối `patchProp.ts` vào bridge queue cho cả props/events (`set`/`remove`).
- Bổ sung test mount flow để assert mutation batch có đủ nhóm op quan trọng.

### Files changed
- `packages/runtime-native/src/host.ts`
- `packages/runtime-native/src/patchProp.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`

### Validation
- Test: ✅ `pnpm test` → 8/8 tests pass.

### Decision / Next
- Tiếp tục **Feature 2.3**: thêm batching strategy flush theo tick.

---

## [2026-03-24 11:23] Phase 2 / Feature 2.3 (Batching flush theo tick)

### Overview
- Thêm cơ chế batching microtask trong bridge để gom nhiều `enqueue` vào 1 lần flush.
- `enqueue` giờ tự schedule flush theo tick, giảm chattering giữa JS host ops và adapter sink.
- Bổ sung test async xác nhận nhiều ops trong cùng tick được forward thành 1 batch.

### Files changed
- `packages/runtime-native/src/bridge.ts`
- `packages/runtime-native/__tests__/bridge.spec.ts`

### Validation
- Test: ✅ `pnpm test` → 9/9 tests pass.

### Decision / Next
- Chạy `pnpm typecheck` để chốt toàn bộ Phase 2.

---

## [2026-03-24 11:24] Phase 2 / Completion Checkpoint

### Overview
- Hoàn thành 3 feature của Phase 2:
  1. Bridge interface + queue
  2. Host/patchProp emit mutation records
  3. Batching flush theo tick (microtask)

### Files changed
- `packages/runtime-native/src/bridge.ts`
- `packages/runtime-native/src/host.ts`
- `packages/runtime-native/src/patchProp.ts`
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/__tests__/bridge.spec.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`

### Validation
- Test: ✅ `pnpm test` → 9/9 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Phase 2 đã đạt Done criteria cốt lõi cho mutation bridge nền tảng.
- Có thể chuyển sang **Phase 3** (mở rộng primitives + authoring experience).

---

## [2026-03-24 11:27] Phase 3 / Pre-checkpoint (Rule update)

### Overview
- Bổ sung rule mới trước khi vào Phase 3: **không được sử dụng bất cứ native của React** trong runtime implementation.
- Native behavior bắt buộc đi qua host contract/bridge/primitives của `runtime-native`.

### Files changed
- `.github/copilot-instructions.md`

### Validation
- Rule đã được thêm ở workspace instruction (always-on cho toàn project).

### Decision / Next
- Từ Phase 3 trở đi, implementation chỉ dùng abstractions của `runtime-native`, không gọi trực tiếp React Native native APIs/components.

---

## [2026-03-24 12:06] Phase 3 / Feature 3.1 (Thêm primitives mới)

### Overview
- Bổ sung 3 primitives mới trong `runtime-native`: `Image`, `ScrollView`, `Pressable`.
- Export các primitives mới ra public API package.
- Bổ sung test xác nhận template có thể render các tag primitives mới.

### Files changed
- `packages/runtime-native/src/primitives.ts`
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`

### Validation
- Test: ✅ `pnpm test` → 10/10 tests pass.

### Decision / Next
- Tiếp tục **Feature 3.2**: register global các primitives mới trong `createNativeApp` để bỏ cảnh báo resolve component.

---

## [2026-03-24 12:07] Phase 3 / Feature 3.2 (Global register primitives)

### Overview
- Đăng ký global `Image`, `ScrollView`, `Pressable` trong `createNativeApp`.
- Cập nhật test để assert không còn warning `Failed to resolve component` khi dùng primitives mới trong template.

### Files changed
- `packages/runtime-native/src/nativeApp.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`

### Validation
- Test: ✅ `pnpm test` → 10/10 tests pass.

### Decision / Next
- Tiếp tục **Feature 3.3**: cập nhật sandbox/docs để làm usage reference cho primitives mới.

---

## [2026-03-24 12:08] Phase 3 / Feature 3.3 (Sandbox + docs usage)

### Overview
- Cập nhật sandbox `AppRoot` để demo thực tế `ScrollView`, `Pressable`, `Image` bằng template syntax.
- Cập nhật `README.md` cho development notes và next work theo trạng thái Phase 3.

### Files changed
- `apps/sandbox/src/AppRoot.ts`
- `README.md`

### Validation
- Test: ✅ `pnpm test` → 10/10 tests pass.

### Decision / Next
- Chạy `pnpm typecheck` để chốt toàn bộ Phase 3.

---

## [2026-03-24 12:09] Phase 3 / Completion Checkpoint

### Overview
- Hoàn thành 3 feature của Phase 3:
  1. Thêm primitives `Image`, `ScrollView`, `Pressable`
  2. Register global primitives trong `createNativeApp`
  3. Cập nhật sandbox/docs usage reference
- Tuân thủ rule mới: runtime layer không dùng trực tiếp React Native native APIs/components.

### Files changed
- `packages/runtime-native/src/primitives.ts`
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/src/nativeApp.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`
- `apps/sandbox/src/AppRoot.ts`
- `README.md`

### Validation
- Test: ✅ `pnpm test` → 10/10 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Phase 3 hoàn tất theo roadmap ngắn hạn.
- Có thể chuyển sang bước mở rộng primitives nâng cao và bridge adapter thực thi native target.

---

## [2026-03-24 12:15] Rule clarification / Runtime vs Sandbox scope

### Overview
- Theo feedback review, làm rõ phạm vi rule "không dùng direct React Native":
  - **Cấm** trong runtime layer: `packages/runtime-native/**`.
  - **Được phép** trong sandbox host shell: `apps/sandbox/App.tsx` để dựng UI demo/snapshot/debug panel.

### Files changed
- `.github/copilot-instructions.md`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Rule wording đã rõ ràng để tránh hiểu nhầm khi đọc `App.tsx`.

### Decision / Next
- Tiếp tục giữ nguyên nguyên tắc kiến trúc: runtime không phụ thuộc React Native built-ins; sandbox host shell có thể dùng `react-native`.

---

## [2026-03-24 12:30] Phase 4.1 / Kickoff Checkpoint (Native Bridge Adapter skeleton)

### Overview
- Review lại trạng thái hiện tại: Phase 1-3 đã hoàn tất, bridge queue/batching đã ổn định và test pass.
- Mục tiêu Phase 4.1: thêm adapter skeleton để mutation batch có thể được forward qua một interface thay thế được.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trạng thái trước khi làm feature: workspace ổn định, test/typecheck pass ở checkpoint trước.

### Decision / Next
- Bắt đầu triển khai **Feature 4.1**: `NativeBridgeAdapter` + register/unregister flow + test contract.

---

## [2026-03-24 13:52] Phase 4.1 / Feature (Native Bridge Adapter skeleton)

### Overview
- Thêm adapter skeleton cho bridge layer để forward mutation batch qua interface thay thế được.
- Hỗ trợ lifecycle `register/unregister` adapter và expose trạng thái adapter đang active.
- Thêm runtime hook để adapter có thể phát event ngược vào bridge (`dispatchEvent`).

### Files changed
- `packages/runtime-native/src/bridge.ts`
- `packages/runtime-native/__tests__/bridge.spec.ts`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Test: ✅ `pnpm test` → 13/13 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Feature 4.1 hoàn tất, sẵn sàng cho bước adapter implementation cụ thể theo từng native target.

---

## [2026-03-24 14:05] Phase 4.2 + 4.3 / Kickoff Checkpoint

### Overview
- Review lại trạng thái: Phase 4.1 đã có adapter skeleton + lifecycle register/unregister.
- Mục tiêu tiếp theo:
  - **Phase 4.2**: triển khai adapter cụ thể cho target in-memory/sandbox.
  - **Phase 4.3**: bổ sung integration tests cho adapter flow (batch order, replace adapter, event dispatch).

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước khi triển khai: test/typecheck đều ổn định từ checkpoint trước.

### Decision / Next
- Bắt đầu **Phase 4.2** với module adapter implementation cụ thể + test mapping mutation.

---

## [2026-03-24 14:06] Phase 4.2 / Feature (In-memory adapter implementation)

### Overview
- Thêm adapter implementation cụ thể: `createInMemoryBridgeAdapter`.
- Adapter map mutation records vào state in-memory (node tree data + props + listeners).
- Adapter hỗ trợ lifecycle attach/detach và `emitEvent` để gọi ngược runtime dispatch hook.

### Files changed
- `packages/runtime-native/src/adapters/inMemoryBridgeAdapter.ts` (new)
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/__tests__/in-memory-adapter.spec.ts` (new)
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Test: ✅ `pnpm test` → 15/15 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Tiếp tục **Phase 4.3**: integration test adapter flow end-to-end với event dispatch runtime.

---

## [2026-03-24 14:06] Phase 4.3 / Feature (Bridge adapter integration tests)

### Overview
- Bổ sung integration tests cho adapter flow end-to-end:
  - mutation batch order sau mount
  - replace adapter runtime
  - event dispatch từ adapter runtime về Vue handler
- Nối lại bridge event dispatcher mỗi lần đảm bảo renderer để tránh mất dispatcher sau `resetBridgeState`.
- Thêm host helper dispatch event theo `nodeId + event` để phục vụ roundtrip.

### Files changed
- `packages/runtime-native/src/host.ts`
- `packages/runtime-native/src/renderer.ts`
- `packages/runtime-native/__tests__/bridge-adapter.integration.spec.ts` (new)
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Test: ✅ `pnpm test` → 18/18 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Phase 4.2 + 4.3 đã hoàn tất; có thể chuyển sang Phase 5 (primitive expansion nâng cao).

---

## [2026-03-24 14:25] Phase 5 / Kickoff Checkpoint

### Overview
- Review trạng thái hiện tại: đã có bridge adapter skeleton + in-memory adapter + integration tests ổn định.
- Mục tiêu Phase 5:
  1. Mở rộng primitive coverage nâng cao.
  2. Chuẩn hoá prop/event mapping chi tiết hơn.
  3. Cập nhật sandbox/docs làm reference usage.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trạng thái trước khi làm Phase 5: test/typecheck đang pass.

### Decision / Next
- Bắt đầu **Feature 5.1**: thêm primitives nâng cao + register mặc định.

---

## [2026-03-24 14:14] Phase 5 / Feature 5.1 (Primitive expansion nâng cao)

### Overview
- Thêm primitives mới: `TextInput`, `FlatList`, `KeyboardAvoidingView`.
- Register global mặc định trong `createNativeApp`.
- Bổ sung test render/resolve component cho primitives mới.

### Files changed
- `packages/runtime-native/src/primitives.ts`
- `packages/runtime-native/src/nativeApp.ts`
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`

### Validation
- Test: ✅ `pnpm test` → 19/19 tests pass.

### Decision / Next
- Tiếp tục **Feature 5.2**: chuẩn hoá prop mapping chi tiết hơn (`class`/`style`/boolean props).

---

## [2026-03-24 14:17] Phase 5 / Feature 5.2 (Chuẩn hoá prop mapping)

### Overview
- Chuẩn hoá mapping `class` -> `className`.
- Chuẩn hoá `style` array/object về object hợp nhất trước khi ghi vào host props.
- Giữ semantics boolean props: `true` giữ lại, `false` remove.

### Files changed
- `packages/runtime-native/src/patchProp.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`

### Validation
- Test: ✅ `pnpm test` → 20/20 tests pass.

### Decision / Next
- Tiếp tục **Feature 5.3**: cập nhật sandbox/docs làm reference cho primitives + prop mapping mới.

---

## [2026-03-24 14:19] Phase 5 / Feature 5.3 (Sandbox + docs reference)

### Overview
- Cập nhật sandbox `AppRoot` để demo primitives mới: `TextInput`, `FlatList`, `KeyboardAvoidingView`.
- Cập nhật README để phản ánh primitive coverage mở rộng và prop mapping rules (`class/style/boolean`).

### Files changed
- `apps/sandbox/src/AppRoot.ts`
- `README.md`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Test: ✅ `pnpm test` → 20/20 tests pass.

### Decision / Next
- Chạy `pnpm typecheck` và tổng kết hoàn tất Phase 5.

---

## [2026-03-24 14:20] Phase 5 / Completion Checkpoint

### Overview
- Hoàn thành 3 feature Phase 5:
  1. Primitive expansion nâng cao (`TextInput`, `FlatList`, `KeyboardAvoidingView`)
  2. Chuẩn hoá prop mapping (`class`, `style`, boolean semantics)
  3. Cập nhật sandbox/docs reference usage

### Files changed
- `packages/runtime-native/src/primitives.ts`
- `packages/runtime-native/src/nativeApp.ts`
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/src/patchProp.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`
- `apps/sandbox/src/AppRoot.ts`
- `README.md`
- `docs/ROADMAP_STATUS.md`

### Validation
- Test: ✅ `pnpm test` → 20/20 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Phase 5 hoàn tất.
- Next: Phase 6 (adapter target thực thi native thật) theo `docs/ROADMAP_STATUS.md`.

---

## [2026-03-24 14:35] Phase 6 / Kickoff Checkpoint

### Overview
- Review trạng thái hiện tại: Phase 5 đã hoàn tất, bridge + adapter in-memory + integration tests ổn định.
- Mục tiêu Phase 6: thêm adapter target cho native execution layer thật với `ack/error` path rõ ràng.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trạng thái trước khi làm Phase 6: test/typecheck pass.

### Decision / Next
- Bắt đầu **Feature 6.1**: `native transport bridge adapter` + test contract.

---

## [2026-03-24 14:28] Phase 6 / Feature 6.1 (Native transport adapter)

### Overview
- Thêm `createNativeTransportBridgeAdapter` cho target native execution layer thật.
- Hỗ trợ đầy đủ `ack/error` path và thống kê runtime (`sentBatches`, `sentMutations`, `ackCount`, `errorCount`).
- Hỗ trợ wiring event receiver từ transport về bridge dispatcher (`setEventReceiver`).

### Files changed
- `packages/runtime-native/src/adapters/nativeTransportBridgeAdapter.ts` (new)
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/__tests__/native-transport-adapter.spec.ts` (new)
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Test: ✅ `pnpm test` → 23/23 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Phase 6 đã có adapter target thực thi native thật ở mức runtime contract.
- Bước tiếp theo: gắn transport implementation cụ thể theo môi trường native thực tế (bridge runtime của app).

---

## [2026-03-24 14:35] Phase 6 / Feature 6.2 (Sandbox transport integration)

### Overview
- Tạo sandbox transport implementation để mô phỏng native execution layer trong host app.
- Gắn `createNativeTransportBridgeAdapter` vào `apps/sandbox/App.tsx`.
- Hiển thị stats + recent batches từ transport trong UI sandbox.
- Bổ sung integration test xác nhận mutation forwarding + receiver event roundtrip qua native transport adapter.

### Files changed
- `apps/sandbox/src/sandboxNativeTransport.ts` (new)
- `apps/sandbox/App.tsx`
- `packages/runtime-native/__tests__/bridge-adapter.integration.spec.ts`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Test: ✅ `pnpm test` → 24/24 tests pass.
- Typecheck: ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Feature 6.2 hoàn tất.
- Có thể tiếp tục với Feature 6.3 (gắn transport implementation native runtime thực sự theo target app cụ thể).

---

## [2026-03-24 14:45] Phase 6 / Feature 6.2 Kickoff (Sandbox transport integration)

### Overview
- Mục tiêu: gắn `native transport adapter` vào sandbox host app như một target runtime cụ thể.
- Scope feature: tạo transport implementation cho sandbox + hiển thị stats/last batches để quan sát flow.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước khi triển khai: test/typecheck pass ở Feature 6.1.

### Decision / Next
- Triển khai sandbox transport module, wiring adapter trong `apps/sandbox/App.tsx`, và thêm test cho transport behavior.

---

## [2026-03-24 15:30] Phase 6 / Feature 6.3 Kickoff (Native host transport integration)

### Overview
- Tổng kết scope trước (Feature 6.2): đã gắn transport adapter vào sandbox host app, có telemetry UI và integration test cho mutation forwarding + event roundtrip.
- Validation trước khi vào Feature 6.3: `pnpm test` pass (24/24), `pnpm typecheck` pass.
- Mục tiêu Feature 6.3: thêm transport implementation cho môi trường native runtime thực tế (qua host bridge module), đồng thời giữ fallback sandbox để dev/test.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Checkpoint trước triển khai: dựa trên trạng thái green của Feature 6.2.

### Decision / Next
- Tiếp tục implement module transport runtime-aware (native module + event subscription), rồi wiring vào `apps/sandbox/App.tsx`.

---

## [2026-03-24 16:05] Phase 6 / Feature 6.3 Hoàn tất (Runtime-aware native host transport)

### Overview
- Triển khai transport mới trong sandbox host app để ưu tiên kết nối với native bridge module thực (`NativeModules`) khi có sẵn.
- Bổ sung cơ chế subscribe native event channel (`NativeEventEmitter` + fallback `DeviceEventEmitter`) để nhận event từ host runtime.
- Giữ fallback mode để vẫn chạy được trên môi trường chưa có native module thật.

### Files changed
- `apps/sandbox/src/runtimeNativeTransport.ts` (new)
- `apps/sandbox/App.tsx`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- ✅ `pnpm test` pass (24/24 tests).
- ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Feature 6.3 hoàn tất ở mức JS host integration.
- Bước tiếp theo: implement native module thật trong target app (Android/iOS) để đường transport chạy end-to-end với runtime host thực.

---

## [2026-03-24 16:58] Phase 7 / Kickoff Checkpoint (Chờ duyệt)

### Overview
- Tổng kết Phase 6:
  - Hoàn tất `createNativeTransportBridgeAdapter` với ack/error/event receiver contract.
  - Hoàn tất sandbox transport integration + telemetry và integration test roundtrip.
  - Hoàn tất runtime-aware transport trong host app (`NativeModules` + `NativeEventEmitter`/`DeviceEventEmitter` fallback).
  - Trạng thái scope còn mở của Phase 6: **chưa có native bridge module thật ở Android/iOS target app**, nên chưa đạt end-to-end native runtime hoàn chỉnh.
- Validation mới nhất (re-check): `pnpm test` pass 24/24, `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- ✅ `pnpm test` (24/24)
- ✅ `pnpm typecheck`

### Decision / Next
- Kết luận readiness: có thể bắt đầu triển khai **Phase 7** song song backlog native module thật của Phase 6.
- Scope đề xuất bắt đầu: **Feature 7.1 — Primitive app-level bổ sung + test coverage + docs usage**.
- Chờ checkpoint review/approval của user trước khi code Phase 7.

---

## [2026-03-24 17:10] Phase 6 / Feature 6.4 Kickoff (Native bridge module Android/iOS)

### Overview
- Tổng kết trước kickoff: Phase 6.1-6.3 đã hoàn tất ở mức runtime JS + transport adapter + sandbox wiring, test/typecheck đều xanh.
- Gap còn lại của Phase 6: chưa có native bridge module thật ở Android/iOS để nhận mutation batch và phát event ngược về JS.
- Mục tiêu Feature 6.4: triển khai module `VueNativeHostBridge` cho cả Android/iOS, khớp contract với `runtimeNativeTransport`.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước triển khai: `pnpm test` pass (24/24), `pnpm typecheck` pass.

### Decision / Next
- Implement native module source cho Android/iOS + tài liệu tích hợp vào prebuild runtime của Expo sandbox.

---

## [2026-03-24 17:20] Phase 6 / Feature 6.4 Hoàn tất (Native bridge module source)

### Overview
- Đã thêm native bridge module `VueNativeHostBridge` cho Android/iOS với đầy đủ contract method:
  - `applyMutations`
  - `applyMutationBatch`
  - `sendMutations`
  - `emitEvent`
  - `getStats`
- Event channel native -> JS dùng `vue-native:bridge-event`, khớp với `runtimeNativeTransport`.
- Bổ sung tài liệu tích hợp vào output của Expo prebuild để chạy trên target runtime thật.

### Files changed
- `apps/sandbox/native/android/src/main/java/com/vuenative/bridge/VueNativeHostBridgeModule.kt` (new)
- `apps/sandbox/native/android/src/main/java/com/vuenative/bridge/VueNativeHostBridgePackage.kt` (new)
- `apps/sandbox/native/ios/VueNativeHostBridge.swift` (new)
- `apps/sandbox/native/ios/VueNativeHostBridge.m` (new)
- `apps/sandbox/native/README.md` (new)
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- ✅ `pnpm test` pass (24/24 tests).
- ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.
- ℹ️ Native E2E (run app Android/iOS với module đã copy vào prebuild output) cần verify thủ công trên môi trường thiết bị/emulator.

### Decision / Next
- Hoàn tất backlog kỹ thuật “implement native bridge module source cho Android/iOS”.
- Có thể chuyển sang Phase 7; đồng thời giữ một task follow-up để verify E2E native runtime trên thiết bị thật/emulator.

---

## [2026-03-24 17:35] Phase 7 / Feature 7.1 Kickoff (App-level primitives batch 1)

### Overview
- Tổng kết trước kickoff: Phase 6 đã hoàn tất adapter + transport + native bridge module source Android/iOS; test/typecheck xanh.
- Scope mở đầu Phase 7: mở rộng thêm primitives app-level và cập nhật test/sandbox/docs tương ứng.
- Mục tiêu Feature 7.1: bổ sung nhóm primitives phổ biến cho screen-level UX (`SafeAreaView`, `ActivityIndicator`, `Modal`).

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước triển khai: `pnpm test` pass (24/24), `pnpm typecheck` pass.

### Decision / Next
- Implement primitives + global register + exports + runtime tests + sandbox usage/docs.

---

## [2026-03-24 17:48] Phase 7 / Feature 7.1 Hoàn tất (App-level primitives batch 1)

### Overview
- Bổ sung 3 primitives mới cho app-level UX: `SafeAreaView`, `ActivityIndicator`, `Modal`.
- Đăng ký global trong `createNativeApp` và export ở public API `runtime-native`.
- Bổ sung runtime test xác nhận render/resolve component cho primitives mới.
- Cập nhật sandbox `AppRoot` để có usage thực tế và cập nhật README.

### Files changed
- `packages/runtime-native/src/primitives.ts`
- `packages/runtime-native/src/nativeApp.ts`
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`
- `apps/sandbox/src/AppRoot.ts`
- `README.md`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- ✅ `pnpm test` pass (25/25 tests).
- ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Feature 7.1 hoàn tất.
- Có thể tiếp tục Feature 7.2: mở rộng input/form/list primitives sâu hơn và refine mapping theo case thực tế.

---

## [2026-03-24 18:05] Phase 7 / Feature 7.2 Kickoff (Input/Form/List batch 2 + mapping refine)

### Overview
- Tổng kết scope trước: Feature 7.1 đã thêm `SafeAreaView`, `ActivityIndicator`, `Modal` và test/typecheck pass.
- Mục tiêu Feature 7.2:
  1. Mở rộng primitives theo hướng input/form/list sâu hơn.
  2. Refine prop/event mapping cho template authoring thân thiện hơn (đặc biệt dạng kebab-case).

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước triển khai: `pnpm test` pass (25/25), `pnpm typecheck` pass.

### Decision / Next
- Implement primitives batch 2 + update register/export + test + sandbox/docs + commit riêng cho Feature 7.2.

---

## [2026-03-24 18:22] Phase 7 / Feature 7.2 Hoàn tất (Input/Form/List batch 2 + mapping refine)

### Overview
- Bổ sung thêm primitives batch 2 cho input/form/list use case: `Switch`, `SectionList`, `RefreshControl`.
- Đăng ký global các primitives mới trong `createNativeApp` và export qua public API.
- Refine `patchProp`:
  - Hỗ trợ normalize kebab-case prop key -> camelCase (ví dụ `max-length` -> `maxLength`, `placeholder-text-color` -> `placeholderTextColor`).
  - Hỗ trợ normalize kebab-case event key (ví dụ `@change-text` -> `onChangeText`).
- Cập nhật test coverage + sandbox demo + README.

### Files changed
- `packages/runtime-native/src/primitives.ts`
- `packages/runtime-native/src/nativeApp.ts`
- `packages/runtime-native/src/index.ts`
- `packages/runtime-native/src/patchProp.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`
- `apps/sandbox/src/AppRoot.ts`
- `README.md`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- ✅ `pnpm test` pass (27/27 tests).
- ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Feature 7.2 hoàn tất.
- Có thể tiếp tục Feature 7.3 để mở rộng thêm primitives chuyên sâu và chuẩn hoá mapping edge-cases theo component-specific behavior.

---

## [2026-03-24 18:35] Phase 7 / Feature 7.3 Kickoff (Component-specific mapping edge-cases)

### Overview
- Tổng kết trước kickoff: Feature 7.2 đã mở rộng primitives batch 2 và normalize kebab-case props/events.
- Mục tiêu Feature 7.3: xử lý edge-cases theo component-specific behavior để tăng DX cho template authoring, đặc biệt với `v-model` trên input controls.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước triển khai: `pnpm test` pass (27/27), `pnpm typecheck` pass.

### Decision / Next
- Implement mapping aliases cho `TextInput`/`Switch` + giữ `false` cho một số boolean props cần preserve + test roundtrip.

---

## [2026-03-24 18:45] Phase 7 / Feature 7.3 Hoàn tất (Component-specific mapping edge-cases)

### Overview
- Refine `patchProp` theo component-specific behavior:
  - `modelValue -> value` cho `TextInput` và `Switch`.
  - `onUpdate:modelValue -> onChangeText` (`TextInput`) và `onValueChange` (`Switch`).
  - Preserve giá trị boolean `false` cho các props cần thiết theo component (`Switch.value`, `Modal.visible`, `RefreshControl.refreshing`).
- Cập nhật sandbox demo dùng `v-model` trực tiếp cho `TextInput` và `Switch`.
- Bổ sung test coverage cho mapping alias và v-model roundtrip qua runtime event dispatch.

### Files changed
- `packages/runtime-native/src/patchProp.ts`
- `packages/runtime-native/__tests__/runtime-native.spec.ts`
- `apps/sandbox/src/AppRoot.ts`
- `README.md`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- ✅ `pnpm test` pass (29/29 tests).
- ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Feature 7.3 hoàn tất.
- Có thể tiếp tục Feature 7.4: mở rộng mapping edge-cases theo nhóm prop/event chuyên sâu hơn (ví dụ pointer/input submit/focus lifecycle).

---

## [2026-03-24 19:05] Phase 6 / Feature 6.5 Kickoff (Chuẩn hoá prebuild Android real-device flow)

### Overview
- Tổng kết trước kickoff: native bridge module source Android/iOS đã có, nhưng bước tích hợp vào prebuild output + checklist verify máy thật chưa chuẩn hoá.
- Ưu tiên hiện tại: chốt flow Android trước (phù hợp môi trường Windows, dễ verify hơn iOS).
- Mục tiêu Feature 6.5:
  1. Chuẩn hoá quy trình copy/sync native module Android vào prebuild output.
  2. Thêm checklist readiness để giảm sai sót khi chạy máy thật.
  3. Thêm script chạy nhanh trong sandbox package.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước triển khai: `pnpm test` pass (29/29), `pnpm typecheck` pass.

### Decision / Next
- Implement script + docs cho Android prebuild integration, sau đó chạy test/typecheck và cập nhật roadmap.

---

## [2026-03-24 19:20] Phase 6 / Feature 6.5 Hoàn tất (Android prebuild integration workflow)

### Overview
- Chuẩn hoá Android-first workflow để test máy thật trên Windows:
  - thêm script sync native bridge module vào prebuild output Android,
  - thêm script readiness check (detect file + package registration),
  - thêm lệnh all-in-one để prebuild + sync + check + run.
- Cập nhật tài liệu checklist verify máy thật theo Android trước.

### Files changed
- `apps/sandbox/scripts/sync-native-android.mjs` (new)
- `apps/sandbox/scripts/check-android-readiness.mjs` (new)
- `apps/sandbox/package.json`
- `apps/sandbox/native/README.md`
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- ✅ `pnpm test` pass (29/29 tests).
- ✅ `pnpm typecheck` pass cho `runtime-native` + `sandbox`.

### Decision / Next
- Đã có quy trình chuẩn để verify runtime native trên Android device/emulator.
- Có thể ưu tiên chạy verification thực tế trước khi tiếp tục Feature 7.4.

---

## [2026-03-24 19:35] Phase 6 / Feature 6.6 Kickoff (Verify native runtime roundtrip)

### Overview
- Mục tiêu: chạy verify end-to-end native runtime roundtrip trên Android device/emulator bằng workflow prebuild đã chuẩn hoá.
- Scope:
  1. chạy prebuild + sync + readiness check + run native Android,
  2. xử lý blocker tích hợp nếu có,
  3. ghi nhận bằng chứng verify thành công/không thành công và bước tiếp theo.

### Files changed
- `docs/PHASE_FEATURE_LOG.md`

### Validation
- Trước khi verify: `pnpm test` pass (29/29), `pnpm typecheck` pass.

### Decision / Next
- Thực thi verify pipeline trên Android trước (ưu tiên môi trường Windows).
