import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { logger, setLogLevel } from '@/utils/logger'

setLogLevel('warn')

test('logger：info 级别过滤 debug，debug 级别放行', () => {
  const seen: string[] = []
  const origLog = console.log
  const origInfo = console.info
  console.log = ((msg?: unknown) => {
    seen.push(`log:${String(msg)}`)
  }) as typeof console.log
  console.info = ((msg?: unknown) => {
    seen.push(`info:${String(msg)}`)
  }) as typeof console.info

  try {
    setLogLevel('info')
    logger.debug('scope', 'debug-hidden')
    logger.info('scope', 'info-shown')
    setLogLevel('debug')
    logger.debug('scope', 'debug-shown')
  } finally {
    console.log = origLog
    console.info = origInfo
    setLogLevel('warn')
  }

  assert.ok(!seen.includes('log:[scope] debug-hidden'), 'info 级别不应输出 debug')
  assert.ok(seen.includes('info:[scope] info-shown'), 'info 级别应输出 info')
  assert.ok(seen.includes('log:[scope] debug-shown'), 'debug 级别应输出 debug')
})
