# Phase 9 Migration Notes (v1 RC)

Tài liệu này chốt policy migration cho `@vue-native/runtime-native` ở mốc Phase 9.

## 1. Semver policy

- Stable APIs: tuân thủ semver chuẩn.
  - Breaking change chỉ được phép ở major version.
  - Minor/Patch không được phá behavior contract đã chốt.
- Compatibility APIs: vẫn duy trì qua toàn bộ nhánh `v1.0.0-rc.*`.
- Experimental APIs: có thể thay đổi giữa các RC, nhưng phải có changelog ghi rõ.

## 2. API buckets (nguồn chuẩn)

Nguồn chuẩn nằm tại:
- `packages/runtime-native/src/apiContract.ts`

Các nhóm:
- Stable: dùng cho production flow.
- Compat: legacy naming, giữ để migrate dần.
- Experimental: advanced/internals, có thể đổi contract.

## 3. Migration map (legacy -> preferred)

### Bridge / transport

- `createNativeTransportBridgeAdapter` -> `createHostTransportBridgeAdapter`
- `dispatchNativeEvent` -> `dispatchHostEvent`

### Host bootstrap

- Bootstrap thủ công adapter/root/session -> `createHostRuntimeSession`

### Host transports

- RN-specific transport trực tiếp trong host -> tách qua `HostMutationTransport` + factory mode (`react-native` / `in-memory` / `auto`).

## 4. Breaking-change policy

Một thay đổi được xem là breaking nếu thuộc ít nhất một điều kiện:

1. Xóa hoặc đổi signature của Stable API.
2. Đổi semantics gây khác behavior contract đã test (event dispatch, mutation forwarding, lifecycle ordering).
3. Đổi default behavior của API stable mà không có migration path rõ ràng.

## 5. Quy trình khi cần breaking trong tương lai

1. Tạo Compatibility alias trước (nếu khả thi).
2. Thêm warning/deprecation note (docs + changelog).
3. Bổ sung test contract bảo vệ cả old/new path trong giai đoạn chuyển tiếp.
4. Chỉ xóa compatibility API ở major kế tiếp.

## 6. Khuyến nghị cho team app

1. Ưu tiên dùng API thuộc Stable bucket.
2. Với Compat API, lên kế hoạch migrate trước khi chốt `v1.0.0` chính thức.
3. Tránh phụ thuộc trực tiếp vào Experimental APIs trừ khi có lý do rõ ràng.
