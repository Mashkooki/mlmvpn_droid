package com.mlmvpn.scanner.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.mlmvpn.scanner.quick.*
import com.mlmvpn.scanner.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * The server pool: pick a country, sweep it, keep what works.
 *
 * This is the browsing half of Quick Connect, deliberately separate from the connect screen.
 * The pool is thousands of entries and mostly dead at any moment; the connect screen is a
 * short list of servers that have proved themselves. Mixing the two would put a wall of
 * untested rows in front of the one button that is supposed to just work.
 */
@Composable
fun QuickServersScreen(
    onDismiss: () -> Unit,
    /** Hand proven servers to the connect screen's saved list. */
    onAdopt: (List<QuickNode>) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var catalog by remember { mutableStateOf<QuickCatalog?>(null) }
    var loading by remember { mutableStateOf(true) }
    var loadError by remember { mutableStateOf<String?>(null) }

    var selectedCountry by remember { mutableStateOf<String?>(null) }
    var showPicker by remember { mutableStateOf(false) }

    // Owned by QuickScanSession, not by this composable: a sweep has to survive the user
    // navigating away, which is exactly what a composition-scoped coroutine cannot do.
    val results by QuickScanSession.results.collectAsState()
    val progress by QuickScanSession.progress.collectAsState()
    val scanning by QuickScanSession.running.collectAsState()
    val sessionError by QuickScanSession.error.collectAsState()
    val sessionLabel by QuickScanSession.label.collectAsState()
    var confirmDelete by remember { mutableStateOf(false) }

    // The targeted sweep: "N servers from M countries".
    var wantCount by remember { mutableStateOf(50) }
    var wantCountries by remember { mutableStateOf(5) }

    /** Ids already on the connect screen, so the list can say which are not new. */
    val savedIds = remember { QuickSavedStore.all(context).map { it.id }.toHashSet() }

    suspend fun reload(force: Boolean) {
        loading = true
        loadError = null
        try {
            catalog = withContext(Dispatchers.IO) { QuickConnectRepository.catalog(context, force) }
        } catch (e: Exception) {
            loadError = e.message ?: "فهرست سرورها دریافت نشد."
        } finally {
            loading = false
        }
    }

    LaunchedEffect(Unit) { reload(false) }
    // Back leaves the screen; it does not cancel the sweep. Stopping is an explicit request
    // (the "stop" button), never a side effect of navigating.
    BackHandler(enabled = true) { onDismiss() }

    fun startScan(all: Boolean) {
        if (scanning) return
        val countryName = catalog?.countries?.firstOrNull { it.code == selectedCountry }?.name ?: "همه کشورها"
        QuickScanSession.startScan(
            context = context,
            country = selectedCountry,
            // "Check them all" means exactly that -- no target to stop early at. The quick sweep
            // stops at 20 because the user wants to get online, not to survey.
            want = if (all) Int.MAX_VALUE else 20,
            label = if (all) "بررسی همه سرورهای $countryName" else "بررسی سریع $countryName",
        )
    }

    /** "N servers from M countries" -- every result proven, spread evenly across the countries. */
    fun startBalanced() {
        if (scanning) return
        QuickScanSession.startBalanced(
            context = context,
            countryCount = wantCountries,
            want = wantCount,
            label = "یافتن $wantCount سرور از $wantCountries کشور",
        )
    }

    val selectedRow = catalog?.countries?.firstOrNull { it.code == selectedCountry }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(color = BgDark, modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.fillMaxSize().padding(top = LocalSystemTopPadding.current)) {

                Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "بازگشت", tint = TextPrimary)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("فهرست سرورها", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Text(
                            when {
                                loading && catalog == null -> "در حال دریافت…"
                                catalog != null -> "${catalog!!.total} سرور · ${QuickConnectRepository.SOURCE_REFRESH_LABEL}"
                                else -> "—"
                            },
                            color = TextMuted, fontSize = 11.sp
                        )
                    }
                    IconButton(onClick = { scope.launch { reload(true) } }, enabled = !loading && !scanning) {
                        Icon(Icons.Default.Refresh, contentDescription = "به‌روزرسانی فهرست", tint = if (loading) TextDim else Primary)
                    }
                }

                // Country selector
                Surface(
                    color = SurfaceDark,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth().padding(horizontal = 16.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(enabled = catalog != null) { showPicker = true }
                ) {
                    Row(modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(selectedRow?.flag ?: "🌐", fontSize = 22.sp)
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(selectedRow?.name ?: "همه کشورها", color = TextPrimary, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(
                                selectedRow?.let { "${it.count} سرور" } ?: (catalog?.let { "${it.total} سرور" } ?: "…"),
                                color = TextMuted, fontSize = 12.sp
                            )
                        }
                        Icon(Icons.Default.ExpandMore, contentDescription = null, tint = TextMuted)
                    }
                }

                Spacer(Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    Button(
                        onClick = { if (scanning) QuickScanner.stop() else startScan(false) },
                        enabled = catalog != null,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (scanning) YellowWarn else Primary, contentColor = BgDark
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        Text(if (scanning) "توقف" else "بررسی سریع", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(8.dp))
                    OutlinedButton(
                        onClick = { startScan(true) },
                        enabled = catalog != null && !scanning,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        Text("بررسی همه سرورها", color = Primary, fontSize = 14.sp)
                    }
                }

                // Targeted sweep. Separate from the two buttons above because it ignores the
                // country selector entirely -- it picks its own countries, by pool size.
                Spacer(Modifier.height(14.dp))
                Surface(color = SurfaceDark, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("جست‌وجوی هدف‌دار", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(2.dp))
                        Text(
                            "همه‌ی نتیجه‌ها با اتصال واقعی تأیید می‌شوند و به‌طور مساوی بین کشورها پخش می‌شوند.",
                            color = TextMuted, fontSize = 11.sp
                        )
                        Spacer(Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("تعداد سرور", color = TextMuted, fontSize = 12.sp)
                            Spacer(Modifier.width(8.dp))
                            listOf(10, 25, 50, 100).forEach { n ->
                                ChoiceChip(n.toString(), wantCount == n, !scanning) { wantCount = n }
                                Spacer(Modifier.width(6.dp))
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("از چند کشور", color = TextMuted, fontSize = 12.sp)
                            Spacer(Modifier.width(8.dp))
                            listOf(1, 3, 5, 10).forEach { n ->
                                ChoiceChip(n.toString(), wantCountries == n, !scanning) { wantCountries = n }
                                Spacer(Modifier.width(6.dp))
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        Button(
                            onClick = { if (scanning) QuickScanner.stop() else startBalanced() },
                            enabled = catalog != null,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (scanning) YellowWarn else Primary, contentColor = BgDark
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().height(42.dp)
                        ) {
                            Text(
                                if (scanning) "توقف" else "یافتن $wantCount سرور از $wantCountries کشور",
                                fontSize = 14.sp, fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                if (progress.stage != QuickScanner.Stage.IDLE) ScanStrip(progress, sessionLabel, scanning)

                (loadError ?: sessionError)?.let {
                    Surface(color = RedError.copy(alpha = 0.12f), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                        Text(it, color = RedError, fontSize = 13.sp, modifier = Modifier.padding(12.dp))
                    }
                }
                catalog?.takeIf { it.stale }?.let {
                    Text(
                        "فهرست ذخیره‌شده نمایش داده می‌شود — دریافت تازه ناموفق بود.",
                        color = YellowWarn, fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                    )
                }

                if (results.isNotEmpty()) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("${results.size} سرور سالم", color = GreenOk, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.weight(1f))
                        IconButton(onClick = { confirmDelete = true }) {
                            Icon(Icons.Default.DeleteSweep, contentDescription = "حذف", tint = RedError)
                        }
                    }
                    Button(
                        onClick = { onAdopt(results) },
                        colors = ButtonDefaults.buttonColors(containerColor = GreenOk, contentColor = BgDark),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(46.dp)
                    ) {
                        Icon(Icons.Default.PlaylistAdd, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("افزودن ${results.size} سرور به صفحه‌ی اتصال", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(8.dp))
                }

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = LocalSystemBottomPadding.current + 16.dp)
                ) {
                    items(results, key = { it.id }) { node ->
                        ResultRow(
                            node = node,
                            alreadySaved = node.id in savedIds,
                            onDelete = {
                                QuickSavedStore.remove(context, listOf(node.id))
                                QuickConnectRepository.invalidate()
                                QuickScanSession.removeResults(listOf(node.id))
                            },
                        )
                        Spacer(Modifier.height(8.dp))
                    }
                    if (results.isEmpty() && !scanning) {
                        item {
                            Text(
                                "کشور را انتخاب کنید و «بررسی سریع» را بزنید. «بررسی همه سرورها» کل سرورهای آن کشور را " +
                                    "تست می‌کند — کامل‌تر است ولی طول می‌کشد.",
                                color = TextMuted, fontSize = 13.sp, modifier = Modifier.padding(vertical = 24.dp)
                            )
                        }
                    }
                    catalog?.sources?.takeIf { it.isNotEmpty() }?.let { sources ->
                        item {
                            Spacer(Modifier.height(16.dp))
                            Text(QuickConnectRepository.SOURCE_REFRESH_LABEL, color = TextDim, fontSize = 11.sp)
                            Spacer(Modifier.height(4.dp))
                            sources.forEach { s ->
                                Text(
                                    if (s.ok) "• ${s.title}: ${s.usable} سرور" else "• ${s.title}: ناموفق (${s.error ?: "—"})",
                                    color = if (s.ok) TextDim else RedError, fontSize = 11.sp,
                                    modifier = Modifier.padding(vertical = 2.dp)
                                )
                            }
                            val blocked = QuickBlocklist.count(context)
                            if (blocked > 0) {
                                Spacer(Modifier.height(6.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("$blocked سرور حذف‌شده (دیگر دانلود نمی‌شوند)", color = TextDim, fontSize = 11.sp)
                                    TextButton(onClick = {
                                        QuickBlocklist.clear(context)
                                        QuickConnectRepository.invalidate()
                                        scope.launch { reload(true) }
                                    }) { Text("بازگرداندن", color = Primary, fontSize = 11.sp) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPicker) {
        CountryPickerDialog(
            catalog = catalog,
            selected = selectedCountry,
            onPick = { code ->
                selectedCountry = code
                showPicker = false
                // A running sweep keeps its results; only an idle screen is cleared.
                QuickScanSession.reset()
            },
            onDismiss = { showPicker = false },
            onForgetVerified = {
                QuickConnectRepository.forgetVerified(context)
                scope.launch { reload(true) }
            },
        )
    }

    if (confirmDelete) {
        val dead = results.filter { it.delay <= 0 }
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            containerColor = SurfaceDark,
            icon = { Icon(Icons.Default.DeleteSweep, contentDescription = null, tint = RedError) },
            title = { Text("حذف از فهرست", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "سرورهای حذف‌شده در به‌روزرسانی‌های بعدی هم دانلود نمی‌شوند و دیگر در هیچ بررسی‌ای شرکت نمی‌کنند.",
                    color = TextMuted, fontSize = 13.sp
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    QuickSavedStore.remove(context, dead.map { it.id })
                    QuickConnectRepository.invalidate()
                    QuickScanSession.removeResults(dead.map { it.id })
                    confirmDelete = false
                }) { Text("قطع‌شده‌ها (${dead.size})", color = YellowWarn) }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = { confirmDelete = false }) { Text("انصراف", color = TextMuted) }
                    TextButton(onClick = {
                        QuickSavedStore.remove(context, results.map { it.id })
                        QuickConnectRepository.invalidate()
                        QuickScanSession.removeResults(results.map { it.id })
                        confirmDelete = false
                    }) { Text("همه (${results.size})", color = RedError) }
                }
            }
        )
    }
}

@Composable
private fun ChoiceChip(text: String, selected: Boolean, enabled: Boolean, onClick: () -> Unit) {
    Surface(
        color = if (selected) Primary.copy(alpha = 0.22f) else BgDark,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable(enabled = enabled) { onClick() }
    ) {
        Text(
            text,
            color = if (selected) Primary else TextMuted,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

@Composable
private fun ResultRow(node: QuickNode, alreadySaved: Boolean, onDelete: () -> Unit) {
    Surface(color = SurfaceDark, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(start = 12.dp, end = 4.dp, top = 8.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(node.flag ?: "🏳️", fontSize = 20.sp)
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(node.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.width(6.dp))
                    // "Already here" vs "new to you" -- so a second sweep of the same country
                    // shows at a glance what it actually added.
                    if (alreadySaved) Badge("قبلاً تست‌شده", TextMuted) else Badge("جدید", Primary)
                    if (node.verified) {
                        Spacer(Modifier.width(6.dp))
                        Icon(Icons.Default.Verified, contentDescription = "کشور تأییدشده", tint = GreenOk, modifier = Modifier.size(13.dp))
                    }
                }
                Text(
                    listOfNotNull(node.countryName, node.protocol.uppercase()).joinToString(" · "),
                    color = TextMuted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
                )
            }
            Text(
                if (node.delay > 0) "${node.delay} ms" else "—",
                color = when {
                    node.delay in 1..399 -> GreenOk
                    node.delay in 400..999 -> YellowWarn
                    node.delay > 0 -> RedError
                    else -> TextDim
                },
                fontSize = 13.sp, fontWeight = FontWeight.Bold
            )
            IconButton(onClick = onDelete, modifier = Modifier.size(38.dp)) {
                Icon(Icons.Default.Close, contentDescription = "حذف", tint = RedError, modifier = Modifier.size(18.dp))
            }
        }
    }
}

/** Live progress for the two-stage sweep. */
@Composable
private fun ScanStrip(p: QuickScanner.Progress, label: String, running: Boolean) {
    val text = when (p.stage) {
        QuickScanner.Stage.TCP -> "مرحله ۱ از ۲ — بررسی دسترسی: ${p.tested} از ${p.total} · ${p.open} پاسخ‌گو"
        QuickScanner.Stage.DELAY -> "مرحله ۲ از ۲ — اتصال واقعی: ${p.tested} از ${p.total} · ${p.found} سالم"
        QuickScanner.Stage.DONE -> when {
            p.empty -> "هیچ سرور پاسخ‌گویی پیدا نشد."
            p.stopped -> "متوقف شد — ${p.found} سرور سالم نگه داشته شد."
            else -> "${p.found} سرور سالم پیدا شد."
        }
        QuickScanner.Stage.IDLE -> ""
    }
    val fraction = if (p.total > 0 && p.stage != QuickScanner.Stage.DONE) {
        (p.tested.toFloat() / p.total).coerceIn(0f, 1f)
    } else 1f

    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
        if (label.isNotBlank()) {
            Text(
                if (running) label else "$label — پایان یافت",
                color = if (running) Primary else TextMuted,
                fontSize = 12.sp, fontWeight = FontWeight.Bold
            )
        }
        Text(text, color = TextMuted, fontSize = 12.sp)
        Spacer(Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = fraction,
            color = if (p.stage == QuickScanner.Stage.DONE) GreenOk else Primary,
            trackColor = BorderDark,
            modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape)
        )
    }
}

@Composable
private fun CountryPickerDialog(
    catalog: QuickCatalog?,
    selected: String?,
    onPick: (String?) -> Unit,
    onDismiss: () -> Unit,
    onForgetVerified: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    val rows = remember(catalog, query) {
        val all = catalog?.countries.orEmpty()
        if (query.isBlank()) all else all.filter { it.name.contains(query, true) || it.code.contains(query, true) }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(color = BgDark, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth(0.92f).fillMaxHeight(0.85f)) {
            Column {
                Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "بازگشت", tint = TextPrimary)
                    }
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        placeholder = { Text("جست‌وجوی کشور…", color = TextDim) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary, unfocusedTextColor = TextPrimary,
                            focusedBorderColor = Primary, unfocusedBorderColor = BorderDark,
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }

                LazyColumn(modifier = Modifier.weight(1f), contentPadding = PaddingValues(horizontal = 12.dp)) {
                    item { CountryRow("🌐", "همه کشورها", catalog?.total ?: 0, selected == null) { onPick(null) } }
                    items(rows, key = { it.code }) { row ->
                        CountryRow(row.flag, row.name, row.count, selected == row.code) { onPick(row.code) }
                    }
                    if ((catalog?.unknown ?: 0) > 0) {
                        item { CountryRow("🏳️", "نامشخص", catalog!!.unknown, selected == "unknown") { onPick("unknown") } }
                    }
                }

                if ((catalog?.verified ?: 0) > 0) {
                    TextButton(onClick = { onForgetVerified(); onDismiss() }, modifier = Modifier.fillMaxWidth().padding(8.dp)) {
                        Text("پاک کردن کشورهای اندازه‌گیری‌شده (${catalog!!.verified})", color = TextMuted, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun CountryRow(flag: String, name: String, count: Int, selected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .then(if (selected) Modifier.background(Primary.copy(alpha = 0.14f)) else Modifier)
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(flag, fontSize = 20.sp)
        Spacer(Modifier.width(12.dp))
        Text(name, color = TextPrimary, fontSize = 15.sp, modifier = Modifier.weight(1f))
        Text("$count", color = TextMuted, fontSize = 13.sp)
    }
}
