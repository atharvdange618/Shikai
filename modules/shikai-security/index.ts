import ShikaiSecurityModule from "./src/ShikaiSecurityModule";

export interface SecurityCheckResult {
  isBlocked: boolean;
  reasons: string[];
  devModeBlocked: boolean;
  hasDevModeIssues: boolean;
}

export async function runSecurityChecks(): Promise<SecurityCheckResult> {
  try {
    return await ShikaiSecurityModule.runChecks();
  } catch (e) {
    console.error("Security check failed:", e);
    return {
      isBlocked: true,
      reasons: ["Security check failed"],
      devModeBlocked: false,
      hasDevModeIssues: false,
    };
  }
}

export async function setDevModeOverride(
  enabled: boolean,
): Promise<boolean> {
  try {
    const result = await ShikaiSecurityModule.setDevModeOverride(enabled);
    return result.success;
  } catch (e) {
    console.error("Failed to set dev mode override:", e);
    return false;
  }
}

export async function getDevModeOverride(): Promise<boolean> {
  try {
    const result = await ShikaiSecurityModule.getDevModeOverride();
    return result.enabled;
  } catch (e) {
    console.error("Failed to get dev mode override:", e);
    return false;
  }
}
