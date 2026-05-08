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
        "developer_options_enabled",
        0
      ) != 0
      if (devOptionsEnabled) {
        reasons.add("Developer options enabled")
      }
    } catch (_: Exception) {
      // Some OEMs (Samsung, Xiaomi) may not expose this setting
      // Fall through to USB/ADB checks
    }

    try {
      val usbDebuggingEnabled = Settings.Secure.getInt(
        context.contentResolver,
        "usb_debugging",
        0
      ) != 0
      if (usbDebuggingEnabled) {
        reasons.add("USB debugging enabled")
      }
    } catch (_: Exception) {
      reasons.add("USB debugging check failed")
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
      reasons.add("ADB check failed")
    }

    return CheckResult(passed = reasons.isEmpty(), reasons = reasons)
  }
}
