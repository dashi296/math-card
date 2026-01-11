/**
 * Utility functions for statistical calculations
 */

/**
 * Calculate accuracy percentage
 *
 * @param correct - Number of correct answers
 * @param total - Total number of attempts
 * @returns Accuracy as a string with one decimal place (e.g., "85.5")
 */
export function calculateAccuracy(correct: number, total: number): string {
  return total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
}
