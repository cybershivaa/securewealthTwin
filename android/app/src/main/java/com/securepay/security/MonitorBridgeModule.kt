package com.securepay.security

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*

class MonitorBridgeModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "MonitorBridge"

    @ReactMethod
    fun startMonitoring(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, MonitoringService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopMonitoring(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, MonitoringService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isMonitoringActive(promise: Promise) {
        try {
            @Suppress("DEPRECATION")
            val manager = reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            @Suppress("DEPRECATION")
            val isRunning = manager.getRunningServices(Integer.MAX_VALUE)
                .any { it.service.className == MonitoringService::class.java.name }
            promise.resolve(isRunning)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getAlertHistory(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                MonitoringService.PREFS_NAME, Context.MODE_PRIVATE
            )
            promise.resolve(prefs.getString(MonitoringService.PREFS_KEY, "[]"))
        } catch (e: Exception) {
            promise.reject("ALERTS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun clearAlertHistory(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                MonitoringService.PREFS_NAME, Context.MODE_PRIVATE
            )
            prefs.edit().putString(MonitoringService.PREFS_KEY, "[]").apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_ERROR", e.message)
        }
    }
}
