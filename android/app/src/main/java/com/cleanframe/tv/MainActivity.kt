package com.cleanframe.tv

import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Hosts the CleanFrame web UI (bundled under assets/web) in a full-screen WebView and forwards
 * the TV remote to it. The web code is the same one the Samsung/Tizen widget runs; only the
 * device layer (device.js) differs, overlaid at build time with the Android WebView bridge.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    // Android remote key codes -> the key codes the web UI already handles (Tizen/browser).
    private val keyMap: Map<Int, Int> = mapOf(
        KeyEvent.KEYCODE_DPAD_LEFT to 37,
        KeyEvent.KEYCODE_DPAD_RIGHT to 39,
        KeyEvent.KEYCODE_DPAD_UP to 38,
        KeyEvent.KEYCODE_DPAD_DOWN to 40,
        KeyEvent.KEYCODE_DPAD_CENTER to 13,
        KeyEvent.KEYCODE_ENTER to 13,
        KeyEvent.KEYCODE_NUMPAD_ENTER to 13,
        KeyEvent.KEYCODE_BACK to 8,
        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE to 10252,
        KeyEvent.KEYCODE_MEDIA_PLAY to 415,
        KeyEvent.KEYCODE_MEDIA_PAUSE to 19,
        KeyEvent.KEYCODE_MEDIA_NEXT to 10233,
        KeyEvent.KEYCODE_MEDIA_PREVIOUS to 10232,
        KeyEvent.KEYCODE_MEDIA_STOP to 413,
        KeyEvent.KEYCODE_MEDIA_FAST_FORWARD to 417,
        KeyEvent.KEYCODE_MEDIA_REWIND to 412
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(0xFF000000.toInt())

        val s = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        s.allowFileAccess = true
        s.allowContentAccess = true
        // The bundled file:// page fetches the owner's own services directly, the Android
        // equivalent of the Tizen widget's <access origin="*">. Only our code runs here.
        s.allowFileAccessFromFileURLs = true
        s.allowUniversalAccessFromFileURLs = true
        s.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        s.cacheMode = WebSettings.LOAD_NO_CACHE
        // Honour the page's width=device-width so the 1920x1080 design scales to the screen,
        // instead of the WebView's default ~980px layout width (which leaves the UI tiny).
        s.useWideViewPort = true
        s.loadWithOverviewMode = true
        s.setSupportZoom(false)
        s.builtInZoomControls = false

        web.webViewClient = WebViewClient()
        web.addJavascriptInterface(WebBridge(this), "AndroidTV")
        setContentView(web)
        web.loadUrl("file:///android_asset/web/index.html")
    }

    private fun send(code: Int, type: String): Boolean {
        web.evaluateJavascript("window.CleanFrameAndroidKey&&CleanFrameAndroidKey($code,'$type')", null)
        return true
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        val c = keyMap[keyCode] ?: return super.onKeyDown(keyCode, event)
        return send(c, "down")
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
        val c = keyMap[keyCode] ?: return super.onKeyUp(keyCode, event)
        return send(c, "up")
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onPause() {
        super.onPause()
        web.onPause() // stops any playing video's audio when leaving to another app
    }
}
