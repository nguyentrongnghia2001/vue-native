# Phase 11 / Feature 11.1 - Security Baseline

## Muc tieu

Thiet lap baseline bao mat co the chay duoc trong workspace de giam rui ro truoc release:
- Dependency audit theo nguong muc do nghiem trong.
- Secret leak scan tren tracked files.
- Chinh sach ro rang cho network va storage.

## Artifacts da them

- `scripts/security/dependency-audit.mjs`
- `scripts/security/check-secrets.mjs`
- Root scripts trong `package.json`:
  - `pnpm security:audit`
  - `pnpm security:secrets`
  - `pnpm security:baseline`
- Hardening `.gitignore`:
  - bo qua `.env*` (giu lai `.env.example`)
  - bo qua signing artifacts (`*.keystore`, `*.jks`, `*.p12`, `*.mobileprovision`)
  - bo qua local security reports (`reports/security/`)

## Cach su dung

Chay dependency audit (mac dinh `audit-level=high`, chi production deps):

```bash
pnpm security:audit
```

Tuy chon:

```bash
pnpm security:audit -- --level critical
pnpm security:audit -- --include-dev
```

Chay secret scan:

```bash
pnpm security:secrets
```

Chay full baseline:

```bash
pnpm security:baseline
```

## Policy - Dependency Audit

- Chay toi thieu:
  - truoc moi release candidate.
  - dinh ky hang tuan trong CI.
- Gate de xuat:
  - fail neu co vulnerability tu `high` tro len.
- Neu can tam thoi chap nhan risk:
  - ghi ly do, owner va deadline xu ly trong release notes noi bo.

## Policy - Secret Handling

- Khong commit secret that vao repo.
- Bien moi truong local phai dat trong `.env.local` hoac file `.env.*` khong track.
- Chi commit `.env.example` de mo ta contract bien moi truong.
- Signing keys/chung chi phai dat trong CI secret vault, khong dat trong workspace.
- Secret scan can duoc chay truoc khi mo PR release.

## Policy - Network

- Chi cho phep outbound requests den endpoints da duoc allowlist theo moi truong (`dev/staging/prod`).
- Bat buoc HTTPS cho moi API call production.
- Khong hardcode API keys/tokens trong source code.
- Log/telemetry phai redact thong tin nhay cam (token, auth header, user secret).

## Policy - Storage

- Phan loai data truoc khi luu:
  - public: co the cache binh thuong.
  - internal: can TTL + cleanup policy.
  - sensitive: khong luu plain text trong storage chung.
- Khong luu signing secrets, API keys, access tokens dai han trong app storage.
- Du lieu tam (cache/debug snapshot) phai co co che xoa theo vong doi phat hanh.

## Scope tiep theo

Feature 11.1 chi cung cap baseline automation + policy.
Cac dau viec tiep theo cua Phase 11:
- 11.2: manifest/permission standardization.
- 11.3: Android/iOS release checklist.
- 11.4: rollback plan + release notes template.
