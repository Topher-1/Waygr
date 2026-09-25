/**
 * Share a card PNG through the native share sheet, with a desktop download
 * fallback (BUILD-BRIEF · acceptance: concession card).
 * Browser-only.
 */

export type ShareCardResult = "shared" | "downloaded" | "dismissed" | "failed";

type ShareCardOptions = {
  /** Card route, e.g. /api/cards/abc123?type=concession&format=post */
  url: string;
  fileName: string;
  title: string;
  text?: string;
};

function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  if (!navigator.canShare) return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

function download(file: File): ShareCardResult {
  const href = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
  return "downloaded";
}

export async function shareCardImage(
  options: ShareCardOptions,
): Promise<ShareCardResult> {
  let file: File;
  try {
    const response = await fetch(options.url);
    if (!response.ok) return "failed";
    const blob = await response.blob();
    file = new File([blob], options.fileName, {
      type: blob.type || "image/png",
    });
  } catch {
    return "failed";
  }

  if (!canShareFiles([file])) {
    try {
      return download(file);
    } catch {
      return "failed";
    }
  }

  try {
    await navigator.share({
      files: [file],
      title: options.title,
      text: options.text,
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "dismissed";
    }
    // Some browsers advertise file share then refuse it; fall back to a file.
    try {
      return download(file);
    } catch {
      return "failed";
    }
  }
}

/** Share completed in a way that puts the card in front of other people. */
export function shareCounts(result: ShareCardResult): boolean {
  return result === "shared" || result === "downloaded";
}
