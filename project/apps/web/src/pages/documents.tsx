import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  FaCircleCheck,
  FaClock,
  FaDatabase,
  FaFileLines,
  FaLayerGroup,
  FaPlus,
  FaShieldHalved,
  FaTrashCan,
  FaTriangleExclamation
} from "react-icons/fa6";
import {
  ACCEPTED_DOCUMENT_INPUT,
  ApiError,
  apiRequest,
  buildDocumentFileKey,
  formatDateTime,
  formatFileSize,
  getDocumentTitleFromFileName,
  isAcceptedDocumentFile,
  sampleDocument,
  useDashboardContext
} from "../app-shared";
import type {
  DocumentSummary,
  DocumentsPayload,
  GroupSummary,
  UploadedDocumentsPayload
} from "../app-types";
import {
  Banner,
  Button,
  Card,
  Divider,
  EmptyState,
  Field,
  Panel,
  PanelHeading,
  SelectInput,
  TextArea,
  TextInput
} from "../components/ui";

export function DocumentIndexPage() {
  const { user, ragConfig, resetAuth } = useDashboardContext();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("Politique RAG d’équipe");
  const [group, setGroup] = useState("");
  const [sourceText, setSourceText] = useState(sampleDocument);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      resetAuth();
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      setUploadError(null);
      setPasteError(null);

      try {
        const groupsPayload = await apiRequest<{ groups: GroupSummary[] }>(
          "/api/groups"
        );
        setGroups(groupsPayload.groups);
        setGroup((current) => current || groupsPayload.groups[0]?.name || "");
      } catch (error) {
        handleUnauthorized(error);
        const message =
          error instanceof Error ? error.message : "Chargement impossible.";
        setUploadError(message);
        setPasteError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadGroups();
  }, []);

  const appendFiles = (incomingFiles: File[]) => {
    const acceptedFiles = incomingFiles.filter(isAcceptedDocumentFile);
    const rejectedFiles = incomingFiles.filter(
      (file) => !isAcceptedDocumentFile(file)
    );

    setFiles((current) => {
      const nextFiles = new Map(
        current.map((file) => [buildDocumentFileKey(file), file])
      );

      for (const file of acceptedFiles) {
        nextFiles.set(buildDocumentFileKey(file), file);
      }

      return [...nextFiles.values()];
    });

    setUploadMessage(null);
    setUploadError(
      rejectedFiles.length
        ? "Seuls les fichiers .txt, .md et .markdown sont acceptés."
        : null
    );
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputFiles = event.target.files ? [...event.target.files] : [];
    appendFiles(inputFiles);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    appendFiles([...event.dataTransfer.files]);
  };

  const removeFile = (fileKey: string) => {
    setFiles((current) =>
      current.filter((file) => buildDocumentFileKey(file) !== fileKey)
    );
  };

  const handleFileUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploadingFiles(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("group", group);
      for (const file of files) {
        formData.append("files", file);
      }

      const payload = await apiRequest<UploadedDocumentsPayload>(
        "/api/documents/upload",
        {
          method: "POST",
          body: formData
        }
      );
      setUploadMessage(
        `${payload.documents.length} document(s) indexé(s) avec succès.`
      );
      setFiles([]);
    } catch (error) {
      handleUnauthorized(error);
      setUploadError(
        error instanceof Error ? error.message : "Import impossible."
      );
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleTextSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingText(true);
    setPasteError(null);
    setPasteMessage(null);

    try {
      await apiRequest<{ document: DocumentSummary }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({ title, group, sourceText })
      });
      setPasteMessage("Document texte indexé et persisté avec succès.");
      setTitle("");
      setSourceText("");
    } catch (error) {
      handleUnauthorized(error);
      setPasteError(
        error instanceof Error ? error.message : "Indexation impossible."
      );
    } finally {
      setIsSubmittingText(false);
    }
  };

  return (
    <div className="page-grid">
      <Panel className="page-panel">
        <PanelHeading
          description={
            <>
              Vous pouvez uniquement indexer un document dans un groupe dont
              vous êtes membre. Groupes actifs : {user.groups.join(", ")}.
            </>
          }
          icon={<FaPlus />}
          title="Indexer un document"
        />

        {isLoading ? (
          <EmptyState icon={<FaClock />}>Chargement des groupes…</EmptyState>
        ) : null}

        <form className="subpanel" onSubmit={handleFileUpload}>
          <Field label="Groupe">
            <SelectInput
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              {groups.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>

          <div className="mt-2 flex flex-col gap-2">
            <span>Fichiers source</span>
            <div
              className={`upload-dropzone ${isDragActive ? "is-drag-active" : ""}`}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                accept={ACCEPTED_DOCUMENT_INPUT}
                className="visually-hidden"
                multiple
                onChange={handleFileInputChange}
                ref={fileInputRef}
                type="file"
              />
              <p className="upload-dropzone__title">
                Glissez-déposez un ou plusieurs fichiers texte ou Markdown
              </p>
              <p className="muted-text upload-dropzone__hint">
                Formats acceptés : .txt, .md, .markdown
              </p>
              <Button
                className="upload-dropzone__button"
                onClick={() => fileInputRef.current?.click()}
                type="button"
                variant="ghost"
              >
                <FaPlus />
                <span>Choisir des fichiers</span>
              </Button>
            </div>
          </div>

          <div className="document-list">
            {files.map((file) => {
              const fileKey = buildDocumentFileKey(file);

              return (
                <Card className="compact-card document-card" key={fileKey}>
                  <div className="document-card__header">
                    <div>
                      <h3>{getDocumentTitleFromFileName(file.name)}</h3>
                      <p className="muted-text meta-line meta-line--wrap">
                        <FaFileLines />
                        <span>
                          {file.name} · {formatFileSize(file.size)}
                        </span>
                      </p>
                    </div>

                    <Button
                      onClick={() => removeFile(fileKey)}
                      type="button"
                      variant="danger"
                    >
                      <FaTrashCan />
                      <span>Retirer</span>
                    </Button>
                  </div>
                </Card>
              );
            })}

            {!files.length ? (
              <EmptyState icon={<FaFileLines />}>
                Aucun fichier sélectionné pour l’import multiple.
              </EmptyState>
            ) : null}
          </div>

          <Button
            disabled={
              isUploadingFiles ||
              !ragConfig.configured ||
              !groups.length ||
              !files.length
            }
            fullWidth
            type="submit"
          >
            <FaFileLines />
            <span>
              {isUploadingFiles
                ? "Import en cours…"
                : "Indexer les fichiers sélectionnés"}
            </span>
          </Button>
        </form>

        {uploadMessage ? (
          <Banner icon={<FaCircleCheck />} tone="success">
            {uploadMessage}
          </Banner>
        ) : null}
        {uploadError ? (
          <Banner icon={<FaTriangleExclamation />} tone="error">
            {uploadError}
          </Banner>
        ) : null}

        <Divider className="section-divider" />

        <form className="subpanel" onSubmit={handleTextSubmit}>
          <Field label="Nom du document">
            <TextInput
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
            />
          </Field>

          <Field label="Texte source">
            <TextArea
              rows={14}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
            />
          </Field>

          <Button
            disabled={
              isSubmittingText || !ragConfig.configured || !groups.length
            }
            fullWidth
            type="submit"
          >
            <FaPlus />
            <span>
              {isSubmittingText ? "Indexation…" : "Indexer le texte collé"}
            </span>
          </Button>
        </form>

        {pasteMessage ? (
          <Banner icon={<FaCircleCheck />} tone="success">
            {pasteMessage}
          </Banner>
        ) : null}
        {pasteError ? (
          <Banner icon={<FaTriangleExclamation />} tone="error">
            {pasteError}
          </Banner>
        ) : null}

        {!ragConfig.configured ? (
          <Banner icon={<FaShieldHalved />} tone="info">
            Le backend RAG doit être configuré avant toute indexation dans
            Pinecone.
          </Banner>
        ) : null}
      </Panel>
    </div>
  );
}

export function DocumentsListPage() {
  const { resetAuth } = useDashboardContext();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      resetAuth();
    }
  };

  const loadPageData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const documentsPayload =
        await apiRequest<DocumentsPayload>("/api/documents");

      setDocuments(documentsPayload.documents);
    } catch (error) {
      handleUnauthorized(error);
      setError(
        error instanceof Error ? error.message : "Chargement impossible."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    setError(null);
    setMessage(null);

    try {
      await apiRequest<{ ok: boolean }>(`/api/documents/${documentId}`, {
        method: "DELETE"
      });
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId)
      );
      setMessage("Document supprimé du JSON applicatif et de Pinecone.");
    } catch (error) {
      handleUnauthorized(error);
      setError(
        error instanceof Error ? error.message : "Suppression impossible."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-grid">
      <Panel className="page-panel">
        <PanelHeading
          description={
            <>
              Seuls les documents correspondant à vos groupes apparaissent ici.
            </>
          }
          icon={<FaDatabase />}
          title="Documents accessibles"
        />

        {message ? (
          <Banner icon={<FaCircleCheck />} tone="success">
            {message}
          </Banner>
        ) : null}
        {error ? (
          <Banner icon={<FaTriangleExclamation />} tone="error">
            {error}
          </Banner>
        ) : null}
        {isLoading ? (
          <EmptyState icon={<FaClock />}>Chargement des documents…</EmptyState>
        ) : null}

        <div className="document-list">
          {documents.map((document) => (
            <Card className="document-card" key={document.id}>
              <div className="document-card__header">
                <div>
                  <h3>{document.title}</h3>
                  <p className="muted-text meta-line meta-line--wrap">
                    <FaLayerGroup />
                    <span>
                      Groupe {document.group} · {document.chunkCount} chunks ·{" "}
                      {formatDateTime(document.createdAt)}
                    </span>
                  </p>
                </div>

                <Button
                  disabled={deletingId === document.id}
                  onClick={() => void handleDelete(document.id)}
                  type="button"
                  variant="danger"
                >
                  <FaTrashCan />
                  <span>
                    {deletingId === document.id ? "Suppression…" : "Supprimer"}
                  </span>
                </Button>
              </div>

              <p>{document.sourceText}</p>
            </Card>
          ))}

          {!isLoading && !documents.length ? (
            <EmptyState icon={<FaFileLines />}>
              Aucun document accessible pour les groupes de l’utilisateur
              connecté.
            </EmptyState>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
