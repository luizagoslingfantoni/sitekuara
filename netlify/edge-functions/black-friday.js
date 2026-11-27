import { blackFridayDestination, salesOnHold } from '../lib/black-friday.mjs';

export default async (request, context) => {
 const destination = blackFridayDestination();
 if (destination) return new URL(destination, request.url);
 const response = await context.next();
 response.headers.set('Cache-Control', 'no-store');
 if (salesOnHold) response.headers.set('X-Kuara-Campaign', 'presale-hold');
 return response;
};
export const config = { path: ['/blackfriday', '/blackfriday/', '/black-friday/', '/black-friday/index.html'], method: 'GET' };
