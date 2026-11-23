import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — RiftFix",
  robots: { index: false, follow: false },
};

/** Offline fallback served by the service worker for document requests. */
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <WifiOff className="mx-auto h-10 w-10 text-sky-300" />
      <h1 className="mt-4 text-2xl font-black text-slate-50">
        You&apos;re offline
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        RiftFix can&apos;t reach the server right now. Champion pages and art
        you&apos;ve already visited are cached on this device and will still
        open; live lookups, builds and your Forever archive need a connection.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-sm font-semibold text-sky-400 hover:underline">
          Back to RiftFix home
        </Link>
      </p>
    </div>
  );
}
