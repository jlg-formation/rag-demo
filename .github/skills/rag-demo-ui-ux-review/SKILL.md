---
name: rag-demo-ui-ux-review
description: "À utiliser pour analyser l’UI ou l’UX de cette démo RAG : écran de connexion, dashboard, formulaires, espacements, hiérarchie visuelle, Gestalt, groupement des CTA, clarté de navigation, décisions de thème clair, qualité perçue du produit, ou quand l’utilisateur demande une critique, un audit, des commentaires, ou un retour d’expert design sans demander du code immédiatement."
version: 1.0.0
---

# Revue UI/UX RAG Demo

Skill de revue UI/UX spécifique au projet Mini RAG Demo.

Ce skill condense, sous forme de synthèse originale, le cadre d’audit ergonomique structuré par le site UX Audit, puis l’adapte au contexte de cette application RAG.

## Utiliser Ce Skill Quand

- L’utilisateur demande une revue UI experte d’un écran, d’un flux ou d’un composant.
- L’utilisateur partage une capture d’écran et demande une analyse ou des commentaires.
- La demande concerne l’UX de connexion, les formulaires, le placement des CTA, les espacements, la hiérarchie, le rythme, ou la qualité perçue de finition.
- La demande concerne l’ergonomie d’un dashboard ou d’une interface d’administration de style B2B.
- L’utilisateur veut une critique avant implémentation, ou souhaite une direction design plutôt qu’un correctif de code immédiat.
- Une interface semble correcte au premier regard mais donne une impression de résultat peu professionnel, étrange, bancal ou mal fini.

## Contexte Produit

- Ce projet est une démo RAG en thème clair, avec un frontend React et un dashboard de style administration.
- Le produit est sérieux, opérationnel, et centré sur le contrôle d’accès : groupes, utilisateurs, documents indexés, configuration RAG.
- L’interface doit inspirer confiance, rigueur et intention, plutôt qu’un simple habillage décoratif.
- Le niveau d’exigence visuelle est élevé parce que l’interface est globalement propre : de petites erreurs de groupement ou d’espacement deviennent donc immédiatement visibles.

## Mission Du Skill

Ce skill ne cherche pas à coder, corriger l’interface, ni proposer directement des patchs.

Sa mission est de produire un rapport d’audit UX/UI clair, exploitable et priorisé dans un fichier situé dans `/UX-AUDIT/<slug-page>.md`.

Pour réaliser cet audit, il peut utiliser des outils d’observation du site en conditions réelles, par exemple un navigateur piloté ou un serveur MCP de type Chrome DevTools, afin de voir l’interface comme un utilisateur.

## Sortie Obligatoire

Quand ce skill est invoqué pour un audit, il doit produire ou mettre à jour un fichier dans le dossier racine `/UX-AUDIT/`.

Le nom du fichier doit suivre la forme `/UX-AUDIT/<slug-page>.md`.

Le `slug-page` doit être suffisamment explicite pour identifier la zone auditée, par exemple :

- `login.md`
- `dashboard-rag-question.md`
- `documents-indexer.md`
- `admin-users-create.md`
- `rag-configuration.md`

Le slug doit être :

- en minuscules ;
- en kebab-case ;
- centré sur la page, le flux ou la zone réellement auditée ;
- stable dans le temps, pour permettre l’historisation des audits.

Le rapport doit être rédigé en français clair et contenir :

1. le périmètre audité ;
2. les constats principaux ;
3. les problèmes classés par sévérité ou priorité ;
4. l’explication ergonomique de chaque problème ;
5. une roadmap de correction ordonnée.

## Méthode De Revue

1. Identifier la tâche principale de l’écran.
2. Observer la page telle qu’elle est réellement rendue, si possible via un outil navigateur.
3. Auditer l’écran selon les critères ergonomiques adaptés au cas.
4. Faire passer la structure perceptive avant le style.
5. Expliquer les causes du malaise visuel ou fonctionnel.
6. Prioriser les corrections selon leur impact sur la compréhension et la qualité perçue.

## Observation En Conditions Réelles

Quand les outils disponibles le permettent, le skill doit privilégier une observation directe du site, par exemple via un navigateur instrumenté.

Exemples d’actions autorisées pendant l’audit :

- ouvrir une page ;
- redimensionner la fenêtre ;
- prendre des captures ;
- vérifier le rendu desktop et mobile ;
- observer les états de survol, de focus, de chargement ou d’erreur ;
- parcourir un flux comme le ferait un utilisateur.

Le but de ces outils est d’améliorer la qualité de l’audit, pas de modifier l’application.

## Mode Dégradé Si Le Site N’Est Pas Observable

Si le skill ne peut pas voir le site dans un navigateur, il doit le dire explicitement à l’utilisateur avant de poursuivre.

Dans ce cas, il doit basculer vers un audit fondé uniquement sur la lecture du code du frontend et sur les éventuelles captures déjà fournies.

Le rapport doit alors mentionner clairement que :

- l’interface n’a pas pu être observée en rendu réel ;
- l’audit repose sur les fichiers frontend disponibles ;
- certaines conclusions restent moins solides qu’après observation directe.

## Principes Directeurs Pour Ce Projet

- Thème clair par défaut.
- Hiérarchie claire avant densité décorative.
- Ton sérieux de produit B2B ou d’administration plutôt que posture marketing démonstrative.
- Les actions primaires doivent être perçues comme des actions finales, non comme des contrôles locaux.
- Les contrôles secondaires ne doivent pas entrer en compétition avec le CTA.
- L’interface doit paraître cohérente au premier regard et rigoureuse à l’examen détaillé.

## Base De Savoir Ergonomique

Le skill s’appuie sur huit grandes familles de critères ergonomiques. `SKILL.md` reste volontairement court ; charger ensuite la fiche pertinente selon le problème observé.

- Vue d’ensemble du processus : [audit-process](reference/audit-process.md)
- Guidage : [criteres-guidage](reference/criteres-guidage.md)
- Charge de travail : [criteres-charge-travail](reference/criteres-charge-travail.md)
- Contrôle explicite : [criteres-controle-explicite](reference/criteres-controle-explicite.md)
- Adaptabilité : [criteres-adaptabilite](reference/criteres-adaptabilite.md)
- Gestion des erreurs : [criteres-gestion-erreurs](reference/criteres-gestion-erreurs.md)
- Homogénéité / cohérence : [criteres-homogeneite-coherence](reference/criteres-homogeneite-coherence.md)
- Signifiance des codes et dénominations : [criteres-signifiance-denomination](reference/criteres-signifiance-denomination.md)
- Compatibilité : [criteres-compatibilite](reference/criteres-compatibilite.md)
- Cas projet prioritaire, formulaires de connexion : [login-form-review](reference/login-form-review.md)
- Modèle attendu du rapport : [ux-audit-report-template](reference/ux-audit-report-template.md)
- Convention de nommage des rapports : [ux-audit-slugging](reference/ux-audit-slugging.md)

## Priorités Par Défaut Pour Ce Projet

Quand aucun angle n’est précisé, commencer par :

1. Guidage
2. Groupement perceptif et hiérarchie des actions
3. Charge de travail
4. Homogénéité / cohérence
5. Compatibilité avec les habitudes d’usage actuelles

## Format Attendu Pour Les Rapports D’Audit

Le rapport doit rester opérationnel, sans jargon inutile. Il doit aider à décider quoi corriger d’abord.

Structure recommandée :

1. Contexte
2. Résumé exécutif
3. Constats détaillés
4. Roadmap de correction
5. Risques si rien n’est corrigé

Pour chaque constat, préciser :

- ce qui ne va pas ;
- pourquoi cela pose problème ;
- quel critère ergonomique est touché ;
- quel niveau de priorité attribuer.

## Style De Sortie Attendu

Quand ce skill est utilisé, le livrable principal est un fichier `/UX-AUDIT/<slug-page>.md`, et non une réponse conversationnelle longue.

Le rapport peut être structuré avec des sections courtes, par exemple :

1. Ce qui fonctionne
2. Ce qui casse la perception
3. Pourquoi cela paraît peu professionnel ou visuellement incorrect
4. Ce qu’il faut corriger en premier

Être explicite sur la logique perceptive :

- proximité
- hiérarchie
- région commune
- continuité
- équilibre
- rythme
- contraste d’emphase

Éviter les compliments génériques. Si quelque chose fonctionne, expliquer pourquoi. Si quelque chose ne fonctionne pas, identifier la cause structurelle exacte.

La roadmap doit être concrète et ordonnée, par exemple :

1. corriger les problèmes qui cassent la compréhension de l’action principale ;
2. corriger les problèmes qui augmentent la charge cognitive ou les erreurs ;
3. corriger les problèmes de cohérence, de rythme et de finition.

## Limite D’Intervention

Ce skill sert exclusivement à l’analyse, à la critique et à l’orientation design.

- Il ne doit pas chercher à implémenter les corrections.
- Il ne doit pas produire de patch ni modifier le frontend applicatif.
- Il peut utiliser des outils de navigation, de capture, de redimensionnement et d’inspection visuelle pour observer le comportement réel de l’interface.
- Si ces outils ne sont pas disponibles ou ne permettent pas de voir le site, il doit prévenir l’utilisateur et poursuivre l’audit uniquement à partir du code frontend.
- Si des modifications sont souhaitées ensuite, elles doivent être traitées dans une étape séparée, à partir de la roadmap du rapport.
