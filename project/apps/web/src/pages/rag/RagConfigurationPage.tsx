import { FaGear } from "react-icons/fa6";
import { Navigate } from "react-router-dom";
import { useDashboardContext } from "../../app-shared";
import { Divider, Panel, PanelHeading } from "../../components/ui";
import { RagConfigurationForm } from "./RagConfigurationForm";
import { RagConfigurationStatusCards } from "./RagConfigurationStatusCards";

export function RagConfigurationPage() {
  const { user, ragConfig, setRagConfig, resetAuth } = useDashboardContext();

  if (!user.isAdmin) {
    return <Navigate replace to="/app/rag" />;
  }

  return (
    <div className="page-grid">
      <Panel className="page-panel">
        <PanelHeading
          className="mb-5"
          description={
            <>Paramètres utilisés par l’indexation et les requêtes RAG.</>
          }
          icon={<FaGear />}
          title="Configuration du backend RAG"
        />

        <RagConfigurationStatusCards ragConfig={ragConfig} />
        <Divider className="my-5" />
        <RagConfigurationForm
          ragConfig={ragConfig}
          resetAuth={resetAuth}
          setRagConfig={setRagConfig}
        />
      </Panel>
    </div>
  );
}
