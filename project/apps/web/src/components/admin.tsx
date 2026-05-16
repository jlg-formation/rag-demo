import {
  FaClock,
  FaEye,
  FaEyeSlash,
  FaLayerGroup,
  FaShieldHalved,
  FaUser
} from "react-icons/fa6";
import { Button, Card, StatusChip } from "./ui";

type PasswordVisibilityButtonProps = {
  shown: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
};

export function PasswordVisibilityButton({
  shown,
  onToggle,
  showLabel,
  hideLabel
}: PasswordVisibilityButtonProps) {
  return (
    <button
      aria-label={shown ? hideLabel : showLabel}
      className="secret-visibility-toggle"
      onClick={onToggle}
      type="button"
    >
      {shown ? <FaEyeSlash /> : <FaEye />}
    </button>
  );
}

type GroupListCardProps = {
  name: string;
  createdAtLabel: string;
};

export function GroupListCard({ createdAtLabel, name }: GroupListCardProps) {
  return (
    <Card className="compact-card document-card">
      <div className="document-card__header">
        <h3>{name}</h3>
        <StatusChip tone="neutral">
          <FaClock />
          <span>{createdAtLabel}</span>
        </StatusChip>
      </div>
    </Card>
  );
}

type UserListCardProps = {
  displayName: string | null;
  email: string;
  groups: string[];
  isAdmin: boolean;
};

export function UserListCard({
  displayName,
  email,
  groups,
  isAdmin
}: UserListCardProps) {
  return (
    <Card className="compact-card document-card">
      <div className="document-card__header">
        <div>
          <h3>{displayName || email}</h3>
          <p className="muted-text">{email}</p>
        </div>
        <StatusChip tone={isAdmin ? "ready" : "neutral"}>
          {isAdmin ? <FaShieldHalved /> : <FaUser />}
          <span>{isAdmin ? "Admin" : "Utilisateur"}</span>
        </StatusChip>
      </div>
      <p className="muted-text meta-line meta-line--wrap">
        <FaLayerGroup />
        <span>Groupes : {groups.join(", ")}</span>
      </p>
    </Card>
  );
}
