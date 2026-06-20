const CHUNK_SIZE = 80;

export function splitIntoChunks(content: string): string[] {
  if (!content) return [];
  const lines = content.split("\n");
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    chunks.push(lines.slice(i, i + CHUNK_SIZE).join("\n"));
  }
  return chunks;
}
