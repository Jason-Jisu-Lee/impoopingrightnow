import { ShellScreen } from "../(shell)/shell";

export default function MyStatsPage() {
  return (
    <ShellScreen
      eyebrow="My Stats shell"
      title="A reserved surface for heatmaps, streaks, and personal records."
      description="This route exists so we can add retention features later without redesigning navigation. V1 stats widgets will render here only when session data exists."
      statuses={[
        { label: "Heatmap", value: "Placeholder only" },
        { label: "Streaks", value: "Current and best reserved" },
        { label: "Records", value: "Fastest, longest, most logs" },
      ]}
      checklist={[
        "Screen exists but does not fake user data.",
        "Copy sets expectations for data-dependent rendering.",
        "Layout already supports a summary card and records stack.",
      ]}
      asideTitle="Why it exists now"
      asideBody="The app needs stable information architecture early. This route keeps future retention work local instead of forcing a nav refactor later."
    />
  );
}
