/**
 * Truncates a Solana address for display purposes
 * 
 * @param address - The full address string
 * @param startChars - Number of characters to show at the start
 * @param endChars - Number of characters to show at the end
 * @returns Truncated address string
 */
export const truncateAddress = (
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Formats a number to a fixed number of decimal places
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  decimals: number = 2
): string => {
  return value.toFixed(decimals);
};

/**
 * Formats a timestamp to a readable date string
 * 
 * @param timestamp - The timestamp in milliseconds
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};