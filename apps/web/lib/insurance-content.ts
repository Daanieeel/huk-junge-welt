// ─── Hard-coded insurance type content ───────────────────────────────────────
// Update youtubeVideoId and applyUrl per type as needed.

export interface InsuranceTypeContent {
  /** Full German name shown as page headline */
  fullName: string;
  /** 2-3 sentence teaser shown on detail page */
  shortDescription: string;
  /** Multi-paragraph text shown on mehr-infos sub-page */
  longDescription: string;
  /** YouTube video ID (embed). Set to null if not available yet. */
  youtubeVideoId: string | null;
  /** Caption shown below the video embed */
  youtubeCaption: string;
  /** Top 3 covered cases shown on detail page */
  topCoveredCases: string[];
  /** All covered cases shown on leistungen sub-page */
  allCoveredCases: string[];
  /** Not covered cases shown on leistungen sub-page */
  notCoveredCases: string[];
  /** Deep-link to HUK.de application form */
  applyUrl: string;
}

export const INSURANCE_CONTENT: Record<string, InsuranceTypeContent> = {
  PRIVATHAFTPFLICHT: {
    fullName: "Privathaftpflichtversicherung",
    shortDescription:
      "Die Privathaftpflicht schützt dich, wenn du versehentlich anderen einen Schaden zufügst – egal ob du jemanden verletzt oder Eigentum beschädigst. Ohne sie haftest du im Schadensfall mit deinem gesamten Vermögen, auch als junger Mensch.",
    longDescription:
      "Die Privathaftpflichtversicherung ist eine der wichtigsten Versicherungen überhaupt. Sie greift immer dann, wenn du als Privatperson für einen Schaden verantwortlich bist, den du unabsichtlich einem anderen zugefügt hast.\n\nOb du beim Sport eine andere Person anrempelst und sie sich verletzt, mit dem Fahrrad ein Auto beschädigst oder als Mieter aus Versehen die Wohnung des Vermieters beschädigst – in all diesen Situationen springt die Privathaftpflicht ein und übernimmt die Kosten.\n\nBesonders wichtig: HUK-COBURG prüft nicht nur, ob ein Anspruch berechtigt ist, sondern wehrt auch unberechtigte Forderungen aktiv ab. So bist du doppelt geschützt.",
    youtubeVideoId: "olb9gM4e9T0",
    youtubeCaption: "Erklärvideo: So funktioniert die Privathaftpflicht",
    topCoveredCases: [
      "Du verletzt versehentlich eine andere Person beim Sport",
      "Du beschädigst mit dem Fahrrad ein geparktes Auto",
      "Du überschwemmst als Mieter die Wohnung des Vermieters",
    ],
    allCoveredCases: [
      "Personenschäden: du verletzt versehentlich jemanden",
      "Sachschäden an fremdem Eigentum",
      "Vermögensschäden als Folge eines Personen- oder Sachschadens",
      "Schäden durch dein Fahrrad im Straßenverkehr",
      "Schäden, die du als Mieter in der Wohnung verursachst",
      "Schäden durch Kinder unter 7 Jahren (deliktunfähig)",
      "Abwehr unberechtigter Schadenersatzforderungen",
    ],
    notCoveredCases: [
      "Vorsätzlich verursachte Schäden",
      "Schäden an eigenem Eigentum",
      "Schäden durch Kfz (hierfür ist die Kfz-Versicherung zuständig)",
      "Beruflich verursachte Schäden (benötigt Berufshaftpflicht)",
      "Schäden beim Führen von Booten oder Schiffen (separate Versicherung)",
    ],
    applyUrl: "https://www.huk.de/privathaftpflichtversicherung",
  },

  HAUSRAT: {
    fullName: "Hausratversicherung",
    shortDescription:
      "Die Hausratversicherung schützt alles, was in deiner Wohnung ist – von Möbeln und Elektronik bis hin zu Kleidung. Bei Einbruch, Feuer, Wasserschaden oder Sturm ersetzt HUK-COBURG den entstandenen Schaden.",
    longDescription:
      "Stell dir vor, du kommst nach Hause und deine Wohnung wurde eingebrochen – oder ein Rohrbruch hat deine Einrichtung zerstört. Genau für solche Fälle ist die Hausratversicherung da.\n\nSie deckt alle beweglichen Gegenstände in deiner Wohnung ab: Möbel, Elektrogeräte, Kleidung, Fahrräder und vieles mehr. Der Versicherungsschutz gilt bei Einbruchdiebstahl, Feuer, Leitungswasser, Sturm und Hagel.\n\nFür junge Menschen, die gerade ausziehen und ihre erste eigene Wohnung einrichten, ist die Hausratversicherung besonders wertvoll. Oft ist der Wert des eigenen Hausrats deutlich höher als gedacht.",
    youtubeVideoId: "ujXwxny2yF4",
    youtubeCaption: "Erklärvideo: Was deckt die Hausratversicherung ab?",
    topCoveredCases: [
      "Einbruch und Diebstahl aus der Wohnung",
      "Brand oder Explosion in der Wohnung",
      "Wasserschaden durch geplatztes Rohr",
    ],
    allCoveredCases: [
      "Einbruchdiebstahl und Vandalismus nach Einbruch",
      "Brand, Blitzschlag und Explosion",
      "Leitungswasserschäden durch Rohrbruch",
      "Sturm ab Windstärke 8 und Hagel",
      "Schäden durch Überspannung nach Blitzschlag",
      "Fahrraddiebstahl (je nach Tarif)",
      "Schäden an Kellern und Garagen",
    ],
    notCoveredCases: [
      "Grobe Fahrlässigkeit (je nach Tarif eingeschränkt)",
      "Bargeld und Schmuck über Pauschalbeträge hinaus",
      "Beschädigungen durch normalen Verschleiß",
      "Schäden durch Kriegs- oder Katastrophenereignisse",
      "Kfz, Anhänger und Wasserfahrzeuge",
    ],
    applyUrl: "https://www.huk.de/hausratversicherung",
  },

  KFZ: {
    fullName: "Kfz-Versicherung",
    shortDescription:
      "Die Kfz-Versicherung ist gesetzlich Pflicht und schützt dich bei Unfällen im Straßenverkehr. HUK-COBURG bietet Haftpflicht, Teilkasko und Vollkasko – passend zu Fahrzeug und Budget.",
    longDescription:
      "Ohne Kfz-Haftpflichtversicherung darfst du kein Fahrzeug im öffentlichen Straßenverkehr bewegen. Sie schützt andere Verkehrsteilnehmer, wenn du einen Unfall verursachst – HUK-COBURG übernimmt die Kosten für Personen-, Sach- und Vermögensschäden.\n\nZusätzlich kannst du mit der Teilkasko auch Schäden an deinem eigenen Fahrzeug absichern: Diebstahl, Wildschäden, Glasbruch oder Unwetterschäden. Die Vollkasko deckt zusätzlich selbst verursachte Unfallschäden ab.\n\nAls junger Fahrer profitierst du bei HUK-COBURG von fairen Konditionen – und durch schadensfreies Fahren senkst du deinen Beitrag jedes Jahr weiter.",
    youtubeVideoId: null,
    youtubeCaption: "Erklärvideo: Haftpflicht, Teilkasko, Vollkasko – was ist der Unterschied?",
    topCoveredCases: [
      "Schäden an anderen Fahrzeugen und Personen bei einem Unfall",
      "Diebstahl oder Teildiebstahl des Fahrzeugs (Teilkasko)",
      "Wildschäden und Glasbruch (Teilkasko)",
    ],
    allCoveredCases: [
      "Personen-, Sach- und Vermögensschäden anderer (Haftpflicht)",
      "Fahrzeugdiebstahl und Einbruchschäden (Teilkasko)",
      "Wildschäden durch Tiere (Teilkasko)",
      "Glasbruch an Scheiben (Teilkasko)",
      "Sturm, Hagel und Überschwemmung (Teilkasko)",
      "Selbst verursachte Unfallschäden am eigenen Fahrzeug (Vollkasko)",
      "Vandalismus am Fahrzeug (Vollkasko)",
    ],
    notCoveredCases: [
      "Schäden am eigenen Fahrzeug bei reiner Haftpflicht",
      "Fahrten unter Alkohol- oder Drogeneinfluss",
      "Rennen und verbotene Veranstaltungen",
      "Schäden durch normale Abnutzung",
      "Fahrten ohne gültigen Führerschein",
    ],
    applyUrl: "https://www.huk.de/kfz-versicherung",
  },

  BERUFSUNFAEHIGKEIT: {
    fullName: "Berufsunfähigkeitsversicherung",
    shortDescription:
      "Die Berufsunfähigkeitsversicherung sichert dein Einkommen ab, wenn du durch Krankheit oder Unfall dauerhaft nicht mehr arbeiten kannst. Je früher du einsteigst, desto günstiger der Beitrag.",
    longDescription:
      "Stell dir vor, du kannst deinen Beruf nicht mehr ausüben – durch einen Unfall, eine psychische Erkrankung oder eine schwere Krankheit. Die gesetzliche Absicherung reicht in den meisten Fällen nicht aus, um den gewohnten Lebensstandard zu halten.\n\nDie Berufsunfähigkeitsversicherung zahlt dir eine monatliche Rente, wenn du zu mindestens 50 % berufsunfähig bist. Dieser Schutz ist besonders wertvoll, weil die häufigsten Ursachen von Berufsunfähigkeit nicht körperliche Unfälle sind, sondern psychische Erkrankungen und Rückenprobleme.\n\nAls junger Mensch bist du in einer besonders guten Position: Dein Gesundheitszustand ist gut, die Beiträge sind günstig, und du baust über viele Jahre einen starken Schutz auf.",
    youtubeVideoId: "DhVnsXK1g9k",
    youtubeCaption: "Erklärvideo: Warum ist die Berufsunfähigkeitsversicherung so wichtig?",
    topCoveredCases: [
      "Psychische Erkrankungen wie Burnout oder Depression",
      "Rücken- und Bandscheibenerkrankungen",
      "Krebserkrankungen und andere schwere Krankheiten",
    ],
    allCoveredCases: [
      "Psychische Erkrankungen (häufigste Ursache)",
      "Erkrankungen des Bewegungsapparats",
      "Krebserkrankungen",
      "Herzkreislauferkrankungen",
      "Unfälle mit dauerhaften Einschränkungen",
      "Neurologische Erkrankungen",
      "Monatliche Rente ab 50 % Berufsunfähigkeit",
    ],
    notCoveredCases: [
      "Selbst herbeigeführte Berufsunfähigkeit",
      "Vorerkrankungen, die beim Vertragsabschluss verschwiegen wurden",
      "Berufsunfähigkeit unter 50 % Einschränkung (Standardtarife)",
      "Berufsunfähigkeit durch Kriegshandlungen",
    ],
    applyUrl: "https://www.huk.de/berufsunfaehigkeitsversicherung",
  },

  ZAHNZUSATZ: {
    fullName: "Zahnzusatzversicherung",
    shortDescription:
      "Die Zahnzusatzversicherung schließt die Lücken, die die gesetzliche Krankenkasse offen lässt – vor allem bei Zahnersatz und Implantaten. So sparst du erheblich, wenn aufwendige Behandlungen notwendig werden.",
    longDescription:
      "Die gesetzliche Krankenversicherung übernimmt bei Zahnersatz oft nur den einfachen Festzuschuss – alles darüber hinaus zahlst du selbst. Bei einem einzelnen Implantat können das schnell mehrere tausend Euro sein.\n\nMit der Zahnzusatzversicherung von HUK-COBURG stockst du den Kassenanteil deutlich auf. Je nach Tarif werden bis zu 90 % der Kosten für Zahnersatz, Implantate und kieferorthopädische Behandlungen erstattet.\n\nFür junge Menschen lohnt sich der frühe Abschluss besonders: Gute Zähne jetzt schützen – und für später vorsorgen, wenn größere Behandlungen anstehen.",
    youtubeVideoId: null,
    youtubeCaption: "Erklärvideo: Was übernimmt die Zahnzusatzversicherung?",
    topCoveredCases: [
      "Zahnersatz wie Kronen, Brücken und Prothesen",
      "Zahnimplantate",
      "Kieferorthopädische Behandlungen",
    ],
    allCoveredCases: [
      "Zahnersatz: Kronen, Brücken, Prothesen, Inlays",
      "Implantate inklusive Aufbauarbeiten",
      "Kieferorthopädie bei Erwachsenen und Jugendlichen",
      "Professionelle Zahnreinigung (je nach Tarif)",
      "Zahnerhaltende Maßnahmen über Kassenleistung hinaus",
    ],
    notCoveredCases: [
      "Behandlungen, die vor Versicherungsbeginn begonnen wurden",
      "Reine Schönheitsbehandlungen ohne medizinische Notwendigkeit",
      "Wartezeitvorbehalt in den ersten Monaten (je nach Tarif)",
    ],
    applyUrl: "https://www.huk.de/zahnzusatzversicherung",
  },

  PFLEGE: {
    fullName: "Pflegezusatzversicherung",
    shortDescription:
      "Die Pflegezusatzversicherung sichert dich für den Fall ab, dass du pflegebedürftig wirst. Die gesetzliche Pflegeversicherung deckt die Kosten nur teilweise – die Pflegelücke kannst du damit schließen.",
    longDescription:
      "Pflegebedürftigkeit kann jeden treffen – durch einen Unfall, eine schwere Erkrankung oder im Alter. Die gesetzliche Pflegeversicherung deckt aber nur einen Teil der anfallenden Kosten, die monatliche Pflegelücke beträgt oft mehrere hundert Euro.\n\nMit der Pflegezusatzversicherung von HUK-COBURG sorgst du frühzeitig vor. Du bekommst im Pflegefall eine monatliche Leistung, mit der du die Lücke zwischen Pflegekosten und Kassenleistung schließen kannst.\n\nJe früher du abschließt, desto günstiger der Beitrag – und desto besser bist du für die Zukunft abgesichert.",
    youtubeVideoId: null,
    youtubeCaption: "Erklärvideo: Die Pflegelücke und wie du sie schließt",
    topCoveredCases: [
      "Ambulante Pflege zu Hause durch Pflegedienst",
      "Stationäre Pflege im Pflegeheim",
      "Tages- und Kurzzeitpflege",
    ],
    allCoveredCases: [
      "Ambulante Pflege zu Hause",
      "Stationäre Pflege im Pflegeheim",
      "Tages- und Kurzzeitpflege",
      "Monatliche Geldleistung ab Pflegegrad 2",
      "Übernahme der Pflegelücke",
    ],
    notCoveredCases: [
      "Behandlungspflege durch medizinisches Fachpersonal (Krankenversicherung)",
      "Pflegegrad 1 (je nach Tarif nicht oder eingeschränkt)",
      "Kosten, die durch Eigenverantwortung entstehen",
    ],
    applyUrl: "https://www.huk.de/pflegeversicherung",
  },

  UNFALL: {
    fullName: "Unfallversicherung",
    shortDescription:
      "Die Unfallversicherung zahlt dir eine Kapitalleistung, wenn du durch einen Unfall dauerhaft körperlich eingeschränkt wirst. Sie gilt rund um die Uhr – in der Freizeit, beim Sport und im Haushalt.",
    longDescription:
      "Die gesetzliche Unfallversicherung greift nur bei Arbeitsunfällen und auf dem Weg zur Arbeit. Die private Unfallversicherung schützt dich zusätzlich in der Freizeit – also genau dann, wenn die meisten Unfälle passieren.\n\nBei dauerhafter Invalidität durch einen Unfall zahlt HUK-COBURG eine Kapitalleistung, die dir hilft, notwendige Umbauten vorzunehmen, Hilfsmittel zu finanzieren oder Einkommensverluste auszugleichen.\n\nFür junge, aktive Menschen, die Sport treiben oder viel unterwegs sind, bietet die Unfallversicherung wichtigen Schutz – auch als Ergänzung zur Berufsunfähigkeitsversicherung.",
    youtubeVideoId: "tHyE_kseDcM",
    youtubeCaption: "Erklärvideo: Wann zahlt die Unfallversicherung?",
    topCoveredCases: [
      "Dauerhafte Invalidität nach einem Unfall",
      "Knochenbrüche und dauerhafte Gelenkschäden",
      "Krankenhaustagegeld nach Unfall",
    ],
    allCoveredCases: [
      "Dauerhafte Invalidität durch Unfall",
      "Krankenhaustagegeld",
      "Genesungsgeld nach Krankenhausaufenthalt",
      "Bergungskosten nach Unfall",
      "Kosmetische Operationen nach Unfall",
      "Sofortleistung bei schweren Verletzungen (je nach Tarif)",
    ],
    notCoveredCases: [
      "Krankheiten und degenerative Beschwerden",
      "Unfälle unter Alkohol- oder Drogeneinfluss (je nach Tarif)",
      "Vorsätzlich herbeigeführte Unfälle",
      "Bestimmte Extremsportarten ohne Zusatzvereinbarung",
      "Reine Sachschäden",
    ],
    applyUrl: "https://www.huk.de/unfallversicherung",
  },

  RECHTSSCHUTZ: {
    fullName: "Rechtsschutzversicherung",
    shortDescription:
      "Die Rechtsschutzversicherung übernimmt Anwalts- und Gerichtskosten, wenn du dein Recht durchsetzen musst. Ob Mietstreit, Kündigungsschutz oder Verkehrsunfall – HUK-COBURG steht auf deiner Seite.",
    longDescription:
      "Wenn es zum Rechtsstreit kommt, können Anwalts- und Gerichtskosten schnell in die Tausende gehen. Viele Menschen verzichten deshalb auf die Durchsetzung ihrer Rechte – die Rechtsschutzversicherung ändert das.\n\nMit HUK-COBURG hast du einen starken Partner an deiner Seite: Die Versicherung übernimmt die Kosten für Anwalt, Gericht und ggf. Sachverständige – egal ob du klagst oder beklagt wirst.\n\nBesonders für Mieter, Arbeitnehmer und Autofahrer ist die Rechtsschutzversicherung wertvoll. Drei häufige Streitfelder, die jungen Menschen oft begegnen.",
    youtubeVideoId: null,
    youtubeCaption: "Erklärvideo: In welchen Situationen hilft die Rechtsschutzversicherung?",
    topCoveredCases: [
      "Streitigkeiten mit dem Vermieter (z. B. Kaution, Kündigung)",
      "Kündigungsschutzklage beim Arbeitgeber",
      "Unfallschadenregulierung nach Verkehrsunfall",
    ],
    allCoveredCases: [
      "Mietrechtsstreitigkeiten",
      "Arbeitsrechtsstreitigkeiten",
      "Verkehrsrechtliche Auseinandersetzungen",
      "Vertragsstreitigkeiten im Alltag",
      "Übernahme von Anwaltskosten",
      "Übernahme von Gerichtskosten",
      "Übernahme von Sachverständigenkosten",
    ],
    notCoveredCases: [
      "Vorsätzlich begangene Straftaten",
      "Streitigkeiten, die vor Vertragsabschluss entstanden sind",
      "Ehe-, Familien- und Erbrechtsstreitigkeiten (je nach Tarif)",
      "Streitigkeiten zwischen mitversicherten Personen",
      "Bußgeldverfahren (je nach Tarif)",
    ],
    applyUrl: "https://www.huk.de/rechtsschutzversicherung",
  },

  AUSLANDS_KRANKEN: {
    fullName: "Auslandskrankenversicherung",
    shortDescription:
      "Die Auslandskrankenversicherung schützt dich weltweit bei medizinischen Notfällen. Denn die gesetzliche Krankenkasse übernimmt im Ausland oft nur eingeschränkte Kosten – und Rücktransporte gar nicht.",
    longDescription:
      "Wer ins Ausland reist, braucht mehr als nur die Gesundheitskarte. Die gesetzliche Krankenversicherung hat im Ausland enge Grenzen: In vielen Ländern außerhalb der EU übernimmt sie gar nichts, und selbst innerhalb der EU fehlt die Kostenübernahme für einen medizinischen Rücktransport nach Deutschland.\n\nMit der Auslandskrankenversicherung von HUK-COBURG bist du weltweit abgesichert: Arztbesuche, Krankenhausaufenthalte und – besonders wichtig – der organisierte Rücktransport nach Deutschland im Ernstfall.\n\nFür Reisen, Auslandssemester oder Work-and-Travel ist diese Versicherung unverzichtbar. Der Beitrag ist günstig, der Schutz enorm.",
    youtubeVideoId: null,
    youtubeCaption: "Erklärvideo: Warum reicht die Gesundheitskarte im Ausland nicht aus?",
    topCoveredCases: [
      "Notfallbehandlungen weltweit beim Arzt oder im Krankenhaus",
      "Medizinisch notwendiger Rücktransport nach Deutschland",
      "Krankenhausaufenthalte im Ausland",
    ],
    allCoveredCases: [
      "Ambulante und stationäre Notfallbehandlungen weltweit",
      "Medizinisch notwendiger Rücktransport nach Deutschland",
      "Medikamente auf Auslandsreisen",
      "Zahnärztliche Notfallbehandlungen",
      "Überführungskosten im Todesfall",
      "Telefonische medizinische Beratung (je nach Tarif)",
    ],
    notCoveredCases: [
      "Vorerkrankungen, die vor der Reise bekannt waren",
      "Geplante Behandlungen im Ausland",
      "Schwangerschaft ab der 36. Woche (je nach Tarif)",
      "Langzeitaufenthalte über 6 Monate ohne Sondertarif",
      "Behandlungen, die bis zur Rückkehr warten konnten",
    ],
    applyUrl: "https://www.huk.de/auslandskrankenversicherung",
  },
};

// ─── URL helpers ─────────────────────────────────────────────────────────────

export function typeToSlug(type: string): string {
  return type.toLowerCase().replace(/_/g, "-");
}

export function slugToType(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}
