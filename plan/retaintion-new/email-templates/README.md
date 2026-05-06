# Email Templates — Dunning + Win-back

Plain-text email templates ready for drop-in once an email provider is integrated. Each file uses `{{variable}}` syntax for substitution. No HTML — plain text outperforms designed emails for both dunning recovery and win-back response (industry consensus).

## Provider integration touchpoints

When you wire up an email provider (recommended: Resend or Postmark for transactional; Customer.io for sequenced campaigns), here's where each template fires:

### Dunning sequence (failed-payment recovery)

Fires on payment failure (RevenueCat webhook → your backend → email provider). Fully native IAP failures are mostly handled by Apple/Google's grace period + retries — these templates target users with web-purchase fallback (if you ship a web flow) and serve as a safety net for missed RevenueCat retries.

| File | Day after failure | Trigger condition |
|---|---|---|
| `dunning-d0.md` | 0 (immediate) | First payment failure |
| `dunning-d3.md` | 3 | Still failing after first auto-retry |
| `dunning-d7.md` | 7 | Approaching subscription pause |
| `dunning-d10.md` | 10 | Final notice before access locked |

### Win-back sequence (post-cancel)

Fires when CANCEL_CONFIRMED event lands in PostHog → your backend → email provider. Schedule as a delayed send.

| File | Day after cancel | Trigger condition |
|---|---|---|
| `winback-d30.md` | 30 | All cancelled users |
| `winback-d60.md` | 60 | Only if their cancel reason matched a feature we shipped between D30 and D60 |
| `winback-d90.md` | 90 | Final outreach, all cancelled users — then stop |

After D90, stop emailing. Industry data shows D90+ open rates collapse and unsubscribe rates spike.

## Template variables

Every template assumes these variables are available from your provider:

| Variable | Source |
|---|---|
| `{{first_name}}` | profile.name.split(' ')[0] |
| `{{sun_sign}}` | profile.chart.planets.find('Sun').sign |
| `{{moon_sign}}` | profile.chart.planets.find('Moon').sign |
| `{{cancel_reason}}` | (win-back only) reason from CANCEL_REASON_SELECTED event |
| `{{days_with_us}}` | computed from FIRST_USE_DATE |
| `{{journal_count}}` | JournalRepository.getEntryCount |
| `{{partner_count}}` | partnerProfiles.length |
| `{{update_payment_url}}` | (dunning only) deep-link to in-app payment update |
| `{{reactivate_url}}` | (win-back only) deep-link to subscribe flow |
| `{{unsubscribe_url}}` | provider-supplied |

## Tone guardrails

Per `04-churn-prevention.md`:
- Don't blame ("your payment didn't go through" not "you failed to pay")
- Show what they keep + what they lose access to
- Plain text > HTML
- Direct deep-link to payment / reactivation page (no login required if possible)
- Include support contact in dunning emails

## Subject-line testing

Each template has an `## Subject` section with 2-3 variants. Pick one as default, A/B test the others via your email provider's split-test feature.
