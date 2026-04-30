import type { Metadata } from "next";

import { PageChromeControls } from "../../_components/page-chrome-controls";
import { getStoredShareSnapshot } from "../../_lib/share-store";
import { PublicShareScreen } from "../public-share-screen";

export const metadata: Metadata = {
  title: "Share | impoopingrightnow",
  description: "Public share snapshot for a brag or challenge.",
};

type ShareIdPageProps = {
  params: Promise<{
    shareId: string;
  }>;
};

export default async function ShareIdPage({ params }: ShareIdPageProps) {
  const resolvedParams = await params;
  const snapshot = await getStoredShareSnapshot(resolvedParams.shareId);

  return (
    <main className="shell-page share-page">
      <PageChromeControls />
      <PublicShareScreen snapshot={snapshot} />
    </main>
  );
}