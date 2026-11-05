import { syncContact } from '../lib/brevo.mjs';
import { verifiedEventData } from '../lib/form-event.mjs';
export default {
  async formSubmitted(event) {
    const data = await verifiedEventData(event.data, process.env.TURNSTILE_SECRET_KEY);
    if (!data) {
      console.error('Form proof rejected or form not mapped');
      return;
    }
    const result = await syncContact(data);
    console.info('Brevo result', result);
  },
};
