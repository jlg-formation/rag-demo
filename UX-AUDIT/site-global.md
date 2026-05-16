# Audit global du site

## 1. Contexte

- Périmètre audité : écran de connexion, dashboard connecté, vues Question RAG, Configuration RAG, Documents, Indexer, Groupes et Utilisateurs.
- Méthode : observation du rendu réel sur la démo locale desktop et mobile, complétée par la lecture ciblée du frontend React.
- Contexte d’usage : produit de démonstration B2B / administration en thème clair, centré sur le contrôle d’accès, l’indexation documentaire et l’interrogation RAG.

## 2. Résumé exécutif

L’interface a une base visuelle sérieuse et cohérente. Le langage de composants, la palette claire et la structure générale donnent déjà une impression de produit administrable plutôt que de simple prototype.

En revanche, trois défauts affaiblissent fortement la qualité perçue et la confiance :

1. la page de configuration RAG expose les secrets opérationnels dans l’interface ;
2. la hiérarchie mobile est dominée par le menu au détriment de la tâche en cours ;
3. plusieurs écrans d’administration produisent une charge cognitive inutile par manque de structuration, de guidance et d’états intermédiaires fiables.

En l’état, le site paraît prometteur mais pas encore assez robuste pour inspirer une confiance forte en démonstration avancée ou devant un public métier.

## 3. Ce qui fonctionne

- Le thème clair, les surfaces vitrées, les coins arrondis et la palette chaude/froide construisent une identité visuelle cohérente.
- Le système de navigation est lisible sur desktop : les sections métier sont explicites et les intitulés sont globalement compréhensibles.
- Les écrans principaux partagent le même vocabulaire de composants, ce qui améliore l’homogénéité perçue.
- Les formulaires restent simples et les CTA principaux sont généralement faciles à repérer.

## 4. Constats détaillés

### Critique 1. Les secrets RAG sont exposés dans l’interface

- Gravité : critique.
- Constat : la vue Configuration RAG affiche les clés OpenAI et Pinecone déjà remplies dans les champs de formulaire. Lors de l’observation réelle, les valeurs étaient visibles dans l’arbre d’accessibilité, ce qui casse immédiatement la confiance produit.
- Pourquoi c’est grave : même dans une démo admin, montrer des secrets opérationnels dans l’UI fait basculer le problème hors du simple UX. L’utilisateur comprend que l’interface manipule des secrets sans précaution perceptible. Cela dégrade simultanément la sécurité, la crédibilité et la sensation de maîtrise.
- Critères touchés : gestion des erreurs, contrôle explicite, compatibilité avec les attentes actuelles, qualité perçue.
- Confirmation code : la page prévoit bien des champs de type `password`, mais l’interface rend quand même les secrets présents en valeur dans les contrôles, ce qui ne doit pas être observable comme tel côté client.

### Haute 2. En mobile, la navigation écrase la tâche principale

- Gravité : haute.
- Constat : sur mobile, la colonne latérale devient une longue pile de gros boutons occupant le haut de page. La navigation prend visuellement le rôle d’écran principal et pousse le contenu métier sous la ligne de flottaison.
- Pourquoi c’est un problème : un produit d’administration mobile peut être dense, mais il doit d’abord présenter la tâche en cours. Ici, le menu devient l’objet principal de la page. L’utilisateur voit d’abord une liste de destinations, pas la vue qu’il a choisie.
- Critères touchés : guidage, charge de travail, hiérarchie visuelle, compatibilité mobile.
- Effet perçu : l’application paraît plus proche d’un shell de navigation que d’un outil réellement optimisé pour accomplir une action.

### Haute 3. L’écran de connexion mise sur un héro spectaculaire au détriment de l’équilibre

- Gravité : haute.
- Constat : le titre principal est volontairement monumental, mais il se fragmente en colonnes de mots très courts et crée un déséquilibre important entre le panneau de gauche et le panneau de connexion.
- Pourquoi c’est un problème : la dramatisation typographique attire trop d’attention sur la promesse générale et pas assez sur l’action immédiate. On comprend le concept, mais la page perd en rythme, en stabilité et en efficacité de scan.
- Critères touchés : guidage, charge perceptive, équilibre, continuité.
- Effet perçu : le produit paraît visuellement ambitieux mais moins maîtrisé qu’il ne devrait l’être pour un contexte d’administration.

### Moyenne 4. Les formulaires d’administration manquent de hiérarchie interne

- Gravité : moyenne.
- Constat : sur les pages Groupes, Utilisateurs et Indexer, les zones de saisie, les listes existantes et les CTA partagent des niveaux d’emphase très proches. Sur Utilisateurs en particulier, la grille de groupes ajoute de la densité sans créer de paliers visuels nets.
- Pourquoi c’est un problème : l’utilisateur doit reconstruire seul la structure du formulaire. Il manque une segmentation plus explicite entre identité, sécurité, autorisations et résultat attendu.
- Critères touchés : guidage, charge de travail, groupement perceptif.
- Effet perçu : l’outil est fonctionnel, mais il demande plus d’attention que nécessaire pour une opération simple.

### Moyenne 5. Les états vides ne guident pas assez l’action suivante

- Gravité : moyenne.
- Constat : la vue Documents indique qu’aucun document n’est accessible, mais ne propose pas de chemin explicite vers l’indexation, la création ou l’explication des droits. Les listes d’administration reposent aussi sur des messages très courts.
- Pourquoi c’est un problème : un état vide utile doit répondre à la question “que faire maintenant ?”. Ici, il informe mais n’oriente pas.
- Critères touchés : guidage, compatibilité, signifiance des messages.
- Effet perçu : l’application paraît plus statique qu’assistante.

### Moyenne 6. Le langage produit reste hétérogène

- Gravité : moyenne.
- Constat : l’interface mélange français métier, anglicismes UI et termes techniques non harmonisés : `Login`, `Display name`, `spinal-case`, `Question RAG`, `Config RAG`.
- Pourquoi c’est un problème : dans un dashboard sérieux, le vocabulaire fait partie de l’expérience de confiance. Les changements de registre donnent une impression de finition incomplète.
- Critères touchés : homogénéité / cohérence, signifiance des dénominations.

### Moyenne 7. Les vues Groupes et Utilisateurs peuvent afficher un faux état vide pendant le chargement

- Gravité : moyenne.
- Constat : lors du parcours réel, les écrans Groupes et Utilisateurs ont brièvement présenté “Aucun groupe disponible” ou “Aucun compte disponible” avant d’afficher les données. Le code ne gère pas d’état de chargement dédié sur ces deux vues, contrairement aux pages Documents et Indexer.
- Pourquoi c’est un problème : un faux vide est plus nocif qu’un simple loader, car il communique une information factuellement fausse. L’utilisateur peut croire à un bug, à une perte de données ou à un problème de droits.
- Critères touchés : gestion des erreurs, guidage, cohérence inter-écrans.

### Basse 8. La démonstration expose trop visiblement ses données de départ

- Gravité : basse.
- Constat : l’écran de connexion annonce immédiatement `admin / admin`, et certaines vues préremplissent fortement les actions de démonstration.
- Pourquoi c’est un problème : cela aide à entrer vite, mais cela réduit la gravité perçue du produit et l’impression de robustesse. La démonstration devient visible comme démonstration, au lieu de rester crédible comme outil réel.
- Critères touchés : compatibilité avec le contexte d’usage, qualité perçue.

## 5. Roadmap de correction

### Priorité 1

1. Ne plus exposer les secrets RAG dans l’interface. Remplacer l’affichage des clés par un état masqué non récupérable visuellement et une logique de mise à jour partielle.
2. Revoir la page de configuration pour faire sentir la sensibilité des données : séparation nette entre statut, secrets, paramètres techniques et action de sauvegarde.

### Priorité 2

1. Repenser la version mobile du shell : navigation condensée, accordéon, tiroir ou barre plus compacte.
2. Faire remonter la tâche active avant le menu sur petit écran.
3. Réduire la hauteur occupée par l’introduction latérale en mobile.

### Priorité 3

1. Rééquilibrer la page de connexion : héro moins haut, meilleur rapport entre promesse produit et bloc d’action.
2. Réduire les retours à la ligne forcés du titre pour améliorer rythme et lisibilité.

### Priorité 4

1. Restructurer les formulaires d’administration en sous-sections plus nettes.
2. Enrichir les états vides avec une action utile immédiate.
3. Ajouter de vrais états de chargement sur Groupes et Utilisateurs, cohérents avec ceux des autres pages.

### Priorité 5

1. Harmoniser toute la terminologie de l’interface dans un français produit cohérent.
2. Réduire les indices trop démonstratifs visibles dès l’accueil.

## 6. Risques si rien n’est corrigé

- Perte immédiate de confiance à cause de l’exposition des secrets.
- Impression d’outil non finalisé ou non sécurisé devant un public client ou interne.
- Dégradation de l’usage mobile, avec une navigation qui concurrence le travail réel.
- Augmentation de la charge cognitive dans l’admin, surtout lors des premières utilisations.
- Confusion ponctuelle provoquée par des états vides faux ou insuffisamment guidants.
