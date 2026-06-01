package com.securepay.security

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.TrafficStats
import android.os.*
import androidx.core.app.NotificationCompat
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class MonitoringService : Service() {

    companion object {
        const val CHANNEL_MONITOR = "securepay_monitor"
        const val CHANNEL_ALERTS  = "securepay_alerts"
        const val NOTIF_FOREGROUND = 1001
        const val PREFS_NAME       = "monitor_alerts"
        const val PREFS_KEY        = "alerts_json"
        const val POLL_MS          = 30_000L   // check every 30 seconds
        const val COOLDOWN_MS      = 5 * 60 * 1000L  // no repeat alert within 5 min
    }

    private val handler = Handler(Looper.getMainLooper())
    private val alertCooldowns = mutableMapOf<String, Long>()

    // Network delta tracking
    private var prevRxBytes    = 0L
    private var prevTxBytes    = 0L
    private var prevTimestamp  = 0L

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIF_FOREGROUND, buildForegroundNotif("🔒 Monitoring active..."))
        handler.post(monitorRunnable)
        return START_STICKY   // restart if killed by OS
    }

    override fun onDestroy() {
        handler.removeCallbacks(monitorRunnable)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?) = null

    // ─── Main Polling Loop ────────────────────────────────────────────────────

    private val monitorRunnable = object : Runnable {
        override fun run() {
            runChecks()
            handler.postDelayed(this, POLL_MS)
        }
    }

    private fun runChecks() {
        val pendingAlerts = mutableListOf<Triple<String, String, String>>() // key, title, body

        // ── 0. Security Threats (USB Debug, Screen Record, Root) ──────────────
        
        // USB Debugging
        val adbEnabled = try {
            Settings.Global.getInt(contentResolver, Settings.Global.ADB_ENABLED, 0) != 0
        } catch(e: Exception) { false }
        if (adbEnabled) {
            pendingAlerts.add(Triple(
                "usb_debugging",
                "⚠️ USB Debugging Active",
                "Your device has USB debugging turned on, which can allow malicious connections."
            ))
        }

        // Screen Recording Check (DisplayManager & Accessibility)
        var isRecording = false
        val displayManager = getSystemService(Context.DISPLAY_SERVICE) as? android.hardware.display.DisplayManager
        if (displayManager != null) {
            for (display in displayManager.displays) {
                val flags = display.flags
                val isVirtual = display.displayId != android.view.Display.DEFAULT_DISPLAY
                val isSecure = (flags and android.view.Display.FLAG_SECURE) != 0
                val name = display.name?.lowercase() ?: ""
                
                if (isVirtual && !isSecure) {
                    if (name.contains("virtual") || name.contains("screen") || 
                        name.contains("record") || name.contains("cast") || 
                        name.contains("capture") || name.contains("vnc")) {
                        isRecording = true
                        break
                    }
                }
            }
        }
        if (!isRecording) {
            val am = getSystemService(Context.ACCESSIBILITY_SERVICE) as? android.view.accessibility.AccessibilityManager
            isRecording = am?.isEnabled == true &&
                    Settings.Secure.getString(
                        contentResolver,
                        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                    )?.contains("screen", ignoreCase = true) == true
        }
        if (isRecording) {
            pendingAlerts.add(Triple(
                "screen_recording",
                "🛑 Screen Recording Detected",
                "An app is actively capturing your screen! Your passwords and banking data are at risk."
            ))
        }

        // Root / Jailbreak Check
        var isRooted = false
        if (Build.TAGS?.contains("test-keys") == true) isRooted = true
        val paths = arrayOf("/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su", "/data/local/xbin/su", "/data/local/bin/su", "/system/sd/xbin/su", "/system/bin/failsafe/su", "/data/local/su")
        for (path in paths) {
            if (java.io.File(path).exists()) {
                isRooted = true
                break
            }
        }
        if (isRooted) {
            pendingAlerts.add(Triple(
                "device_rooted",
                "❌ Device Rooted",
                "Your device is rooted/jailbroken. Banking features may be compromised."
            ))
        }

        // ── 1. Temperature ────────────────────────────────────────────────────
        val tempC = getBatteryTemp()
        val tempStr = if (tempC >= 0) "%.1f°C".format(tempC) else "—"

        when {
            tempC >= 50.0 -> pendingAlerts.add(Triple(
                "temp_critical",
                "🚨 Critical Temperature: $tempStr",
                "Your phone is dangerously hot! A hidden process may be running. Check active apps immediately."
            ))
            tempC >= 45.0 -> pendingAlerts.add(Triple(
                "temp_hot",
                "🔥 Phone Overheating: $tempStr",
                "Battery temperature is above 45°C. A background app may be draining resources."
            ))
        }

        // ── 2. Network Speed ──────────────────────────────────────────────────
        val now    = System.currentTimeMillis()
        val totalRx = TrafficStats.getTotalRxBytes()
        val totalTx = TrafficStats.getTotalTxBytes()

        if (prevTimestamp > 0 && totalTx >= 0 && totalRx >= 0) {
            val deltaMs   = (now - prevTimestamp).coerceAtLeast(1)
            val txPerSec  = ((totalTx - prevTxBytes)  * 1000L / deltaMs).coerceAtLeast(0)
            val rxPerSec  = ((totalRx - prevRxBytes)  * 1000L / deltaMs).coerceAtLeast(0)

            val hour    = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
            val isNight = hour >= 23 || hour < 6
            val timeTag = if (isNight) " at night (${hour}:00)" else ""

            // Suspicious upload: >500 KB/s any time, >100 KB/s at night
            val uploadLimit = if (isNight) 100 * 1024L else 500 * 1024L
            if (txPerSec > uploadLimit) {
                pendingAlerts.add(Triple(
                    "upload_spike",
                    "⬆️ Suspicious Data Upload$timeTag",
                    "Your phone is sending ${fmtBytes(txPerSec)}/s$timeTag. This may indicate a data leak or spyware."
                ))
            }

            // Suspicious download spike at night: >2 MB/s
            if (isNight && rxPerSec > 2 * 1024 * 1024L) {
                pendingAlerts.add(Triple(
                    "download_night",
                    "⬇️ Unusual Download at Night",
                    "Your phone is receiving ${fmtBytes(rxPerSec)}/s at ${hour}:00. Something is being downloaded silently."
                ))
            }

            // Combined: heat + upload = high risk
            if (tempC >= 42.0 && txPerSec > 200 * 1024L) {
                pendingAlerts.add(Triple(
                    "heat_upload_combo",
                    "⚠️ HIGH RISK: Overheating + Data Leak",
                    "Phone is at $tempStr AND sending ${fmtBytes(txPerSec)}/s. Possible spyware or screen recorder active!"
                ))
            }
        }

        prevRxBytes   = totalRx
        prevTxBytes   = totalTx
        prevTimestamp = now

        // ── 3. Fire alerts with cooldown ──────────────────────────────────────
        for ((key, title, body) in pendingAlerts) {
            val lastFired = alertCooldowns[key] ?: 0L
            if (System.currentTimeMillis() - lastFired > COOLDOWN_MS) {
                fireAlertNotification(title, body)
                saveAlertToHistory(title, body, tempC, now)
                alertCooldowns[key] = System.currentTimeMillis()
            }
        }

        // ── 4. Update persistent foreground notification ───────────────────────
        updateForegroundNotif("🔒 Monitoring · Temp: $tempStr · Alerts: ${getAlertCount()}")
    }

    // ─── Temperature ──────────────────────────────────────────────────────────

    private fun getBatteryTemp(): Double {
        return try {
            val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val bs = registerReceiver(null, ifilter)
            val raw = bs?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -10) ?: -10
            if (raw >= 0) raw / 10.0 else -1.0
        } catch (e: Exception) { -1.0 }
    }

    // ─── Notification Channels ────────────────────────────────────────────────

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            NotificationChannel(CHANNEL_MONITOR, "Monitor Status", NotificationManager.IMPORTANCE_LOW)
                .apply { description = "Persistent background monitoring status" }
                .let { nm.createNotificationChannel(it) }

            NotificationChannel(CHANNEL_ALERTS, "Security Alerts", NotificationManager.IMPORTANCE_HIGH)
                .apply {
                    description = "Suspicious activity alerts"
                    enableVibration(true)
                    setShowBadge(true)
                }
                .let { nm.createNotificationChannel(it) }
        }
    }

    private fun buildForegroundNotif(text: String): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pi = PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_IMMUTABLE)

        return NotificationCompat.Builder(this, CHANNEL_MONITOR)
            .setContentTitle("SecurePay Guardian")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pi)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun updateForegroundNotif(text: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_FOREGROUND, buildForegroundNotif(text))
    }

    private fun fireAlertNotification(title: String, body: String) {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pi = PendingIntent.getActivity(
            this, System.currentTimeMillis().toInt(), launchIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val notif = NotificationCompat.Builder(this, CHANNEL_ALERTS)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(System.currentTimeMillis().toInt(), notif)
    }

    // ─── Alert History (SharedPreferences) ───────────────────────────────────

    private fun saveAlertToHistory(title: String, body: String, tempC: Double, timestamp: Long) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val existing = try { JSONArray(prefs.getString(PREFS_KEY, "[]")) } catch (e: Exception) { JSONArray() }

        val entry = JSONObject().apply {
            put("title", title)
            put("body", body)
            put("tempC", if (tempC >= 0) tempC else JSONObject.NULL)
            put("timestamp", timestamp)
        }

        val updated = JSONArray()
        updated.put(entry)
        for (i in 0 until minOf(existing.length(), 49)) updated.put(existing.get(i))

        prefs.edit().putString(PREFS_KEY, updated.toString()).apply()
    }

    private fun getAlertCount(): Int {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return try { JSONArray(prefs.getString(PREFS_KEY, "[]")).length() } catch (e: Exception) { 0 }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun fmtBytes(b: Long): String = when {
        b > 1024 * 1024 -> "%.1f MB".format(b / (1024.0 * 1024.0))
        b > 1024         -> "%.1f KB".format(b / 1024.0)
        else             -> "$b B"
    }
}
