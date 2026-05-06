# Win-back — Day 60 post-cancel (conditional)

## Trigger

Sent 60 days after CANCEL_CONFIRMED ONLY IF the user's cancel reason matches a feature we shipped in the last 30 days.

This is a precision email — don't blast it to everyone. Use the cancel_reason field from CANCEL_REASON_SELECTED to filter.

## Subject

- We just shipped what you wanted
- {{first_name}}, the thing you mentioned — it's live
- Update: {{shipped_feature_name}} is here

## Body (plain text)

Hi {{first_name}},

Two months ago you mentioned {{cancel_reason_paraphrase}} when you cancelled.

We just shipped {{shipped_feature_name}}. Here's what it does:
{{shipped_feature_description}}

If that closes the gap for you, your account is still here:
{{reactivate_url}}

If not, no worries — we'll keep building, and your data stays preserved as long as you want it.

— The Celestia team

---

Reactivate Pro: {{reactivate_url}}
Manage email preferences: {{unsubscribe_url}}
