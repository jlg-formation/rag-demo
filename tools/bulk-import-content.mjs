import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_CONTENT_DIR = path.resolve("content");
const DEFAULT_IMPORT_PASSWORD = "demo-import-2026";

const parseArgs = (argv) => {
  const args = {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    contentDir: DEFAULT_CONTENT_DIR,
    adminEmail: "admin",
    adminPassword: "admin",
    importPassword: DEFAULT_IMPORT_PASSWORD,
    dryRun: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--api") {
      args.apiBaseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--content") {
      args.contentDir = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (token === "--admin-email") {
      args.adminEmail = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--admin-password") {
      args.adminPassword = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--import-password") {
      args.importPassword = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
};

const ensureOk = async (response, fallbackMessage) => {
  if (response.ok) {
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json")
      ? response.json()
      : response.text();
  }

  let details = fallbackMessage;
  try {
    const payload = await response.json();
    if (payload?.error) {
      details = payload.error;
    }
  } catch {
    const text = await response.text();
    if (text) {
      details = text;
    }
  }

  throw new Error(`${fallbackMessage} (${response.status}) - ${details}`);
};

const login = async ({ apiBaseUrl, email, password }) => {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  await ensureOk(response, `Echec de connexion pour ${email}`);
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error(`Aucun cookie de session recu pour ${email}.`);
  }

  return setCookie.split(";")[0];
};

const fetchJson = async ({ apiBaseUrl, endpoint, cookie }) => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    headers: {
      cookie
    }
  });

  return ensureOk(response, `Echec GET ${endpoint}`);
};

const postJson = async ({
  apiBaseUrl,
  endpoint,
  cookie,
  body,
  allowConflict
}) => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie
    },
    body: JSON.stringify(body)
  });

  if (allowConflict && response.status === 409) {
    return { conflict: true };
  }

  return ensureOk(response, `Echec POST ${endpoint}`);
};

const formatPercent = (value) => `${value.toFixed(1).replace(/\.0$/, "")}%`;

const logProgress = ({ completedFiles, totalFiles, group, fileName }) => {
  const percent = totalFiles ? (completedFiles / totalFiles) * 100 : 100;
  const suffix = group && fileName ? ` ${group}/${fileName}` : "";
  console.log(
    `[import] ${formatPercent(percent)} (${completedFiles}/${totalFiles})${suffix}`
  );
};

const uploadFile = async ({ apiBaseUrl, cookie, group, file }) => {
  const formData = new FormData();
  formData.append("group", group);

  const content = await readFile(file.absolutePath, "utf8");
  formData.append(
    "files",
    new File([content], file.name, { type: "text/markdown" })
  );

  const response = await fetch(`${apiBaseUrl}/api/documents/upload`, {
    method: "POST",
    headers: {
      cookie
    },
    body: formData
  });

  return ensureOk(response, `Echec d'import du groupe ${group}`);
};

const isMarkdownFile = (fileName) => /\.(md|markdown|txt)$/i.test(fileName);

const listGroupFiles = async (contentDir) => {
  const entries = await readdir(contentDir, { withFileTypes: true });
  const groups = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const groupDir = path.join(contentDir, entry.name);
    const childEntries = await readdir(groupDir, { withFileTypes: true });
    const files = [];

    for (const child of childEntries) {
      if (!child.isFile() || !isMarkdownFile(child.name)) {
        continue;
      }

      const absolutePath = path.join(groupDir, child.name);
      const fileStats = await stat(absolutePath);
      files.push({
        group: entry.name,
        name: child.name,
        absolutePath,
        size: fileStats.size
      });
    }

    files.sort((left, right) => left.name.localeCompare(right.name));

    if (files.length) {
      groups.push({
        name: entry.name,
        files
      });
    }
  }

  groups.sort((left, right) => left.name.localeCompare(right.name));
  return groups;
};

const buildImporterIdentity = (group) => ({
  email: `import-${group}@demo.local`,
  displayName: `Import ${group}`
});

const main = async () => {
  const args = parseArgs(process.argv);
  const health = await fetchJson({
    apiBaseUrl: args.apiBaseUrl,
    endpoint: "/api/health",
    cookie: ""
  });

  const groups = await listGroupFiles(args.contentDir);
  if (!groups.length) {
    throw new Error(
      `Aucun sous-repertoire exploitable dans ${args.contentDir}.`
    );
  }

  const totalFiles = groups.reduce((sum, group) => sum + group.files.length, 0);
  const totalBytes = groups.reduce(
    (sum, group) =>
      sum + group.files.reduce((innerSum, file) => innerSum + file.size, 0),
    0
  );

  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          apiBaseUrl: args.apiBaseUrl,
          ragConfigured: health.ragConfigured,
          groups: groups.map((group) => ({
            name: group.name,
            files: group.files.length,
            bytes: group.files.reduce((sum, file) => sum + file.size, 0),
            importer: buildImporterIdentity(group.name).email
          })),
          totalFiles,
          totalBytes
        },
        null,
        2
      )
    );
    return;
  }

  if (!health.ragConfigured) {
    throw new Error(
      "Le backend RAG n'est pas configure. Renseigne d'abord OpenAI et Pinecone dans l'interface avant l'import."
    );
  }

  const adminCookie = await login({
    apiBaseUrl: args.apiBaseUrl,
    email: args.adminEmail,
    password: args.adminPassword
  });

  const existingGroupsPayload = await fetchJson({
    apiBaseUrl: args.apiBaseUrl,
    endpoint: "/api/groups",
    cookie: adminCookie
  });
  const existingGroupNames = new Set(
    existingGroupsPayload.groups.map((group) => group.name)
  );

  for (const group of groups) {
    if (!existingGroupNames.has(group.name)) {
      await postJson({
        apiBaseUrl: args.apiBaseUrl,
        endpoint: "/api/groups",
        cookie: adminCookie,
        body: { name: group.name }
      });
      existingGroupNames.add(group.name);
    }
  }

  const importReport = [];
  let completedFiles = 0;

  logProgress({ completedFiles, totalFiles });

  for (const group of groups) {
    const importer = buildImporterIdentity(group.name);
    await postJson({
      apiBaseUrl: args.apiBaseUrl,
      endpoint: "/api/users",
      cookie: adminCookie,
      body: {
        email: importer.email,
        password: args.importPassword,
        displayName: importer.displayName,
        groups: [group.name]
      },
      allowConflict: true
    });

    const importerCookie = await login({
      apiBaseUrl: args.apiBaseUrl,
      email: importer.email,
      password: args.importPassword
    });

    let documentsCreated = 0;

    for (const file of group.files) {
      const payload = await uploadFile({
        apiBaseUrl: args.apiBaseUrl,
        cookie: importerCookie,
        group: group.name,
        file
      });
      documentsCreated += payload.documents?.length ?? 0;
      completedFiles += 1;
      logProgress({
        completedFiles,
        totalFiles,
        group: group.name,
        fileName: file.name
      });
    }

    importReport.push({
      group: group.name,
      importer: importer.email,
      files: group.files.length,
      documentsCreated,
      bytes: group.files.reduce((sum, file) => sum + file.size, 0)
    });
  }

  console.log(
    JSON.stringify(
      {
        apiBaseUrl: args.apiBaseUrl,
        importedGroups: importReport.length,
        totalFiles,
        totalBytes,
        report: importReport
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
