export function formatBHD(amount) {
  if (typeof amount !== "number") return "";
  return `${amount.toFixed(2)} BD`;
}
