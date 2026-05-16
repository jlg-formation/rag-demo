# Critère Ergonomique : Contrôle Explicite

## Idée Centrale

L’utilisateur doit comprendre ce qui déclenche une action, et garder la main sur les opérations importantes. Le système ne doit pas agir de manière ambiguë ou surprenante.

## Sous-Critères À Vérifier

- Actions explicites : les actions sont-elles déclenchées de manière claire et volontaire ?
- Contrôle utilisateur : l’utilisateur peut-il corriger, interrompre ou revenir sur une action importante ?

## Questions De Revue

- Est-il évident de savoir ce qui sera déclenché ?
- Une action locale peut-elle être confondue avec une action globale ?
- Les opérations sensibles ont-elles une validation ou une réversibilité adaptées ?
- L’interface évite-t-elle les surprises de comportement ?

## Signes De Faiblesse

- bouton principal confondu avec un contrôle de champ
- soumission involontaire
- effet déclenché avant compréhension
- action dangereuse sans confirmation ni retour arrière

## Traduction Pour Ce Projet

Ce critère est particulièrement important pour l’indexation, la suppression, la déconnexion et les réglages RAG. L’utilisateur doit toujours savoir s’il modifie un champ, une section, ou l’état global du système.
