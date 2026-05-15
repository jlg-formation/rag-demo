Ajouter au RAG un systeme de gestion utilisateur.
Au depart un compte admin/admin qui peut creer des groupes et des comptes.

compte =

- identifiant (mail) / mot de passe
- Display name
- appartient a un ou plusieurs groupes

Authentification (login/logout)

Un document qui se fait indexer par le RAG doit appartenir a un groupe.
Un utilisateur peut acceder a un document de RAG que si il appartient au groupe indique dans le document.

1. persistence : fichier JSON derriere le backend
2. fichier JSON
3. Mot de passe admin initial : on peut laisser admin/admin
4. Session : cookie de session
5. deconnexion : invalidation cote serveur
6. groupe : seulement un nom en spinal-case
7. les utilisateurs faisant parti du groupe admin seront admin. Le groupe admin existera au lancement de la demo.
8. quand un document est lié à un groupe, un utilisateur ayant au moins un des groupes du document peut y accéder.
9. un document indexé appartient à un seul groupe exactement.
10. indexation : un utilisateur peut indexer un document dont il est membre du groupe. un utilisateur n'a pas le droit d'indexer un document avec un groupe auquel il n'appartient pas.
11. Contrôle d’accès RAG : lors d’une question, il faut rechercher uniquement dans les documents accessibles à l’utilisateur connecté, même si plusieurs groupes sont concernés dans la même requête.
12. Isolation Pinecone : il faut une séparation logique par métadonnées et filtres Pinecone.
13. Gestion des documents : il faut ajouter une interface pour lister les documents indexés, voir leur groupe, et éventuellement les supprimer.
14. Identifiant utilisateur : le mail sert-il d’identifiant unique absolu, avec unicité stricte insensible à la casse.
15. Display name facultatif.
16. Création de compte : l’admin definit le mot de passe initial.
17. Niveau de sécurité attendu : pour cette démo, un système simple mais propre suffit.
18. Frontend : faire une layout complete avec mode connecte, deconnecte, page de login, dashboard avec sidebar a gauche qui montre les differentes pages.

Deuxieme vague de question/reponse :

1. Cookies de session : cookie simple signé côté backend
2. Durée de session : 1 jour
3. Fichier JSON : plusieurs fichiers séparés
4. Documents indexés : stocker les métadonnées du document dans le JSON applicatif, et aussi le texte source complet pour pouvoir le réafficher.
5. Suppression d’un document : il faut supprimer à la fois son enregistrement dans le JSON et aussi ses vecteurs correspondants dans Pinecone.
6. Pinecone : on garde un namespace unique pour toute l’application et filtrer uniquement par métadonnées (group, documentId, etc.)
7. Recherche RAG : lorsqu’un utilisateur appartient à plusieurs groupes, une seule question doit interroger simultanément tous les documents de tous ses groupes autorisés.
8. Admin : je confirme qu’un utilisateur membre du groupe admin peut aussi indexer et interroger des documents de ce groupe comme n’importe quel autre groupe.
9. UI dashboard : je veux un routage réel avec plusieurs pages (/login, /app/documents, /app/users, /app/groups, etc.)
10. Création de groupes : interdire strictement tout nom qui n’est pas déjà en spinal-case.
