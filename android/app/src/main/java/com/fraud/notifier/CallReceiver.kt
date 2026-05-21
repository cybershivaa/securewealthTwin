package com.fraud.notifier

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager

import android.util.Log

class CallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            Log.d("CallReceiver", "Phone State: $state, Number: $number")

            if (state == TelephonyManager.EXTRA_STATE_RINGING && number != null) {

                // Start the overlay service when the phone rings
                val serviceIntent = Intent(context, OverlayService::class.java).apply {
                    putExtra("EXTRA_NUMBER", number)
                }
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        }
    }
}
