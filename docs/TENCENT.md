# Tencent Cloud deployment

## Recommended split

- **CloudBase static website hosting**: China-accessible web mirror of the single-file game.
- **COS + CDN**: large assets for the future WeChat Mini Game (main package must stay under 4 MB).
- **GitHub remains the source of truth**; Tencent is only a delivery target.

## Free quota reality

- CloudBase static hosting: new-user quota is approximately **1 GB storage + 5 GB traffic for one month**. It is not permanent.
- COS: personal new-user free tier is **50 GB standard storage for 6 months**; requests, egress traffic, and CDN traffic are billed separately.

For a 10 MB page, 5 GB traffic is roughly 500 full first loads. Watch traffic if the link is shared widely.

## First deployment: CloudBase console

1. Register/login to Tencent Cloud and complete real-name verification.
2. Open CloudBase: https://tcb.cloud.tencent.com/
3. Create an environment:
   - Name: `stellar-assault`
   - Region: Guangzhou or Shanghai
   - Billing: pay-as-you-go (the free quota is applied automatically)
4. Enable **Static website hosting**.
5. Upload `dist/index.html` from the repository root.
6. Open the generated default domain and verify the game loads.

The default CloudBase domain normally works without ICP. A custom domain in mainland China requires ICP filing.

## CLI deployment

Install/login once:

```bash
npx --yes @cloudbase/cli login
```

Then:

```bash
export TCB_ENV_ID=your-env-id
bash tools/deploy_cloudbase.sh
```

`tools/deploy_cloudbase.sh` builds `dist/index.html` if needed, then runs:

```bash
npx --yes @cloudbase/cli hosting deploy dist -e "$TCB_ENV_ID"
```

## Later: COS for Mini Game assets

- Create a COS bucket in Guangzhou/Hong Kong.
- Upload `assets/` (hashed filenames).
- Put a CDN or CloudBase default domain in front.
- Add the HTTPS domain to the WeChat Mini Game `downloadFile` legal-domain list.
- Keep the Mini Game main package under 4 MB; total main + subpackages under 30 MB.

## Security

Use a CAM sub-user rather than root credentials if automation is needed. Grant only CloudBase/COS permissions for the relevant environment/bucket. Never commit SecretId/SecretKey.
