/**
 * Deterministic color generation based on user address.
 * Focuses on Blue, Cyan, and Silver palettes as requested.
 */
export function getProfileGradient(address: string | null): string {
  if (!address) return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
  
  const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const variants = [
    'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', // Blue/Azure
    'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)', // Cyan/Teal
    'linear-gradient(135deg, #94a3b8 0%, #475569 100%)', // Silver/Slate
    'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)', // Sky/Deep Blue
    'linear-gradient(135deg, #67e8f9 0%, #0e7490 100%)', // Bright Cyan
    'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)', // Metallic Silver
  ];
  
  return variants[seed % variants.length];
}

/**
 * Gets initials from the address (first 2 chars)
 */
export function getAddressInitials(address: string | null): string {
  if (!address) return 'GM';
  return address.substring(0, 2).toUpperCase();
}
