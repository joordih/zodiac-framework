export function isIP(input: string): number {
  if (isIPv4(input)) return 4;
  if (isIPv6(input)) return 6;
  return 0;
}

function isIPv4(input: string): boolean {
  const parts = input.split('.');
  if (parts.length !== 4) return false;

  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

function isIPv6(input: string): boolean {
  const parts = input.split(':');
  if (parts.length > 8) return false;

  let emptyFound = false;
  for (const part of parts) {
    if (part === '') {
      if (emptyFound) return false;
      emptyFound = true;
      continue;
    }
    if (!/^[0-9A-Fa-f]{1,4}$/.test(part)) return false;
  }
  return true;
}

export default {
  isIP
}; 