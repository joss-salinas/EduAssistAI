import { ErrorLogger } from "./error-logger"

/**
 * RetryManager class for handling retries of operations that might fail
 * Implements exponential backoff strategy with jitter
 */
export class RetryManager {
  private maxRetries: number
  private initialDelayMs: number
  private maxDelayMs: number
  private backoffFactor: number
  private jitterFactor: number
  private logger: ErrorLogger

  /**
   * Create a new RetryManager instance
   *
   * @param maxRetries Maximum number of retry attempts
   * @param initialDelayMs Initial delay in milliseconds
   * @param maxDelayMs Maximum delay in milliseconds
   * @param backoffFactor Factor to multiply delay by after each attempt
   * @param jitterFactor Random jitter factor to add to delay (0-1)
   */
  constructor(maxRetries = 3, initialDelayMs = 100, maxDelayMs = 10000, backoffFactor = 2, jitterFactor = 0.1) {
    this.maxRetries = maxRetries
    this.initialDelayMs = initialDelayMs
    this.maxDelayMs = maxDelayMs
    this.backoffFactor = backoffFactor
    this.jitterFactor = jitterFactor
    this.logger = ErrorLogger.getInstance()
  }

  /**
   * Execute an operation with retry logic
   *
   * @param operation Function to execute
   * @param retryableErrors Array of error types that should trigger a retry
   * @param context Context information for logging
   * @returns Result of the operation
   * @throws Error if all retry attempts fail
   */
  public async execute<T>(
    operation: () => Promise<T>,
    retryableErrors: Array<new (...args: any[]) => Error> = [],
    context: Record<string, any> = {},
  ): Promise<T> {
    let lastError: Error | null = null
    let delay = this.initialDelayMs

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Check if we should retry based on the error type
        const shouldRetry = attempt <= this.maxRetries && this.isRetryableError(lastError, retryableErrors)

        if (!shouldRetry) {
          this.logger.error(`Operation failed permanently after ${attempt} attempt(s)`, lastError, {
            ...context,
            attempt,
          })
          throw lastError
        }

        this.logger.warn(`Operation failed, retrying (${attempt}/${this.maxRetries})`, {
          ...context,
          attempt,
          error: lastError.message,
        })

        // Wait before retrying
        await this.sleep(delay)

        // Calculate next delay with exponential backoff and jitter
        delay = Math.min(delay * this.backoffFactor * (1 + Math.random() * this.jitterFactor), this.maxDelayMs)
      }
    }

    // This should never happen due to the throw in the loop,
    // but TypeScript needs it for type safety
    throw lastError || new Error("Unexpected error in retry logic")
  }

  /**
   * Check if an error is retryable based on its type
   */
  private isRetryableError(error: Error, retryableErrors: Array<new (...args: any[]) => Error>): boolean {
    if (retryableErrors.length === 0) {
      // If no specific error types are provided, retry all errors
      return true
    }

    return retryableErrors.some((errorType) => error instanceof errorType)
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
