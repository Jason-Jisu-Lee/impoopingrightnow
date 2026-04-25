import { ShellScreen } from "../(shell)/shell";

export default function GlobalPage() {
  return (
    <ShellScreen
      eyebrow="Global shell"
      title="The public leaderboard and regional analytics have a home now."
      description="This route will eventually hold the country table, region metrics, and placeholder food profile copy. In this step it only establishes the page shell and navigation target."
      statuses={[
        { label: "Country leaderboard", value: "Awaiting thresholded data" },
        { label: "Regional stats", value: "Buckets defined later" },
        { label: "Read-only mode", value: "Public analytics surface" },
      ]}
      checklist={[
        "Navigation exposes the analytics surface from day one.",
        "No fake leaderboard values are stored or implied.",
        "The right column is sized for regional sidecards and notes.",
      ]}
      asideTitle="What lands here later"
      asideBody="Once Supabase and aggregation queries are wired, this screen becomes the place for country rankings, region callouts, and the deadpan comparative copy."
    />
  );
}
