/**
 * Admin UI utility functions
 *
 * Reusable helpers for admin components including status colors,
 * formatting, and other common admin UI patterns.
 */

/**
 * Get Tailwind color classes for status badges
 * Includes both base color and hover state for consistent UI
 *
 * Works for both order statuses and fulfillment statuses:
 * - Order: pending, processing, shipped, delivered, cancelled
 * - Fulfillment: pending, sent_to_supplier, shipped, delivered
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500 hover:bg-yellow-600',
    processing: 'bg-blue-500 hover:bg-blue-600',
    sent_to_supplier: 'bg-blue-500 hover:bg-blue-600',
    shipped: 'bg-purple-500 hover:bg-purple-600',
    delivered: 'bg-green-500 hover:bg-green-600',
    cancelled: 'bg-red-500 hover:bg-red-600',
  };
  return colors[status] || 'bg-gray-500 hover:bg-gray-600';
}

/**
 * Format status for display
 * Converts snake_case to readable text and capitalizes first letter
 */
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
