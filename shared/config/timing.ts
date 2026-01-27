/**
 * Timing constants for the application
 *
 * These values control various delays and timeouts throughout the app.
 * Centralized here for easy maintenance and consistency.
 */

/**
 * Delay before starting voice recognition (in milliseconds)
 * Allows UI to settle and prevents immediate recognition start
 * Reduced from 500ms to 200ms for faster response
 */
export const VOICE_RECOGNITION_START_DELAY_MS = 200;

/**
 * Delay before transitioning to next card/problem (in milliseconds)
 * Brief delay ensures clearResults takes effect before next problem loads
 */
export const CARD_TRANSITION_DELAY_MS = 100;
