import { FaCircleCheck, FaGear, FaTriangleExclamation } from "react-icons/fa6";
import { CHUNK_MODE_OPTIONS, getChunkUnitLabel } from "../../app-shared";
import type { RagConfigSummary } from "../../app-types";
import {
  Banner,
  Button,
  Card,
  Divider,
  Field,
  SelectInput,
  TextInput
} from "../../components/ui";
import { ChunkingSchema } from "../../components/chunk-schema";
import { SecretField } from "./SecretField";
import { useRagConfigurationForm } from "./useRagConfigurationForm";

type RagConfigurationFormProps = {
  ragConfig: RagConfigSummary;
  resetAuth: () => void;
  setRagConfig: (value: RagConfigSummary) => void;
};

export function RagConfigurationForm({
  ragConfig,
  resetAuth,
  setRagConfig
}: RagConfigurationFormProps) {
  const form = useRagConfigurationForm({ ragConfig, resetAuth, setRagConfig });
  const chunkUnitLabel = getChunkUnitLabel(form.chunkMode);

  return (
    <>
      <form className="subpanel" onSubmit={form.handleConfigure}>
        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-semibold text-ink-900">
            Secrets fournisseurs
          </p>
          <p className="m-0 text-sm text-ink-700">
            Vérifiez rapidement quelles clés sont déjà en place, puis remplacez
            uniquement celles qui changent.
          </p>
        </div>

        <div className="grid gap-4">
          <SecretField
            configured={ragConfig.openAiApiKeyConfigured}
            label="Clé OpenAI"
            lastCharacters={ragConfig.openAiApiKeyLast4}
            replaceMode={form.replaceOpenAiApiKey}
            value={form.openAiApiKey}
            visible={form.showOpenAiApiKey}
            onChange={form.setOpenAiApiKey}
            onToggleReplace={() => {
              form.setReplaceOpenAiApiKey((current) => !current);
              form.setOpenAiApiKey("");
              form.setShowOpenAiApiKey(false);
            }}
            onToggleVisibility={() =>
              form.setShowOpenAiApiKey((current) => !current)
            }
          />

          <SecretField
            configured={ragConfig.pineconeApiKeyConfigured}
            label="Clé Pinecone"
            lastCharacters={ragConfig.pineconeApiKeyLast4}
            replaceMode={form.replacePineconeApiKey}
            value={form.pineconeApiKey}
            visible={form.showPineconeApiKey}
            onChange={form.setPineconeApiKey}
            onToggleReplace={() => {
              form.setReplacePineconeApiKey((current) => !current);
              form.setPineconeApiKey("");
              form.setShowPineconeApiKey(false);
            }}
            onToggleVisibility={() =>
              form.setShowPineconeApiKey((current) => !current)
            }
          />
        </div>

        <Divider className="my-5" />

        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-semibold text-ink-900">
            Paramètres techniques
          </p>
          <p className="m-0 text-sm text-ink-700">
            Modifiez ici l’index, le host, les modèles et les paramètres de
            chunking utilisés par le backend.
          </p>
        </div>

        <div className="config-grid">
          <Field label="Index Pinecone">
            <TextInput
              value={form.pineconeIndex}
              onChange={(event) => form.setPineconeIndex(event.target.value)}
            />
          </Field>
          <Field label="Host Pinecone">
            <TextInput
              value={form.pineconeHost}
              onChange={(event) => form.setPineconeHost(event.target.value)}
            />
          </Field>
          <Field label="Modèle d’embedding">
            <TextInput
              value={form.embeddingModel}
              onChange={(event) => form.setEmbeddingModel(event.target.value)}
            />
          </Field>
          <Field label="Modèle de chat">
            <TextInput
              value={form.chatModel}
              onChange={(event) => form.setChatModel(event.target.value)}
            />
          </Field>
          <Field label="Mode de chunking">
            <SelectInput
              value={form.chunkMode}
              onChange={(event) =>
                form.setChunkMode(event.target.value as typeof form.chunkMode)
              }
            >
              {CHUNK_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={`Taille de chunk (${chunkUnitLabel})`}>
            <TextInput
              min={1}
              step={1}
              type="number"
              value={form.chunkSize}
              onChange={(event) => form.setChunkSize(event.target.value)}
            />
          </Field>
          <Field label={`Overlap (${chunkUnitLabel})`}>
            <TextInput
              min={0}
              step={1}
              type="number"
              value={form.chunkOverlap}
              onChange={(event) => form.setChunkOverlap(event.target.value)}
            />
          </Field>
        </div>

        <Card className="compact-card">
          <p className="m-0 text-sm font-semibold text-ink-900">
            Stride calculé
          </p>
          <p className="m-0 text-sm text-ink-700">
            {form.chunkStrideValue > 0
              ? `${form.chunkStrideValue} ${chunkUnitLabel} (${form.chunkSizeValue} - ${form.chunkOverlapValue})`
              : "Le stride doit rester strictement positif."}
          </p>
          {form.chunkMode === "tokens" ? (
            <p className="m-0 text-sm text-ink-700">
              Le mode tokens utilise tiktoken pour compter les segments.
            </p>
          ) : null}
          <ChunkingSchema
            chunkOverlap={form.chunkOverlapValue}
            chunkSize={form.chunkSizeValue}
            unitLabel={chunkUnitLabel}
          />
        </Card>

        <Divider className="my-5" />

        <Button
          disabled={
            form.isConfiguring ||
            !form.pineconeIndex.trim() ||
            form.chunkOverlapValue >= form.chunkSizeValue
          }
          fullWidth
          type="submit"
        >
          <FaGear />
          <span>
            {form.isConfiguring
              ? "Enregistrement…"
              : "Enregistrer la configuration"}
          </span>
        </Button>
      </form>

      {form.message ? (
        <Banner icon={<FaCircleCheck />} tone="success">
          {form.message}
        </Banner>
      ) : null}
      {form.error ? (
        <Banner icon={<FaTriangleExclamation />} tone="error">
          {form.error}
        </Banner>
      ) : null}
      {form.chunkOverlapValue >= form.chunkSizeValue ? (
        <Banner icon={<FaTriangleExclamation />} tone="error">
          L’overlap doit rester strictement inférieur à la taille de chunk.
        </Banner>
      ) : null}
    </>
  );
}
