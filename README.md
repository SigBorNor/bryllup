# Bryllupsside – Sofie & Sigve (versjon 3)

Statisk nettside på GitHub Pages. Gjestene går inn med en felles kode, påmeldingene lagres i et Google Regneark, og den som svarer får en oppsummering på e-post.

| Fil | Hva |
|---|---|
| `index.html` | Hele siden. Alt innhold (tekster, program, infotekster, tips, kart) ligger i `C`-objektet øverst. |
| `style.css` | Utseende. Fargene ligger øverst. |
| `config.js` | Koden, lenken til regnearket, maks antall per påmelding og bryteren `paameldingApen`. |
| `apps-script.gs` | Limes inn i Google Apps Script. Tar imot påmeldinger, sender e-post og lager fanene i regnearket. |
| `media/` | `hav.mp4` og `hav.jpg` (toppbanner), `oss-svalbard.jpg`, `krogerup.jpg`, `surf.jpg`, `deling.jpg` (forhåndsvisning ved deling). |
| `fonts/` | `HAD-Script.woff2` (håndskriften). Reservefont: Caveat. |

---

## Oppdatere fra versjon 2 til versjon 3

Gjør dette i denne rekkefølgen. Scriptet må være oppdatert **før** den nye siden lastes opp, ellers lagres «Nei» og «Vet ikke» som «Ja».

1. Åpne regnearket → **Utvidelser → Apps Script**. Slett alt som står der, lim inn hele den nye `apps-script.gs` og lagre.
2. Velg **oppsett** i nedtrekkslisten og trykk **Kjør**. Google spør om en ny tillatelse: å sende e-post. Godkjenn den. Svarene som ligger der fra før, beholdes.
3. Sjekk fanen **Innstillinger**: kode, priser (800 og 200), betalingstekst og e-post. Fyll gjerne inn adressen svar på e-posten skal gå til (B6).
4. **Distribuer → Administrer distribusjoner → blyanten → Versjon: Ny versjon → Distribuer.** URL-en forblir den samme.
5. Last opp de nye filene til GitHub (**Add file → Upload files**): `index.html`, `style.css`, `apps-script.gs`, `README.md`, `CLAUDE.md` og `media/hav.mp4`. Slett videofilen med det lange navnet i `media/`.
6. Vent et par minutter, åpne siden i inkognitovindu og send en testpåmelding (se del 3).

## 1. Regnearket fra bunnen av (ca. 15 min)

1. Lag et nytt Google Regneark, for eksempel «Bryllup – påmeldinger».
2. **Utvidelser → Apps Script**. Slett det som står der, lim inn hele `apps-script.gs` og lagre (Ctrl+S).
3. Velg **oppsett** i nedtrekkslisten øverst og trykk **Kjør**. Godkjenn tilgang når Google spør (se punkt 5). Regnearket får da fanene **Oversikt**, **Svar** og **Innstillinger**.
4. **Distribuer → Ny distribusjon** → tannhjulet → **Nettapp**:
   - *Kjør som:* Meg
   - *Hvem har tilgang:* Alle
   - Trykk **Distribuer** og kopier **nettapp-URL-en** (slutter på `/exec`).
5. Google advarer om at appen ikke er verifisert. Det er normalt for egne script: **Avansert → Gå til … (ikke trygg) → Tillat**. Scriptet ber om tilgang til dette regnearket og til å sende e-post.
6. Lim inn URL-en i `config.js` under `scriptUrl`.

### Fanen Innstillinger

| Celle | Hva | Må også endres i |
|---|---|---|
| B1 | Koden fra invitasjonen | `config.js` |
| B2 | Pris overnatting (NOK) | `C.info.overnatting.pris` i `index.html` |
| B3 | Pris brunsj (NOK) | `C.info.brunsj.pris` i `index.html` |
| B4 | Betalingstekst i e-posten | `C.betaling` i `index.html` |
| B5 | Send oppsummering på e-post: Ja eller Nei | – |
| B6 | Adressen svar på e-posten går til. Tom = kontoen som eier scriptet | – |

Verdiene her kan endres uten å distribuere scriptet på nytt.

### E-postoppsummeringen

- Sendes fra Google-kontoen som eier scriptet, til den som fylte ut skjemaet. Gjester som legges til, får ikke egen e-post.
- Gmail tillater rundt 100 slike e-poster i døgnet. Er kvoten brukt opp, lagres svaret likevel.
- Koden ligger åpent i dette repoet, så hvem som helst kan i prinsippet sende inn skjemaet. Dukker det opp tullepåmeldinger, sett B5 til «Nei» og bytt kode.

**Endrer du scriptet senere:** lim inn, kjør **oppsett**, og deretter Distribuer → Administrer distribusjoner → blyanten → Versjon: *Ny versjon* → Distribuer.

## 2. Publiser

Last opp alle filene til GitHub-repoet (**Add file → Upload files**). Siden ligger på
`https://www.sofieogsigve.no/`

## 3. Test

- [ ] Feil kode gir feilmelding, riktig kode slipper inn (og huskes ved neste besøk)
- [ ] Infoknappene under tidslinjen åpner Dresscode, Overnatting, Taler og Gaver
- [ ] «Se tips til ting å gjøre» åpner tipsene, både fra fredagen og fra Praktisk info. Lenkene virker
- [ ] De fire bolkene i Praktisk info åpnes og lukkes
- [ ] Påmelding: én person, flere gjester, og «Nei, jeg kan dessverre ikke»
- [ ] Svarene havner i fanen **Svar** med Ja/Nei/Vet ikke i riktige kolonner, og **Oversikt** teller riktig
- [ ] Summen i takkemeldingen, i e-posten og i kolonnen «Å betale» er lik
- [ ] E-posten kommer frem (sjekk også søppelpost)
- [ ] «Legg i kalenderen» fungerer på iPhone og Android
- [ ] Slett testradene i **Svar** før lansering

## Deling og tilgang

- Del regnearket med Sigve, Sofie og Anders (**Del**, øverst til høyre).
- Ikke endre kolonnene i **Svar**. Vil dere jobbe videre med listen, for eksempel bordplassering eller hvem som har betalt, lag en egen fane som henter data fra **Svar**.
- Lenke som slipper gjester rett inn: `https://www.sofieogsigve.no/?kode=123`

## Oppdatere innhold

Endre `C`-objektet i `index.html`, eller be Claude gjøre det, og last opp filen på nytt.

- Tekst står mellom "anførselstegn".
- I lister `[ ... ]` skal det være komma etter hver linje, unntatt den siste.
- Blir siden tom etter en endring, mangler det nesten alltid et komma eller et anførselstegn. Åpne siden, trykk F12 og se under *Console*. Feilmeldingen viser linjenummeret.

Infotekstene (dresscode, overnatting, taler, gaver, brunsj) ligger i `C.info`. Hver av dem vises flere steder på siden, men skrives bare der.

Bilde til et tips: legg bildet i `media/` og skriv for eksempel `bilde: "media/louisiana.jpg"` i `C.tips`. Bruk egne bilder eller bilder dere har lov til å bruke.

## Etter bryllupet

Slett regnearket, eller i det minste kolonnen med allergier. Allergiopplysninger skal ikke ligge lagret lenger enn nødvendig.
