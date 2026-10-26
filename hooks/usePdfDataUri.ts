import { useEffect, useState } from "react";

type PdfDataUriState =
  | { status: "loading" }
  | { status: "ready"; uri: string }
  | { status: "error"; message: string };

/**
 * Downloads a PDF and returns it as a base64 data URI for react-native-pdf.
 *
 * react-native-pdf downloads a remote URL through react-native-blob-util,
 * which chokes on GitHub's redirect. Fetch the bytes with RN's own stack
 * (straight to GitHub, no third party) and hand the viewer a data URI.
 */
export function usePdfDataUri(url: string): PdfDataUriState {
  const [state, setState] = useState<PdfDataUriState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = String(reader.result);
            const comma = result.indexOf(",");
            resolve(comma === -1 ? result : result.slice(comma + 1));
          };
          reader.onerror = () =>
            reject(reader.error ?? new Error("could not read PDF"));
          reader.readAsDataURL(blob);
        });
        if (!cancelled) {
          setState({
            status: "ready",
            uri: `data:application/pdf;base64,${base64}`,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
