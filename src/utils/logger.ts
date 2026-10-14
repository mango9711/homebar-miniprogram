/**
 * 极简分级日志。
 *
 * 默认：开发环境打印 info 及以上，生产环境只打印 warn 及以上。
 * 排查排序异常时可在入口调用 setLogLevel('debug') 打开逐卡/逐材料的详细日志。
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

let threshold: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'info'

export function setLogLevel(level: LogLevel) {
  threshold = level
}

export function getLogLevel(): LogLevel {
  return threshold
}

function emit(level: LogLevel, scope: string, msg: string, data?: unknown) {
  if (ORDER[level] < ORDER[threshold]) return
  const line = `[${scope}] ${msg}`
  const fn = level === 'debug' ? console.log : console[level]
  if (data === undefined) fn(line)
  else fn(line, data)
}

export const logger = {
  debug: (scope: string, msg: string, data?: unknown) => emit('debug', scope, msg, data),
  info: (scope: string, msg: string, data?: unknown) => emit('info', scope, msg, data),
  warn: (scope: string, msg: string, data?: unknown) => emit('warn', scope, msg, data),
  error: (scope: string, msg: string, data?: unknown) => emit('error', scope, msg, data)
}
