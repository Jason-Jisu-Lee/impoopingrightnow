import { ShellScreen } from "./(shell)/shell";

export default function Home() {
  return (
    <ShellScreen
      eyebrow="Home / Session shell"
      title="Start here, then drop into the live session flow."
      description="The landing screen and active session will live here. For now, this route defines the primary entrypoint, top counter placement, and the visual hierarchy we will reuse once the timer and hold mechanic are added."
      statuses={[
        { label: "Primary CTA", value: "I’m Pooping Right Now" },
        { label: "Secondary CTA", value: "I Pooped · coming soon" },
        { label: "Live counter", value: "Top bar reserved" },
      ]}
      checklist={[
        "Home route is the default web entrypoint.",
        "Layout already leaves room for the simulated counter.",
        "The main content column is sized for mobile-first session UI.",
      ]}
      asideTitle="Next step on this surface"
      asideBody="The next build slice on this screen is the actual landing flow and session shell logic, not backend wiring or certificate generation."
    />
  );
}
