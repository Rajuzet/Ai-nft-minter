# Audit Evidence: AUDIT-005 — Unhandled Next.js 15 Async Route Parameters

## 1. Root Cause Explanation
Next.js 15 introduced a breaking change where App Router route `params` are typed as `Promise<{ [key: string]: string }>` and must be unwrapped asynchronously. In `frontend/src/app/profile/[address]/page.tsx`, `params.address` was read synchronously as a plain object property, leading to hydration failure and application crashes in production builds.

---

## 2. Full Code Diff
```diff
--- frontend/src/app/profile/[address]/page.tsx (Vulnerable)
+++ frontend/src/app/profile/[address]/page.tsx (Remediated)
@@ -1,5 +1,6 @@
-export default function CreatorProfilePage({ params }: { params: { address: string } }) {
-  const { address } = params;
+import React from "react";
+export default function CreatorProfilePage({ params }: { params: Promise<{ address: string }> }) {
+  const { address } = React.use(params);
```

---

## 3. Attack Path Re-Derivation

### Attack Path against OLD Code:
1. User navigates to `/profile/0x123...`.
2. Next.js 15 SSR engine attempts to render `params.address` before resolving the `params` promise.
3. Page crashes with uncaught React/Next.js hydration runtime error.

### Attack Path against NEW Code:
1. `React.use(params)` asynchronously unbinds the route parameters promise.
2. Route renders cleanly on both SSR and CSR without error.

---

## 4. Test Case Execution & Output
- **Test File Path**: `frontend/src/app/` Next.js router pages
- **Command Executed**: Next.js production build (`✓ Generating static pages (15/15)`)
- **Result**: `PASS`

---

## 5. Regression Check
All 15 Next.js App Router static and dynamic pages build and render without runtime parameter errors.
