import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — RiftFix",
  description: "What player data RiftFix stores, why, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black text-slate-50">Privacy Policy</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: November 23, 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-base font-bold text-slate-100">1. What we store</h2>
          <p className="mt-1">
            RiftFix stores only League of Legends game data that is publicly
            available through the official Riot Games API:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li><strong className="text-slate-100">Riot ID</strong> (game name and tag) and region, for players who are looked up;</li>
            <li><strong className="text-slate-100">PUUID</strong> — Riot&apos;s persistent, anonymous player identifier, used to link a player to their matches;</li>
            <li><strong className="text-slate-100">Profile snapshots</strong> — summoner level, profile icon, ranked tier/division/LP and win-loss record, and champion mastery;</li>
            <li><strong className="text-slate-100">Match data</strong> — the full public record of fetched matches: champions, items, runes, K/D/A, CS, damage, vision score, and the other nine players&apos; public in-game stats from those matches;</li>
          </ul>
          <p className="mt-1">
            One thing we do <strong className="text-slate-100">not</strong>{" "}
            store on our servers: your tracked players. If you tap “Track
            this player” on a profile, that player&apos;s Riot ID and region
            are saved only in your own browser&apos;s local storage, so they
            can appear under “Your tracked players” on the home screen. The
            list never leaves your browser, is never sent to RiftFix&apos;s
            servers, and is not shared with anyone. You can clear it at any
            time by untracking each player or by clearing this site&apos;s
            storage in your browser settings.
          </p>
          <p className="mt-1">
            RiftFix does not ask for, store, or have access to Riot account
            passwords, email addresses, real names, payment information, or any
            other personal account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">2. Why we store it</h2>
          <p className="mt-1">
            The permanent archive is the product: other stats sites delete
            match history after a few months, which destroys long-term trends.
            RiftFix keeps every match it fetches so that a player&apos;s One
            Fix analysis, next-rank benchmarks, builds, and tier lists can be
            computed from real history. Builds and benchmarks are computed only
            from this archived data, in aggregate, and always display their
            sample sizes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">3. What we never do</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>We do not sell player data to anyone.</li>
            <li>We do not share player data with advertisers or data brokers.</li>
            <li>We do not build hidden-MMR estimates, shaming labels, or profiles of players&apos; behaviour outside their public match record.</li>
            <li>We do not use stored data for any purpose other than running RiftFix&apos;s features.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">4. Deletion on request</h2>
          <p className="mt-1">
            If you own a Riot account that appears in RiftFix, you can ask for
            your data to be deleted — your profile snapshot and your
            participant rows will be removed from the archive. Send a
            deletion request to{" "}
            <a href="mailto:lyris@muse.ai" className="text-sky-400 hover:underline">lyris@muse.ai</a>,
            including your Riot ID and region
            and proof the account is yours (for example, signing in through
            Riot&apos;s verification flow if requested). Deletion requests are
            honoured within 30 days. Note that match records are shared game
            records: deleting your data removes your participant rows and
            profile, and matches will no longer be associated with your Riot ID.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">5. Cookies and analytics</h2>
          <p className="mt-1">
            RiftFix&apos;s core features work without accounts and without
            tracking cookies. The site may set strictly-necessary cookies or
            local storage for basic preferences (such as your last selected
            region). Local storage is also where your tracked players live
            (see section 1): that list stays in your browser, is never
            transmitted to us, and you can delete it yourself at any time by
            untracking the players or clearing this site&apos;s browser
            storage. If privacy-respecting, aggregate analytics are added
            later, they will be disclosed here before use, will not fingerprint
            individual visitors, and will never include Riot IDs from profile
            URLs. RiftFix does not run third-party advertising trackers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">6. Server logs and security</h2>
          <p className="mt-1">
            Like any website, RiftFix&apos;s hosting may keep short-lived
            server logs (IP address, user agent, requested URL) for security
            and abuse prevention. The Riot API key used by RiftFix is held
            server-side only and is never sent to visitors.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">7. Changes and contact</h2>
          <p className="mt-1">
            Material changes to this policy will be reflected here with a new
            date. Questions or deletion requests can be sent to{" "}
            <a href="mailto:lyris@muse.ai" className="text-sky-400 hover:underline">lyris@muse.ai</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
