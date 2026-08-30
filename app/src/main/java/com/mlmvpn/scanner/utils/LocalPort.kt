package com.mlmvpn.scanner.utils

import android.content.Context
import androidx.preference.PreferenceManager

/**
 * The app's Local Port setting, and the rules that make a value valid.
 *
 * The setting is not one port. Everything that starts a tunnel uses `port` for the mixed
 * SOCKS/HTTP inbound and `port + 10000` for the status/country probe — a convention shared with
 * the GST engine, which listens there regardless of which engine is connected. So a value is
 * only usable if BOTH land somewhere legal and neither collides with a range the app has
 * already spoken for.
 *
 * Before this existed the settings field accepted any text at all. Most readers do
 * `getString("local_port","10808")?.toIntOrNull() ?: 10808`, which quietly rescues an empty or
 * non-numeric value — but a *valid* number in the wrong place is not rescued by anything:
 *
 *   - 21000 puts the probe on 31000, inside the throwaway range the delay tester walks, so
 *     bulk tests and the probe fight over the same port
 *   - anything at or above 55536 puts the probe past 65535, so it can never bind
 *   - a port inside 31000-34999 collides with the delay tester directly
 *   - 20810 is Aether's
 *
 * None of these announce themselves. They present as "every server tests as dead" or "the
 * status bar never finds the country", which is a long way from "the port you typed".
 */
object LocalPort {

    const val DEFAULT = 10808
    const val KEY = "local_port"

    /** The probe offset. Not configurable; several engines assume it. */
    const val PROBE_OFFSET = 10000

    private const val MIN = 1024
    // Above this the probe (port + 10000) would exceed 65535.
    private const val MAX = 65535 - PROBE_OFFSET

    private const val AETHER_PORT = 20810

    /** Null when [raw] is usable; otherwise a Persian sentence naming the actual problem. */
    fun validate(raw: String?): String? {
        val text = raw?.trim().orEmpty()
        if (text.isEmpty()) return "پورت محلی نمی‌تواند خالی باشد."
        val port = text.toIntOrNull() ?: return "پورت باید فقط عدد باشد."
        if (port < MIN) return "پورت باید $MIN یا بیشتر باشد (پورت‌های پایین‌تر مال سیستم است)."
        if (port > MAX) return "پورت باید $MAX یا کمتر باشد، چون برنامه از پورت + $PROBE_OFFSET هم استفاده می‌کند."
        if (port == AETHER_PORT) return "این پورت برای موتور Aether رزرو شده است."
        val probe = port + PROBE_OFFSET
        val testRange = XrayJsonGenerator.TEST_PORT_MIN..XrayJsonGenerator.TEST_PORT_MAX
        if (port in testRange) {
            return "این پورت در بازه‌ی ${XrayJsonGenerator.TEST_PORT_MIN}–${XrayJsonGenerator.TEST_PORT_MAX} است که برای تست سرورها استفاده می‌شود."
        }
        if (probe in testRange) {
            return "برنامه از پورت $probe هم استفاده می‌کند و آن در بازه‌ی تست سرورهاست. عدد دیگری انتخاب کنید."
        }
        return null
    }

    /**
     * The configured port, or [DEFAULT] when what is stored is unusable.
     *
     * Every caller went through `?: DEFAULT` on its own before, which caught bad text but not a
     * bad number. Going through here means one definition of "usable" instead of nine.
     */
    fun get(context: Context): Int {
        val raw = PreferenceManager.getDefaultSharedPreferences(context).getString(KEY, DEFAULT.toString())
        return if (validate(raw) == null) raw!!.trim().toInt() else DEFAULT
    }

    /** The same value as a string, for the intent extras the services read. */
    fun getString(context: Context): String = get(context).toString()

    /** The probe/secondary port that goes with [get]. */
    fun probe(context: Context): Int = get(context) + PROBE_OFFSET
}
