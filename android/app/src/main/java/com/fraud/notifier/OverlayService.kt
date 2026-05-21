package com.fraud.notifier

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat
import java.util.*

class OverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var incomingNumber: String = "Unknown"
    private val transcript = StringBuilder()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        incomingNumber = intent?.getStringExtra("EXTRA_NUMBER") ?: "Unknown"
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, "FraudServiceChannel")
            .setContentTitle("Fraud Notifier Active")
            .setContentText("Monitoring call from $incomingNumber")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()
        startForeground(1, notification)

        showOverlay()
        return START_NOT_STICKY
    }

    private fun showOverlay() {
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.TOP

        val txtNumber = overlayView?.findViewWithTag<TextView>("txtNumber")
        val btnAnalyze = overlayView?.findViewWithTag<Button>("btnAnalyze")
        val txtStatus = overlayView?.findViewWithTag<TextView>("txtStatus")

        txtNumber?.text = "Call from: $incomingNumber"

        btnAnalyze?.setOnClickListener {
            startListening(txtStatus)
            btnAnalyze.visibility = View.GONE
        }

        windowManager.addView(overlayView, params)
    }

    private fun startListening(statusView: TextView?) {
        statusView?.text = "Listening to call..."
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        }

        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { 
                    transcript.append(it).append(" ")
                    analyzeTranscript(it, statusView)
                }
            }
            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { analyzeTranscript(it, statusView) }
            }
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onError(error: Int) { statusView?.text = "Error listening: $error" }
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        speechRecognizer?.startListening(intent)
    }

    private fun analyzeTranscript(text: String, statusView: TextView?) {
        val result = FraudDetector.analyze(text)
        overlayView?.setBackgroundColor(when(result.level) {
            FraudLevel.FRAUD -> Color.parseColor("#800000") // Maroon
            FraudLevel.SUSPICIOUS -> Color.YELLOW
            FraudLevel.SAFE -> Color.GREEN
        })
        statusView?.text = "Result: ${result.level} - ${result.reason}"
        statusView?.setTextColor(if (result.level == FraudLevel.FRAUD) Color.WHITE else Color.BLACK)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                "FraudServiceChannel", "Fraud Detection Service",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
        overlayView?.let { windowManager.removeView(it) }
    }
}
