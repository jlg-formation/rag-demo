import { access } from "node:fs/promises";
import { extname, normalize } from "node:path";
import type { ResponseSet } from "./apiTypes";

const WEB_DIST_DIR = new URL("../../web/dist/", import.meta.url);
const WEB_INDEX_FILE = Bun.file(new URL("index.html", WEB_DIST_DIR));

const resolveStaticFile = async (requestPath: string) => {
  const normalizedPath = normalize(requestPath).replace(/^([.][./\\])+/, "");
  const relativePath = normalizedPath.replace(/^[/\\]+/, "");
  const fileUrl = new URL(relativePath, WEB_DIST_DIR);

  try {
    await access(fileUrl);
    return Bun.file(fileUrl);
  } catch {
    return null;
  }
};

export const serveFrontend = async (requestPath: string, set: ResponseSet) => {
  const assetPath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const assetFile = await resolveStaticFile(assetPath);

  if (assetFile) {
    return assetFile;
  }

  if (extname(requestPath)) {
    set.status = 404;
    return { error: "Ressource introuvable." };
  }

  return WEB_INDEX_FILE;
};
