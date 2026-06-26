import rawAirports from "./airports-db.json";
import type { Airport } from "@/lib/types";

const DB = rawAirports as Airport[];

// Main hub airport per country (cheapest/biggest international gateway)
const COUNTRY_HUBS: Record<string, string> = {
  "France": "CDG",
  "United Kingdom": "LHR",
  "Germany": "FRA",
  "Spain": "MAD",
  "Italy": "FCO",
  "Netherlands": "AMS",
  "Belgium": "BRU",
  "Switzerland": "ZRH",
  "Portugal": "LIS",
  "Austria": "VIE",
  "Sweden": "ARN",
  "Norway": "OSL",
  "Denmark": "CPH",
  "Finland": "HEL",
  "Greece": "ATH",
  "Turkey": "IST",
  "Russia": "SVO",
  "United States": "JFK",
  "Canada": "YYZ",
  "Mexico": "MEX",
  "Brazil": "GRU",
  "Argentina": "EZE",
  "Colombia": "BOG",
  "Chile": "SCL",
  "Peru": "LIM",
  "Australia": "SYD",
  "New Zealand": "AKL",
  "Japan": "NRT",
  "China": "PEK",
  "South Korea": "ICN",
  "Thailand": "BKK",
  "Vietnam": "SGN",
  "Singapore": "SIN",
  "Malaysia": "KUL",
  "Indonesia": "CGK",
  "Philippines": "MNL",
  "India": "DEL",
  "United Arab Emirates": "DXB",
  "Qatar": "DOH",
  "Saudi Arabia": "RUH",
  "Egypt": "CAI",
  "Morocco": "CMN",
  "South Africa": "JNB",
  "Kenya": "NBO",
  "Ethiopia": "ADD",
  "Nigeria": "LOS",
  "Ghana": "ACC",
  "Israel": "TLV",
  "Jordan": "AMM",
  "Lebanon": "BEY",
  "Pakistan": "KHI",
  "Bangladesh": "DAC",
  "Sri Lanka": "CMB",
  "Nepal": "KTM",
  "Myanmar": "RGN",
  "Cambodia": "PNH",
  "Taiwan": "TPE",
  "Hong Kong": "HKG",
  "Maldives": "MLE",
  "Mauritius": "MRU",
  "Cuba": "HAV",
  "Jamaica": "KIN",
  "Dominican Republic": "SDQ",
  "Panama": "PTY",
  "Costa Rica": "SJO",
  "Ecuador": "UIO",
  "Uruguay": "MVD",
  "Venezuela": "CCS",
  "Croatia": "ZAG",
  "Czech Republic": "PRG",
  "Hungary": "BUD",
  "Poland": "WAW",
  "Romania": "OTP",
  "Bulgaria": "SOF",
  "Serbia": "BEG",
  "Ukraine": "KBP",
  "Kazakhstan": "ALA",
  "Georgia": "TBS",
  "Armenia": "EVN",
  "Azerbaijan": "GYD",
  "Iran": "IKA",
  "Iraq": "BGW",
  "Kuwait": "KWI",
  "Bahrain": "BAH",
  "Oman": "MCT",
  "Tunisia": "TUN",
  "Algeria": "ALG",
  "Libya": "TIP",
  "Tanzania": "DAR",
  "Uganda": "EBB",
  "Zimbabwe": "HRE",
  "Zambia": "LUN",
  "Senegal": "DSS",
  "Ivory Coast": "ABJ",
  "Cameroon": "DLA",
  "Guatemala": "GUA",
  "Honduras": "SAP",
  "Nicaragua": "MGA",
  "El Salvador": "SAL",
  "Bolivia": "VVI",
  "Paraguay": "ASU",
  "Laos": "VTE",
  "Mongolia": "ULN",
  "Uzbekistan": "TAS",
  "Belarus": "MSQ",
  "Slovakia": "BTS",
  "Slovenia": "LJU",
  "Lithuania": "VNO",
  "Latvia": "RIX",
  "Estonia": "TLL",
  "Iceland": "KEF",
  "Ireland": "DUB",
  "Luxembourg": "LUX",
  "Malta": "MLA",
  "Cyprus": "LCA",
};

// French country name → English (for matching user input in French)
const FR_TO_EN_COUNTRY: Record<string, string> = {
  "france": "France",
  "angleterre": "United Kingdom",
  "royaume-uni": "United Kingdom",
  "grande-bretagne": "United Kingdom",
  "allemagne": "Germany",
  "espagne": "Spain",
  "italie": "Italy",
  "pays-bas": "Netherlands",
  "hollande": "Netherlands",
  "belgique": "Belgium",
  "suisse": "Switzerland",
  "portugal": "Portugal",
  "autriche": "Austria",
  "suede": "Sweden",
  "norvege": "Norway",
  "danemark": "Denmark",
  "finlande": "Finland",
  "grece": "Greece",
  "turquie": "Turkey",
  "russie": "Russia",
  "etats-unis": "United States",
  "etats unis": "United States",
  "amerique": "United States",
  "usa": "United States",
  "canada": "Canada",
  "mexique": "Mexico",
  "bresil": "Brazil",
  "argentine": "Argentina",
  "colombie": "Colombia",
  "chili": "Chile",
  "perou": "Peru",
  "australie": "Australia",
  "nouvelle-zelande": "New Zealand",
  "japon": "Japan",
  "chine": "China",
  "coree du sud": "South Korea",
  "coree": "South Korea",
  "thailande": "Thailand",
  "vietnam": "Vietnam",
  "singapour": "Singapore",
  "malaisie": "Malaysia",
  "indonesie": "Indonesia",
  "philippines": "Philippines",
  "inde": "India",
  "emirats": "United Arab Emirates",
  "emirats arabes unis": "United Arab Emirates",
  "dubai": "United Arab Emirates",
  "qatar": "Qatar",
  "arabie saoudite": "Saudi Arabia",
  "egypte": "Egypt",
  "maroc": "Morocco",
  "afrique du sud": "South Africa",
  "kenya": "Kenya",
  "ethiopie": "Ethiopia",
  "nigeria": "Nigeria",
  "israel": "Israel",
  "jordanie": "Jordan",
  "liban": "Lebanon",
  "pakistan": "Pakistan",
  "bangladesh": "Bangladesh",
  "sri lanka": "Sri Lanka",
  "nepal": "Nepal",
  "birmanie": "Myanmar",
  "cambodge": "Cambodia",
  "taiwan": "Taiwan",
  "hong kong": "Hong Kong",
  "maldives": "Maldives",
  "maurice": "Mauritius",
  "cuba": "Cuba",
  "jamaique": "Jamaica",
  "panama": "Panama",
  "croatie": "Croatia",
  "republique tcheque": "Czech Republic",
  "tcheque": "Czech Republic",
  "hongrie": "Hungary",
  "pologne": "Poland",
  "roumanie": "Romania",
  "bulgarie": "Bulgaria",
  "serbie": "Serbia",
  "ukraine": "Ukraine",
  "georgie": "Georgia",
  "islande": "Iceland",
  "irlande": "Ireland",
  "luxembourg": "Luxembourg",
  "malte": "Malta",
  "chypre": "Cyprus",
  "tunisie": "Tunisia",
  "algerie": "Algeria",
  "ghana": "Ghana",
  "senegal": "Senegal",
  "tanzanie": "Tanzania",
  "ouzbekistan": "Uzbekistan",
  "bolivie": "Bolivia",
  "uruguay": "Uruguay",
  "venezuela": "Venezuela",
  "laos": "Laos",
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();
}

function getByIata(iata: string): Airport | undefined {
  return DB.find((a) => a.iata === iata);
}

function getCountryAirports(countryEnglish: string, limit = 6): Airport[] {
  return DB.filter((a) => a.country === countryEnglish).slice(0, limit);
}

export interface AirportResult extends Airport {
  isCountryHub?: boolean;
  countryLabel?: string; // e.g. "Australie"
}

export function searchAirports(query: string, limit = 8): AirportResult[] {
  const q = norm(query);
  if (!q || q.length < 2) return [];

  // ── Country detection (French or English names) ──────────────────────────
  const countryEn =
    FR_TO_EN_COUNTRY[q] ??
    Object.keys(COUNTRY_HUBS).find((c) => norm(c) === q || norm(c).startsWith(q));

  if (countryEn) {
    const hubIata = COUNTRY_HUBS[countryEn];
    const hub = hubIata ? getByIata(hubIata) : null;
    const others = getCountryAirports(countryEn, limit - (hub ? 1 : 0)).filter(
      (a) => !hub || a.iata !== hub.iata
    );
    const results: AirportResult[] = [];
    if (hub) results.push({ ...hub, isCountryHub: true, countryLabel: query });
    results.push(...others);
    return results;
  }

  // ── Exact IATA match ──────────────────────────────────────────────────────
  if (/^[a-zA-Z]{3}$/.test(query.trim())) {
    const exact = DB.find((a) => a.iata.toLowerCase() === query.trim().toLowerCase());
    if (exact) {
      const rest = DB.filter(
        (a) =>
          a.iata !== exact.iata &&
          (norm(a.city).includes(q) || norm(a.name).includes(q))
      ).slice(0, limit - 1);
      return [exact, ...rest];
    }
  }

  // ── General text search ───────────────────────────────────────────────────
  const scored = DB.map((a) => {
    const city = norm(a.city);
    const name = norm(a.name);
    const country = norm(a.country);
    const iata = a.iata.toLowerCase();

    let score = 0;
    if (city.startsWith(q)) score += 100;
    else if (city.includes(q)) score += 60;
    if (name.includes(q)) score += 30;
    if (country.startsWith(q)) score += 20;
    if (iata === q) score += 200;

    return { a, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.a);

  return scored;
}
