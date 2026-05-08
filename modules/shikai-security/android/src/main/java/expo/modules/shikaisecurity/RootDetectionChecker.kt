package expo.modules.shikaisecurity

import android.content.Context
import android.os.Build
import expo.modules.shikaisecurity.BuildConfig
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader

class RootDetectionChecker {
  fun check(context: Context): CheckResult {
    if (BuildConfig.DEBUG) return CheckResult(passed = true, reasons = emptyList())
    val reasons = mutableListOf<String>()

    if (checkSuBinary()) reasons.add("su binary found")
    if (checkRootPaths()) reasons.add("root path detected")
    if (checkTestKeys()) reasons.add("test-keys build")
    if (checkBusybox()) reasons.add("busybox found")
    if (checkMagisk()) reasons.add("magisk detected")
    if (checkUnlockedBootloader()) reasons.add("unlocked bootloader")

    return CheckResult(passed = reasons.isEmpty(), reasons = reasons)
  }

  private fun checkSuBinary(): Boolean {
    return try {
      val process = Runtime.getRuntime().exec(arrayOf("which", "su"))
      val reader = BufferedReader(InputStreamReader(process.inputStream))
      val line = reader.readLine()
      process.waitFor()
      line != null && line.isNotBlank()
    } catch (_: Exception) {
      false
    }
  }

  private fun checkRootPaths(): Boolean {
    val rootPaths = listOf(
      "/system/app/Superuser.apk",
      "/system/app/Magisk.apk",
      "/sbin/su",
      "/system/bin/su",
      "/system/xbin/su",
      "/data/local/xbin/su",
      "/data/local/su",
      "/system/xbin/daemonsu"
    )
    return rootPaths.any { File(it).exists() }
  }

  private fun checkTestKeys(): Boolean {
    return Build.TAGS?.contains("test-keys", ignoreCase = true) == true
  }

  private fun checkBusybox(): Boolean {
    val busyboxPaths = listOf(
      "/system/xbin/busybox",
      "/system/bin/busybox",
      "/data/local/xbin/busybox",
      "/data/local/bin/busybox"
    )
    if (busyboxPaths.any { File(it).exists() }) return true

    return try {
      val process = Runtime.getRuntime().exec(arrayOf("which", "busybox"))
      val reader = BufferedReader(InputStreamReader(process.inputStream))
      val line = reader.readLine()
      process.waitFor()
      line != null && line.isNotBlank()
    } catch (_: Exception) {
      false
    }
  }

  private fun checkMagisk(): Boolean {
    val magiskPaths = listOf(
      "/data/adb/magisk",
      "/data/adb/magisk.db",
      "/cache/magisk.log"
    )
    return magiskPaths.any { File(it).exists() }
  }

  private fun checkUnlockedBootloader(): Boolean {
    if (Build.FINGERPRINT?.contains("test-keys", ignoreCase = true) == true) return true

    return try {
      val clazz = Class.forName("android.os.SystemProperties")
      val method = clazz.getMethod("get", String::class.java)
      val state = method.invoke(null, "ro.boot.verifiedbootstate") as? String
      state != null && state != "green"
    } catch (_: Exception) {
      false
    }
  }
}
