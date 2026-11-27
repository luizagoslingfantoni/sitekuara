// Publicação da versão de vendas autorizada em 27/11/2026.
export const salesOnHold = false;
// Meia-noite em Brasília, independente do fuso do visitante.
export const salesStart = Date.parse('2026-11-27T00:00:00-03:00');
export function blackFridayDestination(now = Date.now()) {
 if (salesOnHold) return null;
 return now >= salesStart ? '/black-friday/vendas' : null;
}
