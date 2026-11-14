import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beneigh Website Preview",
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
