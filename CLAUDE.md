# Overlevering – bryllupsside Sofie & Sigve

Kontekst for den som jobber videre med siden, menneske eller Claude. Les dette før du endrer noe.

## Arkitektur
- **Statisk side** på GitHub Pages, repo `SigBorNor/bryllup`, med eget domene `https://www.sofieogsigve.no/` (DNS hos domene.no, filen `CNAME` i repoet må ikke slettes). Ingen byggesteg, bare HTML, CSS og JS.
- **Påmeldinger** sendes til et **Google Apps Script** (`apps-script.gs`), som skriver til et Google Regneark og sender en oppsummering på e-post. Regnearket har fanene **Oversikt**, **Svar** og **Innstillinger**.
- **Kode-port:** én felles kode fra invitasjonskortet. Den ligger i `config.js` **og** i regnearket (Innstillinger!B1). Endres den, må den endres begge steder.
- **Priser** (overnatting 800, brunsj 200 NOK) ligger i `C.info` i `index.html` **og** i regnearket (Innstillinger!B2–B3). Endres de, må de endres begge steder. Det samme gjelder betalingsteksten (`C.betaling` og Innstillinger!B4).

## Hvor ting ligger
- **Alt innhold** ligger i `C`-objektet øverst i `index.html`. Endre tekst der, ikke i HTML-en lenger ned.
  - `C.info` har infotekstene (dresscode, overnatting, taler, gaver, brunsj). Hver tekst vises flere steder: under tidslinjen, i Praktisk info og i påmeldingen. Den skal bare skrives ett sted.
  - `C.praktisk` er de fire bolkene i Praktisk info. `tekstFra: "reise"` gjør at bolken «Reise til området» viser samme tekst som infoknappen «Reise til Humlebæk» (`C.info.reise`).
  - `C.dageneForHotell` er teksten i den grønne boksen til høyre for introen i «Dagene før».
  - `C.hoteller` er hotellene i bolken «Hoteller og rabattordning» (pitch, avtale, booking, nettside, kartsøk). Knappen under «Dagene før» åpner den bolken (`data-bolk="hoteller"`).
  - `C.tips` er tipsene som åpnes fra fredagen og fra Praktisk info. `bilde: null` gir kort uten bilde.
  - Tekstfelt tåler både én streng og en liste med avsnitt.
- **Farger og fonter:** `:root` øverst i `style.css`.
- **Innstillinger:** `config.js` (kode, `scriptUrl`, `maksPersoner`, `paameldingApen`).
- **Bilder:** `media/`. Videoen ligger i `media/hav.mp4` (under ca. 8 MB, spilles uten lyd). Den er bearbeidet: sakket ned til 60 % med beregnede mellombilder, beskåret 20 % på siden med lyst gjenskinn (toppen av filen, venstre side når den vises rotert på PC), og slutten toner over i starten så sløyfen ikke har noe hopp. Filen er 720 × 1024. `media/hav.jpg` er første bilde i videoen og vises mens den lastes. Byttes videoen, må begge lages på nytt.
- **Bilder lastes opp uten posisjonsdata.** Bilder fra mobilen har ofte GPS-posisjon i filen, og repoet er offentlig. Fjern EXIF og skaler ned til maks ca. 1600 piksler før de legges i `media/`.
- **Bilder i `media/`** er navngitt etter motiv. Plassering på siden: `hoddevik-surf-strand` (rad 1, til høyre for teksten) og `oss-svalbard` (rad 2, til venstre) i Om oss, `solnedgang-strand-selfie` på takkesiden etter ja-svar, tre bilder på rad mellom Bryllupsdagen og Dagene før (`forlovelse-klem-genser`, `paris-seinen-eiffel`, `ski-topptur-selfie`) og tre mellom Dagene før og Kart (`vinter-akebrett`, `surf-paa-vei-ut`, `fest-dress-og-kjole`). Alle bildene ligger i karusellen (`C.bilder`, rekkefølgen der er rekkefølgen på siden). `story-nye-nokler` er et skjermbilde av en Instagram-story, og `surf.jpg` har en hvit kant til venstre. `forlovelse-ring-latter` er fjernet fra siden og repoet etter ønske fra Sigve.
- **Håndskriftfont:** `fonts/HAD-Script.woff2`. Reservefont er Caveat.

## Beslutninger som er tatt (ikke endre uten å avklare med Sigve og Sofie)
- Forside: fullskjermsvideo av vann med «Bryllupsinvitasjon / Sofie og Sigve / 17.07.2027» i Fraunces, og kodefelt. Videoen er filmet i høydeformat og roteres −90 grader på liggende skjermer (`style.css`), så mer av bildet vises.
- Sideoppbygning etter koden: Om oss (historien delt i to: første del med bilde til høyre, andre del med bilde til venstre og svarknapp og «+ Legg i kalender» under) → Bryllupsdagen (tekst, bilde, tidslinje, fem infoknapper inkludert «Reise til Humlebæk») → tre bilder → Dagene før (intro med grønn boks om overnatting til høyre, torsdag og fredag skilt med en strek) → tre bilder → Kart (Google My Maps, innebygd) → Bilder (karusell) → Praktisk info nederst (fire bolker som åpnes ved klikk). Innholdsfortegnelse: sidemeny til venstre på store skjermer, knappen «Innhold» oppe til høyre på små. Begge bygges fra `data-toc`.
- Alle ser «Dagene før». Bryteren som skjulte torsdag og fredag er fjernet.
- Flytende svarknapp vises på alle skjermstørrelser når den vanlige knappen ikke er på skjermen.
- Påmelding: Ja eller Nei øverst. Per person: matallergi, overnatting lør–søn (Ja/Nei), brunsj (Ja/Nei), og om de er i området torsdag og fredag (Ja/Nei/Vet ikke). Alle fire må besvares. Gjester arver valgene fra første person. Ikke noe felt for romønske. Taler: bare infotekst med kontakt til toastmaster.
- Etter påmelding vises sum å betale, og gjesten får en e-post med oppsummering.
- Betaling: Vipps eller MobilePay til Sigve.
- Bare norsk.
- Kalender: Google Kalender (én lenke per dag) eller Apple/Outlook (.ics).
- Design: Fraunces (serif), versaloverskrifter uten strek under, sandfarget side, lyseblå knapper, grønne infobokser i skjemaet. Håndskrift brukes bare i «Tusen takk!» og i bunnteksten.

## Regler
- **Ikke endre kolonnerekkefølgen** i `apps-script.gs` (`KOLONNER`). Nye kolonner legges til sist, og formlene i `oppsett()` må oppdateres.
- **Endringer i `apps-script.gs`** må limes inn i Apps Script, `oppsett` må kjøres på nytt, og scriptet må publiseres som **ny versjon**: Distribuer → Administrer distribusjoner → blyant → Ny versjon. URL-en forblir den samme.
- **Scriptet oppdateres før siden.** Siden sender «Ja/Nei/Vet ikke» som tekst. Et gammelt script tolker all tekst som «Ja».
- **Test alltid i inkognitovindu.** GitHub Pages lar nettlesere mellomlagre filer i opptil 10 minutter.
- Etter redigering av `C`: blir siden tom, mangler det nesten alltid et komma eller et anførselstegn. Sjekk Console (F12).
- Ikke legg hemmeligheter i repoet. Det er offentlig.

## Åpne punkter
- [ ] Tekster som er plassholdere: dresscode, taler (toastmaster og kontakt), gaver, reise (`C.info.reise`)
- [ ] Hoteller (`C.hoteller`): avtalene med Comwell, Frihavnen, Villa Brinkly og Nybogaard er ikke bekreftet (per 14.11.2026). Oppdater `avtale` og `booking` med koder, priser og frister når svarene kommer
- [ ] Bilder til tipsene (`C.tips.liste[].bilde`) og lenke til Strava-ruter
- [ ] Håndskriftfont (`fonts/HAD-Script.woff2`) og delingsbilde (`media/deling.jpg`)
- [ ] Tid og sted for torsdag
- [ ] Kart: punktene ligger i Google My Maps (`C.kart.mid`). Vielsesstedet mangler også koordinater i listen under kartet (`C.kart.steder`)
- [ ] Endelig kode før kortene trykkes (config.js og Innstillinger!B1)
- [ ] Sjekk at danske gjester kan betale med MobilePay til norsk nummer
- [ ] Slett testrader i Svar før publisering
