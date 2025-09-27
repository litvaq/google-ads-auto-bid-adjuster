# Google Ads Auto Bid Adjuster (Manual CPC)

A Google Ads Script that automatically adjusts keyword bids to match the **estimated CPC for Top of Page or First Page**.  
Useful if you run **Manual CPC / eCPC** campaigns but still want bids to follow auction dynamics.

---

## Features

- Adjusts bids up or down based on Google Ads keyword estimates:
  - **Top of Page CPC**
  - **First Page CPC**
- Works with **Manual CPC and eCPC** bidding strategies only.
- Respects min/max bid limits.
- Configurable to:
  - Only increase bids
  - Only decrease bids
  - Or both
- Supports filtering by **campaign names** and/or **labels**.
- Option to include/exclude paused campaigns and ad groups.
- Dry-run mode (`DRY_RUN=true`) for safe testing.

---

## Configuration

All options are set in the `CONFIG` object at the top of the script:

```javascript
const CONFIG = {
  TARGET_POSITION: 'TOP_OF_PAGE', // 'TOP_OF_PAGE' or 'FIRST_PAGE'

  MAX_BID: 20.00,  // maximum bid allowed
  MIN_BID: 0.50,   // minimum bid allowed

  ONLY_INCREASE: false, // true = only increase bids
  ONLY_DECREASE: false, // true = only decrease bids

  CAMPAIGN_NAME_CONTAINS: [], // filter campaigns by name (case-insensitive substring match)
  LABEL_NAME: '',             // filter by label (leave empty for no filter)

  INCLUDE_PAUSED: false, // include paused campaigns/ad groups/keywords?

  DRY_RUN: false // if true, no changes are made (logging only)
};
