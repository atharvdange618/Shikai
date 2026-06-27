import { requireNativeModule } from "expo-modules-core";

interface NativeSecurityCheckResult {
  isBlocked: boolean;
  reasons: string[];
  devModeBlocked: boolean;
  hasDevModeIssues: boolean;
}

interface ShikaiSecurityModule {
  runChecks(): Promise<NativeSecurityCheckResult>;
  setDevModeOverride(enabled: boolean): Promise<{ success: boolean }>;
  getDevModeOverride(): Promise<{ enabled: boolean }>;
}

export default requireNativeModule<ShikaiSecurityModule>("ShikaiSecurity");
