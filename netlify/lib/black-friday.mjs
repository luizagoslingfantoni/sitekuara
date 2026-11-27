// Abertura suspensa em 26/11/2026. Liberar somente após nova autorização.
export const salesOnHold = true;
// Horário original preservado; a pausa tem precedência sobre esta data.
export const salesStart = Date.parse('2026-11-27T00:00:00-03:00');
export function blackFridayDestination(now = Date.now()) {
 if (salesOnHold) return null;
 return now >= salesStart ? '/black-friday/vendas' : null;
}
