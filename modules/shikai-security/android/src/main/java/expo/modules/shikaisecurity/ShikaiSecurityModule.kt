package expo.modules.shikaisecurity

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

open class ShikaiSecurityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ShikaiSecurity")

    AsyncFunction("runChecks") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "isBlocked" to true,
        "reasons" to listOf("React context lost")
      )

      val results = mutableListOf<String>()

      val devOptions = DeveloperOptionsChecker().check(context)
      if (!devOptions.passed) results.addAll(devOptions.reasons)

      val root = RootDetectionChecker().check(context)
      if (!root.passed) results.addAll(root.reasons)

      val debug = DebugDetectionChecker().check(context)
      if (!debug.passed) results.addAll(debug.reasons)

      mapOf(
        "isBlocked" to results.isNotEmpty(),
        "reasons" to results
      )
    }
  }
}
