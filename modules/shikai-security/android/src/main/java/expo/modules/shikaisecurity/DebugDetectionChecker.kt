package expo.modules.shikaisecurity

import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Debug
import expo.modules.shikaisecurity.BuildConfig

class DebugDetectionChecker {
  fun check(context: Context): CheckResult {
    if (BuildConfig.DEBUG) return CheckResult(passed = true, reasons = emptyList())
    val reasons = mutableListOf<String>()

    if (Debug.isDebuggerConnected()) {
      reasons.add("Debugger connected")
    }

    if (Debug.waitingForDebugger()) {
      reasons.add("Waiting for debugger")
    }

    val isDebuggable = (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    if (isDebuggable) {
      reasons.add("App is debuggable")
    }

    return CheckResult(passed = reasons.isEmpty(), reasons = reasons)
  }
}
