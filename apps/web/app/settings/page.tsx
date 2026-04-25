import { ShellScreen } from "../(shell)/shell";

export default function SettingsPage() {
  return (
    <ShellScreen
      eyebrow="Settings shell"
      title="Identity controls live here, quietly and without forcing account creation."
      description="This route is reserved for username edits and the passive email prompt. It intentionally avoids any login framing because V1 stays anonymous-first."
      statuses={[
        { label: "Username", value: "Editable later" },
        { label: "Email capture", value: "Passive banner only" },
        { label: "Account model", value: "Anonymous UUID" },
      ]}
      checklist={[
        "No login or password flows are introduced.",
        "The shell leaves room for a small, non-modal email prompt.",
        "Settings remains optional instead of blocking core use.",
      ]}
      asideTitle="Constraint to preserve"
      asideBody="This screen must stay lightweight. Users should never be pushed into account creation before they can start or finish a session."
    />
  );
}
