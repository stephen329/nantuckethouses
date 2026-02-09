# Meta (Facebook) Market Updates

The app can generate **market update posts** from Repliers MLS data and optionally **publish them to your Facebook Page**.

## How it works

- Data comes from your existing Repliers-backed APIs: **market-stats** (active listings, median list price, days on market) and **market-insights** (trend/anomaly narratives).
- A short, post-ready message is built and returned (or posted to Meta if credentials are set).

## API

| Method | Endpoint | Description |
|--------|----------|--------------|
| **GET** | `/api/meta-market-update` | Returns `{ postText, stats, insights }`. Use to **preview** or copy-paste. Does not post. |
| **POST** | `/api/meta-market-update` | Same data → builds post text, then **posts to your Facebook Page** if `META_PAGE_ID` and `META_PAGE_ACCESS_TOKEN` are set. Returns `{ success, posted, postId?, postText }`. |

## Environment variables

Add to `.env.local` (or your host’s env):

| Variable | Required to post | Description |
|----------|------------------|-------------|
| `META_PAGE_ID` | Yes | Your Facebook **Page** ID (numeric). |
| `META_PAGE_ACCESS_TOKEN` | Yes | A **Page** access token with `pages_manage_posts` (and usually `pages_read_engagement`). |

- **GET** works with no Meta env vars (it only builds the post from Repliers data).
- **POST** will still return the generated `postText` if Meta vars are missing; it will set `posted: false` and a message that credentials are not configured.

## Getting a Page access token

1. **Meta for Developers**: [developers.facebook.com](https://developers.facebook.com) → create or use an app.
2. **Add Facebook Login** and request permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`.
3. Use the **Graph API Explorer** or your app’s “Generate Token” to get a **User** access token with those permissions.
4. **Exchange for a Page token**:  
   `GET https://graph.facebook.com/v21.0/me/accounts?access_token={user_token}`  
   Response includes `id` (Page ID) and `access_token` (Page access token). Use the **Page** `access_token` as `META_PAGE_ACCESS_TOKEN` and the Page `id` as `META_PAGE_ID`.
5. Prefer a **long-lived** Page token so you don’t have to re-auth often (see [Meta access token docs](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)).

## Example: preview (no Meta credentials)

```bash
curl "https://your-domain.com/api/meta-market-update"
```

Response:

```json
{
  "postText": "Nantucket market update: 42 active listings on the island, median list price $3.2M. Median sold price is up 5.2% year-over-year for the same three-month period. Data via Repliers MLS. https://nantuckethouses.com",
  "stats": { "activeListingCount": 42, "medianListPrice": 3200000, "medianDaysOnMarket": 78 },
  "insights": [ ... ]
}
```

## Example: post to Facebook

```bash
curl -X POST "https://your-domain.com/api/meta-market-update"
```

With `META_PAGE_ID` and `META_PAGE_ACCESS_TOKEN` set, response:

```json
{
  "success": true,
  "posted": true,
  "postId": "123456789_987654321",
  "postText": "Nantucket market update: ..."
}
```

You can call **POST** from a cron job (e.g. weekly) or a “Post to Facebook” button in an internal tool. **Do not** expose the route publicly without auth if the token is in env; consider protecting it with a secret header or server-side only (e.g. Vercel cron with `CRON_SECRET`).
