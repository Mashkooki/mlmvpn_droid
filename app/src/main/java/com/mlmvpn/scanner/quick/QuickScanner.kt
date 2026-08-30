package com.mlmvpn.scanner.quick

import android.content.Context
import com.mlmvpn.scanner.engines.freeconfig.FreeConfigEngine
import com.mlmvpn.scanner.utils.VpnConfig
import com.mlmvpn.scanner.utils.XrayJsonGenerator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import java.net.InetSocketAddress
import java.net.Socket
import java.util.concurrent.atomic.AtomicInteger

/**
 * Finding servers that work.
 *
 * The funnel is still two tests -- a TCP connect, then a real proxied request -- because on a
 * filtered line most hosts accept the connection and then carry nothing, so only the second
 * proves anything. What changed is that they no longer run one after the other.
 *
 * The first version swept every candidate for reachability and only then began real-testing
 * the survivors. With a pool of ~9,000 that meant minutes of nothing happening before the
 * first real result could exist, which is the wrong shape for a button whose whole promise is
 * "press this and you are online". Now a pool of TCP probes feeds proven-reachable hosts
 * through a channel to a smaller pool of real testers, so the two stages overlap: the first
 * genuine result arrives within seconds of pressing, while the reachability sweep is still
 * running behind it.
 *
 * The channel is bounded, which is load-bearing rather than incidental: it is what stops the
 * cheap stage from racing thousands of entries ahead of the expensive one and building a
 * queue the user is waiting behind.
 */
object QuickScanner {

    private const val DELAY_TEST_URL = "https://clients3.google.com/generate_204"

    private const val TCP_TIMEOUT_MS = 1500
    private const val REAL_TIMEOUT_MS = 6_000L

    /** Concurrency for each half of the pipeline. TCP is cheap, a real test is a whole core. */
    private const val TCP_WORKERS = 96
    private const val REAL_WORKERS = 16

    /**
     * A first result at or under this delay is good enough to connect to immediately.
     *
     * Above it, the sweep keeps looking for a little longer -- the first server to answer is
     * not necessarily one worth using, and the difference between 300ms and 1500ms is the
     * difference between a page loading and a page crawling.
     */
    const val GOOD_ENOUGH_MS = 900

    enum class Stage { IDLE, TCP, DELAY, DONE }

    data class Progress(
        val stage: Stage,
        val tested: Int = 0,
        val open: Int = 0,
        val found: Int = 0,
        val total: Int = 0,
        val target: Int = 0,
        val stopped: Boolean = false,
        val empty: Boolean = false,
    )

    @Volatile
    private var stopRequested = false

    @Volatile
    var running: Boolean = false
        private set

    fun stop() { stopRequested = true }

    // ── primitives ──────────────────────────────────────────────────────────────────────

    private suspend fun tcpOpen(host: String, port: Int, timeoutMs: Int): Int = withContext(Dispatchers.IO) {
        val started = System.currentTimeMillis()
        try {
            Socket().use { s ->
                s.connect(InetSocketAddress(host, port), timeoutMs)
                (System.currentTimeMillis() - started).toInt()
            }
        } catch (e: Exception) {
            -1
        }
    }

    /** One server, one real proxied request. Returns the delay in ms, or -1. */
    suspend fun measure(context: Context, uri: String, skipTcp: Boolean = false): Int = withContext(Dispatchers.IO) {
        FreeConfigEngine.ensureXrayEnv(context)
        try {
            val config = VpnConfig.parseUri(uri) ?: return@withContext -1
            // A dead host is far more common than a live one that fails the request, and the
            // cheap check costs 1.5s against the real test's 6s. Skipped when the caller has
            // already done it -- the pipeline below has, by definition.
            if (!skipTcp && tcpOpen(config.address, config.port, TCP_TIMEOUT_MS) < 0) return@withContext -1
            val json = XrayJsonGenerator.generateSpeedtestConfig(config)
            val ms = withTimeoutOrNull(REAL_TIMEOUT_MS) {
                libv2ray.Libv2ray.measureOutboundDelay(json, DELAY_TEST_URL)
            } ?: 0L
            if (ms > 0) ms.toInt() else -1
        } catch (e: Exception) {
            -1
        }
    }

    /** Re-test many servers at once, reporting each as it finishes. */
    suspend fun measureAll(
        context: Context,
        uris: List<Pair<String, String>>,          // id to uri
        onResult: (id: String, delay: Int) -> Unit,
        onProgress: (done: Int, total: Int) -> Unit,
    ) = coroutineScope {
        FreeConfigEngine.ensureXrayEnv(context)
        stopRequested = false
        val done = AtomicInteger(0)
        val gate = Semaphore(REAL_WORKERS)
        for (batch in uris.chunked(REAL_WORKERS)) {
            if (stopRequested) break
            batch.map { (id, uri) ->
                async(Dispatchers.IO) {
                    gate.acquire()
                    try {
                        val ms = measure(context, uri)
                        onResult(id, ms)
                        onProgress(done.incrementAndGet(), uris.size)
                    } finally {
                        gate.release()
                    }
                }
            }.awaitAll()
        }
    }

    // ── the pipeline ────────────────────────────────────────────────────────────────────

    /**
     * Sweep [candidates], reporting each proven server as it is proven.
     *
     * [accept] decides what happens to a result: return true to keep it. Returning false puts
     * it aside without counting toward [want] -- which is how the balanced sweep enforces a
     * per-country share without throwing away servers it may need to top up with later.
     *
     * [shouldFinish] is checked after every accepted result; returning true ends the run early.
     * This is what lets the connect button stop at the first server that is actually good
     * rather than at the first server that merely answers.
     */
    private suspend fun pipeline(
        context: Context,
        candidates: List<QuickNode>,
        want: Int,
        onProgress: (Progress) -> Unit,
        onFound: (QuickNode) -> Unit,
        accept: (QuickNode) -> Boolean = { true },
        shouldFinish: (List<QuickNode>) -> Boolean = { it.size >= want },
    ): List<QuickNode> = coroutineScope {
        FreeConfigEngine.ensureXrayEnv(context)

        val results = ArrayList<QuickNode>()
        val overflow = ArrayList<QuickNode>()
        val probed = AtomicInteger(0)
        val reachable = AtomicInteger(0)
        val realTested = AtomicInteger(0)
        val total = candidates.size

        // Bounded on purpose: without a cap the TCP half races thousands of hosts ahead of the
        // testers and the user waits behind a queue that serves them no sooner.
        val survivors = Channel<QuickNode>(capacity = 64)

        // A local AtomicBoolean rather than a @Volatile local (which Kotlin does not allow):
        // producer, consumers and the reporter all read it from different threads.
        val finished = java.util.concurrent.atomic.AtomicBoolean(false)
        fun over() = finished.get() || stopRequested

        val producer = launch(Dispatchers.IO) {
            val gate = Semaphore(TCP_WORKERS)
            val jobs = ArrayList<kotlinx.coroutines.Job>()
            for (node in candidates) {
                if (over()) break
                gate.acquire()
                jobs += launch(Dispatchers.IO) {
                    try {
                        if (over()) return@launch
                        val ms = tcpOpen(node.host, node.port, TCP_TIMEOUT_MS)
                        probed.incrementAndGet()
                        if (ms >= 0) {
                            node.tcp = ms
                            reachable.incrementAndGet()
                            if (!over()) survivors.send(node)
                        }
                    } catch (e: Exception) {
                        // A closed channel means the consumers are done; nothing to report.
                    } finally {
                        gate.release()
                    }
                }
            }
            jobs.forEach { it.join() }
            survivors.close()
        }

        val consumers = List(REAL_WORKERS) {
            launch(Dispatchers.IO) {
                for (node in survivors) {
                    if (over()) break
                    val ms = measure(context, node.uri, skipTcp = true)
                    realTested.incrementAndGet()
                    if (ms > 0) {
                        node.delay = ms
                        val stopNow = synchronized(results) {
                            if (accept(node)) {
                                results.add(node)
                                onFound(node)
                            } else {
                                overflow.add(node)
                            }
                            shouldFinish(results)
                        }
                        if (stopNow) {
                            finished.set(true)
                            break
                        }
                    }
                    onProgress(
                        Progress(
                            stage = Stage.DELAY,
                            tested = realTested.get(), open = reachable.get(),
                            found = synchronized(results) { results.size },
                            total = total, target = want,
                        )
                    )
                }
            }
        }

        // A separate reporter, because the two halves progress independently and the strip has
        // to show the cheap sweep moving even while no real test has finished yet.
        val reporter = launch {
            while (!over() && producer.isActive) {
                onProgress(
                    Progress(
                        stage = Stage.TCP,
                        tested = probed.get(), open = reachable.get(),
                        found = synchronized(results) { results.size },
                        total = total, target = want,
                    )
                )
                kotlinx.coroutines.delay(250)
            }
        }

        consumers.forEach { it.join() }
        finished.set(true)
        survivors.cancel()
        producer.cancel()
        reporter.cancel()

        // Top up from what the per-country cap set aside, so a run that asked for 50 comes
        // back with 50 whenever 50 exist at all.
        synchronized(results) {
            if (results.size < want && overflow.isNotEmpty()) {
                results.addAll(overflow.sortedBy { it.delay }.take(want - results.size))
            }
            results.sortBy { it.delay }
        }
        results
    }

    /**
     * The connect button's search: come back with something usable as fast as possible.
     *
     * Returns at the first server whose real delay is at or under [GOOD_ENOUGH_MS]. If the
     * servers that answer are all slow, it keeps looking until [deadlineMs] and then returns
     * the best of them -- a slow connection still beats no connection, but not at the cost of
     * taking the very first thing that replies when something better is seconds away.
     */
    suspend fun quickest(
        context: Context,
        candidates: List<QuickNode>,
        deadlineMs: Long = 20_000,
        onProgress: (Progress) -> Unit = {},
    ): QuickNode? {
        if (candidates.isEmpty()) return null
        if (running) throw IllegalStateException("یک جست‌وجو در حال اجراست.")
        running = true
        stopRequested = false
        val found = ArrayList<QuickNode>()
        try {
            withTimeoutOrNull(deadlineMs) {
                pipeline(
                    context = context,
                    candidates = candidates.shuffled(),
                    want = 1,
                    onProgress = onProgress,
                    onFound = { synchronized(found) { found.add(it) } },
                    // Any working server is worth remembering; only a good one ends the search.
                    shouldFinish = { it.any { node -> node.delay in 1..GOOD_ENOUGH_MS } },
                ).let { synchronized(found) { for (n in it) if (found.none { f -> f.id == n.id }) found.add(n) } }
            }
        } finally {
            running = false
            stopRequested = false
        }
        return synchronized(found) { found.filter { it.delay > 0 }.minByOrNull { it.delay } }
    }

    /**
     * Find [want] working servers among [candidates]. Used by the browse screen's sweeps.
     */
    suspend fun scan(
        context: Context,
        candidates: List<QuickNode>,
        want: Int,
        onProgress: (Progress) -> Unit,
        onFound: (QuickNode) -> Unit,
    ): List<QuickNode> {
        if (running) throw IllegalStateException("یک جست‌وجو در حال اجراست.")
        if (candidates.isEmpty()) throw IllegalStateException("برای این کشور سروری در فهرست نیست.")
        running = true
        stopRequested = false
        try {
            val target = want.coerceIn(1, candidates.size)
            onProgress(Progress(Stage.TCP, total = candidates.size, target = target))
            val results = pipeline(
                context = context,
                candidates = candidates.shuffled(),
                want = target,
                onProgress = onProgress,
                onFound = onFound,
            )
            onProgress(
                Progress(
                    Stage.DONE, found = results.size, target = target,
                    stopped = stopRequested, empty = results.isEmpty(),
                )
            )
            return results
        } finally {
            running = false
            stopRequested = false
        }
    }

    /**
     * Find [want] working servers spread across [countries].
     *
     * "50 servers from 5 countries" has to mean 10 from each, or it is just "50 servers" with
     * a filter on top -- one popular country would supply all of them. Candidates are
     * interleaved round-robin so every country is being probed from the start, and a country
     * that has already contributed its share puts further results aside rather than losing
     * them, so a country that cannot fill its quota is topped up from the others at the end
     * instead of leaving the run short.
     */
    suspend fun scanBalanced(
        context: Context,
        byCountry: Map<String, List<QuickNode>>,
        want: Int,
        onProgress: (Progress) -> Unit,
        onFound: (QuickNode) -> Unit,
    ): List<QuickNode> {
        if (running) throw IllegalStateException("یک جست‌وجو در حال اجراست.")
        val pools = byCountry.filterValues { it.isNotEmpty() }
        if (pools.isEmpty()) throw IllegalStateException("برای این کشورها سروری در فهرست نیست.")

        running = true
        stopRequested = false
        try {
            val perCountry = kotlin.math.ceil(want.toDouble() / pools.size).toInt().coerceAtLeast(1)

            // Round-robin interleave, so the sweep is working on every country at once rather
            // than finishing one before it starts the next.
            val shuffledPools = pools.mapValues { it.value.shuffled() }
            val interleaved = ArrayList<QuickNode>()
            var index = 0
            while (true) {
                var appended = false
                for ((_, list) in shuffledPools) {
                    if (index < list.size) {
                        interleaved.add(list[index])
                        appended = true
                    }
                }
                if (!appended) break
                index++
            }

            val perCountryCount = HashMap<String, Int>()
            val target = want.coerceIn(1, interleaved.size)
            onProgress(Progress(Stage.TCP, total = interleaved.size, target = target))

            val results = pipeline(
                context = context,
                candidates = interleaved,
                want = target,
                onProgress = onProgress,
                onFound = onFound,
                accept = { node ->
                    val code = node.country ?: "??"
                    val used = perCountryCount.getOrDefault(code, 0)
                    if (used < perCountry) {
                        perCountryCount[code] = used + 1
                        true
                    } else {
                        false
                    }
                },
            )
            onProgress(
                Progress(
                    Stage.DONE, found = results.size, target = target,
                    stopped = stopRequested, empty = results.isEmpty(),
                )
            )
            return results
        } finally {
            running = false
            stopRequested = false
        }
    }
}
