import { syncContact } from '../lib/brevo.mjs';
import { verifyForm } from '../lib/form-proof.mjs';
export default {
  async formSubmitted(event) {
    // Even submissions that bypassed the edge guard cannot reach Brevo.
    if (!await verifyForm(event.data, process.env.TURNSTILE_SECRET_KEY)) {
      console.error('Form proof rejected', { eventKeys: Object.keys(event), fieldNames: Object.keys(event.data || {}), hasSecret: !!process.env.TURNSTILE_SECRET_KEY, hasProof: !!event.data?.['kuara-verification'] });
      return;
    }
    const result = await syncContact(event.data);
    console.info('Brevo result', result);
  },
};
