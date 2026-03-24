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
