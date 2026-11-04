import { syncContact } from '../lib/brevo.mjs';
import { verifyForm } from '../lib/form-proof.mjs';
export default {
  async formSubmitted(event) {
    // Even submissions that bypassed the edge guard cannot reach Brevo.
    if (!await verifyForm(event.data, process.env.TURNSTILE_SECRET_KEY)) return;
    await syncContact(event.data);
  },
};
