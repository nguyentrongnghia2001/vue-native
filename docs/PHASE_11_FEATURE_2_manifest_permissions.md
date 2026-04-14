# Phase 11 / Feature 11.2 - Product Manifest and Permission Scope

## Muc tieu

Chot scope manifest cho `apps/product-host` theo nguyen tac least privilege:
- Khong mo quyen nhay cam khi product chua su dung.
- Co source of truth ro rang cho Android/iOS release metadata.
- Co validation tu dong de fail som neu ai do them permission/sensitive module vuot scope.

## Artifacts da them

- `apps/product-host/app.json`
  - them `scheme` va `jsEngine`
  - chot `android.permissions` chi gom `android.permission.INTERNET`
  - them `android.blockedPermissions` cho nhom quyen nhay cam hien tai khong dung
  - them `ios.infoPlist.ITSAppUsesNonExemptEncryption=false`
- `scripts/security/validate-product-manifest.mjs`
  - validate manifest scope cho Android/iOS
  - validate direct dependencies nhay cam trong `apps/product-host/package.json`
- `packages/runtime-native/__tests__/product-manifest-policy.spec.ts`
  - contract tests cho policy validator
- Root/package scripts:
  - `pnpm security:manifest`
  - `pnpm --filter @vue-native/product-host manifest:check`

## Chinh sach scope hien tai

### Android

- Duoc phep:
  - `android.permission.INTERNET`
- Bat buoc blocked:
  - camera
  - microphone
  - location
  - contacts
  - media/storage doc-ghi
  - notifications
  - overlay
  - vibration

### iOS

- Khong duoc khai bao cac usage description keys cho sensitive APIs khi chua co feature tuong ung.
- Hien tai chi co 1 gia tri release policy can co:
  - `ITSAppUsesNonExemptEncryption=false`

### Direct dependency guard

- Khong duoc them thang vao `apps/product-host/package.json` cac module can permission review nhu:
  - `expo-camera`
  - `expo-location`
  - `expo-image-picker`
  - `expo-media-library`
  - `expo-notifications`
  - `expo-contacts`
  - `expo-av`

Neu can mo rong scope:
1. cap nhat feature/doc policy nay,
2. cap nhat validator,
3. review privacy text + release checklist truoc khi merge.

## Cach su dung

```bash
pnpm security:manifest
```

Hoac chi validate trong package product host:

```bash
pnpm --filter @vue-native/product-host manifest:check
```

## Scope tiep theo

Feature 11.2 khoa scope manifest/permission o muc repo config + automation.
Cac dau viec con lai cua Phase 11:
- 11.3: Android/iOS release checklist (assets, signing, privacy text, app identifiers)
- 11.4: rollback plan + release notes template
