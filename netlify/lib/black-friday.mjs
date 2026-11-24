// Midnight in Brasília (UTC−03:00), independent of the visitor's clock/time zone.
export const salesStart = Date.parse('2026-11-27T00:00:00-03:00');
export function blackFridayDestination(now = Date.now()) {
 return now >= salesStart ? '/black-friday/vendas' : null;
}
