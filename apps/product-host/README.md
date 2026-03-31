# Vue Native Product Host

App production baseline cho Vue Native — không phụ thuộc debug panels hay sandbox UI.

## Cấu trúc

```
apps/product-host/
├── index.js                    # Expo entry point
├── src/
│   ├── main.jsx                # Bootstrap mỏng
│   ├── ProductHost.jsx         # Production host (no debug)
│   ├── AppRoot.vue             # Root Vue component
│   ├── hostTransport.ts        # Host-agnostic transport factory
│   ├── reactNativeHostTransport.ts # React Native transport impl (isolated)
│   ├── runtimeNativeTransport.ts   # Backward-compatible re-export
│   ├── productRuntimeSession.ts # Host-agnostic runtime bootstrap session
│   ├── dualHostAppRootRunner.ts # Dual-host runner for the same AppRoot.vue
│   ├── shims-vue.d.ts          # Type support for *.vue modules
│   ├── components/             # Reusable UI components
│   │   └── NavTabs.vue
│   ├── pages/                  # Screen-level components
│   │   ├── HomePage.vue
│   │   └── AboutPage.vue
│   └── composables/            # Shared state/logic
│       └── useAppState.ts
├── metro.config.cjs            # Metro + Vue transformer
├── babel.config.cjs
├── vue-transformer.cjs         # Vue SFC compiler wrapper
├── tsconfig.json
├── app.json
└── package.json
```

## Khác biệt với Sandbox

| Sandbox | Product Host |
|---------|-------------|
| Debug overlay, mutation log | Không có debug UI |
| Snapshot inspector | Chỉ render Vue tree |
| Nhiều primitives demo | Tối giản, production-ready |
| Dùng cho dev/test | Dùng cho phát hành |

## Host transport mode

- `hostTransport.ts` dùng contract chung `HostMutationTransport` từ `@vue-native/runtime-native`.
- `reactNativeHostTransport.ts` chứa toàn bộ phần phụ thuộc `react-native` (NativeModules/event emitter).
- Có thể ép mode khi bootstrap:
	- `react-native`: bắt buộc dùng RN transport
	- `in-memory`: dùng non-RN transport adapter đầu tiên
	- `auto`: ưu tiên RN, fallback in-memory

## Dual host AppRoot runner

- `dualHostAppRootRunner.ts` cung cấp 2 entrypoint:
	- `createAppRootHostRunner(mode)` để mount cùng `AppRoot.vue` theo mode chỉ định.
	- `runAppRootDualHostSnapshotCheck()` để chạy snapshot check tuần tự qua `in-memory` và `auto`.
	- `runAppRootDualHostParitySmokeCheck()` để normalize snapshot và assert parity sâu giữa các host mode.

## Runtime session contract

- `productRuntimeSession.ts` dùng `createHostRuntimeSession` từ runtime package.
- Có thể truyền scheduler/lifecycle hooks để kiểm soát phase chạy:
	- `mount`
	- `snapshot`
	- `emit-event`
	- `unmount`

## Phát triển

```bash
# Cài dependencies
pnpm install

# Chạy dev
pnpm --filter @vue-native/product-host start

# Build Android
pnpm --filter @vue-native/product-host android

# Type check
pnpm --filter @vue-native/product-host typecheck
```

## Thêm màn hình mới

1. Tạo file `.vue` trong `src/pages/YourPage.vue`
2. Import vào `AppRoot.vue`
3. Thêm tab vào `NavTabs.vue`
4. Chạy `pnpm dev:product` để preview
