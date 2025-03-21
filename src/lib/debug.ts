
// Debug utility for controlled logging throughout the application
// Enable or disable logging by setting DEBUG to true or false

// Enable debug mode
export const DEBUG = true;

/**
 * Log messages to console when in debug mode
 * @param component - The component or module name
 * @param message - The message to log
 * @param data - Optional data to log
 */
export function debugLog(component: string, message: string, data?: any): void {
  if (DEBUG) {
    if (data) {
      console.log(`[${component}] ${message}`, data);
    } else {
      console.log(`[${component}] ${message}`);
    }
  }
}

/**
 * Log errors to console when in debug mode
 * @param component - The component or module name
 * @param message - The error message
 * @param error - The error object
 */
export function debugError(component: string, message: string, error: any): void {
  if (DEBUG) {
    console.error(`[${component} ERROR] ${message}`, error);
  }
}

/**
 * Log warnings to console when in debug mode
 * @param component - The component or module name
 * @param message - The warning message
 * @param data - Optional data to log
 */
export function debugWarn(component: string, message: string, data?: any): void {
  if (DEBUG) {
    if (data) {
      console.warn(`[${component} WARNING] ${message}`, data);
    } else {
      console.warn(`[${component} WARNING] ${message}`);
    }
  }
}
