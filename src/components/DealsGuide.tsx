interface Tip {
  icon: string;
  title: string;
  body: string;
  tag: string;
}

// Honest, curated travel-hacking tips — NOT fabricated coupon codes. When real
// affiliate/coupon feeds are wired in, this section becomes data-driven.
const TIPS: Tip[] = [
  {
    icon: "🗓️",
    title: "Meilleur moment pour acheter",
    tag: "Vols",
    body: "Court-courrier : 3-6 semaines avant. Long-courrier : 2-5 mois avant. Réservez un mardi/mercredi, partez en milieu de semaine, et activez une alerte prix (Google Flights, Hopper).",
  },
  {
    icon: "💳",
    title: "Empiler les points",
    tag: "Combo",
    body: "Payez en carte Revolut/Wise (taux interbancaire, pas de frais), réservez via un portail qui cumule (Booking Genius, Miles & More eShopping) et créditez le programme de la compagnie. Trois couches de gains sur le même achat.",
  },
  {
    icon: "📶",
    title: "Carte SIM / eSIM",
    tag: "Sur place",
    body: "Une eSIM (Airalo, Holafly) s'active avant le départ, sans boutique ni caution. Pour un long séjour, une SIM locale prépayée reste souvent moins chère au Go.",
  },
  {
    icon: "🛡️",
    title: "Assurance voyage",
    tag: "Couverture",
    body: "Vérifiez d'abord votre carte bancaire premium (souvent assurance + assistance incluses si le billet est payé avec). Sinon comparez une assurance dédiée (frais médicaux ≥ 100 000 € hors UE).",
  },
  {
    icon: "🏧",
    title: "Retirer des espèces",
    tag: "Argent",
    body: "Évitez les bureaux de change d'aéroport et refusez la « conversion dans votre monnaie » au DAB (DCC = mauvais taux). Retirez à un DAB bancaire avec une carte sans frais (Revolut, Wise).",
  },
  {
    icon: "📱",
    title: "Applis utiles",
    tag: "Sur place",
    body: "Hors-ligne : Maps.me / Google Maps (zones téléchargées). Traduction : Google Translate (mode photo). Transports : Citymapper / Moovit. Taux : XE. Avis food : local + Google.",
  },
];

export default function DealsGuide() {
  return (
    <section className="mt-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Bons plans &amp; astuces pour payer moins
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Conseils vérifiés, applicables partout. (Pas de faux codes promo — quand
          de vrais flux d&apos;affiliation seront branchés, ils apparaîtront ici.)
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TIPS.map((t) => (
          <div
            key={t.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden>
                {t.icon}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                {t.tag}
              </span>
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{t.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {t.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
