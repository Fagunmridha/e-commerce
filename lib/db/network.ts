import net from 'node:net'

/**
 * Let Node reach Neon over whichever address family actually works *today*.
 *
 * Neon's hostname has both IPv6 (AAAA) and IPv4 (A) records, and this network
 * does not reliably carry both. It has failed in both directions: on 2026-09-12
 * IPv6 was a blackhole and IPv4 worked; on 2026-09-17 IPv4 timed out and IPv6
 * worked. This file used to pin every lookup to IPv4, which fixed the first day
 * and caused every DB call to fail with `UND_ERR_CONNECT_TIMEOUT` on the second.
 * Pinning either family is betting on the network, and it has lost both bets.
 *
 * So nothing is pinned. Node already tries every address in turn — "Happy
 * Eyeballs", `autoSelectFamily` — which is exactly what is wanted. The trouble
 * was only its patience: it gives each address **250ms** before moving on,
 * and a TCP connect to us-east-2 from here takes ~300ms. Node therefore
 * abandoned the working family moments before it connected, fell through to
 * the dead one, and waited out the full 10s. Measured the same afternoon:
 * 250ms fails, 1000ms connects in ~1.2s, 2500ms in ~1.1s.
 *
 * 2000ms clears one real handshake with room for a lost-and-retransmitted SYN
 * (the retransmit fires at 1s), which a flaky link here does produce. The cost
 * is only paid when the *first* family tried is dead, and only on a cold
 * connection — after that the socket is kept alive and reused.
 *
 * Imported for its side effect at the top of the DB client, so it runs before
 * the first connection is opened. The setting is process-wide.
 */
const ATTEMPT_TIMEOUT_MS = 2000

net.setDefaultAutoSelectFamily(true)
net.setDefaultAutoSelectFamilyAttemptTimeout(ATTEMPT_TIMEOUT_MS)
