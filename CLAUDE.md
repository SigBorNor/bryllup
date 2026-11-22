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
  - `C.dageneForHotell` er teksten i den grønne boksen til høyre for introen i «Torsdag og fredag». Den samme teksten står i kolonnen «Dagene rundt» under «Overnatting» i Praktisk info.
  - Bolken «Overnatting» i Praktisk info har to kolonner: «Bryllupet» (lør–søn, viser `C.info.overnatting`) og «Dagene rundt» (`C.dageneForHotell`). Knappen der åpner hotelloversikten som en overliggende visning (`#hotellDlg`, med `C.hoteller` og `hotellTekst` som innledning). Alle knapper med `data-hoteller` åpner den.
  - `C.hoteller` er hotellene i bolken «Hoteller og rabattordning» (pitch, avtale, booking, nettside, kartsøk). `avtaleOmrade: true` legger hotellet under «Hoteller med avtale» øverst. De andre vises under «Andre hoteller». Knappen i den grønne boksen under «Torsdag og fredag» åpner den samme overliggende visningen.
  - `C.tips` er tipsene som åpnes fra fredagen og fra Praktisk info. `bilde: null` gir kort uten bilde. Ett tips kan ha én lenke (`lenke`, `lenkeTekst`) eller flere (`lenker: [{ lenke, lenkeTekst }]`).
  - Tekstfelt tåler både én streng og en liste med avsnitt.
- **Mobilvisning (under 48rem):** egen blokk nederst i `style.css`. PC-visningen påvirkes ikke. `.kun-mobil` vises bare på mobil, `.kun-pc` bare på større skjermer. På mobil:
  - Invitasjonsboksen øverst i Om oss (`C.kortFortalt`): midtstilt tekst uten bakgrunn (gyllen bakgrunn og bølgekanter er prøvd og tatt bort igjen), med svarfrist, svarknapp og «+ Legg bryllupet i kalenderen» (lørdagen fra `C.dager`). Den samme invitasjonsblokken (`#svar`, klassen `invitasjon`) står under Svalbard-bildet på PC, med `sommer-terrasse-borg` til høyre (klassen `kun-pc`), og begge er skjult på mobil. Bilder i `.kun-pc` regnes ikke som «brukt», så de vises i karusellen på mobil. Begge legger lørdagen i kalenderen (svarfristen legges ikke lenger i kalenderen).
  - Kortere tekster: `C.bryllupsdagen.tekstMobil` og `C.dageneForIntroMobil`. Endres langteksten, bør kortteksten sjekkes også.
  - Tettere tidslinje, infoknappene i rutenett, bilderekkene som sveipbare striper, Krogerup-bildet i full bredde, lavere kart med én linje per sted.
  - Karusellen viser bare bilder som ikke allerede er på siden (klassen `brukt`).
  - Topplinje (`#mobilbar`) med «Innhold» og «Svar» i stedet for de flytende knappene.
- **Farger og fonter:** `:root` øverst i `style.css`.
- **Innstillinger:** `config.js` (kode, `scriptUrl`, `maksPersoner`, `paameldingApen`).
- **Bilder:** `media/`. Videoen ligger i `media/hav.mp4` (under ca. 8 MB, spilles uten lyd). Den er bearbeidet: sakket ned til 60 % med beregnede mellombilder, beskåret 10 % på siden med lyst gjenskinn (toppen av filen, venstre side når den vises rotert på PC), og slutten toner over i starten så sløyfen ikke har noe hopp. Filen er 720 × 1152. `media/hav.jpg` er første bilde i videoen og vises mens den lastes. Byttes videoen, må begge lages på nytt.
- **Bilder lastes opp uten posisjonsdata.** Bilder fra mobilen har ofte GPS-posisjon i filen, og repoet er offentlig. Fjern EXIF og skaler ned til maks ca. 1600 piksler før de legges i `media/`.
- **Bilder i `media/`** er navngitt etter motiv. Plassering på siden: `hoddevik-surf-strand` (rad 1, til høyre for teksten), `oss-svalbard` (rad 2, til venstre for teksten) og `sommer-terrasse-borg` (til høyre for invitasjonsblokken, bare PC og nettbrett) i Om oss, `solnedgang-strand-selfie` på takkesiden etter ja-svar, tre bilder på rad mellom Bryllupsdagen og Dagene før (`forlovelse-klem-genser`, `paris-seinen-eiffel`, `ski-topptur-selfie`) og tre mellom Dagene før og Kart (`vinter-akebrett`, `surf-paa-vei-ut`, `fest-dress-og-kjole`). Alle bildene ligger i karusellen (`C.bilder`, rekkefølgen der er rekkefølgen på siden). `story-nye-nokler` er et skjermbilde av en Instagram-story, og `surf.jpg` har en hvit kant til venstre. `forlovelse-ring-latter` er fjernet fra siden og repoet etter ønske fra Sigve.
- **Navnetrekket:** `media/sofie-sigve.svg` er det håndtegnede «Sofie ♡ Sigve», gjort om til vektorgrafikk (skarpt i alle størrelser). Tegningen er definert én gang som symbolet `#navnetrekk` øverst i `<body>` i `index.html`, og settes inn med `<svg class="navnetrekk" viewBox="0 0 630 138" role="img" aria-label="Sofie og Sigve"><use href="#navnetrekk" width="630" height="138"/></svg>` (kopier en av de eksisterende). Fargen følger teksten rundt (`fill: currentColor`). Navnene er flyttet nærmere hjertet enn i originaltegningen. (CSS-maske ble prøvd først, men vistes ikke i alle nettlesere på PC.) Størrelsen settes med `width`. Brukes på forsiden, i bunnteksten og i topplinjen på mobil.
- **Hjertet** fra navnetrekket er et eget symbol (`#hjerte`) og markerer hver ny dag på tidslinjen under Bryllupsdagen (`.tl-hjerte`). Navnetrekket står også over innholdsfortegnelsen i sidemenyen på PC (`.toc-navn`).
- **Blyantstreken** på tidslinjen er bilder: `media/linje-h.png` (PC) og `media/linje-v.png` (mobil), laget med blyantmotoren i `/home/claude/skisser/pencil.py` (ikke i repoet).
- **Dagene** i «Torsdag og fredag»: `tittel` er den store overskriften, `undertittel` den lille, lyse teksten under.
- **Håndskriftfont:** `fonts/HAD-Script.woff2`. Reservefont er Caveat. Brukes nå bare i «Tusen takk!».

## Beslutninger som er tatt (ikke endre uten å avklare med Sigve og Sofie)
- Forside: fullskjermsvideo av vann med «Bryllupsinvitasjon» og «17.07.2027» i Fraunces med det håndtegnede navnetrekket mellom, og kodefelt. Videoen er filmet i høydeformat og roteres −90 grader på liggende skjermer (`style.css`), så mer av bildet vises.
- Sideoppbygning etter koden: Om oss (historien delt i to: første del med bilde til høyre, andre del med Svalbard-bildet til venstre, og under det invitasjonsblokken med terrasse-bildet til høyre: «Vi inviterer til bryllup», dato, sted, svarfrist, svarknapp og «+ Legg bryllupet i kalenderen») → Bryllupsdagen (tekst, bilde, tidslinje, fem infoknapper inkludert «Reise til Humlebæk») → tre bilder → Torsdag og fredag (id `dagene-for`; intro med grønn boks om overnatting til høyre på PC og under torsdag og fredag på mobil, torsdag og fredag skilt med en strek) → tre bilder → Kart (Google My Maps, innebygd) → Bilder (karusell) → Praktisk info nederst (fire bolker som åpnes ved klikk: På selve dagen, Overnatting, Reise til området, Ting å gjøre i området). Innholdsfortegnelse: sidemeny til venstre på store skjermer, knappen «Innhold» oppe til høyre på nettbrett, og i topplinjen på mobil. Begge bygges fra `data-toc`.
- Alle ser «Torsdag og fredag». Bryteren som skjulte torsdag og fredag er fjernet.
- Flytende svarknapp vises på PC og nettbrett når den vanlige knappen ikke er på skjermen. På mobil ligger svarknappen i topplinjen.
- Påmelding: Ja eller Nei øverst. Per person: matallergi, overnatting lør–søn (Ja/Nei), brunsj (Ja/Nei), og om de er i området torsdag og fredag (Ja/Nei/Vet ikke). Alle fire må besvares. Gjester arver valgene fra første person. Ikke noe felt for romønske. Taler: bare infotekst med kontakt til toastmaster.
- Etter påmelding vises sum å betale, og gjesten får en e-post med oppsummering.
- Betaling: Vipps eller MobilePay til Sigve.
- Bare norsk.
- Kalender: Google Kalender (én lenke per dag) eller Apple/Outlook (.ics).
- Design: Fraunces (serif), versaloverskrifter uten strek under, sandfarget side, lyseblå knapper, grønne infobokser i skjemaet. Det håndtegnede navnetrekket brukes på forsiden, over innholdsfortegnelsen på PC, i bunnteksten og i topplinjen på mobil. Tidslinjen under Bryllupsdagen har blyantstrek og hjerter. Håndskriftfonten brukes bare i «Tusen takk!».

## Regler
- **Ikke endre kolonnerekkefølgen** i `apps-script.gs` (`KOLONNER`). Nye kolonner legges til sist, og formlene i `oppsett()` må oppdateres.
- **Endringer i `apps-script.gs`** må limes inn i Apps Script, `oppsett` må kjøres på nytt, og scriptet må publiseres som **ny versjon**: Distribuer → Administrer distribusjoner → blyant → Ny versjon. URL-en forblir den samme.
- **Scriptet oppdateres før siden.** Siden sender «Ja/Nei/Vet ikke» som tekst. Et gammelt script tolker all tekst som «Ja».
- **Test alltid i inkognitovindu.** GitHub Pages lar nettlesere mellomlagre filer i opptil 10 minutter.
- Etter redigering av `C`: blir siden tom, mangler det nesten alltid et komma eller et anførselstegn. Sjekk Console (F12).
- Ikke legg hemmeligheter i repoet. Det er offentlig.

## Åpne punkter
- [ ] Tekster som er plassholdere: taler (toastmaster og kontakt), gaver
- [ ] Hoteller (`C.hoteller`), per 17.11.2026: Comwell Portside bekreftet med 15 rom, bookingkode kommer. Tilbud på Comwell Borupgaard er bedt om. Frihavnen: gjestene booker på e-post (bookingkode kun ved stor interesse). Nybogaard: ingen avtale, gjestene booker selv på nett. Villa Brinkly har ikke svart på spørsmål sendt 14.11
- [ ] Bilder til tipsene (`C.tips.liste[].bilde`)
- [ ] Håndskriftfont (`fonts/HAD-Script.woff2`) og delingsbilde (`media/deling.jpg`)
- [ ] Tid og sted for torsdag
- [ ] Kart: punktene ligger i Google My Maps (`C.kart.mid`). Vielsesstedet mangler også koordinater i listen under kartet (`C.kart.steder`)
- [ ] Endelig kode før kortene trykkes (config.js og Innstillinger!B1)
- [ ] Sjekk at danske gjester kan betale med MobilePay til norsk nummer
- [ ] Slett testrader i Svar før publisering
