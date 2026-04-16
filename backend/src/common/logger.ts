import pino from 'pino'
import { config } from './config'

const level = process.env.LOG_LEVEL || 'info'

export const logger = pino({
  level,
  // Use pretty printing in dev for readability; ship JSON in production so
  // log shippers (Loki, ELK, Datadog, etc.) can parse it directly.
  ...(config.isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.oldPassword',
      'req.body.newPassword',
      '*.password',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
})
