import { requireNativeModule } from "expo-modules-core";

interface NativeSecurityCheckResult {
  isBlocked: boolean;
  reasons: string[];
}

interface ShikaiSecurityModule {
  runChecks(): Promise<NativeSecurityCheckResult>;
}

export default requireNativeModule<ShikaiSecurityModule>("ShikaiSecurity");
