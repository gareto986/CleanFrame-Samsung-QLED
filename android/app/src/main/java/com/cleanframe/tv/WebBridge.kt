package com.cleanframe.tv

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

/**
 * The native side of the device layer, exposed to the web UI as window.AndroidTV. It replaces
 * the Tizen APIs: launching apps by package, listing installed TV apps, and opening Android
 * settings / the system launcher. Called from the Android device.js overlay.
 */
class WebBridge(private val context: Context) {

    /** Launch an installed app by package id. Returns "" on success, else an error message. */
    @JavascriptInterface
    fun launch(pkg: String): String {
        return try {
            val pm = context.packageManager
            val intent = pm.getLeanbackLaunchIntentForPackage(pkg)
                ?: pm.getLaunchIntentForPackage(pkg)
                ?: return "App not installed"
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            ""
        } catch (e: Exception) {
            e.message ?: "Could not open the app"
        }
    }

    /** The installed TV apps as a JSON array of { appId, name }. */
    @JavascriptInterface
    fun apps(): String {
        val pm = context.packageManager
        val main = Intent(Intent.ACTION_MAIN).addCategory("android.intent.category.LEANBACK_LAUNCHER")
        val arr = JSONArray()
        val self = context.packageName
        for (ri in pm.queryIntentActivities(main, 0)) {
            val pkg = ri.activityInfo?.packageName ?: continue
            if (pkg == self) continue
            val o = JSONObject()
            o.put("appId", pkg)
            o.put("name", ri.loadLabel(pm).toString())
            arr.put(o)
        }
        return arr.toString()
    }

    @JavascriptInterface
    fun openSettings(): String {
        return try {
            context.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            ""
        } catch (e: Exception) {
            e.message ?: "Could not open settings"
        }
    }

    /** Best effort: open the system/Google TV launcher so the owner can leave CleanFrame. */
    @JavascriptInterface
    fun openHome(): String {
        val pm = context.packageManager
        for (p in listOf("com.google.android.apps.tv.launcherx", "com.google.android.tvlauncher")) {
            val i = pm.getLeanbackLaunchIntentForPackage(p) ?: pm.getLaunchIntentForPackage(p)
            if (i != null) {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(i)
                return ""
            }
        }
        return "No system home launcher found"
    }
}
