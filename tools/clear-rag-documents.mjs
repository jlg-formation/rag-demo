import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DOCUMENTS_FILE = fileURLToPath(
  new URL("../project/apps/api/data/documents.json", import.meta.url)
);
const SETTINGS_FILE = fileURLToPath(
  new URL("../project/apps/api/data/rag-settings.json", import.meta.url)
);
const DEFAULT_NAMESPACE = "rag-demo";
const DELETE_BATCH_SIZE = 100;

/**
 * @typedef {{
 *   pineconeApiKey?: string;
 *   pineconeIndex?: string;
 *   pineconeHost?: string;
 *   namespace?: string;
 * }} RagSettings
 */

/**
 * @typedef {{
 *   id?: string;
 *   vectorIds?: string[];
 * }} StoredDocument
 */

/**
 * @param {string[]} argv
 */
const parseArgs = (argv) => {
  const args = {
    dryRun: false,
    localOnly: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--local-only") {
      args.localOnly = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
};

/**
 * @template T
 * @param {string} filePath
 * @param {T} fallbackValue
 * @returns {Promise<T>}
 */
const readJsonFile = async (filePath, fallbackValue) => {
  try {
    const contents = await readFile(filePath, "utf8");
    return /** @type {T} */ (JSON.parse(contents));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "ENOENT") {
        return fallbackValue;
      }
    }

    throw error;
  }
};

/**
 * @param {string} filePath
 * @param {unknown} value
 */
const writeJsonFile = async (filePath, value) => {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
};

/**
 * @template T
 * @param {T[]} items
 * @param {number} size
 * @returns {T[][]}
 */
const chunkArray = (items, size) => {
  /** @type {T[][]} */
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

/**
 * @param {RagSettings | null} settings
 */
const resolvePineconeHost = async (settings) => {
  if (settings?.pineconeHost) {
    return settings.pineconeHost;
  }

  if (!settings?.pineconeApiKey || !settings?.pineconeIndex) {
    throw new Error(
      "La configuration Pinecone est incomplete. Impossible de resoudre le host."
    );
  }

  const response = await fetch(
    `https://api.pinecone.io/indexes/${encodeURIComponent(settings.pineconeIndex)}`,
    {
      headers: {
        Accept: "application/json",
        "Api-Key": settings.pineconeApiKey,
        "X-Pinecone-API-Version": "2025-01"
      }
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Impossible de resoudre le host Pinecone pour l'index ${settings.pineconeIndex}. ${details}`.trim()
    );
  }

  const description = /** @type {{ host?: string }} */ (await response.json());

  if (!description.host) {
    throw new Error(
      `Impossible de resoudre le host Pinecone pour l'index ${settings.pineconeIndex}.`
    );
  }

  return description.host;
};

/**
 * @param {RagSettings | null} settings
 */
const createDeleteEndpoint = async (settings) => {
  if (!settings?.pineconeApiKey || !settings?.pineconeIndex) {
    throw new Error(
      "La configuration Pinecone est incomplete. Impossible de purger les vecteurs distants."
    );
  }

  const host = await resolvePineconeHost(settings);
  const normalizedHost = host.replace(/^https?:\/\//, "");
  const namespace = settings.namespace || DEFAULT_NAMESPACE;

  return {
    namespace,
    url: `https://${normalizedHost}/vectors/delete`,
    apiKey: settings.pineconeApiKey
  };
};

/**
 * @param {StoredDocument[]} documents
 * @returns {string[]}
 */
const collectVectorIds = (documents) =>
  Array.from(
    new Set(
      documents.flatMap((document) =>
        Array.isArray(document.vectorIds)
          ? document.vectorIds.filter((value) => typeof value === "string")
          : []
      )
    )
  );

/**
 * @param {RagSettings | null} settings
 * @param {string[]} vectorIds
 */
const deleteRemoteVectors = async (settings, vectorIds) => {
  if (!vectorIds.length) {
    return;
  }

  const endpoint = await createDeleteEndpoint(settings);
  const batches = chunkArray(vectorIds, DELETE_BATCH_SIZE);

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Api-Key": endpoint.apiKey,
        "X-Pinecone-API-Version": "2025-01"
      },
      body: JSON.stringify({
        ids: batch,
        namespace: endpoint.namespace
      })
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `Echec de suppression Pinecone pour le batch ${index + 1}: ${details}`.trim()
      );
    }

    console.log(
      `[clear-rag] Suppression Pinecone ${index + 1}/${batches.length} (${batch.length} vecteurs)`
    );
  }
};

const main = async () => {
  const args = parseArgs(process.argv);
  /** @type {StoredDocument[]} */
  const documents = await readJsonFile(
    DOCUMENTS_FILE,
    /** @type {StoredDocument[]} */ ([])
  );
  /** @type {RagSettings | null} */
  const settings = await readJsonFile(
    SETTINGS_FILE,
    /** @type {RagSettings | null} */ (null)
  );
  const vectorIds = collectVectorIds(documents);

  const summary = {
    mode: args.dryRun ? "dry-run" : args.localOnly ? "local-only" : "full",
    documents: documents.length,
    vectors: vectorIds.length,
    namespace: settings?.namespace || DEFAULT_NAMESPACE,
    pineconeConfigured: Boolean(
      settings?.pineconeApiKey && settings?.pineconeIndex
    )
  };

  if (args.dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (!documents.length) {
    await writeJsonFile(DOCUMENTS_FILE, []);
    console.log("[clear-rag] Aucun document local a supprimer.");
    return;
  }

  if (!args.localOnly) {
    await deleteRemoteVectors(settings, vectorIds);
  } else {
    console.log(
      "[clear-rag] Mode local-only: suppression distante Pinecone ignoree."
    );
  }

  await writeJsonFile(DOCUMENTS_FILE, []);

  console.log(
    `[clear-rag] Purge terminee: ${documents.length} document(s) retires, ${vectorIds.length} vecteur(s) references supprimes.`
  );
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[clear-rag] ${message}`);
  process.exitCode = 1;
});
