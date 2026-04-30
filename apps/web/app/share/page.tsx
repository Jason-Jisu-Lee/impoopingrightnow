import type { Metadata } from "next";

import { PageChromeControls } from "../_components/page-chrome-controls";
import { parsePublicShareSnapshot } from "../_lib/share-snapshot";
import { PublicShareScreen } from "./public-share-screen";

export const metadata: Metadata = {
  title: "Share | impoopingrightnow",
  description: "Public share snapshot for a brag or challenge.",
};

type SharePageProps = {
  searchParams: Promise<{
    data?: string | string[];
  }>;
};

export default async function SharePage({ searchParams }: SharePageProps) {
  const resolvedSearchParams = await searchParams;
  const dataValue = Array.isArray(resolvedSearchParams.data)
    ? resolvedSearchParams.data[0]
    : resolvedSearchParams.data;
  const snapshot = parsePublicShareSnapshot(dataValue);

  return (
    <main className="shell-page share-page">
      <PageChromeControls />
      <PublicShareScreen snapshot={snapshot} />
    </main>
  );
}