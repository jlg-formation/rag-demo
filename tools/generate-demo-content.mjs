import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_TARGET_BYTES = 1024 * 1024;

/** @typedef {"admin" | "patients" | "docteurs" | "dsi" | "ressources-humaines"} GroupKey */

/**
 * @typedef {{
 *   audience: string;
 *   roles: string[];
 *   contexts: string[];
 *   metrics: string[];
 *   keywords: string[];
 * }} GroupProfile
 */

/**
 * @typedef {{
 *   fileName: string;
 *   title: string;
 *   summary: string;
 *   body: string;
 * }} SourceFile
 */

/**
 * @typedef {{
 *   group: GroupKey;
 *   themes: string[];
 *   files: SourceFile[];
 * }} ParsedSourceGroup
 */

/**
 * @typedef {{
 *   outDir: string;
 *   targetBytes: number;
 *   sources: string[];
 * }} ParsedArgs
 */

/**
 * @typedef {{
 *   group: GroupKey;
 *   fileName: string;
 *   content: string;
 *   profile: GroupProfile;
 *   themes: string[];
 * }} CorpusDocument
 */

/** @type {Record<GroupKey, GroupProfile>} */
const groupProfiles = {
  admin: {
    audience:
      "cadres de direction, secretariat general, pilotage institutionnel",
    roles: [
      "Direction generale",
      "Secretaire generale",
      "DSI",
      "controle de gestion",
      "direction des achats",
      "direction des soins"
    ],
    contexts: [
      "arbitrage budgetaire",
      "incident majeur",
      "decision de gouvernance",
      "preparation d'un comite executif",
      "revue de conformite",
      "renouvellement contractuel"
    ],
    metrics: [
      "delai de decision",
      "cout complet a trois ans",
      "niveau de risque residuel",
      "taux de projets dans la trajectoire",
      "niveau de disponibilite des services critiques"
    ],
    keywords: [
      "gouvernance",
      "priorisation",
      "conformite",
      "resilience",
      "fournisseurs",
      "trajectoire numerique"
    ]
  },
  patients: {
    audience: "patients, proches, mediateurs, accueil administratif",
    roles: [
      "patient",
      "proche aidant",
      "agent d'accueil",
      "infirmier",
      "medecin referent",
      "service relations usagers"
    ],
    contexts: [
      "preadmission",
      "preparation d'examen",
      "retour a domicile",
      "mediation",
      "teleconsultation",
      "demande d'acces au dossier"
    ],
    metrics: [
      "delai de reponse au patient",
      "niveau de comprehension des consignes",
      "taux de dossiers complets a l'admission",
      "nombre de retours non programmes",
      "qualite perçue du parcours"
    ],
    keywords: [
      "parcours de soins",
      "consentement",
      "confidentialite",
      "sortie",
      "droits du patient",
      "telesuivi"
    ]
  },
  docteurs: {
    audience:
      "medecins seniors, internes, praticiens de garde, coordination medicale",
    roles: [
      "medecin senior",
      "interne",
      "praticien de garde",
      "chef de service",
      "pharmacien",
      "cadre de sante"
    ],
    contexts: [
      "escalade clinique",
      "concertation pluridisciplinaire",
      "prescription a risque",
      "transmission de garde",
      "conciliation medicamenteuse",
      "revue d'evenement indesirable"
    ],
    metrics: [
      "delai d'escalade",
      "taux de reevaluation therapeutique",
      "exhaustivite de la tracabilite",
      "delai de reponse aux avis specialises",
      "qualite des transmissions"
    ],
    keywords: [
      "protocoles cliniques",
      "gardes",
      "concertation",
      "prescription",
      "tracabilite",
      "qualite des soins"
    ]
  },
  dsi: {
    audience:
      "exploitation, architecture, securite, support et chefs de projet SI",
    roles: [
      "responsable infrastructure",
      "ingenieur systeme",
      "RSSI",
      "architecte SI",
      "technicien support",
      "chef de projet applicatif"
    ],
    contexts: [
      "incident de production",
      "mise en production",
      "test de restauration",
      "revue IAM",
      "segmentation reseau",
      "qualification d'un changement"
    ],
    metrics: [
      "RTO observe",
      "RPO respecte",
      "taux de patching",
      "delai moyen de resolution",
      "couverture de supervision"
    ],
    keywords: [
      "architecture",
      "supervision",
      "sauvegardes",
      "IAM",
      "segmentation reseau",
      "incidents"
    ]
  },
  "ressources-humaines": {
    audience:
      "DRH, managers, cadres, services support et representants de proximite",
    roles: [
      "DRH",
      "manager recruteur",
      "cadre de proximite",
      "gestionnaire RH",
      "agent",
      "medecine du travail"
    ],
    contexts: [
      "recrutement",
      "integration",
      "gestion des absences",
      "entretien annuel",
      "mobilite interne",
      "traitement d'un signalement"
    ],
    metrics: [
      "delai de recrutement",
      "taux de rupture en periode d'essai",
      "volume d'heures supplementaires",
      "taux d'absenteisme",
      "couverture des formations obligatoires"
    ],
    keywords: [
      "recrutement",
      "temps de travail",
      "formation",
      "mobilite",
      "QVCT",
      "discipline"
    ]
  }
};

/** @param {string} value
 * @returns {value is GroupKey}
 */
const isGroupKey = (value) => value in groupProfiles;

/** @param {string} value */
const toSlug = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

/** @param {string} value */
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @param {string[]} argv
 * @returns {ParsedArgs}
 */
const parseArgs = (argv) => {
  /** @type {{ outDir: string | null; targetBytes: number; sources: string[] }} */
  const args = { outDir: null, targetBytes: DEFAULT_TARGET_BYTES, sources: [] };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--outDir") {
      args.outDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--targetBytes") {
      args.targetBytes = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    args.sources.push(token);
  }

  if (!args.outDir) {
    throw new Error("Missing --outDir argument.");
  }

  if (!args.sources.length) {
    throw new Error("No source files provided.");
  }

  if (!Number.isFinite(args.targetBytes) || args.targetBytes <= 0) {
    throw new Error("--targetBytes must be a positive number.");
  }

  return {
    outDir: args.outDir,
    targetBytes: args.targetBytes,
    sources: args.sources
  };
};

/**
 * @param {string} themesBlock
 * @returns {string[]}
 */
const parseThemes = (themesBlock) =>
  themesBlock
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .map((line) => line.replace(/,$/, ""))
    .filter(Boolean);

/**
 * @param {string} groupBlock
 * @returns {ParsedSourceGroup}
 */
const parseSingleGroupBlock = (groupBlock) => {
  const groupMatch = groupBlock.match(/^GROUP:\s*(.+)$/m);
  const themesMatch = groupBlock.match(/^THEMES:\s*([\s\S]*?)^FILE:\s+/m);

  if (!groupMatch || !themesMatch) {
    throw new Error("Unable to parse GROUP or THEMES block.");
  }

  const group = groupMatch[1].trim();
  if (!isGroupKey(group)) {
    throw new Error(`Unsupported group: ${group}`);
  }
  const themes = parseThemes(themesMatch[1]);
  const fileMatches = [...groupBlock.matchAll(/^FILE:\s*(.+)$/gm)];
  const files = fileMatches.map((match, index) => {
    const start = match.index ?? 0;
    const end = fileMatches[index + 1]?.index ?? groupBlock.length;
    const block = groupBlock.slice(start, end).trim();
    const fileName = match[1].trim();
    const titleMatch = block.match(/^TITLE:\s*(.+)$/m);
    const summaryMatch = block.match(/^SUMMARY:\s*([\s\S]*?)^BODY:\s*$/m);
    const bodyMatch = block.match(/^BODY:\s*\n?([\s\S]*)$/m);

    if (!titleMatch || !summaryMatch || !bodyMatch) {
      throw new Error(`Unable to parse file block for ${fileName}.`);
    }

    return {
      fileName,
      title: titleMatch[1].trim(),
      summary: summaryMatch[1].trim(),
      body: bodyMatch[1].trim()
    };
  });

  return { group, themes, files };
};

/**
 * @param {string} sourceText
 * @returns {ParsedSourceGroup[]}
 */
const parseSourceText = (sourceText) => {
  const normalized = sourceText.replace(/\r\n/g, "\n");
  const groupMatches = [...normalized.matchAll(/^GROUP:\s*.+$/gm)];

  if (!groupMatches.length) {
    throw new Error("Unable to find any GROUP block.");
  }

  return groupMatches.map((match, index) => {
    const start = match.index ?? 0;
    const end = groupMatches[index + 1]?.index ?? normalized.length;
    return parseSingleGroupBlock(normalized.slice(start, end).trim());
  });
};

/** @param {string[]} lines */
const paragraphify = (lines) => lines.join("\n\n");

/**
 * @param {GroupKey} group
 * @param {GroupProfile} profile
 * @param {string} title
 * @param {string[]} themes
 * @returns {string[]}
 */
const buildOperationalParagraphs = (group, profile, title, themes) => {
  return Array.from({ length: 12 }, (_, index) => {
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const role = profile.roles[index % profile.roles.length];
    const context = profile.contexts[index % profile.contexts.length];
    const metric = profile.metrics[index % profile.metrics.length];
    const keyword = profile.keywords[index % profile.keywords.length];

    return `Repere ${index + 1}. Dans le cadre ${context}, le role ${role} doit relire les hypotheses relatives a ${theme} avant toute validation definitive. Pour le groupe ${group}, la documentation associee a \"${title}\" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que ${metric}. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur ${keyword}, sur les arbitrages de terrain et sur les suites a donner.`;
  });
};

/**
 * @param {GroupKey} group
 * @param {GroupProfile} profile
 * @param {string[]} themes
 * @returns {string[]}
 */
const buildScenarioParagraphs = (group, profile, themes) => {
  return Array.from({ length: 10 }, (_, index) => {
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const leadRole = profile.roles[index % profile.roles.length];
    const supportRole = profile.roles[(index + 2) % profile.roles.length];
    const context = profile.contexts[(index + 1) % profile.contexts.length];

    return `Scenario ${index + 1}. Un dossier lie a ${theme} arrive en phase ${context} alors que les informations transmises sont partielles. ${leadRole} constate un ecart entre le besoin initial et la situation observee, puis sollicite ${supportRole} pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.`;
  });
};

/**
 * @param {GroupKey} group
 * @param {GroupProfile} profile
 * @param {string[]} themes
 * @returns {string}
 */
const buildFaqSection = (group, profile, themes) => {
  /** @type {string[]} */
  const lines = [];

  for (let index = 0; index < 14; index += 1) {
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const context = profile.contexts[index % profile.contexts.length];
    const role = profile.roles[index % profile.roles.length];
    const metric = profile.metrics[index % profile.metrics.length];
    lines.push(
      `### Question ${index + 1} - Comment traiter ${theme} dans un contexte de ${context} ?`
    );
    lines.push(
      `La reponse attendue pour le groupe ${group} consiste d'abord a identifier le responsable principal, ici ${role}, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur ${metric}. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.`
    );
  }

  return lines.join("\n\n");
};

/**
 * @param {GroupProfile} profile
 * @param {string[]} themes
 * @returns {string}
 */
const buildChecklistSection = (profile, themes) => {
  const items = Array.from({ length: 18 }, (_, index) => {
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const metric = profile.metrics[index % profile.metrics.length];
    return `- Verifier le perimetre exact de ${theme} et sa correspondance avec l'indicateur ${metric}.`;
  });

  return items.join("\n");
};

/**
 * @param {GroupProfile} profile
 * @param {string[]} themes
 * @returns {string}
 */
const buildGlossarySection = (profile, themes) => {
  return Array.from({ length: 16 }, (_, index) => {
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const keyword = profile.keywords[index % profile.keywords.length];
    return `- **${theme}** : notion recurrente du corpus reliee a ${keyword}, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.`;
  }).join("\n");
};

/**
 * @param {GroupProfile} profile
 * @param {string[]} themes
 * @returns {string}
 */
const buildTimelineSection = (profile, themes) => {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String((index % 12) + 1).padStart(2, "0");
    const day = String(((index * 2) % 27) + 1).padStart(2, "0");
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const context = profile.contexts[index % profile.contexts.length];
    return `- 2026-${month}-${day} : revue ciblee sur ${theme}, avec verification des impacts, clarification du contexte ${context} et actualisation de la documentation de reference.`;
  }).join("\n");
};

/** @param {string} input */
const stripMarkdown = (input) =>
  input
    .replace(/^#+\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*\*/g, "")
    .trim();

/**
 * @param {{ group: GroupKey; themes: string[]; file: SourceFile; profile: GroupProfile; sequence: number }} input
 * @returns {string}
 */
const buildExpandedDocument = ({ group, themes, file, profile, sequence }) => {
  const baseBody = stripMarkdown(file.body);
  const operationalParagraphs = buildOperationalParagraphs(
    group,
    profile,
    file.title,
    themes
  );
  const scenarios = buildScenarioParagraphs(group, profile, themes);
  const faq = buildFaqSection(group, profile, themes);
  const checklist = buildChecklistSection(profile, themes);
  const glossary = buildGlossarySection(profile, themes);
  const timeline = buildTimelineSection(profile, themes);

  return `# ${file.title}

Groupe: ${group}
Sequence: ${sequence}
Audience: ${profile.audience}

## Resume

${file.summary}

## Corps principal

${baseBody}

## Reperes operationnels

${paragraphify(operationalParagraphs)}

## Scenarios frequents

${paragraphify(scenarios)}

## Questions recurrentes

${faq}

## Points de controle

${checklist}

## Glossaire de travail

${glossary}

## Chronologie type

${timeline}
`;
};

/**
 * @param {{ group: GroupKey; themes: string[]; profile: GroupProfile; variant: number }} input
 * @returns {string}
 */
const buildSynthesisDocument = ({ group, themes, profile, variant }) => {
  const title =
    variant === 1
      ? `Repertoire transverse des cas pratiques pour ${group}`
      : `Index thematique, glossaire et questions de recherche pour ${group}`;

  const intro = `Ce document transverse complete les notes principales du groupe ${group}. Il assemble un vocabulaire metier stable, des cas pratiques, des rappels de gouvernance et des formulations alternatives afin d'ameliorer le rappel lors des recherches semantiques. Les themes structurants sont: ${themes.join(", ")}.`;

  /** @type {string[]} */
  const blocks = [];
  for (let index = 0; index < 20; index += 1) {
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const role = profile.roles[index % profile.roles.length];
    const context = profile.contexts[index % profile.contexts.length];
    const metric = profile.metrics[index % profile.metrics.length];
    blocks.push(
      `Cas ${index + 1}. Le role ${role} intervient sur un dossier relie a ${theme} dans un contexte de ${context}. La note attendue doit decrire l'etat initial, les options examinees, la decision retenue, le raisonnement de proportionnalite et l'indicateur ${metric} utilise pour verifier l'effet concret de la mesure. La granularite choisie est volontairement detaillee pour aider un moteur RAG a distinguer les reponses proches, les synonymes et les situations frontieres.`
    );
  }

  const queries = Array.from({ length: 24 }, (_, index) => {
    const theme =
      themes[index % themes.length] ||
      profile.keywords[index % profile.keywords.length];
    const keyword = profile.keywords[index % profile.keywords.length];
    return `- Requete ${index + 1}: retrouver les passages qui rapprochent ${theme} de ${keyword}, avec un exemple, un seuil d'alerte et un role responsable.`;
  }).join("\n");

  return `# ${title}

Groupe: ${group}
Audience: ${profile.audience}

## Positionnement

${intro}

## Cas pratiques et formulations equivalentes

${paragraphify(blocks)}

## Requetes de recherche representative

${queries}

## Liste controlee de notions

${buildGlossarySection(profile, themes)}

## Repere chronologique

${buildTimelineSection(profile, themes)}
`;
};

/**
 * @param {{ group: GroupKey; themes: string[]; profile: GroupProfile; pass: number }} input
 * @returns {string}
 */
const buildAugmentation = ({ group, themes, profile, pass }) => {
  /** @type {string[]} */
  const notes = [];
  for (let index = 0; index < 8; index += 1) {
    const theme =
      themes[(index + pass) % themes.length] ||
      profile.keywords[(index + pass) % profile.keywords.length];
    const role = profile.roles[(index + pass) % profile.roles.length];
    const context = profile.contexts[(index + pass) % profile.contexts.length];
    const metric = profile.metrics[(index + pass) % profile.metrics.length];
    notes.push(
      `Augmentation ${pass + 1}.${index + 1}. Pour ${group}, ${role} documente un cas relie a ${theme} dans un contexte de ${context}. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur ${metric} servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.`
    );
  }

  return `
## Annexe de densification ${pass + 1}

${paragraphify(notes)}
`;
};

/**
 * @param {string} outDir
 * @param {CorpusDocument[]} corpus
 */
const writeCorpus = async (outDir, corpus) => {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const doc of corpus) {
    const groupDir = path.join(outDir, doc.group);
    await mkdir(groupDir, { recursive: true });
    await writeFile(path.join(groupDir, doc.fileName), doc.content, "utf8");
  }
};

/**
 * @param {CorpusDocument[]} corpus
 * @param {number} totalBytes
 * @returns {string}
 */
const buildReadme = (corpus, totalBytes) => {
  const groups = [...new Set(corpus.map((doc) => doc.group))];
  const lines = [
    "# Corpus de demonstration RAG",
    "",
    "Ce repertoire contient un corpus Markdown fictif pour la demo RAG.",
    "",
    `- Groupes: ${groups.join(", ")}`,
    `- Documents: ${corpus.length}`,
    `- Volume total approx.: ${totalBytes} octets`,
    "",
    "## Repartition",
    ""
  ];

  for (const group of groups) {
    const docs = corpus.filter((doc) => doc.group === group);
    const groupBytes = docs.reduce(
      (sum, doc) => sum + Buffer.byteLength(doc.content, "utf8"),
      0
    );
    lines.push(`- ${group}: ${docs.length} documents, ${groupBytes} octets`);
  }

  return `${lines.join("\n")}\n`;
};

const main = async () => {
  const { outDir, targetBytes, sources } = parseArgs(process.argv);
  /** @type {ParsedSourceGroup[]} */
  const parsedSources = [];

  for (const sourcePath of sources) {
    const sourceText = await readFile(sourcePath, "utf8");
    parsedSources.push(...parseSourceText(sourceText));
  }

  /** @type {CorpusDocument[]} */
  const corpus = [];

  for (const parsed of parsedSources) {
    const profile = groupProfiles[parsed.group];
    if (!profile) {
      throw new Error(`Unsupported group: ${parsed.group}`);
    }

    parsed.files.forEach((file, index) => {
      corpus.push({
        group: parsed.group,
        fileName: file.fileName,
        content: buildExpandedDocument({
          group: parsed.group,
          themes: parsed.themes,
          file,
          profile,
          sequence: index + 1
        }),
        profile,
        themes: parsed.themes
      });
    });

    corpus.push({
      group: parsed.group,
      fileName: "05-cas-pratiques-et-requetes.md",
      content: buildSynthesisDocument({
        group: parsed.group,
        themes: parsed.themes,
        profile,
        variant: 1
      }),
      profile,
      themes: parsed.themes
    });

    corpus.push({
      group: parsed.group,
      fileName: "06-glossaire-et-index.md",
      content: buildSynthesisDocument({
        group: parsed.group,
        themes: parsed.themes,
        profile,
        variant: 2
      }),
      profile,
      themes: parsed.themes
    });
  }

  let totalBytes = corpus.reduce(
    (sum, doc) => sum + Buffer.byteLength(doc.content, "utf8"),
    0
  );

  let pass = 0;
  while (totalBytes < targetBytes) {
    for (const doc of corpus) {
      const addition = buildAugmentation({
        group: doc.group,
        themes: doc.themes,
        profile: doc.profile,
        pass
      });
      doc.content += addition;
      totalBytes += Buffer.byteLength(addition, "utf8");
      if (totalBytes >= targetBytes) {
        break;
      }
    }
    pass += 1;
  }

  await writeCorpus(outDir, corpus);
  await writeFile(
    path.join(outDir, "README.md"),
    buildReadme(corpus, totalBytes),
    "utf8"
  );

  const manifest = corpus
    .map(
      (doc) =>
        `${doc.group}/${doc.fileName} ${Buffer.byteLength(doc.content, "utf8")}`
    )
    .join("\n");
  await writeFile(path.join(outDir, "manifest.txt"), `${manifest}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        outDir,
        documents: corpus.length,
        totalBytes,
        targetBytes,
        groups: [...new Set(corpus.map((doc) => doc.group))]
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
