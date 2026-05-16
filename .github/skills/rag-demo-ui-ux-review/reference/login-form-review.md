# Revue D’Un Formulaire De Connexion

Utiliser cette référence lors de la revue d’un écran de connexion ou de tout formulaire compact comportant un CTA primaire unique.

Le but n’est pas de corriger immédiatement le formulaire, mais de documenter précisément les problèmes observés dans un fichier `/UX-AUDIT/<slug-page>.md` avec une roadmap de correction.

## Critères À Charger En Priorité

- Guidage
- Charge de travail
- Contrôle explicite
- Homogénéité / cohérence
- Compatibilité

## Principal Mode D’Échec À Surveiller

L’erreur la plus pénalisante n’est souvent ni typographique ni chromatique, mais perceptive : un mauvais groupement visuel.

Si le CTA primaire est placé trop près du dernier champ, l’utilisateur peut le lire comme faisant partie du cluster de contrôle de ce champ, au lieu de le percevoir comme l’action finale du formulaire.

Lecture erronée typique :

1. champ mot de passe
2. bouton afficher ou masquer
3. bouton de soumission

Lecture correcte attendue :

1. titre et contexte
2. champ identifiant
3. champ mot de passe avec contrôle local de visibilité
4. pause visuelle
5. action primaire de validation

## Vérifications Guidage

- L’écran indique-t-il clairement où l’utilisateur est et ce qu’il doit faire ?
- Le CTA principal est-il immédiatement identifiable ?
- Les labels, aides et retours d’état suffisent-ils à orienter l’action ?

## Vérifications De Charge De Travail

- Le formulaire contient-il uniquement l’essentiel ?
- Les informations de contexte aident-elles vraiment, ou retardent-elles l’action ?
- Le volume visuel du bloc mot de passe est-il disproportionné par rapport au reste ?

## Vérifications De Contrôle Explicite

- Le bouton de visibilité est-il clairement compris comme un contrôle local ?
- Le CTA paraît-il final et global, plutôt que local au champ mot de passe ?
- Une action imprévue peut-elle être déclenchée ?

## Vérifications D’Homogénéité

- Les champs, labels et boutons partagent-ils une logique visuelle cohérente ?
- Les espacements verticaux suivent-ils un rythme stable ?
- Le CTA s’inscrit-il dans le même système visuel que le reste, sans perdre sa primauté ?

## Vérifications De Compatibilité

- La structure correspond-elle à ce qu’un utilisateur attend d’un formulaire web contemporain ?
- La hiérarchie entre champ, contrôle secondaire et soumission suit-elle les conventions connues ?

## Signes D’Une Interface Peu Professionnelle

- Le CTA est absorbé perceptivement par le bloc mot de passe.
- Le problème est structurel avant d’être esthétique.
- La proximité affaiblit la hiérarchie du formulaire.
- L’interface est propre, ce qui rend cette erreur de groupement encore plus visible.
- L’écran semble designé, mais ce détail l’empêche de paraître pleinement au niveau d’un produit fini.

## Traduction En Roadmap

Pour un écran de connexion, la roadmap doit généralement distinguer :

1. les corrections de hiérarchie et de groupement ;
2. les corrections d’espacement et de rythme ;
3. les corrections de finition visuelle et de cohérence.
