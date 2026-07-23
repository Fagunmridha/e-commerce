import dns from 'node:dns'

/**
 * Force DNS resolution to IPv4.
 *
 * Neon's hostname returns both IPv4 (A) and IPv6 (AAAA) records. On IPv4-only
 * networks (common with many ISPs), Node's fetch tries the IPv6 address first
 * and blocks until it times out instead of falling back — so every DB call
 * fails with ETIMEDOUT / "fetch failed". Pinning lookups to IPv4 avoids that.
 *
 * Importing this module once (at the top of the DB client) applies the patch
 * process-wide. Safe on dual-stack networks too: Neon's IPv4 endpoint works
 * everywhere.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const patched = globalThis as typeof globalThis & { __ipv4Patched?: boolean }

if (!patched.__ipv4Patched) {
  patched.__ipv4Patched = true

  const anyDns = dns as any
  const originalLookup = anyDns.lookup.bind(dns)
  anyDns.lookup = (hostname: string, options: any, callback: any) => {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    return originalLookup(hostname, { ...options, family: 4 }, callback)
  }

  const anyPromises = dns.promises as any
  const originalPromiseLookup = anyPromises.lookup.bind(dns.promises)
  anyPromises.lookup = (hostname: string, options: any) =>
    originalPromiseLookup(hostname, {
      ...(typeof options === 'object' ? options : {}),
      family: 4,
    })

  dns.setDefaultResultOrder?.('ipv4first')
}
