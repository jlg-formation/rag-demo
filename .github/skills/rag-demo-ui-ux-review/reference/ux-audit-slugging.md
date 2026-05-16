# Convention De Nommage Des Rapports D’Audit

Utiliser cette fiche pour choisir correctement le nom de sortie du rapport d’audit.

## Format Obligatoire

Le rapport doit être écrit dans :

`/UX-AUDIT/<slug-page>.md`

## Règles De Construction Du Slug

- utiliser uniquement des minuscules ;
- utiliser des mots séparés par des tirets ;
- nommer la page, le flux ou la zone auditée ;
- éviter les noms trop vagues comme `page.md`, `audit.md`, `home.md` si l’écran n’est pas réellement la page d’accueil ;
- choisir un slug suffisamment précis pour que l’on comprenne immédiatement le périmètre audité.

## Exemples Recommandés

- `login.md`
- `login-mobile.md`
- `dashboard-rag-question.md`
- `dashboard-rag-configuration.md`
- `documents-list.md`
- `documents-indexer.md`
- `admin-groups.md`
- `admin-users-create.md`

## Cas D’Audit Partiel

Si l’audit ne porte pas sur toute la page mais sur une zone précise, le slug peut intégrer cette zone :

- `login-password-block.md`
- `documents-indexer-upload-zone.md`
- `dashboard-sidebar-navigation.md`

## Objectif

Le nom du fichier doit permettre :

- de retrouver rapidement l’audit correspondant ;
- de distinguer plusieurs audits d’une même application ;
- de capitaliser dans le temps sans ambiguïté.
