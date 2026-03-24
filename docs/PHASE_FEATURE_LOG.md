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
