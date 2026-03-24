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
