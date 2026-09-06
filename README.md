# DOLCE AGENT — Targets Structure

A separate example based on `dolceagent-all-actions-colors-05sep2026`. Every requested edit gets its own repository and GitHub Pages URL; previous versions remain unchanged.

## Open the example

Use `?workspace=targets` for the combined Targets view or `?workspace=asins` for ASINs. The standard homepage remains Accounting. MENU → PPC → Targets / ASINs opens the same views. The original Accounting report and all 215 action cells are retained.

## Reference and structure

Read-only reference: [MAIN_KEYWORD](https://docs.google.com/spreadsheets/d/15GDQmpzYvHnZvdnSwH6NNLYuSGUCZmigYev3gntKoSQ/edit#gid=1233007547), inspected through Google Sheets metadata, bounded cell reads and the visible sheet.

The example follows the reference's CAMPAIGN → AD_GROUP → KEYWORD / KEYWORD_ASIN → SEARCH_TERM_KW / SEARCH_TERM_ASIN structure. Record type and name remain frozen while the parent keyword/target, period metrics and target context scroll horizontally. The six record types and the parent keyword/ASIN relationship are explicit.

The performance blocks use the reference order: 30 days, 7 days, 60 days, range and date. Each includes spend, sales, orders, clicks, ACoS, CPC, conversion rate, CTR and impressions. The 30-day block also contains TACoS. The context columns include match, status, bid, SKU, campaign and ad group; Info opens complete names, portfolio, budget and the selected-period metrics.

Expand/collapse controls, keyword/ASIN filtering, search, status filtering and date selection work locally. Search reveals matching children with their ancestors. Parent totals are calculated from filtered search-term records once, and ratios use summed spend, sales, clicks and orders. TACoS stays unavailable because total product sales cannot be assigned to these example targets.

## Data and visual design

There are 60 illustrative rows: 3 campaigns, 9 ad groups, 12 keywords, 6 ASIN targets and 30 search terms. Daily figures cover 8 July–5 September 2026 and support exact date/range aggregation. These fixtures and the B0EXAMP-prefixed ASINs are fictional. The reference sheet's performance records are not copied into the published example, and no live advertising operations are performed.

The site's existing black/white chrome and exact red/green metric colors are preserved; the reference's other colors are not used. Original product images, Accounting metrics, action icons and mobile startup code are unchanged.

## Verification

Run `npm test` and `DOLCE_QA_JSDOM=/path/to/jsdom node --test tests/*.integration.mjs`.

Browser checks cover the combined and ASIN views, collapse/search, all five period blocks, full details, frozen columns during horizontal scrolling and phone/desktop geometry. Physical iPhone testing is not available.
