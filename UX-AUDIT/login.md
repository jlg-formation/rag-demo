# Audit UX/UI - Login

## 1. Contexte

- Périmètre audité : page de connexion `http://localhost:5173/login`.
- Slug retenu : `login.md`.
- Méthode : observation directe en navigateur local, capture desktop et viewport étroit, vérification du parcours clavier, lecture ciblée du composant frontend.
- Objectif métier de l'écran : permettre une connexion immédiate et rassurante à la démo RAG.

Sources de vérification :

- rendu observé sur la page locale ;
- structure du composant [project/apps/web/src/app-shell.tsx](project/apps/web/src/app-shell.tsx#L65) ;
- primitives visuelles communes dans [project/apps/web/src/components/ui.tsx](project/apps/web/src/components/ui.tsx#L1).

## 2. Résumé exécutif

La page de login présente une base visuelle sérieuse, avec un formulaire lisible, un CTA principal distinct et un parcours clavier cohérent. En revanche, l'écran ne place pas assez clairement l'action de connexion au premier plan, surtout sur viewport étroit.

Le premier défaut perceptif, celui qu'un humain verbalise presque immédiatement, est plus local : le bouton `Se connecter` est trop collé au champ mot de passe. L'action finale du formulaire entre alors dans le même groupe visuel que le dernier contrôle de saisie et son bouton d'affichage, au lieu d'apparaître comme une décision globale clairement détachée.

Le second problème est plus structurel : la priorité perceptive donnée au panneau éditorial de gauche. La promesse produit est mieux mise en scène que l'action immédiate. Pour un écran de connexion, cette inversion affaiblit le guidage, augmente la charge de lecture initiale et donne une impression de page d'accueil marketing plutôt que d'entrée applicative.

Priorité globale d'intervention : haute.

## 3. Constats détaillés

### Haute 1. Le bouton de soumission est absorbé par le bloc mot de passe

- Symptôme observé : le bouton `Se connecter` est placé trop près du champ mot de passe. La rupture visuelle entre dernier champ et action finale n'est pas assez nette.
- Impact utilisateur : le CTA est bien visible, mais il se lit comme le prolongement du bloc mot de passe plutôt que comme l'issue globale du formulaire.
- Explication ergonomique : c'est un problème classique de proximité et de groupement perceptif. Le champ mot de passe, le contrôle d'affichage/masquage et le bouton de soumission forment un cluster trop continu. Sur un login, l'utilisateur doit percevoir une pause nette entre contrôle local et validation finale.
- Critère concerné : guidage, contrôle explicite, groupement perceptif, Gestalt de proximité.
- Priorité : haute.

### Haute 2. L'action principale arrive trop tard dans le premier parcours visuel

- Symptôme observé : sur viewport étroit, le bloc éditorial occupe tout le premier écran et le formulaire de connexion commence seulement après ce panneau.
- Impact utilisateur : l'utilisateur voit d'abord un manifeste produit, puis seulement ensuite l'action à effectuer. L'entrée en tâche est retardée.
- Explication ergonomique : un écran de connexion doit faire dominer la réponse à la question "que faire maintenant ?". Ici, la hiérarchie de composition favorise la promesse et non l'action. Le couple `h1` monumental + panneau introductif complet prend le rôle de contenu principal.
- Critère concerné : guidage, charge de travail, compatibilité avec les habitudes actuelles.
- Priorité : haute.

### Haute 3. Le héros éditorial est surdimensionné pour une page de connexion

- Symptôme observé : le titre "Contrôler qui peut indexer, lire et interroger chaque document." occupe une place dominante et crée un rythme très long avant d'atteindre le formulaire.
- Impact utilisateur : la page semble d'abord présenter le produit, puis autoriser l'accès, au lieu d'assumer franchement une fonction de connexion.
- Explication ergonomique : ce niveau d'emphase convient à une landing page ou à un écran d'introduction, moins à une interface transactionnelle courte. La tension est encore plus visible parce que le formulaire, lui, est compact et bien construit.
- Critère concerné : guidage, équilibre visuel, continuité, groupement perceptif.
- Priorité : haute.

### Moyenne 4. Les identifiants de démonstration sont trop exposés dans l'interface

- Symptôme observé : la phrase "Compte initial de démonstration : admin / admin" est placée juste sous le titre du formulaire, et les deux champs sont déjà préremplis.
- Impact utilisateur : l'entrée est rapide, mais la page paraît plus démonstrative que rigoureuse. La crédibilité produit baisse, surtout devant un public métier.
- Explication ergonomique : aider à entrer vite est utile, mais il vaut mieux séparer l'aide contextuelle de la donnée sensible ou trop "démo visible". Ici, le message et le pré-remplissage disent la même chose deux fois et sur-signalisent l'artificialité du compte initial.
- Critère concerné : compatibilité, signifiance des dénominations, qualité perçue.
- Priorité : moyenne.

### Moyenne 5. Le contenu de réassurance sous forme d'icônes est décoratif plus qu'informatif

- Symptôme observé : la ligne d'items "Login / Groupes / Documents / RAG filtré" occupe de l'espace dans le panneau introductif sans aider directement la décision de connexion.
- Impact utilisateur : elle allonge l'écran et consomme de l'attention avant l'action principale.
- Explication ergonomique : ce type de liste fonctionne s'il clarifie un bénéfice ou une étape. Ici, elle répète surtout des sections applicatives déjà implicites dans le titre et le paragraphe. Elle est lisible, mais faible en utilité réelle.
- Critère concerné : charge de travail, pertinence informationnelle, concision.
- Priorité : moyenne.

### Basse 6. Le vocabulaire mélange registre produit sérieux et terminologie partiellement anglaise

- Symptôme observé : l'écran combine "Connexion", "Multi-tenant RAG", "Login" et "RAG filtré".
- Impact utilisateur : l'impression globale reste correcte, mais la finition éditoriale perd en cohésion.
- Explication ergonomique : sur un écran aussi court, chaque mot compte. Le mélange français/anglais donne une sensation de composition encore en cours d'arbitrage.
- Critère concerné : homogénéité / cohérence, signifiance des dénominations.
- Priorité : basse.

## 4. Ce qui fonctionne

- Le formulaire est simple, direct et sans surcharge. Il contient uniquement l'essentiel pour accomplir la tâche.
- Le CTA "Se connecter" ressort clairement grâce à sa couleur, sa largeur et son emplacement final dans le formulaire.
- Le contrôle de visibilité du mot de passe est bien compris comme un contrôle local et le parcours clavier observé reste cohérent : identifiant, mot de passe, bouton de visibilité, puis soumission.
- Les labels sont explicites et la lisibilité du formulaire est bonne en thème clair.
- Le système de composants inspire une impression de produit admin propre et relativement mature.

## 5. Roadmap de correction

### Phase 1 - Corriger la compréhension immédiate

1. Créer une vraie pause visuelle entre le champ mot de passe et le bouton `Se connecter` pour sortir le CTA du cluster local du mot de passe.
2. Faire du bloc de connexion l'élément dominant au chargement, surtout sous `920px`.
3. Réduire fortement la hauteur et l'emphase du panneau éditorial sur viewport étroit.
4. Repositionner la promesse produit comme contexte secondaire, pas comme premier objet perceptif.

### Phase 2 - Réduire l'effort et la charge initiale

1. Raccourcir le titre héros ou diminuer son impact typographique sur la page de login.
2. Supprimer ou condenser la ligne d'icônes "Login / Groupes / Documents / RAG filtré".
3. Garder une seule aide d'accès à la démo : message contextuel discret ou champs préremplis, mais pas les deux avec la même emphase.

### Phase 3 - Renforcer la cohésion et la finition

1. Harmoniser la terminologie entre français produit et vocabulaire technique.
2. Clarifier le ton de la page : écran de connexion applicatif d'abord, vitrine de la démo ensuite.
3. Préserver les points forts déjà présents : simplicité du formulaire, CTA net, labels clairs, thème clair propre.

## 6. Risques si rien n'est corrigé

- La page continuera à paraître plus démonstrative qu'opérationnelle.
- En mobile ou sur petits écrans, l'action de connexion restera perceptivement secondaire.
- La charge de lecture initiale sera plus élevée qu'elle ne devrait l'être pour une tâche aussi simple.
- La qualité perçue restera "bonne mais pas totalement maîtrisée", à cause d'un décalage entre ambition éditoriale et efficacité transactionnelle.
