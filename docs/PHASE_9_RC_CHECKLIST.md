# Phase 9 RC Checklist (v1.0.0-rc.0)

Mục tiêu: xác nhận baseline Runtime SDK trước khi chuyển trọng tâm sang Phase 10.

## 1. Version baseline

- Package: `@vue-native/runtime-native`
- Target: `1.0.0-rc.0`
- Trạng thái: ✅ đã set trong `packages/runtime-native/package.json`

## 2. Public API stabilization

- API manifest stable/compat/experimental: ✅
  - `packages/runtime-native/src/apiContract.ts`
- Contract tests:
  - `public-api-contract.spec.ts`: ✅
  - `public-api-critical-contract.spec.ts`: ✅

## 3. Runtime host transport warning hardening

- `NativeEventEmitter` contract guard (`addListener/removeListeners`) cho:
  - sandbox transport: ✅
  - product RN transport: ✅
- Fallback semantics sang `DeviceEventEmitter`: ✅

## 4. Migration policy

- Migration notes + semver policy: ✅
  - `docs/PHASE_9_MIGRATION_NOTES.md`
- README runtime-native link tới migration notes: ✅

## 5. Automated validation

- `pnpm test`: ✅ pass
- `pnpm typecheck`: ✅ pass

## 6. Manual runtime smoke (platform warning check)

- Android runtime warning (`NativeEventEmitter` add/remove listener contract):
  - Trạng thái: ⚠ attempted but blocked (không có emulator/device trong môi trường hiện tại)
  - Lệnh gợi ý: `pnpm --filter @vue-native/sandbox native:run:android`
  - Kết quả lần chạy gần nhất: `expo run:android` fail với `No Android connected device found, and no emulators could be started automatically`.

## 7. Phase 9 close gate

- Implementation gate: ✅ done
- Validation gate (automated): ✅ done
- Validation gate (manual platform warning smoke): ⚠ blocked by environment

Kết luận hiện tại:
- Baseline `v1.0.0-rc.0` đã được thiết lập và pass toàn bộ test/typecheck.
- Cần môi trường có emulator/device để hoàn tất verify thủ công điều kiện "không còn warning runtime cấp platform".
