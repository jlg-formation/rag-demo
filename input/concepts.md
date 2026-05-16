# Concepts à présenter pour l'indexation RAG

Ce document recense les principaux paramètres qu'il est pertinent d'exposer en configuration dans une démonstration RAG, afin que des stagiaires puissent manipuler un maximum de notions liées à l'indexation.

## Objectif pédagogique

L'objectif n'est pas seulement de montrer qu'un document est converti en vecteurs, mais de faire comprendre quels choix de pipeline influencent :

- la qualité de la recherche
- la précision du contexte retrouvé
- le coût d'indexation
- la performance
- la sécurité d'accès aux contenus
- la maintenabilité de l'index

## 1. Découpage des documents

### Taille du chunk

- Définition : taille maximale d'un fragment de texte avant génération de l'embedding.
- Unités possibles : caractères, mots, tokens.
- Impact : des chunks trop petits perdent du contexte ; des chunks trop gros réduisent la précision de la recherche.
- À montrer en formation : comparer plusieurs tailles sur un même document.

### Recouvrement entre chunks

- Définition : portion du chunk précédent recopiée dans le suivant.
- Noms fréquents : overlap, stride, sliding window.
- Impact : un overlap faible ou nul peut perdre de l'information aux frontières ; un overlap fort augmente le coût et le nombre de vecteurs.
- À montrer en formation : comparer overlap 0, 10 %, 20 %.

### Stratégie de split

- Définition : logique utilisée pour découper le texte.
- Exemples : par paragraphe, par phrase, par titres Markdown, par fenêtres fixes, par pages, split sémantique, approche hybride.
- Impact : influe fortement sur la cohérence des chunks et sur la qualité de retrieval.

### Taille minimale d'un chunk

- Définition : seuil sous lequel un fragment est ignoré, fusionné ou enrichi.
- Impact : évite de stocker des morceaux trop pauvres sémantiquement.

### Gestion des longues phrases ou longs paragraphes

- Définition : comportement adopté lorsqu'une phrase ou un paragraphe dépasse la taille cible.
- Options : re-split forcé, coupe brute, fenêtre glissante, conservation telle quelle.
- Impact : important pour les documents juridiques, médicaux ou très denses.

### Conservation de la structure documentaire

- Définition : choix de rattacher ou non au chunk son titre, sa section, son chapitre ou sa page.
- Impact : améliore souvent la pertinence, car un même passage devient plus interprétable lorsqu'il conserve son contexte structurel.

## 2. Nettoyage et préparation du texte

### Normalisation du contenu

- Définition : nettoyage du texte avant découpage et indexation.
- Exemples : suppression des espaces multiples, normalisation Unicode, retrait des lignes vides parasites.
- Impact : réduit le bruit et rend l'index plus cohérent.

### Suppression des éléments non utiles

- Exemples : pieds de page, signatures, numérotation répétitive, headers techniques, mentions légales dupliquées.
- Impact : évite que l'index soit pollué par du texte sans valeur pour la recherche.

### Déduplication

- Définition : suppression des doublons exacts ou quasi doublons.
- Impact : limite le gaspillage de vecteurs et évite des réponses répétitives.

### Gestion par type de document

- Exemples : Markdown, PDF, texte brut, export bureautique.
- Impact : certains formats exigent une extraction et un nettoyage spécifiques avant le chunking.

## 3. Métadonnées indexées

### Identifiants documentaires

- documentId
- chunkIndex
- titre du document
- auteur ou créateur
- date de création
- date de mise à jour
- version du document

### Métadonnées de structure

- section
- chapitre
- page
- offset de début et de fin
- type de contenu

### Métadonnées métier et sécurité

- groupe d'accès
- rôle requis
- niveau de confidentialité
- source métier
- tags ou catégories

### Intérêt pédagogique

- montrer que les métadonnées ne servent pas seulement à l'affichage
- expliquer qu'elles permettent le filtrage d'accès et le filtrage fonctionnel
- montrer qu'elles permettent aussi des stratégies de reranking ou de priorisation

## 4. Embeddings

### Modèle d'embedding

- Définition : modèle qui convertit les chunks en vecteurs.
- Impact : influe sur la qualité sémantique, le coût, la latence et parfois la dimension du vecteur.
- À montrer en formation : comparer un modèle économique et un modèle plus performant si le budget le permet.

### Dimension des vecteurs

- Définition : taille numérique du vecteur produit.
- Impact : doit correspondre à la configuration de l'index vectoriel.
- Point de vigilance : un changement de modèle peut imposer une réindexation complète.

### Batch size d'embedding

- Définition : nombre de chunks envoyés par appel au fournisseur.
- Impact : joue sur la performance, la robustesse et parfois les limites API.

### Gestion des erreurs fournisseurs

- Paramètres utiles : timeout, retries, backoff, journalisation.
- Impact : important pour montrer qu'un pipeline d'indexation doit être opérationnel et non seulement fonctionnel.

### Version de la stratégie d'embedding

- Définition : version logique du pipeline ayant produit les vecteurs.
- Impact : utile pour tracer les campagnes d'indexation et comparer les résultats avant et après changement de configuration.

## 5. Stockage vectoriel

### Fournisseur vectoriel

- Exemples : Pinecone, Qdrant, Weaviate, pgvector.
- Intérêt pédagogique : distinguer le modèle d'embedding du moteur de stockage.

### Index cible

- Définition : index physique ou logique recevant les vecteurs.
- Impact : supporte une métrique, une dimension et des paramètres de capacité donnés.

### Namespace ou partition logique

- Définition : séparation logique des données dans un même index.
- Impact : utile pour segmenter des populations, des environnements ou des jeux de données.

### Métrique de similarité

- Exemples : cosine, dot product, euclidean.
- Impact : elle influence l'interprétation des scores et les performances de retrieval.

### Politique d'upsert et de suppression

- Options : remplacement, append, versionnement, suppression différentielle, purge complète.
- Impact : important pour expliquer la vie d'un index dans le temps.

## 6. Retrieval après indexation

### Top K

- Définition : nombre de chunks récupérés lors d'une recherche vectorielle.
- Impact : top K trop faible, rappel insuffisant ; top K trop élevé, bruit et contexte inutile.

### Seuil minimal de score

- Définition : score minimal à partir duquel un chunk est conservé.
- Impact : permet de filtrer les résultats faibles.

### Diversification des résultats

- Définition : limitation du nombre de chunks issus du même document ou de la même section.
- Impact : évite que tout le contexte vienne d'une seule source très dominante.

### Récupération des chunks voisins

- Définition : ajout du chunk précédent et du chunk suivant autour d'un chunk pertinent.
- Impact : compense un chunking agressif et reconstitue le contexte local.

### Filtrage par métadonnées

- Exemples : groupe, rôle, type de document, date, source, niveau de confidentialité.
- Impact : fondamental dans une démonstration où le contrôle d'accès fait partie de la valeur du système.

### Recherche hybride

- Définition : combinaison d'une recherche sémantique vectorielle et d'une recherche lexicale ou BM25.
- Impact : très utile pour montrer qu'un RAG ne repose pas uniquement sur les embeddings.

### Reranking

- Définition : deuxième étape de tri après la première récupération.
- Impact : améliore souvent la précision finale, au prix d'un coût supplémentaire.

## 7. Paramètres de pilotage et d'exploitation

### Réindexation

- manuelle ou automatique
- complète ou incrémentale
- déclenchée sur changement de modèle ou de chunking

### Traçabilité

- date d'indexation
- utilisateur ayant lancé l'opération
- version du pipeline
- nombre de chunks produits
- nombre de vecteurs envoyés
- durée d'indexation
- erreurs éventuelles

### Coût et performance

- coût estimé par document
- coût estimé par lot
- temps moyen par étape
- taille moyenne des chunks
- nombre de chunks par document

## 8. Paramètres à présenter en priorité à des stagiaires

Si vous devez limiter la configuration visible, les paramètres les plus formateurs sont :

1. taille du chunk
2. overlap
3. stratégie de split
4. modèle d'embedding
5. métadonnées stockées
6. index et namespace
7. top K
8. seuil minimal de score
9. filtrage par groupe ou par rôle
10. chunks voisins
11. recherche hybride activée ou non
12. reranking activé ou non

## 9. Paramètres avancés à montrer dans un second temps

- batch size d'embedding
- retry et timeout fournisseurs
- déduplication avancée
- versionnement du pipeline
- politique d'upsert
- politique de suppression
- priorisation par fraîcheur documentaire
- diversification inter-documents

## 10. Grille de lecture pédagogique

Pour chaque paramètre exposé, il est utile de faire verbaliser aux stagiaires :

- ce que le paramètre contrôle exactement
- ce qu'il améliore
- ce qu'il dégrade potentiellement
- son impact sur le coût
- son impact sur la pertinence
- son impact sur la sécurité ou la gouvernance

## 11. Application à cette démo

Dans cette démonstration, les paramètres actuellement visibles sont surtout liés aux fournisseurs et aux modèles. Pour la rendre plus formative sur l'indexation, il serait pertinent d'ajouter en configuration :

- chunk size
- overlap
- split strategy
- top K
- score threshold
- neighbor chunks
- metadata filters
- embedding model
- namespace
- mode hybrid search

## 12. Proposition de message clé à transmettre

L'indexation RAG n'est pas une simple étape technique cachée. C'est un ensemble de choix de conception qui déterminent ce que le système pourra retrouver, à quel coût, avec quel niveau de précision, et dans quelles limites de sécurité.
