import type { Metadata } from "next";

import { PlaygroundLoader } from "@/features/playground/playground-loader";

export const metadata: Metadata = {
  title: "Playground",
};

export default function PlayPage() {
  return <PlaygroundLoader />;
}
