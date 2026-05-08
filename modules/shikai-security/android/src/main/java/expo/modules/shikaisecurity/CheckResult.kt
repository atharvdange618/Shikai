package expo.modules.shikaisecurity

data class CheckResult(
  val passed: Boolean,
  val reasons: List<String>
)
