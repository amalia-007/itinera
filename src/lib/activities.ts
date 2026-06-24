import type { Destination } from "./types";

export interface ActivityCategory {
  key: string;
  label: string;
  icon: string;
  base: [number, number] | null; // EUR/person; null = gratuit / prix libre
  keywords: string[];
  blurb: string;
}

const CATEGORIES: ActivityCategory[] = [
  { key: "visites", label: "Visites & monuments", icon: "🏛️", base: [10, 30], keywords: ["musée", "monument", "visite", "château", "temple", "billet", "culture", "histoire"], blurb: "Sites incontournables, billets coupe-file." },
  { key: "freewalk", label: "Free walking tour", icon: "🚶", base: null, keywords: ["gratuit", "balade", "marche", "free", "pied", "quartier"], blurb: "Visite guidée à pourboire libre." },
  { key: "food", label: "Food tour & gastronomie", icon: "🍽️", base: [25, 70], keywords: ["food", "gastronomie", "dégustation", "street food", "cuisine", "manger", "marché", "vin"], blurb: "Goûter la ville, marchés et tables locales." },
  { key: "excursion", label: "Excursion à la journée", icon: "🚐", base: [40, 110], keywords: ["excursion", "journée", "day trip", "tour", "île", "désert", "alentours"], blurb: "S'éloigner une journée des sentiers." },
  { key: "nautique", label: "Activités nautiques", icon: "🤿", base: [30, 90], keywords: ["plongée", "snorkeling", "bateau", "surf", "kayak", "plage", "mer", "voile"], blurb: "Sous l'eau et sur l'eau." },
  { key: "nature", label: "Nature & randonnée", icon: "🥾", base: [0, 40], keywords: ["rando", "trek", "nature", "parc", "montagne", "volcan", "cascade"], blurb: "Sentiers, panoramas et grand air." },
  { key: "nuit", label: "Vie nocturne", icon: "🍸", base: [15, 60], keywords: ["bar", "club", "soirée", "nuit", "fête", "pub", "concert"], blurb: "Sortir une fois la nuit tombée." },
  { key: "spa", label: "Bien-être & spa", icon: "💆", base: [25, 90], keywords: ["spa", "massage", "hammam", "yoga", "bien-être", "thermes", "détente"], blurb: "Se détendre et recharger." },
  { key: "cours", label: "Cours & ateliers", icon: "🎨", base: [30, 80], keywords: ["cours", "atelier", "cuisine", "surf", "danse", "poterie", "apprendre"], blurb: "Apprendre un savoir-faire local." },
];

export interface ActivityEstimate extends ActivityCategory {
  price: [number, number] | null; // adjusted to destination cost
}

/** Filter (by free-text query) + price-adjust the activity catalogue. */
export function activityEstimates(
  dest: Destination,
  query?: string
): ActivityEstimate[] {
  const k = dest.costIndex / 100;
  const r5 = (n: number) => Math.max(5, Math.round((n * k) / 5) * 5);
  const q = (query ?? "").trim().toLowerCase();

  return CATEGORIES.filter((c) => {
    if (!q) return true;
    return (
      c.label.toLowerCase().includes(q) ||
      c.keywords.some((kw) => kw.includes(q) || q.includes(kw))
    );
  }).map((c) => ({
    ...c,
    price: c.base ? [r5(c.base[0]), r5(c.base[1])] : null,
  }));
}
