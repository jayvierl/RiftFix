import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — RiftFix",
  description: "The terms that govern use of RiftFix, a fan-made League of Legends stats tool.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black text-slate-50">Terms of Service</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: November 22, 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-base font-bold text-slate-100">1. What RiftFix is</h2>
          <p className="mt-1">
            RiftFix is a fan-made League of Legends statistics tool. It looks up
            publicly available player data through the official Riot Games API,
            stores match data in a permanent archive (the &ldquo;Forever
            archive&rdquo;), and presents statistics, benchmarks, builds, and
            improvement suggestions computed from that archived data. RiftFix is
            not a Riot Games product and is not endorsed by Riot Games.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">2. Acceptable use</h2>
          <p className="mt-1">
            You may use RiftFix to look up any player&apos;s public Riot ID and
            view statistics derived from public match data. You agree not to:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>use RiftFix to harass, shame, or target any player;</li>
            <li>attempt to scrape, overload, or circumvent rate limits or access controls;</li>
            <li>misrepresent RiftFix statistics as official Riot Games data or rankings;</li>
            <li>use the service in a way that violates Riot Games&apos; Terms of Service or API policies.</li>
          </ul>
          <p className="mt-1">
            RiftFix deliberately does not provide hidden-MMR estimates,
            dodge/shame labels, or tools that track other players&apos;
            cooldowns in live games, and its session/pattern features describe
            only the profile owner&apos;s own play.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">3. Suggestions, not verdicts</h2>
          <p className="mt-1">
            Features such as &ldquo;One Fix&rdquo;, benchmarks, builds, and tier
            lists are statistical observations computed from archived games,
            presented with their sample sizes and confidence levels. They are
            suggestions offered with their evidence — they are not instructions,
            guarantees of improvement, or official evaluations of any player.
            Small samples are labelled &ldquo;Too early&rdquo; and should be
            read accordingly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">4. Data and the Forever archive</h2>
          <p className="mt-1">
            When a player is looked up, RiftFix stores that player&apos;s Riot
            ID, PUUID, rank/mastery snapshot, and the fetched matches
            permanently so long-term history remains available. This data
            originates from Riot&apos;s public API. If you are the owner of a
            Riot account and want your data removed from RiftFix, contact us as
            described in the Privacy Policy and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">5. Availability and accuracy</h2>
          <p className="mt-1">
            RiftFix is provided &ldquo;as is&rdquo;, without warranties of any
            kind. Data depends on the Riot Games API and Data Dragon and may be
            delayed, incomplete, or unavailable. Statistics are computed only
            from matches RiftFix has archived, which may be a subset of a
            player&apos;s full history; pages state the sample behind every
            figure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">6. Intellectual property</h2>
          <p className="mt-1">
            League of Legends and Riot Games are trademarks or registered
            trademarks of Riot Games, Inc. Champion names, artwork, and game
            data remain the property of Riot Games and are used under
            Riot&apos;s policies for fan and API projects. RiftFix&apos;s own
            code, design, and branding belong to RiftFix.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-100">7. Changes and contact</h2>
          <p className="mt-1">
            These terms may be updated; the date above reflects the latest
            revision, and continued use of RiftFix after a change means you
            accept the updated terms. Questions about these terms can be sent
            through the contact address listed in the Privacy Policy.
          </p>
        </section>
      </div>
    </div>
  );
}
