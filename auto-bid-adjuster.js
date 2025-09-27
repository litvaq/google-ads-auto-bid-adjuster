/********************  CONFIGURATION  ************************/
const CONFIG = {
  // Which estimate to use as target:
  // 'TOP_OF_PAGE' or 'FIRST_PAGE'
  TARGET_POSITION: 'TOP_OF_PAGE',

  // Bid limits (in account currency)
  MAX_BID: 20.00,     // do not bid higher than this
  MIN_BID: 0.50,      // do not bid lower than this (set 0 if no minimum)

  // Behavior flags
  ONLY_INCREASE: false, // true = only increase bids
  ONLY_DECREASE: false, // true = only decrease bids

  // Scope (leave empty if not needed)
  CAMPAIGN_NAME_CONTAINS: [], // e.g. ['Brand', 'Search Campaign']
  LABEL_NAME: '',             // e.g. 'AutoBids'; if empty — no label filtering

  // Include paused entities?
  INCLUDE_PAUSED: false, // default: work only with ENABLED

  // Dry run (no changes applied, just logs)
  DRY_RUN: false
};
/**************************************************************/

function main() {
  validateConfig();

  let sel = AdsApp.keywords();

  // Status filters
  if (!CONFIG.INCLUDE_PAUSED) {
    sel = sel
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdGroupStatus = ENABLED")
      .withCondition("Status = ENABLED");
  } else {
    sel = sel.withCondition("Status != REMOVED");
  }

  // Filter by campaign names
  if (CONFIG.CAMPAIGN_NAME_CONTAINS.length > 0) {
    const ors = CONFIG.CAMPAIGN_NAME_CONTAINS
      .map(s => `CampaignName CONTAINS_IGNORE_CASE '${escapeQuotes(s)}'`)
      .join(" OR ");
    sel = sel.withCondition("(" + ors + ")");
  }

  // Filter by label
  if (CONFIG.LABEL_NAME && CONFIG.LABEL_NAME.trim() !== '') {
    sel = sel.withCondition(`LabelNames CONTAINS_ANY ['${escapeQuotes(CONFIG.LABEL_NAME.trim())}']`);
  }

  const it = sel.get();

  let checked = 0, changed = 0, skipped = 0;

  while (it.hasNext()) {
    const kw = it.next();
    checked++;

    const b = kw.bidding();
    if (!b) { skipped++; continue; }
    if (kw.getCampaign().getBiddingStrategyType &&
        !isManualBidding(kw.getCampaign().getBiddingStrategyType())) {
      skipped++;
      continue;
    }

    const current = b.getCpc();
    const estimate = getEstimate(kw, CONFIG.TARGET_POSITION);

    if (!estimate || estimate <= 0) { skipped++; continue; }

    let targetBid = clamp(estimate, CONFIG.MIN_BID, CONFIG.MAX_BID);

    // Behavior modes
    if (CONFIG.ONLY_INCREASE && targetBid <= current) { skipped++; continue; }
    if (CONFIG.ONLY_DECREASE && targetBid >= current) { skipped++; continue; }

    // Skip if equal
    const roundedTarget = round2(targetBid);
    const roundedCurrent = round2(current);
    if (roundedTarget === roundedCurrent) { skipped++; continue; }

    logChange(kw, current, roundedTarget, estimate);

    if (!CONFIG.DRY_RUN) {
      b.setCpc(roundedTarget);
    }

    changed++;
  }

  Logger.log(`Checked: ${checked}, Changed: ${changed}, Skipped: ${skipped}, DRY_RUN=${CONFIG.DRY_RUN}`);
}

/*************** helpers ****************/

function getEstimate(kw, mode) {
  // Available methods:
  // getFirstPageCpc(), getTopOfPageCpc()
  if (mode === 'TOP_OF_PAGE') {
    return kw.getTopOfPageCpc();
  } else if (mode === 'FIRST_PAGE') {
    return kw.getFirstPageCpc();
  }
  throw new Error("Unsupported TARGET_POSITION: " + mode);
}

function isManualBidding(strategyType) {
  // Allow Manual CPC and eCPC
  return String(strategyType).indexOf('MANUAL_CPC') !== -1;
}

function clamp(v, min, max) {
  if (max != null) v = Math.min(v, max);
  if (min != null) v = Math.max(v, min);
  return v;
}

function round2(n) { return Math.round(n * 100) / 100; }

function escapeQuotes(s) { return s.replace(/'/g, "\\'"); }

function logChange(kw, from, to, estimate) {
  Logger.log(
    `[${kw.getCampaign().getName()} > ${kw.getAdGroup().getName()}] ` +
    `KW="${kw.getText()}" | current=${from} -> new=${to} (estimate=${round2(estimate)})`
  );
}

function validateConfig() {
  if (CONFIG.ONLY_INCREASE && CONFIG.ONLY_DECREASE) {
    throw new Error('ONLY_INCREASE and ONLY_DECREASE cannot be both true.');
  }
  if (!['TOP_OF_PAGE', 'FIRST_PAGE'].includes(CONFIG.TARGET_POSITION)) {
    throw new Error('TARGET_POSITION must be TOP_OF_PAGE or FIRST_PAGE.');
  }
}
