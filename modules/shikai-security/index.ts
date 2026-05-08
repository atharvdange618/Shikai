import ShikaiSecurityModule from "./src/ShikaiSecurityModule";

export interface SecurityCheckResult {
  isBlocked: boolean;
  reasons: string[];
}

export async function runSecurityChecks(): Promise<SecurityCheckResult> {
  try {
    return await ShikaiSecurityModule.runChecks();
  } catch {
    return { isBlocked: true, reasons: ["Security check failed"] };
  }
}
