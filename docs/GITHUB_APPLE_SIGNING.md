# PUSH TOTAL — GitHub + Apple web signing setup

No local Node.js, npm, Xcode, or EAS CLI is required for the normal flow below.

## 1. Create an App Store Connect Team API key

In App Store Connect:

1. Open **Users and Access**.
2. Open **Integrations**.
3. Open **Team Keys**.
4. Generate a new API key named `PUSH TOTAL GitHub`.
5. Give the key **Admin** access so EAS can create/repair signing credentials when CI needs it.
6. Download the `.p8` private key immediately. Apple allows the private key to be downloaded only once.
7. Record the **Key ID** and **Issuer ID** shown by App Store Connect.

If App Store Connect shows **Request Access** instead of Team Keys, the Account Holder must request App Store Connect API access first.

## 2. Find the Apple Team ID and team type

In Apple Developer, open **Membership details** and copy the 10-character **Team ID**.

Use one of these exact team type values for Expo:

- `INDIVIDUAL`
- `COMPANY_OR_ORGANIZATION`
- `IN_HOUSE`

Normal personal Apple Developer Program memberships use `INDIVIDUAL`.

## 3. Add GitHub repository secrets

Repository: `kimjaehyeon221/baemilgi2000`

Open **Settings → Secrets and variables → Actions → Secrets → New repository secret**.

Keep the existing `EXPO_TOKEN`. Add these five secrets:

| Secret name | Value |
| --- | --- |
| `APPLE_ASC_API_KEY_P8` | Entire contents of the downloaded `.p8` file, including the BEGIN/END PRIVATE KEY lines |
| `APPLE_ASC_KEY_ID` | App Store Connect Key ID |
| `APPLE_ASC_ISSUER_ID` | App Store Connect Issuer ID |
| `APPLE_TEAM_ID` | Apple Developer 10-character Team ID |
| `APPLE_TEAM_TYPE` | One exact value from the list above |

Never commit the `.p8` file to GitHub. The GitHub workflow writes it only to the temporary GitHub Actions runner at build time.

## 4. Connect the GitHub repository to the EAS project once

On expo.dev:

1. Open `@magpie221/push-total`.
2. Open **Project settings → GitHub**.
3. Connect repository `kimjaehyeon221/baemilgi2000`.

This connection is needed only for the browser-based iPhone registration EAS Workflow. Normal GitHub Actions builds use `EXPO_TOKEN` directly.

## 5. Register the iPhone without a local CLI

On GitHub:

1. Open **Actions**.
2. Select **Push Total Register iPhone**.
3. Click **Run workflow** and select branch `push-total-rc`.
4. Open the EAS URL printed in the workflow summary.
5. On the EAS workflow page, follow the QR / device enrollment flow on the iPhone.
6. Install the temporary Apple profile in iPhone Settings when prompted.
7. Return to the EAS workflow page and approve the device registration.

## 6. Build the installable preview

After the iPhone is registered:

1. GitHub → **Actions**.
2. Select **Push Total Preview Build**.
3. Click **Run workflow** on `push-total-rc`.

The workflow uses the ASC API key and automatically refreshes the ad hoc provisioning profile before queuing the EAS build.

## 7. Production build

When the sensor accuracy and UI are approved:

1. GitHub → **Actions**.
2. Select **Push Total Production Build**.
3. Click **Run workflow** on `push-total-rc`.

This queues the App Store distribution build on EAS. Production is intentionally manual so an ordinary code push cannot accidentally create a store build.
