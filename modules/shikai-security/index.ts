import ShikaiSecurityModule from "./src/ShikaiSecurityModule";

export interface SecurityCheckResult {
  isBlocked: boolean;
  reasons: string[];
}

export async function runSecurityChecks(): Promise<SecurityCheckResult> {
  try {
    return await ShikaiSecurityModule.runChecks();
  } catch (e) {
    console.error("Security check failed:", e);
    return { isBlocked: true, reasons: ["Security check failed"] };
  }
}
