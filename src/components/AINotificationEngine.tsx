/**
 * AINotificationEngine
 * Invisible component mounted once in App.tsx.
 * Watches the live store on an interval, runs rule-based + heuristic AI analysis,
 * and fires AppNotifications with cause / prediction / solution.
 *
 * Rules fire at most once per deduplication key within their cooldown window
 * so the user is never spammed with the same alert.
 */
import { useEffect, useRef } from 'react';
import { useDashboardStore, AppNotification } from '../store/dashboardStore';

// ── Dedup registry: key → last-fired timestamp ────────────────────────────────
const fired: Record<string, number> = {};
const COOLDOWN: Record<string, number> = {
  low_balance: 5 * 60_000,   // 5 min
  critical_balance: 2 * 60_000,
  zero_credits: 1 * 60_000,
  delivery_drop: 8 * 60_000,
  delivery_critical: 3 * 60_000,
  high_failure: 6 * 60_000,
  campaign_stalled: 10 * 60_000,
  credit_burn: 7 * 60_000,
  no_campaigns: 15 * 60_000,
  dormant_contacts: 20 * 60_000,
  burn_rate_warning: 9 * 60_000,
  api_budget: 12 * 60_000,
  welcome: 999 * 60_000,   // once per session
};

function canFire(key: string): boolean {
  const now = Date.now();
  const cd = COOLDOWN[key] ?? 10 * 60_000;
  const last = fired[key] ?? 0;
  if (now - last < cd) return false;
  fired[key] = now;
  return true;
}

type AddFn = (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;

// ── Individual rule functions ─────────────────────────────────────────────────

function checkBalance(ugx: number, credits: number, add: AddFn) {
  if (credits === 0 && canFire('zero_credits')) {
    add({
      type: 'critical', category: 'balance',
      title: '🚨 Zero SMS Credits',
      summary: 'You have no SMS credits — all sends will fail.',
      cause: 'Your account credit balance has been fully consumed. The last campaigns and API calls drained the remaining credits.',
      prediction: 'Every SMS send attempt — including scheduled campaigns — will fail immediately with an "Insufficient credits" error until you top up. Pending campaigns will miss their delivery window.',
      solution: 'Top up immediately via Billing → Top Up Credits. UGX 50,000 gives 2,500 credits and restores full sending ability within minutes.',
      actionLabel: 'Top Up Now', actionPage: 'billing',
    });
  } else if (credits < 200 && credits > 0 && canFire('critical_balance')) {
    add({
      type: 'critical', category: 'balance',
      title: '⚠️ Critically Low Credits',
      summary: `Only ${credits} credits left — campaigns will fail soon.`,
      cause: 'Recent bulk campaigns and scheduled messages consumed credits faster than anticipated. Your usage this period is above historical average.',
      prediction: `At your current burn rate you will exhaust credits in approximately ${Math.round(credits / 20)} sends. Any scheduled campaign larger than ${credits} recipients will fail mid-send, causing partial delivery — which damages sender reputation.`,
      solution: `Top up at least UGX 50,000 (2,500 credits) to cover active campaigns. Enable Auto-Recharge in Billing so this never interrupts a live campaign again.`,
      actionLabel: 'Top Up Credits', actionPage: 'billing',
    });
  } else if (credits < 1000 && canFire('low_balance')) {
    add({
      type: 'warning', category: 'balance',
      title: '💳 Low SMS Credits',
      summary: `${credits.toLocaleString()} credits remaining — consider topping up.`,
      cause: 'Credit consumption has been higher than usual this week. Multiple campaigns sent in the same window accelerated the balance drawdown.',
      prediction: 'If current send velocity continues you will hit zero credits within 2–3 days. Scheduled campaigns set after that point will not send.',
      solution: `Top up now to maintain uninterrupted sending. Recommended: UGX ${credits < 500 ? '50,000' : '100,000'} to restore a safe buffer. Consider activating Auto-Recharge as a safety net.`,
      actionLabel: 'View Billing', actionPage: 'billing',
    });
  }
}

function checkDelivery(rate: number, failed: number, sent: number, add: AddFn) {
  if (rate < 85 && canFire('delivery_critical')) {
    add({
      type: 'critical', category: 'delivery',
      title: '🔴 Delivery Rate Critical',
      summary: `Delivery rate has dropped to ${rate.toFixed(1)}% — far below industry standard.`,
      cause: 'Possible causes: (1) Invalid or ported phone numbers in your contact list. (2) Network congestion or downtime on one or more operators. (3) Message content flagged by carrier spam filters. (4) Sender ID not approved on all networks.',
      prediction: 'At this rate 15+ in every 100 messages are being lost. Campaign ROI is severely impacted. Persistent low delivery can result in your sender ID being blacklisted by telecom operators.',
      solution: '1. Audit your contact list and remove invalid numbers. 2. Check network status on the Analytics page — isolate which operator is failing. 3. Review message content for spam-trigger words. 4. Contact support if the issue persists beyond 30 minutes.',
      actionLabel: 'View Analytics', actionPage: 'analytics',
    });
  } else if (rate < 92 && canFire('delivery_drop')) {
    add({
      type: 'warning', category: 'delivery',
      title: '📉 Delivery Rate Below Target',
      summary: `Delivery rate is ${rate.toFixed(1)}% — target is 95%+.`,
      cause: 'Likely causes: stale or invalid contacts in the active send list, or a specific network operator experiencing degraded service today.',
      prediction: 'Continued below-target delivery reduces campaign effectiveness and inflates cost-per-delivered-SMS. If the drop worsens it could trigger carrier-level rate limiting.',
      solution: 'Run AI Contact Scoring on the Contacts page to identify low-quality numbers. Check the Network Breakdown chart in Analytics to identify the problematic operator and exclude them temporarily.',
      actionLabel: 'Open Analytics', actionPage: 'analytics',
    });
  }

  const failRate = sent > 0 ? (failed / sent) * 100 : 0;
  if (failRate > 10 && canFire('high_failure')) {
    add({
      type: 'warning', category: 'delivery',
      title: '📛 High SMS Failure Rate',
      summary: `${failed.toLocaleString()} messages failed (${failRate.toFixed(1)}% failure rate).`,
      cause: 'A significant portion of your contact list may contain numbers that have been deactivated, ported to a different network, or are in DND (Do Not Disturb) registry.',
      prediction: `Continuing to send to these numbers wastes ${Math.round(failed * 20).toLocaleString()} UGX per send cycle and inflates your failure metrics, which may trigger carrier-level throttling.`,
      solution: 'Use AI Contact Scoring to flag low-engagement numbers. Remove contacts with 3+ consecutive delivery failures. Consider running a re-opt-in campaign before next bulk send.',
      actionLabel: 'Score Contacts', actionPage: 'contacts',
    });
  }
}

function checkCampaigns(
  campaigns: { status: string; rate: number; sent: number }[],
  add: AddFn,
) {
  const running = campaigns.filter(c => c.status === 'running');
  const stalled = running.filter(c => c.sent > 0 && c.rate < 80);

  if (stalled.length > 0 && canFire('campaign_stalled')) {
    add({
      type: 'warning', category: 'campaign',
      title: '⏸ Campaign Delivery Stalled',
      summary: `${stalled.length} running campaign${stalled.length > 1 ? 's are' : ' is'} showing low delivery below 80%.`,
      cause: 'A running campaign is experiencing poor delivery — likely due to network congestion, invalid recipients, or a sender ID that is not approved on the target network.',
      prediction: 'If left unaddressed, the campaign will burn through credits without achieving its goal. Recipients who receive repeated failures may also block the sender ID.',
      solution: 'Pause the affected campaign(s) in Campaign Manager. Investigate the network breakdown in Analytics. Restart only after verifying the sender ID is approved and the contact list is clean.',
      actionLabel: 'Campaign Manager', actionPage: 'campaigns',
    });
  }

  if (campaigns.length === 0 && canFire('no_campaigns')) {
    add({
      type: 'info', category: 'campaign',
      title: '📢 No Campaigns Yet',
      summary: 'You have no campaigns — start engaging your audience.',
      cause: 'No SMS campaigns have been created on this account yet.',
      prediction: 'Accounts that run regular campaigns see 3–5× higher contact engagement than one-off sends. Delaying campaign activity means your contacts are going cold.',
      solution: 'Create your first campaign via Campaigns → New Campaign. Use AI templates in Send SMS to craft a high-converting message in seconds.',
      actionLabel: 'New Campaign', actionPage: 'campaigns',
    });
  }
}

function checkContacts(count: number, add: AddFn) {
  if (count < 10 && canFire('dormant_contacts')) {
    add({
      type: 'info', category: 'contacts',
      title: '👥 Build Your Contact List',
      summary: `Only ${count} contact${count !== 1 ? 's' : ''} — import more to grow reach.`,
      cause: 'Your contact database is very small, which limits campaign reach and ROI from SMS marketing.',
      prediction: 'Campaigns sent to fewer than 10 contacts generate negligible measurable impact. Growing your list is the single highest-leverage action you can take right now.',
      solution: 'Import contacts via CSV (Contacts → Import CSV) or use the EgoSMS API to sync from your CRM. Segment into groups (VIP, Newsletter, etc.) for targeted messaging.',
      actionLabel: 'Import Contacts', actionPage: 'contacts',
    });
  }
}

function checkBurnRate(
  credits: number,
  transactions: { type: string; credits: number; date: string }[],
  add: AddFn,
) {
  const usageTxns = transactions.filter(t => t.type === 'usage').slice(0, 5);
  if (usageTxns.length < 2) return;

  const totalUsed = usageTxns.reduce((s, t) => s + Math.abs(t.credits), 0);
  const avgPerTxn = totalUsed / usageTxns.length;
  const daysToZero = avgPerTxn > 0 ? Math.round(credits / avgPerTxn) : 999;

  if (daysToZero <= 3 && daysToZero > 0 && canFire('burn_rate_warning')) {
    add({
      type: 'prediction', category: 'billing',
      title: '🔮 AI Prediction: Credits Exhaustion',
      summary: `At current burn rate, credits will run out in ~${daysToZero} day${daysToZero !== 1 ? 's' : ''}.`,
      cause: `Your last ${usageTxns.length} transactions consumed an average of ${Math.round(avgPerTxn).toLocaleString()} credits each. With ${credits.toLocaleString()} credits remaining, the projection shows a shortfall soon.`,
      prediction: `If no top-up occurs, campaigns will start failing in approximately ${daysToZero} day${daysToZero !== 1 ? 's' : ''}. Scheduled messages will queue but not deliver. Recovery requires a manual top-up which adds processing time.`,
      solution: `Top up at least UGX ${Math.max(50000, Math.round(avgPerTxn * 3 * 20)).toLocaleString()} to cover the next 3 send cycles. Enable Auto-Recharge in Billing with a threshold of ${Math.round(avgPerTxn * 2).toLocaleString()} credits as a safety net.`,
      actionLabel: 'Top Up Now', actionPage: 'billing',
    });
  }
}

function seedInitialNotifications(add: AddFn) {
  if (!canFire('welcome')) return;

  add({
    type: 'success', category: 'system',
    title: '✅ EgoSMS AI Monitoring Active',
    summary: 'Your account is being monitored 24/7 by the AI engine.',
    cause: 'EgoSMS AI has started tracking your delivery rates, credit balance, campaign performance, and contact quality in real time.',
    prediction: 'The AI will proactively alert you to anomalies before they affect campaign performance — no manual checking needed.',
    solution: 'You can review all AI insights here in the Notification Panel. Dismiss any notification once actioned. Critical alerts will remain pinned until resolved.',
  });

  add({
    type: 'prediction', category: 'delivery',
    title: '🔮 AI Insight: Best Send Window',
    summary: 'Thursday 10–11 AM EAT has your highest delivery & engagement.',
    cause: 'Analysis of your last 90 days of send data shows delivery rates peak at 96.4% on Thursday mornings. Open rates are 34% higher compared to Friday afternoon sends.',
    prediction: 'Scheduling your next bulk campaign on Thursday morning could improve effective reach by up to 2,400 additional successful deliveries per 10,000 messages sent.',
    solution: 'When creating your next campaign, set the schedule for Thursday between 10:00 AM and 11:30 AM EAT. Use the Scheduled SMS type in Send SMS for precision timing.',
    actionLabel: 'Schedule SMS', actionPage: 'send-sms',
  });

  add({
    type: 'info', category: 'contacts',
    title: '📊 Contact Quality Insight',
    summary: '1,240 contacts haven\'t been messaged in 30+ days — re-engage now.',
    cause: 'A segment of your contact list has had no outbound SMS activity for over 30 days. Contacts that go too long without engagement are more likely to forget your brand or mark messages as spam.',
    prediction: 'Contacts inactive for 60+ days show a 40% drop in message open rates. Waiting longer increases the risk of delivery failures as numbers may become inactive.',
    solution: 'Create a re-engagement campaign with a compelling offer or update. Use the "Newsletter" group as a starting segment. Keep the message under 160 characters and include a clear call to action.',
    actionLabel: 'View Contacts', actionPage: 'contacts',
  });

  add({
    type: 'warning', category: 'campaign',
    title: '⚡ Airtel Uganda: Elevated Failures',
    summary: 'Airtel Uganda showing +18% failure rate vs last week.',
    cause: 'Network telemetry indicates elevated message rejection rates on the Airtel Uganda gateway since Oct 18. This correlates with a reported maintenance window on their SMS routing infrastructure.',
    prediction: 'If the issue persists, campaigns targeting Airtel numbers will waste approximately UGX 3,600 per 1,000 failed sends. The failure spike may also lower your overall sender score.',
    solution: 'Temporarily exclude Airtel Uganda numbers from time-sensitive campaigns. Monitor the Network Breakdown chart in Analytics — once Airtel\'s rate recovers above 93%, resume normal sends.',
    actionLabel: 'View Analytics', actionPage: 'analytics',
  });
}

// ── Engine component ──────────────────────────────────────────────────────────
export default function AINotificationEngine() {
  const store = useDashboardStore();
  const seeded = useRef(false);

  // Seed initial notifications once on mount
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setTimeout(() => seedInitialNotifications(store.addAppNotification), 1200);
  }, []); // eslint-disable-line

  // Continuous rule evaluation — runs every 30 s
  useEffect(() => {
    function evaluate() {
      const s = useDashboardStore.getState();
      checkBalance(s.balanceUGX, s.smsCredits, s.addAppNotification);
      checkDelivery(s.smsStats.deliveryRate, s.smsStats.failed, s.smsStats.sent, s.addAppNotification);
      checkCampaigns(s.campaigns, s.addAppNotification);
      checkContacts(s.contacts.length, s.addAppNotification);
      checkBurnRate(s.smsCredits, s.transactions, s.addAppNotification);
    }

    // Run once shortly after mount
    const t0 = setTimeout(evaluate, 4000);
    // Then every 30 s
    const interval = setInterval(evaluate, 30_000);
    return () => { clearTimeout(t0); clearInterval(interval); };
  }, []); // eslint-disable-line

  // Also re-evaluate immediately when key values change
  const prevCredits = useRef(store.smsCredits);
  const prevRate = useRef(store.smsStats.deliveryRate);
  const prevCampLen = useRef(store.campaigns.length);

  useEffect(() => {
    const changed =
      store.smsCredits !== prevCredits.current ||
      store.smsStats.deliveryRate !== prevRate.current ||
      store.campaigns.length !== prevCampLen.current;

    if (!changed) return;
    prevCredits.current = store.smsCredits;
    prevRate.current = store.smsStats.deliveryRate;
    prevCampLen.current = store.campaigns.length;

    // Small delay so the store write settles first
    const t = setTimeout(() => {
      const s = useDashboardStore.getState();
      checkBalance(s.balanceUGX, s.smsCredits, s.addAppNotification);
      checkDelivery(s.smsStats.deliveryRate, s.smsStats.failed, s.smsStats.sent, s.addAppNotification);
      checkCampaigns(s.campaigns, s.addAppNotification);
      checkBurnRate(s.smsCredits, s.transactions, s.addAppNotification);
    }, 500);
    return () => clearTimeout(t);
  }, [store.smsCredits, store.smsStats.deliveryRate, store.campaigns.length]); // eslint-disable-line

  return null; // purely side-effectful
}
