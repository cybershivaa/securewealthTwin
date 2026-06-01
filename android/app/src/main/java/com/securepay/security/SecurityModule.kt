package com.securepay.security

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.TrafficStats
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileReader

class SecurityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val CONFIRM_CREDENTIALS_REQUEST_CODE = 4920
    private var pendingAuthPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(object : BaseActivityEventListener() {
            override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
                if (requestCode == CONFIRM_CREDENTIALS_REQUEST_CODE) {
                    if (resultCode == Activity.RESULT_OK) {
                        pendingAuthPromise?.resolve(true)
                    } else {
                        pendingAuthPromise?.resolve(false)
                    }
                    pendingAuthPromise = null
                }
            }
        })
    }

    override fun getName(): String {
        return "SecurityModule"
    }

    @ReactMethod
    fun isUsbDebugging(promise: Promise) {
        try {
            val adbEnabled = Settings.Global.getInt(
                reactApplicationContext.contentResolver,
                Settings.Global.ADB_ENABLED,
                0
            ) != 0
            promise.resolve(adbEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isDeveloperModeEnabled(promise: Promise) {
        try {
            val devEnabled = Settings.Global.getInt(
                reactApplicationContext.contentResolver,
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                0
            ) != 0
            promise.resolve(devEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isScreenRecording(promise: Promise) {
        try {
            var isRecording = false

            // 1. DisplayManager Check (Detects generic MediaProjection / Screen Recording)
            if (!isRecording) {
                val displayManager = reactApplicationContext.getSystemService(Context.DISPLAY_SERVICE) as? android.hardware.display.DisplayManager
                if (displayManager != null) {
                    val displays = displayManager.displays
                    for (display in displays) {
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
            }

            // 3. Accessibility Service Check Fallback
            if (!isRecording) {
                val am = reactApplicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as? android.view.accessibility.AccessibilityManager
                isRecording = am?.isEnabled == true &&
                        Settings.Secure.getString(
                            reactApplicationContext.contentResolver,
                            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                        )?.contains("screen", ignoreCase = true) == true
            }

            promise.resolve(isRecording)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getInstalledPackages(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val jsonArray = JSONArray()

            for (appInfo in packages) {
                if (appInfo.packageName == reactApplicationContext.packageName) continue

                val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                val isUpdatedSystemApp = (appInfo.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
                val isDebuggable = (appInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0

                val isFromUnknownSource = try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        val installSource = pm.getInstallSourceInfo(appInfo.packageName)
                        val installer = installSource.installingPackageName
                        installer != null &&
                                installer != "com.android.vending" &&
                                installer != "com.google.android.packageinstaller" &&
                                !isSystemApp
                    } else {
                        @Suppress("DEPRECATION")
                        val installer = pm.getInstallerPackageName(appInfo.packageName)
                        !isSystemApp && installer != "com.android.vending" &&
                                installer != "com.google.android.packageinstaller"
                    }
                } catch (e: Exception) {
                    false
                }

                val appName = try {
                    pm.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    appInfo.packageName
                }

                val obj = JSONObject().apply {
                    put("name", appName)
                    put("packageName", appInfo.packageName)
                    put("isSystemApp", isSystemApp || isUpdatedSystemApp)
                    put("isDebuggable", isDebuggable)
                    put("isFromUnknownSource", isFromUnknownSource)
                }
                jsonArray.put(obj)
            }
            promise.resolve(jsonArray.toString())
        } catch (e: Exception) {
            promise.reject("PACKAGE_SCAN_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getDeviceBuildInfo(promise: Promise) {
        try {
            val isEmulator = (Build.FINGERPRINT.startsWith("generic")
                    || Build.FINGERPRINT.startsWith("unknown")
                    || Build.MODEL.contains("google_sdk", ignoreCase = true)
                    || Build.MODEL.contains("Emulator", ignoreCase = true)
                    || Build.MODEL.contains("Android SDK built for x86", ignoreCase = true)
                    || Build.MANUFACTURER.contains("Genymotion", ignoreCase = true)
                    || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                    || Build.PRODUCT == "google_sdk")

            val isDebugBuild = Build.TYPE == "debug" || Build.TYPE == "userdebug"

            val obj = JSONObject().apply {
                put("isEmulator", isEmulator)
                put("isDebugBuild", isDebugBuild)
                put("buildType", Build.TYPE)
                put("buildTags", Build.TAGS ?: "")
            }
            promise.resolve(obj.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isJailbroken(promise: Promise) {
        try {
            var isRooted = false
            
            // Check build tags
            val buildTags = Build.TAGS
            if (buildTags != null && buildTags.contains("test-keys")) {
                isRooted = true
            }

            // Check su binary paths
            val paths = arrayOf(
                "/system/app/Superuser.apk",
                "/sbin/su",
                "/system/bin/su",
                "/system/xbin/su",
                "/data/local/xbin/su",
                "/data/local/bin/su",
                "/system/sd/xbin/su",
                "/system/bin/failsafe/su",
                "/data/local/su"
            )
            for (path in paths) {
                if (File(path).exists()) {
                    isRooted = true
                    break
                }
            }

            // Try executing su command
            if (!isRooted) {
                var process: Process? = null
                try {
                    process = Runtime.getRuntime().exec(arrayOf("/system/xbin/which", "su"))
                    isRooted = process.inputStream.read() >= 0
                } catch (e: Exception) {
                    // ignore
                } finally {
                    process?.destroy()
                }
            }

            promise.resolve(isRooted)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun authenticateBiometrics(title: String, subtitle: String, promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        val km = activity.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
        if (km == null || !km.isDeviceSecure) {
            // Device is not secure (no PIN, pattern or password set up), allow passing security check
            promise.resolve(true)
            return
        }

        activity.runOnUiThread {
            try {
                pendingAuthPromise = promise
                val intent = km.createConfirmDeviceCredentialIntent(title, subtitle)
                if (intent != null) {
                    activity.startActivityForResult(intent, CONFIRM_CREDENTIALS_REQUEST_CODE)
                } else {
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                pendingAuthPromise = null
                promise.reject("AUTH_ERROR", e.message)
            }
        }
    }

    // ─── LIVE MONITOR METHODS ────────────────────────────────────────────

    @ReactMethod
    fun getDeviceTemperature(promise: Promise) {
        try {
            val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus = reactApplicationContext.registerReceiver(null, ifilter)

            // Temperature is in tenths of a degree Celsius
            val rawTemp = batteryStatus?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) ?: -1
            val tempC = if (rawTemp >= 0) rawTemp / 10.0 else -1.0
            val tempF = if (tempC >= 0) tempC * 9.0 / 5.0 + 32.0 else -1.0

            val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val batteryPct = if (level >= 0 && scale > 0) (level * 100 / scale) else -1

            val statusInt = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging = statusInt == BatteryManager.BATTERY_STATUS_CHARGING ||
                             statusInt == BatteryManager.BATTERY_STATUS_FULL

            val heatLabel = when {
                tempC < 0   -> "Unknown"
                tempC < 35  -> "Cool"
                tempC < 42  -> "Warm"
                tempC < 50  -> "Hot"
                else        -> "Critical"
            }

            val obj = JSONObject().apply {
                put("batteryTempC", tempC)
                put("batteryTempF", String.format("%.1f", tempF).toDouble())
                put("batteryLevel", batteryPct)
                put("isCharging", isCharging)
                put("heatLabel", heatLabel)
            }
            promise.resolve(obj.toString())
        } catch (e: Exception) {
            promise.reject("TEMP_ERROR", e.message)
        }
    }

    // Keeps previous TX/RX snapshot for per-second delta calculation
    private var prevRxBytes = 0L
    private var prevTxBytes = 0L
    private var prevTimestampMs = 0L

    @ReactMethod
    fun getNetworkStats(promise: Promise) {
        try {
            val totalRx = TrafficStats.getTotalRxBytes()
            val totalTx = TrafficStats.getTotalTxBytes()
            val mobileRx = TrafficStats.getMobileRxBytes()
            val mobileTx = TrafficStats.getMobileTxBytes()

            val now = System.currentTimeMillis()
            val deltaMs = if (prevTimestampMs > 0) now - prevTimestampMs else 1000L

            val rxPerSec = if (prevTimestampMs > 0 && totalRx >= 0 && prevRxBytes >= 0)
                ((totalRx - prevRxBytes) * 1000.0 / deltaMs).toLong().coerceAtLeast(0)
            else 0L

            val txPerSec = if (prevTimestampMs > 0 && totalTx >= 0 && prevTxBytes >= 0)
                ((totalTx - prevTxBytes) * 1000.0 / deltaMs).toLong().coerceAtLeast(0)
            else 0L

            prevRxBytes = totalRx
            prevTxBytes = totalTx
            prevTimestampMs = now

            val wifiRx = if (totalRx >= 0 && mobileRx >= 0) totalRx - mobileRx else -1L
            val wifiTx = if (totalTx >= 0 && mobileTx >= 0) totalTx - mobileTx else -1L

            val obj = JSONObject().apply {
                put("totalRxBytes", totalRx)
                put("totalTxBytes", totalTx)
                put("rxPerSec", rxPerSec)
                put("txPerSec", txPerSec)
                put("mobileRxBytes", mobileRx)
                put("mobileTxBytes", mobileTx)
                put("wifiRxBytes", wifiRx)
                put("wifiTxBytes", wifiTx)
            }
            promise.resolve(obj.toString())
        } catch (e: Exception) {
            promise.reject("NETWORK_STATS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getActiveConnections(promise: Promise) {
        try {
            val connections = JSONArray()
            val tcpFiles = listOf("/proc/net/tcp", "/proc/net/tcp6")

            // TCP state codes
            val stateMap = mapOf(
                "01" to "ESTABLISHED", "02" to "SYN_SENT", "03" to "SYN_RECV",
                "04" to "FIN_WAIT1",  "05" to "FIN_WAIT2", "06" to "TIME_WAIT",
                "07" to "CLOSE",       "08" to "CLOSE_WAIT", "09" to "LAST_ACK",
                "0A" to "LISTEN",      "0B" to "CLOSING"
            )

            for (filePath in tcpFiles) {
                val f = File(filePath)
                if (!f.exists() || !f.canRead()) continue
                val isV6 = filePath.contains("tcp6")

                BufferedReader(FileReader(f)).use { reader ->
                    reader.readLine() // skip header
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        val parts = line!!.trim().split("\\s+".toRegex())
                        if (parts.size < 4) continue

                        val localHex  = parts[1]
                        val remoteHex = parts[2]
                        val stateHex  = parts[3].uppercase()
                        val stateLabel = stateMap[stateHex] ?: stateHex

                        fun hexToIp(hex: String): String {
                            return try {
                                val colonIdx = hex.indexOf(':')
                                val addrHex = if (colonIdx >= 0) hex.substring(0, colonIdx) else hex
                                val portHex = if (colonIdx >= 0) hex.substring(colonIdx + 1) else "0000"
                                val port = portHex.toInt(16)
                                if (!isV6) {
                                    // IPv4: 4-byte little-endian hex
                                    val b = addrHex.toLong(16)
                                    val ip = "${b and 0xFF}.${(b shr 8) and 0xFF}.${(b shr 16) and 0xFF}.${(b shr 24) and 0xFF}"
                                    "$ip:$port"
                                } else {
                                    // IPv6: just show hex for brevity
                                    "[${addrHex.take(8)}...]:$port"
                                }
                            } catch (e: Exception) { hex }
                        }

                        val localAddr  = hexToIp(localHex)
                        val remoteAddr = hexToIp(remoteHex)

                        val conn = JSONObject().apply {
                            put("local", localAddr)
                            put("remote", remoteAddr)
                            put("state", stateLabel)
                            put("isV6", isV6)
                        }
                        connections.put(conn)
                    }
                }
            }
            promise.resolve(connections.toString())
        } catch (e: Exception) {
            // If /proc/net/tcp is restricted, return empty list
            promise.resolve("[]")
        }
    }
}
