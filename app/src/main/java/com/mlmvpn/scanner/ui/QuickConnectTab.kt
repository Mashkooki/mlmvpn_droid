package com.mlmvpn.scanner.ui

// Deliberately in the `ui` package, like VpnGateTab: it reuses stopVpnSafely() and the shared
// insets locals without an import, and there is no second copy of either here.

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.preference.PreferenceManager
import com.mlmvpn.scanner.MyVpnService
import com.mlmvpn.scanner.quick.*
import com.mlmvpn.scanner.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * «اتصال سریع» — the app's home surface.
 *
 * One big button that means the same thing at every moment: press it and you end up online, or
 * offline. With no server chosen it finds one itself; with a saved list it uses the fastest
 * proven entry. The four states (idle, working, connected, disconnecting) each get their own
 * colour, motion and label, because the single most common complaint about a VPN button is not
 * knowing whether it is doing anything.
 *
 * The panel does not own the connection. The chosen node is handed to MyVpnService exactly the
 * way the nodes tab does it, so only one code path can ever say whether the phone is protected.
 */

/** What the big button is currently expressing. */
enum class QuickState { IDLE, SEARCHING, CONNECTING, CONNECTED, DISCONNECTING }

@Composable
fun QuickConnectTab() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val bottomPadding = LocalSystemBottomPadding.current
    val topPadding = LocalSystemTopPadding.current

    val isRunning by MyVpnService.isRunningFlow.collectAsState()
    val connectedNodeId by MyVpnService.connectedNodeIdFlow.collectAsState()

    var saved by remember { mutableStateOf(QuickSavedStore.all(context).toList()) }
    fun reloadSaved() { saved = QuickSavedStore.all(context).toList() }

    var busy by remember { mutableStateOf<QuickState?>(null) }   // overrides the derived state
    var statusLine by remember { mutableStateOf("") }
    var egress by remember { mutableStateOf<EgressResult?>(null) }

    var showServers by remember { mutableStateOf(false) }
    var testingAll by remember { mutableStateOf(false) }
    var testProgress by remember { mutableStateOf(0 to 0) }
    var confirmDelete by remember { mutableStateOf(false) }

    val state = busy ?: if (isRunning) QuickState.CONNECTED else QuickState.IDLE

    // Clear the "new" marks once the user has actually looked at the list.
    LaunchedEffect(Unit) {
        QuickSavedStore.markSeen(context)
        reloadSaved()
    }

    // Learn this phone's own public address while nothing is connected. That baseline is what
    // later lets a trace prove it went THROUGH the tunnel rather than around it -- without it,
    // an Iranian exit and a leak are the same reading. Re-taken whenever we are disconnected,
    // so changing network does not leave a stale baseline behind.
    LaunchedEffect(isRunning) {
        if (!isRunning) {
            EgressTracer.forgetBaseline()
            runCatching { EgressTracer.traceDirect() }
        }
    }

    // ── connecting ──────────────────────────────────────────────────────────────────────

    var pendingUri by remember { mutableStateOf<Pair<String, String>?>(null) }   // id to uri

    fun launchService(id: String, uri: String) {
        val prefs = PreferenceManager.getDefaultSharedPreferences(context)
        val intent = Intent(context, MyVpnService::class.java).apply {
            putExtra("NODE_URI", uri)
            putExtra("NODE_ID", id)
            putExtra("PROXY_MODE", prefs.getBoolean("proxy_mode", false))
            putExtra("LOCAL_PORT", com.mlmvpn.scanner.utils.LocalPort.getString(context))
        }
        context.startService(intent)
        MyVpnService.isRunning = true
        MyVpnService.connectedNodeId = id
    }

    /**
     * After the tunnel is up, ask Cloudflare where the traffic really came out, and file the
     * server under that country for good when the reading can be trusted.
     */
    fun verifyEgress(id: String) {
        scope.launch {
            // Must be the same port the tunnel was started on, or the trace describes whatever
            // else happens to be listening rather than the connection we just made. And it
            // retries until the reading actually comes out of the tunnel: a fixed wait was
            // sometimes measuring a core that had not finished binding, which reads as the
            // user's own country and was being recorded as the server's.
            val res = EgressTracer.traceWhenReady(com.mlmvpn.scanner.utils.LocalPort.get(context))
            egress = res
            if (res.ok && res.tunnelled && res.countryTrusted && res.loc != null) {
                val outcome = QuickVerifiedStore.record(context, id, res.loc)
                val movedInPool = QuickConnectRepository.applyMeasured(id, res.loc)
                // The saved list is its own store, so correcting only the catalog left the
                // connect screen showing the old flag -- the one list the user is looking at.
                val movedInSaved = QuickSavedStore.applyMeasuredCountry(context, id, res.loc)
                if (movedInSaved) reloadSaved()
                if (outcome.ok && (movedInPool || movedInSaved)) {
                    val country = GeoLabel.countryFromCode(res.loc)
                    Toast.makeText(
                        context,
                        "این سرور در واقع از ${country?.label ?: res.loc} خارج می‌شود و به همان کشور منتقل شد.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    fun finishConnect(id: String, uri: String) {
        busy = QuickState.CONNECTING
        statusLine = "در حال برقراری اتصال…"
        launchService(id, uri)
        scope.launch {
            // Held briefly so the connecting state is actually seen; the service flips
            // isRunning immediately, which would otherwise skip the animation entirely.
            delay(1_200)
            busy = null
            statusLine = ""
            verifyEgress(id)
        }
    }

    val vpnLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val target = pendingUri
        pendingUri = null
        if (result.resultCode == Activity.RESULT_OK && target != null) {
            finishConnect(target.first, target.second)
        } else {
            busy = null
            statusLine = ""
            Toast.makeText(context, "اجازه‌ی VPN داده نشد", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Connect, stopping whatever is already running first.
     *
     * Tapping a different server while connected used to call startService straight away, so
     * two cores briefly existed at once and the second could not bind the local port the first
     * still held. That surfaced as a proxy warning from the core and, worse, left the status
     * probe and the egress trace talking to the OLD tunnel on that port -- which is how a
     * freshly connected server could report the wrong country.
     */
    fun connectTo(id: String, uri: String) {
        scope.launch {
            if (MyVpnService.isRunning) {
                busy = QuickState.DISCONNECTING
                statusLine = "قطع اتصال قبلی…"
                withContext(Dispatchers.IO) { stopVpnSafely(context) }
                MyVpnService.isRunning = false
                egress = null
                // Long enough for the previous core to release its inbound. Starting before it
                // has is the whole bug above.
                delay(1_200)
            }
            val prepare = VpnService.prepare(context)
            if (prepare != null) {
                pendingUri = id to uri
                vpnLauncher.launch(prepare)
            } else {
                finishConnect(id, uri)
            }
        }
    }

    fun disconnect() {
        busy = QuickState.DISCONNECTING
        statusLine = "در حال قطع اتصال…"
        egress = null
        scope.launch {
            // stopVpnSafely, not a bare STOP: if the WireGuard trial is what is running, the
            // process must be relaunched or the Go runtime exits by itself seconds later.
            withContext(Dispatchers.IO) { stopVpnSafely(context) }
            MyVpnService.isRunning = false
            delay(900)
            busy = null
            statusLine = ""
        }
    }

    /**
     * The one button, with no server chosen: find one and connect to it.
     *
     * Preference order is the point. A saved server that already proved itself is instant, so
     * it wins; only when there is nothing saved (or nothing saved still works) does this fall
     * back to sweeping the pool, which takes seconds and should not be the everyday path.
     */
    fun quickConnect() {
        scope.launch {
            busy = QuickState.SEARCHING

            // ── the user already has servers: use those, and only those ──────────────────
            //
            // Re-tested rather than trusted: a saved delay can be hours old and the server may
            // have died since. Testing a handful in parallel costs a couple of seconds and is
            // still far faster than sweeping a pool of thousands, so this path stays the
            // everyday one for anyone who has connected before.
            if (saved.isNotEmpty()) {
                statusLine = "بررسی سرورهای شما…"
                val live = java.util.Collections.synchronizedList(ArrayList<Pair<String, Int>>())
                try {
                    QuickScanner.measureAll(
                        context = context,
                        uris = saved.map { it.id to it.uri },
                        onResult = { id, ms ->
                            QuickSavedStore.updateResult(context, id, ms)
                            if (ms > 0) live.add(id to ms)
                        },
                        onProgress = { done, total -> statusLine = "بررسی سرورهای شما… $done از $total" },
                    )
                } catch (e: Exception) {
                    // Fall through to the pool sweep below.
                }
                QuickSavedStore.resort(context)
                reloadSaved()
                val best = live.minByOrNull { it.second }
                if (best != null) {
                    val row = QuickSavedStore.all(context).firstOrNull { it.id == best.first }
                    if (row != null) {
                        connectTo(row.id, row.uri)
                        return@launch
                    }
                }
                statusLine = "هیچ‌کدام از سرورهای شما جواب نداد — جست‌وجوی سرور تازه…"
            }

            // ── nothing saved, or nothing saved still works: sweep the pool ──────────────
            statusLine = "در حال یافتن سرور…"
            try {
                val candidates = withContext(Dispatchers.IO) {
                    QuickConnectRepository.nodesFor(context, "all")
                }
                // Returns at the first server that is actually good, not the first that merely
                // answers -- see QuickScanner.quickest.
                val best = QuickScanner.quickest(
                    context = context,
                    candidates = candidates,
                    onProgress = { p ->
                        statusLine = when (p.stage) {
                            QuickScanner.Stage.TCP -> "جست‌وجو… ${p.open} سرور پاسخ‌گو"
                            QuickScanner.Stage.DELAY -> "تست اتصال واقعی… ${p.tested} بررسی‌شده"
                            else -> statusLine
                        }
                    },
                )
                if (best == null) {
                    busy = null
                    statusLine = ""
                    Toast.makeText(context, "سرور سالمی پیدا نشد — دوباره تلاش کنید.", Toast.LENGTH_LONG).show()
                    return@launch
                }
                QuickSavedStore.addAll(context, listOf(best))
                reloadSaved()
                connectTo(best.id, best.uri)
            } catch (e: Exception) {
                busy = null
                statusLine = ""
                Toast.makeText(context, e.message ?: "جست‌وجو ناموفق بود", Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun onBigButton() {
        when (state) {
            QuickState.CONNECTED -> disconnect()
            QuickState.IDLE -> quickConnect()
            else -> {
                // A press while working is a request to abandon, not a second connect.
                if (state == QuickState.SEARCHING) {
                    QuickScanner.stop()
                    statusLine = "لغو شد"
                }
            }
        }
    }

    // ── re-testing the saved list ───────────────────────────────────────────────────────

    fun testAllSaved() {
        if (testingAll || saved.isEmpty()) return
        scope.launch {
            testingAll = true
            testProgress = 0 to saved.size
            try {
                QuickScanner.measureAll(
                    context = context,
                    uris = saved.map { it.id to it.uri },
                    onResult = { id, ms -> QuickSavedStore.updateResult(context, id, ms) },
                    onProgress = { done, total -> testProgress = done to total },
                )
            } finally {
                QuickSavedStore.resort(context)
                reloadSaved()
                testingAll = false
            }
        }
    }

    fun testOne(row: SavedServer) {
        scope.launch {
            QuickSavedStore.updateResult(context, row.id, 0)   // 0 == in flight
            reloadSaved()
            val ms = QuickScanner.measure(context, row.uri)
            QuickSavedStore.updateResult(context, row.id, ms)
            QuickSavedStore.resort(context)
            reloadSaved()
        }
    }

    // ── layout ──────────────────────────────────────────────────────────────────────────

    Box(modifier = Modifier.fillMaxSize().background(BgDark)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(top = topPadding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = bottomPadding + 90.dp)
        ) {
            item {
                Spacer(Modifier.height(8.dp))
                Text("اتصال سریع", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(24.dp))
            }

            item {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    ConnectOrb(state = state, onClick = { onBigButton() })
                }
                Spacer(Modifier.height(16.dp))
            }

            item {
                Text(
                    text = statusLine.ifBlank {
                        when (state) {
                            QuickState.IDLE -> if (saved.any { it.delay > 0 }) "آماده‌ی اتصال" else "برای اتصال خودکار لمس کنید"
                            QuickState.CONNECTED -> "متصل"
                            else -> ""
                        }
                    },
                    color = when (state) {
                        QuickState.CONNECTED -> GreenOk
                        QuickState.DISCONNECTING -> RedError
                        QuickState.IDLE -> TextMuted
                        else -> Primary
                    },
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(12.dp))
            }

            egress?.let {
                item {
                    EgressBanner(it)
                    Spacer(Modifier.height(8.dp))
                }
            }

            // Saved list header + actions
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("سرورهای من", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Text("(${saved.size})", color = TextMuted, fontSize = 13.sp)
                    Spacer(Modifier.weight(1f))
                    if (saved.isNotEmpty()) {
                        IconButton(onClick = { if (testingAll) QuickScanner.stop() else testAllSaved() }) {
                            Icon(
                                if (testingAll) Icons.Default.Stop else Icons.Default.NetworkCheck,
                                contentDescription = "تست همه",
                                tint = if (testingAll) YellowWarn else Primary
                            )
                        }
                        IconButton(onClick = { confirmDelete = true }) {
                            Icon(Icons.Default.DeleteSweep, contentDescription = "حذف", tint = RedError)
                        }
                    }
                }
                if (testingAll) {
                    val (done, total) = testProgress
                    Text("در حال تست: $done از $total", color = TextMuted, fontSize = 12.sp)
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = if (total > 0) done.toFloat() / total else 0f,
                        color = Primary, trackColor = BorderDark,
                        modifier = Modifier.fillMaxWidth().height(3.dp).clip(CircleShape)
                    )
                    Spacer(Modifier.height(8.dp))
                }
            }

            if (saved.isEmpty()) {
                item {
                    Surface(color = SurfaceDark, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                "هنوز سروری ذخیره نشده. دکمه‌ی بالا خودش یک سرور سالم پیدا می‌کند و وصل می‌شود، " +
                                    "یا از «فهرست سرورها» کشور دلخواهتان را بررسی کنید و نتیجه‌ها را به اینجا بیاورید.",
                                color = TextMuted, fontSize = 13.sp
                            )
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                }
            }

            items(saved, key = { it.id }) { row ->
                SavedRow(
                    row = row,
                    connected = isRunning && connectedNodeId == row.id,
                    onConnect = { if (isRunning && connectedNodeId == row.id) disconnect() else connectTo(row.id, row.uri) },
                    onTest = { testOne(row) },
                    onDelete = {
                        QuickSavedStore.remove(context, listOf(row.id))
                        QuickConnectRepository.invalidate()
                        reloadSaved()
                    },
                )
                Spacer(Modifier.height(8.dp))
            }

            item {
                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick = { showServers = true },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Icon(Icons.Default.Dns, contentDescription = null, tint = Primary)
                    Spacer(Modifier.width(8.dp))
                    Text("فهرست سرورها و بررسی کشورها", color = Primary, fontSize = 15.sp)
                }
            }
        }
    }

    if (showServers) {
        QuickServersScreen(
            onDismiss = {
                showServers = false
                reloadSaved()
            },
            onAdopt = { nodes ->
                val added = QuickSavedStore.addAll(context, nodes)
                reloadSaved()
                Toast.makeText(context, "$added سرور به صفحه‌ی اتصال اضافه شد.", Toast.LENGTH_SHORT).show()
            },
        )
    }

    if (confirmDelete) {
        val deadCount = saved.count { it.isDead }
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            containerColor = SurfaceDark,
            icon = { Icon(Icons.Default.DeleteSweep, contentDescription = null, tint = RedError) },
            title = { Text("حذف سرورها", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "سرورهای حذف‌شده دیگر در به‌روزرسانی‌های بعدی فهرست هم دانلود نمی‌شوند.\n\n" +
                        "قطع‌شده‌ها: $deadCount · همه: ${saved.size}",
                    color = TextMuted, fontSize = 13.sp
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    QuickSavedStore.removeDead(context)
                    QuickConnectRepository.invalidate()
                    reloadSaved()
                    confirmDelete = false
                }) { Text("فقط قطع‌شده‌ها ($deadCount)", color = YellowWarn) }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = { confirmDelete = false }) { Text("انصراف", color = TextMuted) }
                    TextButton(onClick = {
                        QuickSavedStore.remove(context, saved.map { it.id })
                        QuickConnectRepository.invalidate()
                        reloadSaved()
                        confirmDelete = false
                    }) { Text("همه", color = RedError) }
                }
            }
        )
    }
}

/**
 * The connect button.
 *
 * Each state gets its own colour and its own motion, so the button reads at a glance without
 * the label: idle breathes slowly, working sweeps a rotating arc, connected is still (a solid
 * ring — motion on a settled state is noise), disconnecting sweeps red.
 */
@Composable
private fun ConnectOrb(state: QuickState, onClick: () -> Unit) {
    val working = state == QuickState.SEARCHING || state == QuickState.CONNECTING
    val target = when (state) {
        QuickState.CONNECTED -> GreenOk
        QuickState.DISCONNECTING -> RedError
        QuickState.SEARCHING, QuickState.CONNECTING -> Primary
        QuickState.IDLE -> TextDim
    }
    val ringColor by animateColorAsState(target, animationSpec = tween(420), label = "orbColor")

    val transition = rememberInfiniteTransition(label = "orb")
    val sweepAngle by transition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(1400, easing = LinearEasing)),
        label = "sweep"
    )
    // Idle breathes; every other state holds its size so only one thing is moving at a time.
    val breathe by transition.animateFloat(
        initialValue = 0.97f, targetValue = 1.03f,
        animationSpec = infiniteRepeatable(tween(2200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "breathe"
    )
    val pressScale by animateFloatAsState(if (state == QuickState.IDLE) breathe else 1f, label = "scale")

    Box(
        modifier = Modifier.size(210.dp).scale(pressScale),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = 10.dp.toPx()
            val inset = stroke / 2 + 8.dp.toPx()
            val arcSize = Size(size.width - inset * 2, size.height - inset * 2)
            val topLeft = Offset(inset, inset)

            // Halo — the soft outer field. Kept faint so it reads as depth, not decoration.
            drawCircle(
                brush = Brush.radialGradient(
                    listOf(ringColor.copy(alpha = 0.22f), Color.Transparent),
                    center = center,
                    radius = size.minDimension / 2f
                ),
                radius = size.minDimension / 2f
            )

            // Track — always the full circle, so a partial arc reads as progress against it.
            drawArc(
                color = BorderDark,
                startAngle = 0f, sweepAngle = 360f, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round)
            )

            when {
                working -> drawArc(
                    color = ringColor,
                    startAngle = sweepAngle, sweepAngle = 90f, useCenter = false,
                    topLeft = topLeft, size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
                state == QuickState.DISCONNECTING -> drawArc(
                    color = ringColor,
                    startAngle = -sweepAngle, sweepAngle = 70f, useCenter = false,
                    topLeft = topLeft, size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
                state == QuickState.CONNECTED -> drawArc(
                    color = ringColor,
                    startAngle = 0f, sweepAngle = 360f, useCenter = false,
                    topLeft = topLeft, size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
                else -> drawArc(
                    color = ringColor.copy(alpha = 0.5f),
                    startAngle = -90f, sweepAngle = 120f, useCenter = false,
                    topLeft = topLeft, size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
            }
        }

        Surface(
            color = SurfaceDark,
            shape = CircleShape,
            shadowElevation = 8.dp,
            modifier = Modifier.size(150.dp).clip(CircleShape).clickable { onClick() }
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = when (state) {
                        QuickState.CONNECTED -> Icons.Default.PowerSettingsNew
                        QuickState.SEARCHING -> Icons.Default.Search
                        else -> Icons.Default.PowerSettingsNew
                    },
                    contentDescription = null,
                    tint = ringColor,
                    modifier = Modifier.size(46.dp)
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    when (state) {
                        QuickState.IDLE -> "اتصال"
                        QuickState.SEARCHING -> "جست‌وجو"
                        QuickState.CONNECTING -> "اتصال…"
                        QuickState.CONNECTED -> "قطع اتصال"
                        QuickState.DISCONNECTING -> "قطع…"
                    },
                    color = ringColor, fontSize = 14.sp, fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/** What the live trace found, once the tunnel is up. */
@Composable
private fun EgressBanner(res: EgressResult) {
    val (text, tint) = when {
        !res.ok -> "خروجی بررسی نشد: ${res.error}" to YellowWarn
        // A reading whose IP matches the phone's own is not the exit; it is a request that
        // never entered the tunnel. Saying "verified" there would be a lie.
        !res.tunnelled -> "اتصال برقرار است، ولی کشور خروج تأیید نشد — دوباره وصل شوید." to YellowWarn
        // WARP reports the USER's country by design, so this is transit, not location.
        res.warp -> "مسیر تأیید شد (WARP · ${res.colo ?: "—"}) — کشور خروج از این راه قابل اثبات نیست." to GreenOk
        else -> "خروج واقعی: ${res.country?.label ?: res.loc} · ${res.colo ?: "—"} · ${res.ip ?: ""}" to GreenOk
    }
    Surface(color = tint.copy(alpha = 0.12f), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
        Text(text, color = tint, fontSize = 12.sp, modifier = Modifier.padding(10.dp))
    }
}

@Composable
private fun SavedRow(
    row: SavedServer,
    connected: Boolean,
    onConnect: () -> Unit,
    onTest: () -> Unit,
    onDelete: () -> Unit,
) {
    val testing = row.delay == 0 && row.testedAt > 0
    Surface(
        color = SurfaceDark,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .then(if (connected) Modifier.border(1.dp, GreenOk, RoundedCornerShape(12.dp)) else Modifier)
    ) {
        Row(
            modifier = Modifier.padding(start = 12.dp, end = 4.dp, top = 8.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(row.flag ?: "🏳️", fontSize = 20.sp)
            Spacer(Modifier.width(10.dp))
            Column(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).clickable { onConnect() }.padding(vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(row.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    if (row.isNew) {
                        Spacer(Modifier.width(6.dp))
                        Badge("جدید", Primary)
                    }
                    if (row.isDead) {
                        Spacer(Modifier.width(6.dp))
                        Badge("قطع", RedError)
                    }
                }
                Text(
                    listOfNotNull(row.countryName, row.protocol.uppercase()).joinToString(" · "),
                    color = TextMuted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
                )
            }
            Text(
                when {
                    testing -> "…"
                    row.delay > 0 -> "${row.delay} ms"
                    row.testedAt > 0 -> "قطع"
                    else -> "—"
                },
                color = when {
                    row.delay in 1..399 -> GreenOk
                    row.delay in 400..999 -> YellowWarn
                    row.isDead -> RedError
                    else -> TextDim
                },
                fontSize = 13.sp, fontWeight = FontWeight.Bold
            )
            IconButton(onClick = onTest, modifier = Modifier.size(38.dp)) {
                Icon(Icons.Default.Refresh, contentDescription = "تست دوباره", tint = TextMuted, modifier = Modifier.size(18.dp))
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(38.dp)) {
                Icon(Icons.Default.Close, contentDescription = "حذف", tint = RedError, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
internal fun Badge(text: String, color: Color) {
    Surface(color = color.copy(alpha = 0.18f), shape = RoundedCornerShape(6.dp)) {
        Text(text, color = color, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp))
    }
}
