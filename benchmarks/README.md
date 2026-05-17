# Jeux de questions RAG

Ce dossier contient les lots de questions predefinies utilises pour deux usages distincts :

- guider les stagiaires avec des questions prêtes a l'emploi ;
- benchmarker les reponses du systeme sur une base stable.

## Pourquoi ce dossier est hors de `content`

Le script [tools/bulk-import-content.mjs](../tools/bulk-import-content.mjs) parcourt chaque sous-repertoire de `content/` comme un groupe metier a importer. Les jeux de questions ne doivent donc pas etre ranges dans `content/`, sous peine d'etre interpretes comme des documents du corpus.

## Format recommande

Un lot de questions correspond a un fichier JSON autonome, versionne, par exemple :

- `stagiaires-v1.json` pour un jeu guide ;
- `benchmark-v1.json` pour un jeu d'evaluation ;
- `patients-v1.json` pour un jeu centre sur un seul groupe.

Le fichier suit cette structure :

- `datasetId` : identifiant stable du lot.
- `version` : version lisible du lot.
- `purpose` : `training`, `benchmark` ou `mixed`.
- `defaultLanguage` : langue des questions.
- `title` : titre lisible du lot.
- `description` : contexte d'usage du lot.
- `cases` : liste des cas de test.

Chaque cas contient :

- `id` : identifiant stable de la question.
- `title` : etiquette courte.
- `question` : formulation envoyee au RAG.
- `persona` : public vise, par exemple `stagiaire`, `admin`, `patient`.
- `allowedGroups` : groupes que l'on attend comme perimetre d'acces.
- `expectedDocuments` : documents cibles si vous voulez verifier la recuperation.
- `mustInclude` : faits que la reponse doit idealement couvrir.
- `mustAvoid` : faits ou comportements a ne pas produire.
- `notes` : precisions pedagogiques ou d'evaluation.

## Regles de conception

- Garder `id` stable dans le temps pour suivre les regressions.
- Evaluer prioritairement des faits attendus plutot qu'une reponse redigee mot pour mot.
- Preferer `mustInclude` et `expectedDocuments` a une unique `goldenAnswer`.
- Utiliser `allowedGroups` pour verifier le respect du cloisonnement metier.
- Distinguer les cas `training` des cas `benchmark` pour ne pas biaiser les demonstrations.

## Exemple

Voir [benchmarks/question-set.example.json](question-set.example.json).

## Lots initiaux fournis

- [benchmarks/stagiaires-v1.json](stagiaires-v1.json) : lot guide pour demarrer rapidement.
- [benchmarks/benchmark-v1.json](benchmark-v1.json) : lot plus strict pour comparer les reponses et la recuperation.
