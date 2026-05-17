import { FaEye, FaEyeSlash, FaKey, FaXmark } from "react-icons/fa6";
import { Field, TextInput } from "../../components/ui";

const getSecretStatusLabel = (
  configured: boolean,
  lastCharacters: string | null
) => {
  if (!configured) {
    return "Aucune clé enregistrée";
  }

  if (!lastCharacters) {
    return "******";
  }

  return `******${lastCharacters}`;
};

type SecretFieldProps = {
  configured: boolean;
  lastCharacters: string | null;
  label: string;
  replaceMode: boolean;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleReplace: () => void;
  onToggleVisibility: () => void;
};

export function SecretField({
  configured,
  lastCharacters,
  label,
  onChange,
  onToggleReplace,
  onToggleVisibility,
  replaceMode,
  value,
  visible
}: SecretFieldProps) {
  const configuredSecretTooltip =
    "La valeur complète reste côté backend et n’est jamais renvoyée au navigateur.";

  return (
    <Field label={label}>
      <div className="flex flex-col gap-3">
        {replaceMode ? (
          <div className="secret-field">
            <div className="secret-input-wrap secret-input-wrap--editing">
              <button
                aria-label="Annuler le remplacement"
                className="secret-prefix-button"
                onClick={onToggleReplace}
                type="button"
              >
                <FaXmark />
              </button>
              <TextInput
                aria-label={`Nouvelle ${label.toLowerCase()}`}
                autoComplete="off"
                className="secret-input secret-input--with-prefix"
                placeholder={`Saisir une nouvelle ${label.toLowerCase()}`}
                type={visible ? "text" : "password"}
                value={value}
                onChange={(event) => onChange(event.target.value)}
              />
              <button
                aria-label={
                  visible
                    ? `Masquer la nouvelle ${label.toLowerCase()}`
                    : `Afficher la nouvelle ${label.toLowerCase()}`
                }
                className="secret-visibility-toggle"
                onClick={onToggleVisibility}
                type="button"
              >
                {visible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <button
                aria-label={`Modifier ${label.toLowerCase()}`}
                className="secret-status-trigger"
                onClick={onToggleReplace}
                title={configured ? configuredSecretTooltip : undefined}
                type="button"
              >
                <span className="secret-status-content">
                  <FaKey />
                  <span>
                    {getSecretStatusLabel(configured, lastCharacters)}
                  </span>
                </span>
              </button>
              {!configured ? (
                <p className="m-0 text-sm text-ink-700">
                  Ajoutez une clé pour activer ce fournisseur dans la
                  configuration RAG.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}
