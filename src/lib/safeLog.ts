/**
 * Safe logging utilities that prevent sensitive data from being logged
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Sanitize an object by removing or masking sensitive fields
 */
function sanitize(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sensitiveKeys = [
    'image',
    'imageData',
    'base64',
    'photo',
    'file',
    'buffer',
    'apiKey',
    'key',
    'secret',
    'password',
    'token',
    'authorization',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if the key matches any sensitive pattern
    const isSensitive = sensitiveKeys.some(
      (sk) => lowerKey.includes(sk.toLowerCase())
    );

    if (isSensitive) {
      // For image data, show a placeholder
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = `[REDACTED: ${value.length} chars]`;
      } else if (Buffer.isBuffer(value)) {
        sanitized[key] = `[REDACTED: Buffer ${value.length} bytes]`;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Safe logger that masks sensitive data
 */
export const safeLog = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data ? sanitize(data) : '');
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data ? sanitize(data) : '');
  },

  error: (message: string, error?: unknown) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error(`[ERROR] ${message}`, error ? sanitize(error) : '');
    }
  },

  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data ? sanitize(data) : '');
    }
  },
};
