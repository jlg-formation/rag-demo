import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const API_PACKAGE_JSON = new URL(
  "../project/apps/api/package.json",
  import.meta.url
);
const DOCUMENTS_FILE = fileURLToPath(
  new URL("../project/apps/api/data/documents.json", import.meta.url)
);
const SETTINGS_FILE = fileURLToPath(
  new URL("../project/apps/api/data/rag-settings.json", import.meta.url)
);
const DEFAULT_NAMESPACE = "rag-demo";
const DELETE_BATCH_SIZE = 100;

const require = createRequire(API_PACKAGE_JSON);

const getPineconeConstructor = () => {
  const { Pinecone } = require("@pinecone-database/pinecone");
  return Pinecone;
};

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

const readJsonFile = async (filePath, fallbackValue) => {
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "ENOENT") {
        return fallbackValue;
      }
    }

    throw error;
  }
};

const writeJsonFile = async (filePath, value) => {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
};

const chunkArray = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const resolvePineconeHost = async (settings) => {
  const Pinecone = getPineconeConstructor();

  if (settings.pineconeHost) {
    return settings.pineconeHost;
  }

  const client = new Pinecone({ apiKey: settings.pineconeApiKey });
  const description = await client.describeIndex(settings.pineconeIndex);

  if (!description.host) {
    throw new Error(
      `Impossible de resoudre le host Pinecone pour l'index ${settings.pineconeIndex}.`
    );
  }

  return description.host;
};

const createNamespaceHandle = async (settings) => {
  const Pinecone = getPineconeConstructor();

  if (!settings?.pineconeApiKey || !settings?.pineconeIndex) {
    throw new Error(
      "La configuration Pinecone est incomplete. Impossible de purger les vecteurs distants."
    );
  }

  const host = await resolvePineconeHost(settings);
  const client = new Pinecone({ apiKey: settings.pineconeApiKey });

  return client
    .index(settings.pineconeIndex, host)
    .namespace(settings.namespace || DEFAULT_NAMESPACE);
};

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

const deleteRemoteVectors = async (settings, vectorIds) => {
  if (!vectorIds.length) {
    return;
  }

  const namespace = await createNamespaceHandle(settings);
  const batches = chunkArray(vectorIds, DELETE_BATCH_SIZE);

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    await namespace.deleteMany(batch);
    console.log(
      `[clear-rag] Suppression Pinecone ${index + 1}/${batches.length} (${batch.length} vecteurs)`
    );
  }
};

const main = async () => {
  const args = parseArgs(process.argv);
  const documents = await readJsonFile(DOCUMENTS_FILE, []);
  const settings = await readJsonFile(SETTINGS_FILE, null);
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
