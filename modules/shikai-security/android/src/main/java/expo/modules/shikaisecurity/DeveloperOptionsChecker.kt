package expo.modules.shikaisecurity

import android.content.Context
import android.provider.Settings
import expo.modules.shikaisecurity.BuildConfig

class DeveloperOptionsChecker {
  fun check(context: Context): CheckResult {
    if (BuildConfig.DEBUG) return CheckResult(passed = true, reasons = emptyList())
    val reasons = mutableListOf<String>()

    try {
      val devOptionsEnabled = Settings.Secure.getInt(
        context.contentResolver,
        "development_settings_enabled",
        0
      ) != 0
      if (devOptionsEnabled) {
        reasons.add("Developer options enabled")
      }
    } catch (_: Exception) {
      // Some OEMs may not expose this setting
    }

    try {
      val usbDebuggingEnabled = Settings.Secure.getInt(
        context.contentResolver,
        "adb_enabled",
        0
      ) != 0
      if (usbDebuggingEnabled) {
        reasons.add("USB debugging enabled")
      }
    } catch (_: Exception) {
      // Setting may not exist on all devices
    }

    try {
      val adbEnabled = Settings.Global.getInt(
        context.contentResolver,
        "adb_enabled",
        0
      ) != 0
      if (adbEnabled) {
        reasons.add("ADB enabled")
      }
    } catch (_: Exception) {
      // Setting may not exist on all devices
    }

    return CheckResult(passed = reasons.isEmpty(), reasons = reasons)
  }
}
