import ChampionGrid from "@/components/ChampionGrid";
import { getChampions } from "@/lib/ddragon";

export const runtime = "nodejs";
export const revalidate = 3600;

export const metadata = {
  title: "Champions — RiftFix",
  description:
    "Every League of Legends champion on the live patch: search, filter by role, and open full champion pages with lore, abilities and base stats.",
  openGraph: {
    title: "Champions — RiftFix",
    description:
      "Every League of Legends champion on the live patch, from Data Dragon.",
  },
};

export default async function ChampionsPage() {
  const { version, champions } = await getChampions();
  return (
    <div>
      <h1 className="text-3xl font-black text-slate-50">Champions</h1>
      <p className="mt-1 text-sm text-slate-400">
        All {champions.length} champions on live patch{" "}
        <span className="font-semibold text-slate-200">{version}</span>, straight
        from Data Dragon. Tap a champion for lore, abilities, and base stats.
      </p>
      <div className="mt-6">
        <ChampionGrid champions={champions} />
      </div>
    </div>
  );
}
