# Regles IAM, gestion des postes de travail et segmentation reseau

Groupe: dsi
Sequence: 3
Audience: exploitation, architecture, securite, support et chefs de projet SI

## Resume

Ce document precise les principes de gestion des identites et des acces, les regles d'administration des postes de travail et les choix de segmentation reseau applicables aux environnements bureautiques et applicatifs. Il vise a reduire les risques de propagation, de mauvaise attribution des droits et de derive de configuration.

## Corps principal

Principes generaux. La gestion des identites et des acces repose sur le principe du moindre privilege, la separation des taches et la tracabilite des actions sensibles. Les comptes nominatif, compte de service et compte d'administration sont geres selon des regles distinctes afin d'eviter les usages hybrides et les elevations implicites de droits.

Referentiel d'identite. Le referentiel principal d'identite est alimente a partir des donnees RH et des decisions de management formelles. Toute creation, modification, suspension ou suppression de compte doit etre rattachee a un evenement documente, ce qui permet de reduire les ecarts entre situation administrative et droits reels dans le SI.

Habilitations. Les habilitations applicatives sont attribuees par profil de fonction et non par accumulation de droits unitaires lorsque cela est possible. Les exceptions individuelles restent autorisees pour des besoins ponctuels, mais elles doivent avoir une date de fin, un proprietaire metier et une justification explicite.

Comptes privilegies. Les comptes privilegies sont reserves aux personnels habilites a l'administration et ne doivent pas etre utilises pour la navigation bureautique, la messagerie ou l'acces Internet. Les operations sensibles realisees avec ces comptes doivent etre journalisees et faire l'objet de revues periodiques, en particulier pour les annuaires, les hyperviseurs et les solutions de sauvegarde.

Authentification forte. L'authentification renforcee est requise pour les acces distants, les consoles d'administration, les solutions de supervision centrales et tout service donnant acces a des donnees sensibles ou a des parametres critiques. Lorsqu'un editeur ne permet pas ce mecanisme, une mesure compensatoire documentee doit etre mise en place et revalidee periodiquement.

Postes de travail. Les postes de travail geres par la DSI reposent sur une image standard comprenant chiffrement, antivirus ou EDR, parametrage proxy, politique de mise a jour et restrictions d'execution definies selon le profil utilisateur. Les ecarts a l'image de reference ne sont admis que pour les postes techniques ou biomedicaux identifies et suivis nominativement.

Cycle de vie des postes. L'entree en parc, l'affectation, les changements de service, la restitution et la reforme des postes sont enregistres dans l'outil d'inventaire. Toute sortie de parc impose l'effacement controle des donnees locales, la suppression de l'objet d'annuaire si necessaire et la cloture des droits associes aux usages non transferrables.

Segmentation reseau. Le reseau est segmente par usages et niveaux d'exposition, avec separation entre postes bureautiques, serveurs, equipements techniques, services d'administration, flux partenaires et acces Internet. Les communications inter-zones sont autorisees par exception et documentees selon un besoin technique ou metier avéré.

Flux d'administration. Les flux d'administration doivent transiter par des reseaux ou des relais dedies et ne pas etre exposes depuis les segments utilisateurs standards. Cette mesure limite les deplacements lateraux en cas de compromission d'un poste de travail et facilite la surveillance des activites a fort impact sur le fonctionnement global du SI.

Equipements sensibles. Les equipements lies a des fonctions techniques ou a des systemes industriels legers sont places dans des segments specifiques avec des regles de filtrage strictes. Les acces distants de maintenance sont encadres par fenetre, par journalisation et, si possible, par mediation via un point d'entree maitrise par l'etablissement.

Revues periodiques. Une revue trimestrielle des groupes, des droits d'acces critiques, des comptes inactifs et des exceptions de segmentation est conduite par l'equipe securite avec l'appui des exploitants. Les ecarts sans justification sont traites comme non conformites et portent une date limite de regularisation.

Trajectoire. La trajectoire cible privilegie l'automatisation des mouvements IAM, la reduction des comptes techniques permanents et le renforcement du cloisonnement entre domaines d'usage. Les projets nouveaux doivent s'aligner sur cette cible et presenter, des la phase de conception, leurs besoins d'identite, d'administration et de flux reseau.

## Reperes operationnels

Repere 1. Dans le cadre incident de production, le role responsable infrastructure doit relire les hypotheses relatives a Architecture technique et urbanisation du SI avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RTO observe. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur architecture, sur les arbitrages de terrain et sur les suites a donner.

Repere 2. Dans le cadre mise en production, le role ingenieur systeme doit relire les hypotheses relatives a Supervision, observabilite et capacite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RPO respecte. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur supervision, sur les arbitrages de terrain et sur les suites a donner.

Repere 3. Dans le cadre test de restauration, le role RSSI doit relire les hypotheses relatives a Sauvegardes, retention et restauration avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que taux de patching. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur sauvegardes, sur les arbitrages de terrain et sur les suites a donner.

Repere 4. Dans le cadre revue IAM, le role architecte SI doit relire les hypotheses relatives a IAM, habilitations et tracabilite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que delai moyen de resolution. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur IAM, sur les arbitrages de terrain et sur les suites a donner.

Repere 5. Dans le cadre segmentation reseau, le role technicien support doit relire les hypotheses relatives a Gestion des incidents et escalade avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que couverture de supervision. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur segmentation reseau, sur les arbitrages de terrain et sur les suites a donner.

Repere 6. Dans le cadre qualification d'un changement, le role chef de projet applicatif doit relire les hypotheses relatives a PRA, PCA et continuite des soins avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RTO observe. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur incidents, sur les arbitrages de terrain et sur les suites a donner.

Repere 7. Dans le cadre incident de production, le role responsable infrastructure doit relire les hypotheses relatives a Postes de travail et cycle de vie avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RPO respecte. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur architecture, sur les arbitrages de terrain et sur les suites a donner.

Repere 8. Dans le cadre mise en production, le role ingenieur systeme doit relire les hypotheses relatives a Segmentation reseau et projets applicatifs avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que taux de patching. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur supervision, sur les arbitrages de terrain et sur les suites a donner.

Repere 9. Dans le cadre test de restauration, le role RSSI doit relire les hypotheses relatives a Architecture technique et urbanisation du SI avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que delai moyen de resolution. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur sauvegardes, sur les arbitrages de terrain et sur les suites a donner.

Repere 10. Dans le cadre revue IAM, le role architecte SI doit relire les hypotheses relatives a Supervision, observabilite et capacite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que couverture de supervision. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur IAM, sur les arbitrages de terrain et sur les suites a donner.

Repere 11. Dans le cadre segmentation reseau, le role technicien support doit relire les hypotheses relatives a Sauvegardes, retention et restauration avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RTO observe. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur segmentation reseau, sur les arbitrages de terrain et sur les suites a donner.

Repere 12. Dans le cadre qualification d'un changement, le role chef de projet applicatif doit relire les hypotheses relatives a IAM, habilitations et tracabilite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Regles IAM, gestion des postes de travail et segmentation reseau" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RPO respecte. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur incidents, sur les arbitrages de terrain et sur les suites a donner.

## Scenarios frequents

Scenario 1. Un dossier lie a Architecture technique et urbanisation du SI arrive en phase mise en production alors que les informations transmises sont partielles. responsable infrastructure constate un ecart entre le besoin initial et la situation observee, puis sollicite RSSI pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 2. Un dossier lie a Supervision, observabilite et capacite arrive en phase test de restauration alors que les informations transmises sont partielles. ingenieur systeme constate un ecart entre le besoin initial et la situation observee, puis sollicite architecte SI pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 3. Un dossier lie a Sauvegardes, retention et restauration arrive en phase revue IAM alors que les informations transmises sont partielles. RSSI constate un ecart entre le besoin initial et la situation observee, puis sollicite technicien support pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 4. Un dossier lie a IAM, habilitations et tracabilite arrive en phase segmentation reseau alors que les informations transmises sont partielles. architecte SI constate un ecart entre le besoin initial et la situation observee, puis sollicite chef de projet applicatif pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 5. Un dossier lie a Gestion des incidents et escalade arrive en phase qualification d'un changement alors que les informations transmises sont partielles. technicien support constate un ecart entre le besoin initial et la situation observee, puis sollicite responsable infrastructure pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 6. Un dossier lie a PRA, PCA et continuite des soins arrive en phase incident de production alors que les informations transmises sont partielles. chef de projet applicatif constate un ecart entre le besoin initial et la situation observee, puis sollicite ingenieur systeme pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 7. Un dossier lie a Postes de travail et cycle de vie arrive en phase mise en production alors que les informations transmises sont partielles. responsable infrastructure constate un ecart entre le besoin initial et la situation observee, puis sollicite RSSI pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 8. Un dossier lie a Segmentation reseau et projets applicatifs arrive en phase test de restauration alors que les informations transmises sont partielles. ingenieur systeme constate un ecart entre le besoin initial et la situation observee, puis sollicite architecte SI pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 9. Un dossier lie a Architecture technique et urbanisation du SI arrive en phase revue IAM alors que les informations transmises sont partielles. RSSI constate un ecart entre le besoin initial et la situation observee, puis sollicite technicien support pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

Scenario 10. Un dossier lie a Supervision, observabilite et capacite arrive en phase segmentation reseau alors que les informations transmises sont partielles. architecte SI constate un ecart entre le besoin initial et la situation observee, puis sollicite chef de projet applicatif pour confirmer les dependances, requalifier le niveau de risque et fixer un delai de reponse. Le traitement retenu privilegie une action simple, reversible et tracee, avec un point de controle explicite a la fin de la sequence. Ce type de cas pratique enrichit le corpus de recherche semantique en mettant en relation des mots clefs proches mais non strictement identiques.

## Questions recurrentes

### Question 1 - Comment traiter Architecture technique et urbanisation du SI dans un contexte de incident de production ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici responsable infrastructure, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur RTO observe. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 2 - Comment traiter Supervision, observabilite et capacite dans un contexte de mise en production ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici ingenieur systeme, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur RPO respecte. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 3 - Comment traiter Sauvegardes, retention et restauration dans un contexte de test de restauration ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici RSSI, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur taux de patching. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 4 - Comment traiter IAM, habilitations et tracabilite dans un contexte de revue IAM ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici architecte SI, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur delai moyen de resolution. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 5 - Comment traiter Gestion des incidents et escalade dans un contexte de segmentation reseau ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici technicien support, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur couverture de supervision. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 6 - Comment traiter PRA, PCA et continuite des soins dans un contexte de qualification d'un changement ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici chef de projet applicatif, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur RTO observe. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 7 - Comment traiter Postes de travail et cycle de vie dans un contexte de incident de production ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici responsable infrastructure, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur RPO respecte. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 8 - Comment traiter Segmentation reseau et projets applicatifs dans un contexte de mise en production ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici ingenieur systeme, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur taux de patching. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 9 - Comment traiter Architecture technique et urbanisation du SI dans un contexte de test de restauration ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici RSSI, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur delai moyen de resolution. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 10 - Comment traiter Supervision, observabilite et capacite dans un contexte de revue IAM ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici architecte SI, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur couverture de supervision. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 11 - Comment traiter Sauvegardes, retention et restauration dans un contexte de segmentation reseau ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici technicien support, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur RTO observe. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 12 - Comment traiter IAM, habilitations et tracabilite dans un contexte de qualification d'un changement ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici chef de projet applicatif, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur RPO respecte. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 13 - Comment traiter Gestion des incidents et escalade dans un contexte de incident de production ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici responsable infrastructure, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur taux de patching. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

### Question 14 - Comment traiter PRA, PCA et continuite des soins dans un contexte de mise en production ?

La reponse attendue pour le groupe dsi consiste d'abord a identifier le responsable principal, ici ingenieur systeme, puis a verifier les pre requis, les informations manquantes et les impacts potentiels sur delai moyen de resolution. Une bonne reponse RAG doit retrouver les paragraphes qui distinguent la decision immediate, les conditions de reexamen et les points a escalader.

## Points de controle

- Verifier le perimetre exact de Architecture technique et urbanisation du SI et sa correspondance avec l'indicateur RTO observe.
- Verifier le perimetre exact de Supervision, observabilite et capacite et sa correspondance avec l'indicateur RPO respecte.
- Verifier le perimetre exact de Sauvegardes, retention et restauration et sa correspondance avec l'indicateur taux de patching.
- Verifier le perimetre exact de IAM, habilitations et tracabilite et sa correspondance avec l'indicateur delai moyen de resolution.
- Verifier le perimetre exact de Gestion des incidents et escalade et sa correspondance avec l'indicateur couverture de supervision.
- Verifier le perimetre exact de PRA, PCA et continuite des soins et sa correspondance avec l'indicateur RTO observe.
- Verifier le perimetre exact de Postes de travail et cycle de vie et sa correspondance avec l'indicateur RPO respecte.
- Verifier le perimetre exact de Segmentation reseau et projets applicatifs et sa correspondance avec l'indicateur taux de patching.
- Verifier le perimetre exact de Architecture technique et urbanisation du SI et sa correspondance avec l'indicateur delai moyen de resolution.
- Verifier le perimetre exact de Supervision, observabilite et capacite et sa correspondance avec l'indicateur couverture de supervision.
- Verifier le perimetre exact de Sauvegardes, retention et restauration et sa correspondance avec l'indicateur RTO observe.
- Verifier le perimetre exact de IAM, habilitations et tracabilite et sa correspondance avec l'indicateur RPO respecte.
- Verifier le perimetre exact de Gestion des incidents et escalade et sa correspondance avec l'indicateur taux de patching.
- Verifier le perimetre exact de PRA, PCA et continuite des soins et sa correspondance avec l'indicateur delai moyen de resolution.
- Verifier le perimetre exact de Postes de travail et cycle de vie et sa correspondance avec l'indicateur couverture de supervision.
- Verifier le perimetre exact de Segmentation reseau et projets applicatifs et sa correspondance avec l'indicateur RTO observe.
- Verifier le perimetre exact de Architecture technique et urbanisation du SI et sa correspondance avec l'indicateur RPO respecte.
- Verifier le perimetre exact de Supervision, observabilite et capacite et sa correspondance avec l'indicateur taux de patching.

## Glossaire de travail

- **Architecture technique et urbanisation du SI** : notion recurrente du corpus reliee a architecture, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Supervision, observabilite et capacite** : notion recurrente du corpus reliee a supervision, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Sauvegardes, retention et restauration** : notion recurrente du corpus reliee a sauvegardes, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **IAM, habilitations et tracabilite** : notion recurrente du corpus reliee a IAM, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Gestion des incidents et escalade** : notion recurrente du corpus reliee a segmentation reseau, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **PRA, PCA et continuite des soins** : notion recurrente du corpus reliee a incidents, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Postes de travail et cycle de vie** : notion recurrente du corpus reliee a architecture, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Segmentation reseau et projets applicatifs** : notion recurrente du corpus reliee a supervision, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Architecture technique et urbanisation du SI** : notion recurrente du corpus reliee a sauvegardes, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Supervision, observabilite et capacite** : notion recurrente du corpus reliee a IAM, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Sauvegardes, retention et restauration** : notion recurrente du corpus reliee a segmentation reseau, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **IAM, habilitations et tracabilite** : notion recurrente du corpus reliee a incidents, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Gestion des incidents et escalade** : notion recurrente du corpus reliee a architecture, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **PRA, PCA et continuite des soins** : notion recurrente du corpus reliee a supervision, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Postes de travail et cycle de vie** : notion recurrente du corpus reliee a sauvegardes, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.
- **Segmentation reseau et projets applicatifs** : notion recurrente du corpus reliee a IAM, documentee avec des exemples, des variantes lexicales et des criteres d'usage propres au terrain.

## Chronologie type

- 2026-01-01 : revue ciblee sur Architecture technique et urbanisation du SI, avec verification des impacts, clarification du contexte incident de production et actualisation de la documentation de reference.
- 2026-02-03 : revue ciblee sur Supervision, observabilite et capacite, avec verification des impacts, clarification du contexte mise en production et actualisation de la documentation de reference.
- 2026-03-05 : revue ciblee sur Sauvegardes, retention et restauration, avec verification des impacts, clarification du contexte test de restauration et actualisation de la documentation de reference.
- 2026-04-07 : revue ciblee sur IAM, habilitations et tracabilite, avec verification des impacts, clarification du contexte revue IAM et actualisation de la documentation de reference.
- 2026-05-09 : revue ciblee sur Gestion des incidents et escalade, avec verification des impacts, clarification du contexte segmentation reseau et actualisation de la documentation de reference.
- 2026-06-11 : revue ciblee sur PRA, PCA et continuite des soins, avec verification des impacts, clarification du contexte qualification d'un changement et actualisation de la documentation de reference.
- 2026-07-13 : revue ciblee sur Postes de travail et cycle de vie, avec verification des impacts, clarification du contexte incident de production et actualisation de la documentation de reference.
- 2026-08-15 : revue ciblee sur Segmentation reseau et projets applicatifs, avec verification des impacts, clarification du contexte mise en production et actualisation de la documentation de reference.
- 2026-09-17 : revue ciblee sur Architecture technique et urbanisation du SI, avec verification des impacts, clarification du contexte test de restauration et actualisation de la documentation de reference.
- 2026-10-19 : revue ciblee sur Supervision, observabilite et capacite, avec verification des impacts, clarification du contexte revue IAM et actualisation de la documentation de reference.
- 2026-11-21 : revue ciblee sur Sauvegardes, retention et restauration, avec verification des impacts, clarification du contexte segmentation reseau et actualisation de la documentation de reference.
- 2026-12-23 : revue ciblee sur IAM, habilitations et tracabilite, avec verification des impacts, clarification du contexte qualification d'un changement et actualisation de la documentation de reference.

## Annexe de densification 1

Augmentation 1.1. Pour dsi, responsable infrastructure documente un cas relie a Architecture technique et urbanisation du SI dans un contexte de incident de production. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur RTO observe servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.

Augmentation 1.2. Pour dsi, ingenieur systeme documente un cas relie a Supervision, observabilite et capacite dans un contexte de mise en production. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur RPO respecte servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.

Augmentation 1.3. Pour dsi, RSSI documente un cas relie a Sauvegardes, retention et restauration dans un contexte de test de restauration. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur taux de patching servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.

Augmentation 1.4. Pour dsi, architecte SI documente un cas relie a IAM, habilitations et tracabilite dans un contexte de revue IAM. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur delai moyen de resolution servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.

Augmentation 1.5. Pour dsi, technicien support documente un cas relie a Gestion des incidents et escalade dans un contexte de segmentation reseau. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur couverture de supervision servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.

Augmentation 1.6. Pour dsi, chef de projet applicatif documente un cas relie a PRA, PCA et continuite des soins dans un contexte de qualification d'un changement. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur RTO observe servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.

Augmentation 1.7. Pour dsi, responsable infrastructure documente un cas relie a Postes de travail et cycle de vie dans un contexte de incident de production. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur RPO respecte servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.

Augmentation 1.8. Pour dsi, ingenieur systeme documente un cas relie a Segmentation reseau et projets applicatifs dans un contexte de mise en production. La note rappelle les informations a verifier, les decisions a tracer, les formulations synonymes utiles a la recherche et l'indicateur taux de patching servant de point de comparaison. Ce paragraphe additionnel densifie le corpus sans changer sa plausibilite documentaire.
