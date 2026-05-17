Lorsqu'un utilisateur reçoit une réponse à une question RAG, cette réponse doit être renvoyée au format Markdown et suivre une structure lisible.

Le frontend doit être capable d'interpréter correctement le Markdown reçu et de l'afficher proprement dans l'interface.

La hiérarchie attendue sur l'écran est la suivante :

- la réponse constitue le contenu principal et doit être immédiatement lisible ;
- les chunks récupérés restent visibles comme éléments de preuve ou d'inspection ;
- le contenu détaillé de chaque chunk doit être replié par défaut dans un accordéon afin d'éviter de surcharger l'écran.

En pratique, cela implique :

- une réponse RAG structurée, par exemple avec des titres, paragraphes, listes et références de sources ;
- un rendu frontend compatible avec ce Markdown ;
- une zone secondaire dédiée aux chunks, avec un mécanisme d'ouverture et de fermeture pour consulter leur contenu seulement si nécessaire.

## Conception

### Objectif

L'écran de question RAG doit privilégier le processus nominal suivant :

1. l'utilisateur saisit une question ;
2. il obtient une réponse claire, structurée et immédiatement lisible ;
3. il peut ensuite inspecter les chunks récupérés s'il souhaite comprendre ou vérifier la réponse.

Les éléments de preuve ne doivent donc pas concurrencer visuellement la réponse principale.

### Conception backend

Le backend continue de renvoyer une réponse textuelle unique dans le champ `answer`, mais le contenu attendu de ce champ devient du Markdown structuré.

Le prompt système doit demander explicitement au modèle de produire une sortie stable, lisible et contrainte, par exemple avec la structure suivante :

- un court résumé ou une réponse directe ;
- une section de points clés ;
- une section de limites ou d'incertitudes lorsque l'information manque ;
- des références aux sources sous la forme `[Source X]`.

Le backend ne doit pas renvoyer du HTML. Le contrat de sortie reste du texte Markdown afin de conserver un transport simple et prévisible.

### Conception frontend

Le frontend doit interpréter le champ `answer` comme du Markdown et le rendre dans un composant dédié.

Le rendu doit au minimum supporter correctement :

- les titres ;
- les paragraphes ;
- les listes ;
- le texte accentué ;
- les citations éventuelles ;
- les références de type `[Source X]` affichées comme du texte lisible.

Le bloc de réponse doit devenir le bloc principal de lecture sur la page.

### Conception UX des chunks

Les chunks récupérés doivent être affichés dans une zone secondaire distincte, située après la réponse.

Chaque chunk doit présenter immédiatement ses métadonnées utiles, par exemple :

- le titre du document ;
- le groupe ;
- le score ;
- l'identifiant de source si nécessaire.

Le contenu textuel détaillé du chunk ne doit pas être visible par défaut. Il doit être placé dans un accordéon, ouvert à la demande, chunk par chunk.

Cette approche permet de conserver la traçabilité documentaire sans transformer l'écran principal en panneau d'inspection permanent.

### Décisions d'interface

- La réponse est affichée dans une carte ou un panneau principal.
- Les chunks sont affichés dans une section secondaire intitulée de manière explicite, par exemple `Passages récupérés`.
- Cette section peut rester visible, mais chaque contenu de chunk est replié par défaut.
- L'utilisateur doit pouvoir ouvrir un chunk individuellement sans perturber la lecture de la réponse.

### Contraintes de qualité

- Le Markdown renvoyé par le backend doit rester simple et régulier.
- Le frontend doit éviter toute interprétation dangereuse ou ambiguë du contenu reçu.
- L'affichage doit rester lisible sur desktop comme sur mobile.
- Si aucune réponse n'est encore disponible, l'interface doit conserver un état vide clair.

### Résultat attendu

La page `Question RAG` doit être perçue d'abord comme un écran de réponse, et seulement ensuite comme un écran d'inspection des preuves. La réponse doit être facile à lire, tandis que les chunks doivent rester accessibles sans surcharger la lecture initiale.
