# Vercel Deployment Troubleshooting

If you open your Vercel URL and see a **404 Deployment Not Found** page (with an error code such as `DEPLOYMENT_NOT_FOUND`), Vercel is telling you that the domain you are visiting is not pointing at an active build. This usually happens after deleting a deployment, renaming the project, or when a custom domain has not been assigned to the latest production build.

Follow the steps below to recover:

1. **Verify the project ID**
   - Open the [Vercel dashboard](https://vercel.com/dashboard) and click your project.
   - Under **Settings → Git**, confirm the project is connected to the correct GitHub repository and branch.
   - If the project was renamed, copy the new `*.vercel.app` domain from **Settings → Domains**.

2. **Inspect existing domains**
   - Visit **Settings → Domains** and make sure each domain listed shows a green check next to the latest production deployment.
   - Remove any domain entries that show `Not found` so Vercel stops routing traffic to a deleted build.

3. **Trigger a fresh deployment**
   - Push your latest changes to the branch that Vercel watches (usually `main`).
   - Or, redeploy manually from the dashboard via **Deployments → Redeploy**.
   - The new build will receive a fresh deployment ID; copy the updated preview/production URL if you share links externally.

4. **Optional: Re-link the local CLI**
   - If you deploy from the CLI, run `npx vercel link` inside this repository to re-associate the project, then `npx vercel --prod` to publish a new build.

5. **Wait for propagation**
   - DNS changes (especially for custom domains) can take a few minutes. While propagating, the old deployment ID may still resolve to the 404 page.

Once the domain points at an active deployment, the 404 screen disappears and the SPA assets served from the `dist/` build will load as expected.
