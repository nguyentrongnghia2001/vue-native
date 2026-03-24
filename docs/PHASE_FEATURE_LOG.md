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
