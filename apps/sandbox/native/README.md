# Native bridge module integration (Android-first)

Thư mục này chứa source native module thật cho `VueNativeHostBridge` (Android/iOS), khớp contract mà `apps/sandbox/src/runtimeNativeTransport.ts` đang gọi.

---

## 1) Android-first workflow (khuyến nghị trên Windows)

### Bước A — Generate prebuild output

Từ `apps/sandbox`, chạy:

- `pnpm prebuild:android`

### Bước B — Sync native bridge module vào `android/`

Từ `apps/sandbox`, chạy:

- `pnpm native:sync:android`

Script sẽ copy:

- `native/android/src/main/java/com/vuenative/bridge/VueNativeHostBridgeModule.kt`
- `native/android/src/main/java/com/vuenative/bridge/VueNativeHostBridgePackage.kt`

vào:

- `android/app/src/main/java/com/vuenative/bridge/VueNativeHostBridgeModule.kt`
- `android/app/src/main/java/com/vuenative/bridge/VueNativeHostBridgePackage.kt`

### Bước C — Register package trong `MainApplication`

Mở `android/app/src/main/java/**/MainApplication.kt` (hoặc `.java`) và thêm:

- Import `com.vuenative.bridge.VueNativeHostBridgePackage`
- Trong `getPackages()` thêm `packages.add(VueNativeHostBridgePackage())`

### Bước D — Readiness check

Từ `apps/sandbox`, chạy:

- `pnpm native:check:android`

Script sẽ kiểm tra:

- đã có `android/` output
- đã copy đúng bridge module files
- đã đăng ký package trong `MainApplication`

### Bước E — Run on real device

Bạn có thể chạy all-in-one:

- `pnpm native:run:android`

Hoặc chạy riêng:

- `expo run:android`

---

## 2) Checklist verify trên máy thật (Android)

Sau khi app chạy trên thiết bị:

1. Vào màn sandbox, xem section `Native transport stats`.
2. Kiểm tra `runtimeTransportDiagnostics.moduleDetected === true`.
3. Bấm `Increment count` và kiểm tra:
	- `sentBatches` tăng,
	- `sentMutations` tăng,
	- `mode` là `native-module`.
4. Bấm `Simulate native onPress` và kiểm tra state trong `AppRoot` thay đổi đúng.
5. Đảm bảo không có error transport ở panel stats.

> Nếu `moduleDetected === false`, nghĩa là app đang rơi vào fallback JS transport (chưa dùng native module thật).

---

## 3) iOS integration (tham chiếu)

Copy các file:

- `native/ios/VueNativeHostBridge.swift`
- `native/ios/VueNativeHostBridge.m`

vào iOS prebuild output rồi build bằng Xcode.

---

## 4) Contract được hỗ trợ

Module expose methods:

- `applyMutations(batch)`
- `applyMutationBatch(payload)`
- `sendMutations(payload)`
- `emitEvent(nodeId, event, payload)`
- `getStats()`

Event channel native -> JS:

- `vue-native:bridge-event`
