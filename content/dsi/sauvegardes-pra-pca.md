# Politique de sauvegardes, de restauration et de continuite d'activite

Groupe: dsi
Sequence: 2
Audience: exploitation, architecture, securite, support et chefs de projet SI

## Resume

Ce document formalise les regles de sauvegarde, les objectifs de restauration et l'organisation du PRA et du PCA pour les services numeriques critiques. Il distingue les exigences techniques et les exigences metier afin de soutenir la continuite des soins et la reprise des fonctions administratives essentielles.

## Corps principal

Objectif. La politique de sauvegardes vise a garantir la disponibilite, l'integrite et la recuperabilite des donnees utiles au fonctionnement de l'etablissement. Elle couvre les donnees applicatives, les configurations d'infrastructure, les scripts d'exploitation, les referentiels partages et les elements necessaires a une reconstruction controlee des services.

Classification. Les services sont classes en quatre niveaux de criticite selon leur impact sur la continuite des soins, l'accueil des patients, la production medico-technique et l'administration. Cette classification determine la frequence de sauvegarde, la duree de retention, les objectifs de point de reprise et les delais acceptables de remise en service.

Strategie de sauvegarde. Les bases critiques font l'objet de sauvegardes completes hebdomadaires, de sauvegardes incrementales quotidiennes et, lorsque la technologie le permet, d'une journalisation permettant une restauration a un instant donne. Les serveurs de fichiers et depots documentaires sont sauvegardes selon une combinaison de captures regulieres et d'archivage distinct pour les donnees de reference.

Retentions. Les retentions sont definies selon un principe de paliers afin de concilier besoin d'exploitation et maitrise des couts de stockage. Une retention courte permet la restauration rapide des incidents courants, une retention mensuelle soutient les demandes ponctuelles de reprise ancienne, et une retention longue est reservee aux obligations de reference ou aux dossiers a forte sensibilite.

Isolement des copies. Au moins une copie de sauvegarde est conservee sur un support ou un emplacement logiquement distinct de la production. Ce principe limite le risque de compromission simultanee lors d'un incident majeur, d'une erreur humaine ou d'une attaque affectant les systemes connectes au domaine d'administration courant.

Tests de restauration. Les restaurations ne sont considerees conformes que si elles sont testees regulierement. Un plan de tests trimestriel couvre les fichiers, les bases et au minimum un service applicatif complet, avec verification de la coherence fonctionnelle par un referent metier lorsque la restauration concerne un processus sensible.

RTO et RPO. Pour les applications indispensables a la prise en charge immediate, l'objectif de reprise est court et le point de reprise doit limiter la perte de donnees a une fenetre restreinte. Pour les applications de support non cliniques, des objectifs plus larges sont toleres, sous reserve qu'ils soient explicites, connus des directions et valides en comite de continuite.

PRA technique. Le plan de reprise d'activite technique decrit les conditions de declaration, la chaine d'alerte, l'ordre de redemarrage des briques et les controles de sortie de crise. Il inclut les dependances invisibles en apparence, telles que DNS, annuaires, certificats, passerelles de messagerie, outils de supervision et comptes de service.

PCA metier. Le plan de continuite d'activite organise les modes de fonctionnement degradés des directions et des services de soins lorsque le SI n'est plus integralement disponible. Les procedures papier ou locales, les circuits de validation manuelle et les modalites de resaisie ulterieure y sont decrits pour les activites prioritaires.

Gouvernance de crise. En cas de sinistre majeur, une cellule de crise DSI est activee sous l'autorite du directeur ou de son delegataire. Les decisions de bascule, de reprise partielle, de maintien en mode degrade et de retour a la normale sont tracees, datees et communiquees selon un schema predefini vers les parties prenantes internes.

Conditions de succes. La qualite du PRA et du PCA depend de l'actualisation des inventaires, de la disponibilite des contacts, de la maitrise des dependances contractuelles et de la clarte des criteres de priorisation. Toute mise en production majeure doit donc verifier son alignement avec les scenarios de reprise avant cloture du changement.

Revue annuelle. Une revue annuelle consolide les resultats des tests, les ecarts constates, les actions correctives et les besoins de financement eventuels. Les enseignements tires des incidents reels sont integres dans la version suivante afin d'eviter que le PRA et le PCA ne deviennent des documents theoriques deconnectes des pratiques d'exploitation.

## Reperes operationnels

Repere 1. Dans le cadre incident de production, le role responsable infrastructure doit relire les hypotheses relatives a Architecture technique et urbanisation du SI avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RTO observe. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur architecture, sur les arbitrages de terrain et sur les suites a donner.

Repere 2. Dans le cadre mise en production, le role ingenieur systeme doit relire les hypotheses relatives a Supervision, observabilite et capacite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RPO respecte. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur supervision, sur les arbitrages de terrain et sur les suites a donner.

Repere 3. Dans le cadre test de restauration, le role RSSI doit relire les hypotheses relatives a Sauvegardes, retention et restauration avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que taux de patching. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur sauvegardes, sur les arbitrages de terrain et sur les suites a donner.

Repere 4. Dans le cadre revue IAM, le role architecte SI doit relire les hypotheses relatives a IAM, habilitations et tracabilite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que delai moyen de resolution. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur IAM, sur les arbitrages de terrain et sur les suites a donner.

Repere 5. Dans le cadre segmentation reseau, le role technicien support doit relire les hypotheses relatives a Gestion des incidents et escalade avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que couverture de supervision. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur segmentation reseau, sur les arbitrages de terrain et sur les suites a donner.

Repere 6. Dans le cadre qualification d'un changement, le role chef de projet applicatif doit relire les hypotheses relatives a PRA, PCA et continuite des soins avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RTO observe. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur incidents, sur les arbitrages de terrain et sur les suites a donner.

Repere 7. Dans le cadre incident de production, le role responsable infrastructure doit relire les hypotheses relatives a Postes de travail et cycle de vie avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RPO respecte. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur architecture, sur les arbitrages de terrain et sur les suites a donner.

Repere 8. Dans le cadre mise en production, le role ingenieur systeme doit relire les hypotheses relatives a Segmentation reseau et projets applicatifs avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que taux de patching. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur supervision, sur les arbitrages de terrain et sur les suites a donner.

Repere 9. Dans le cadre test de restauration, le role RSSI doit relire les hypotheses relatives a Architecture technique et urbanisation du SI avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que delai moyen de resolution. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur sauvegardes, sur les arbitrages de terrain et sur les suites a donner.

Repere 10. Dans le cadre revue IAM, le role architecte SI doit relire les hypotheses relatives a Supervision, observabilite et capacite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que couverture de supervision. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur IAM, sur les arbitrages de terrain et sur les suites a donner.

Repere 11. Dans le cadre segmentation reseau, le role technicien support doit relire les hypotheses relatives a Sauvegardes, retention et restauration avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RTO observe. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur segmentation reseau, sur les arbitrages de terrain et sur les suites a donner.

Repere 12. Dans le cadre qualification d'un changement, le role chef de projet applicatif doit relire les hypotheses relatives a IAM, habilitations et tracabilite avant toute validation definitive. Pour le groupe dsi, la documentation associee a "Politique de sauvegardes, de restauration et de continuite d'activite" rappelle que la qualite d'execution depend autant de la clarte des responsabilites que de la precision des informations transmises. Lorsque la situation change, la mise a jour doit etre horodatee, motivee et reliee a un indicateur de suivi tel que RPO respecte. Cette discipline documentaire permet de retrouver rapidement les passages utiles a une question RAG portant sur incidents, sur les arbitrages de terrain et sur les suites a donner.

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
