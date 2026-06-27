package expo.modules.shikaisecurity

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

open class ShikaiSecurityModule : Module() {
  private fun getPrefs(): android.content.SharedPreferences? {
    val context = appContext.reactContext ?: return null
    return context.getSharedPreferences("shikai_security", Context.MODE_PRIVATE)
  }

  override fun definition() = ModuleDefinition {
    Name("ShikaiSecurity")

    AsyncFunction("runChecks") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "isBlocked" to true,
        "reasons" to listOf("React context lost")
      )

      val results = mutableListOf<String>()
      val devReasons = mutableListOf<String>()

      val devOptions = DeveloperOptionsChecker().check(context)
      if (!devOptions.passed) devReasons.addAll(devOptions.reasons)

      val root = RootDetectionChecker().check(context)
      if (!root.passed) results.addAll(root.reasons)

      val debug = DebugDetectionChecker().check(context)
      if (!debug.passed) results.addAll(debug.reasons)

      val overrideEnabled = getPrefs()?.getBoolean("dev_mode_override", false) ?: false

      if (!overrideEnabled) {
        results.addAll(devReasons)
      }

      mapOf<String, Any>(
        "isBlocked" to results.isNotEmpty(),
        "reasons" to results,
        "devModeBlocked" to (devReasons.isNotEmpty() && !overrideEnabled),
        "hasDevModeIssues" to devReasons.isNotEmpty()
      )
    }

    AsyncFunction("setDevModeOverride") { enabled: Boolean ->
      getPrefs()?.edit()?.putBoolean("dev_mode_override", enabled)?.apply()
      mapOf("success" to true)
    }

    AsyncFunction("getDevModeOverride") {
      val enabled = getPrefs()?.getBoolean("dev_mode_override", false) ?: false
      mapOf("enabled" to enabled)
    }
  }
}
