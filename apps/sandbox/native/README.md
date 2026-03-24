# Native bridge module templates for sandbox

Thư mục này chứa source native module thật cho `VueNativeHostBridge` (Android/iOS) để khớp contract mà `apps/sandbox/src/runtimeNativeTransport.ts` đang gọi.

## 1) Android integration (Expo prebuild output)

Copy các file Kotlin vào project Android sau khi chạy prebuild:

- `native/android/src/main/java/com/vuenative/bridge/VueNativeHostBridgeModule.kt`
- `native/android/src/main/java/com/vuenative/bridge/VueNativeHostBridgePackage.kt`

Đặt tại:

- `android/app/src/main/java/com/vuenative/bridge/VueNativeHostBridgeModule.kt`
- `android/app/src/main/java/com/vuenative/bridge/VueNativeHostBridgePackage.kt`

Sau đó đăng ký package trong `MainApplication`:

- Thêm import `com.vuenative.bridge.VueNativeHostBridgePackage`
- Trong `getPackages()` thêm `packages.add(VueNativeHostBridgePackage())`

## 2) iOS integration (Expo prebuild output)

Copy các file iOS vào project iOS sau khi prebuild:

- `native/ios/VueNativeHostBridge.swift`
- `native/ios/VueNativeHostBridge.m`

Đặt tại thư mục app iOS (ví dụ `ios/vue-native-sandbox/`).

Xcode sẽ expose module tên `VueNativeHostBridge` qua bridge file Objective-C.

## 3) Contract được hỗ trợ

Module expose các method sau (khớp transport JS):

- `applyMutations(batch)`
- `applyMutationBatch(payload)`
- `sendMutations(payload)`
- `emitEvent(nodeId, event, payload)`
- `getStats()`

Event channel native -> JS:

- `vue-native:bridge-event`

## 4) Gợi ý kiểm thử E2E thủ công

- Chạy app native (`expo run:android` hoặc `expo run:ios`) sau khi đã copy module.
- Mở sandbox và bấm `Increment count` để tạo mutation batch.
- Dùng `emitEvent` từ native module để phát `onPress` về JS node tương ứng.
- Quan sát panel transport stats/diagnostics trong sandbox để xác nhận roundtrip.
