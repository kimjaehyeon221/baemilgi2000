# PUSH TOTAL — Public support site

The private app repository remains the source of truth for release copy and policy content. A public mirror is published in the user's existing public GitHub repository so App Store reviewers and users can access the documents without authentication.

## Public App Store URLs
- Landing: https://github.com/kimjaehyeon221/web1/tree/main/push-total
- Support: https://github.com/kimjaehyeon221/web1/blob/main/push-total/SUPPORT.md
- Privacy Policy: https://github.com/kimjaehyeon221/web1/blob/main/push-total/PRIVACY.md
- Support contact channel: https://github.com/kimjaehyeon221/web1/issues/new

These URLs were verified from an unauthenticated GitHub Actions runner on September 1, 2026.

## Private source of truth
- `docs/PUSH_TOTAL_APP_STORE_COPY.md`
- `docs/APP_REVIEW_NOTES.md`
- `docs/support.html`
- `docs/privacy.html`
- `PRIVACY.md`

## Public mirror
- `kimjaehyeon221/web1/push-total/README.md`
- `kimjaehyeon221/web1/push-total/SUPPORT.md`
- `kimjaehyeon221/web1/push-total/PRIVACY.md`

## Update rule
1. Update the private source of truth in `baemilgi2000` first.
2. Mirror the user-facing support/privacy changes to `kimjaehyeon221/web1/push-total/`.
3. Verify the public URLs without authentication.
4. If a public URL changes, update App Store Connect before submitting a new version.

## Vercel note
A temporary Vercel deployment was tested but was protected by Vercel Authentication and therefore is **not** used by App Store Connect. Do not point App Review metadata at the protected Vercel URL.
