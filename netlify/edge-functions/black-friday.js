import { blackFridayDestination } from '../lib/black-friday.mjs';

export default async (request, context) => {
 const destination = blackFridayDestination();
 if (destination) return new URL(destination, request.url);
 const response = await context.next();
 response.headers.set('Cache-Control', 'no-store');
 return response;
};
export const config = { path: ['/black-friday/', '/black-friday/index.html'], method: 'GET' };
