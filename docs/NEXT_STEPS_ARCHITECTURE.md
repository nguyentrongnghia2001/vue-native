# Next-step architecture (vue-native)

Tài liệu này chỉ tập trung vào **bước tiếp theo** cho codebase hiện tại.

## Mục tiêu ngắn hạn

Biến runtime hiện tại từ "in-memory debug renderer" thành nền tảng có thể:

1. định nghĩa host contract ổn định,
2. có bridge mutation rõ ràng,
3. giữ syntax viết component giống Vue web (`setup + template`).

---

## Trạng thái hiện tại (điểm xuất phát)

- `packages/runtime-native/src/renderer.ts`: renderer entry đang hoạt động.
- `packages/runtime-native/src/compiler.ts`: đã có runtime template compiler.
- `packages/runtime-native/src/primitives.ts`: có `View`, `Text`.
- `apps/sandbox/src/AppRoot.ts`: authoring theo template syntax.
- Host đang là tree in-memory + debug ops, chưa có bridge thật.

---

## Phase 1 — Ổn định host contract (ưu tiên cao)

### Mục tiêu

Chuẩn hoá contract giữa Vue patching và host layer để tránh rò rỉ behavior DOM.

### Việc cần làm

1. Chuẩn hóa mapping props/events theo native host:
   - file: `packages/runtime-native/src/patchProp.ts`
   - quyết định rõ key nào vào `props`, key nào vào `eventListeners`.

2. Chuẩn hóa snapshot model:
   - file: `packages/runtime-native/src/types.ts`, `src/host.ts`
   - đảm bảo snapshot đủ thông tin debug nhưng không chứa state dư thừa.

3. Tách debug-op và host-op:
   - file: `packages/runtime-native/src/host.ts`
   - giữ `debugOps` chỉ là instrumentation, không phụ thuộc business flow.

### Output kỳ vọng

- Host contract được mô tả rõ và test được.
- Không còn logic mang hơi hướng DOM trong patch/host.

---

## Phase 2 — Introduce mutation bridge (JS -> Native)

### Mục tiêu

Thay vì chỉ mutate tree in-memory, renderer sẽ phát mutation records qua bridge adapter.

### Việc cần làm

1. Tạo bridge adapter interface:
   - file mới: `packages/runtime-native/src/bridge.ts`
   - ví dụ API: `enqueue(op)`, `flush()`, `setEventDispatcher(fn)`.

2. Chuyển host ops sang emit mutation:
   - file: `packages/runtime-native/src/host.ts`
   - các op `insert/remove/setText/patchProp` phải đi qua bridge queue.

3. Add batching strategy:
   - file: `packages/runtime-native/src/renderer.ts` hoặc `bridge.ts`
   - flush theo tick/frame để tránh chattering.

### Output kỳ vọng

- Có thể thay bridge implementation mà không đổi renderer core.
- Có log mutation batch rõ ràng để debug/perf.

---

## Phase 3 — Mở rộng primitives + authoring experience

### Mục tiêu

Giữ developer experience gần Vue web hơn, đồng thời mở rộng host coverage.

### Việc cần làm

1. Thêm primitives cơ bản:
   - file: `packages/runtime-native/src/primitives.ts`
   - thêm `Image`, `ScrollView`, `Pressable` wrapper.

2. Global register mặc định trong native app:
   - file: `packages/runtime-native/src/nativeApp.ts`
   - đăng ký primitives nhất quán.

3. Chuẩn hoá docs usage trong sandbox:
   - file: `apps/sandbox/src/AppRoot.ts`, `README.md`
   - ví dụ template cho events/styles theo host mapping thực tế.

### Output kỳ vọng

- Viết component native theo syntax Vue web, ít ceremony.
- Sandbox dùng làm reference implementation.

---

## Test strategy cho next steps

Tối thiểu bổ sung test ở `packages/runtime-native/__tests__`:

1. `bridge.spec.ts`
   - assert mutation batch order.

2. `props-events.spec.ts`
   - assert mapping `@press`, `:style`, boolean props.

3. `template-compiler.spec.ts`
   - assert template compile + primitive resolution.

---

## Định nghĩa Done cho milestone tiếp theo

Done khi thoả cả 4 điều kiện:

1. `pnpm test` pass.
2. `pnpm typecheck` pass.
3. Sandbox vẫn render được với template syntax.
4. Mutation flow không còn phụ thuộc debug tree nội bộ.
