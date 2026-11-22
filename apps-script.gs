/**
 * @OnlyCurrentDoc
 * Begrenser scriptet til bare dette regnearket. Uten denne linjen ber Google
 * om tilgang til ALLE regnearkene dine.
 */

/**
 * Bryllupsside Sofie & Sigve – mottak av påmeldinger.
 *
 * Oppsett (første gang, og hver gang denne filen er endret):
 *   1. Lim inn hele denne filen i Utvidelser → Apps Script og lagre.
 *   2. Velg funksjonen «oppsett» i nedtrekkslisten øverst og trykk Kjør.
 *      Den lager fanene Svar, Oversikt og Innstillinger, og er trygg å kjøre på nytt.
 *      Google spør om tilgang til regnearket og til å sende e-post.
 *   3. Første gang: Distribuer → Ny distribusjon → Nettapp. Kjør som: meg. Tilgang: Alle.
 *      Senere: Distribuer → Administrer distribusjoner → blyanten → Ny versjon.
 *
 * Kode, priser, betalingstekst og e-post styres i fanen «Innstillinger».
 * De kan endres der uten å distribuere scriptet på nytt.
 */

// Ikke endre rekkefølgen. Nye kolonner legges til sist.
const KOLONNER = [
  "Tidspunkt", "Påmeldings-ID", "Påmeldt av", "E-post", "Telefon",
  "Navn", "Kommer", "Torsdag", "Fredag", "Lørdag", "Søndag brunsj",
  "Overnatting lør–søn", "Allergier / mathensyn", "Å betale (NOK)"
];

// Fanen Innstillinger: [ledetekst, standardverdi]. Verdiene står i kolonne B.
const INNSTILLINGER = [
  ["Kode", "123"],
  ["Pris overnatting (NOK)", 800],
  ["Pris brunsj (NOK)", 200],
  ["Betaling", "Betales med Vipps eller MobilePay til Sigve, tlf. 468 16 165."],
  ["Send oppsummering på e-post (Ja/Nei)", "Ja"],
  ["Svar på e-posten går til (valgfritt)", ""]
];

// Kontaktinfo og navnetrekk i oppsummeringen på e-post
const KONTAKT = { sigve: "468 16 165", sofie: "477 08 445" };
const NAVNETREKK_URL = "https://www.sofieogsigve.no/media/navnetrekk-epost.png";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const bok = SpreadsheetApp.getActive();
    const inn = lesInnstillinger(bok);

    // Riktig kode?
    if (tekst(d.kode, 50) !== inn.kode) return svar({ ok: false, feil: "kode" });

    // Robotfelle
    if (d.nettside) return svar({ ok: true });

    const navn = tekst(d.navn, 120);
    const epost = tekst(d.epost, 200);
    if (!navn || !/^\S+@\S+\.\S+$/.test(epost)) return svar({ ok: false, feil: "felt" });

    const personer = Array.isArray(d.personer) ? d.personer.slice(0, 10) : [];
    if (!personer.length || personer.some(p => !tekst(p.navn, 120))) return svar({ ok: false, feil: "personer" });

    const kommer = d.kommer !== false;
    const id = Utilities.getUuid().slice(0, 8);
    const tid = new Date();

    const linjer = personer.map(p => {
      const overnatting = jaNei(p.overnatting), brunsj = jaNei(p.brunsj);
      return {
        navn: tekst(p.navn, 120),
        torsdag: kommer ? treValg(p.torsdag) : "",
        fredag: kommer ? treValg(p.fredag) : "",
        brunsj: kommer ? brunsj : "",
        overnatting: kommer ? overnatting : "",
        allergier: kommer ? tekst(p.allergier, 500) : "",
        sum: kommer ? (overnatting === "Ja" ? inn.prisOvernatting : 0) + (brunsj === "Ja" ? inn.prisBrunsj : 0) : 0
      };
    });

    const rader = linjer.map(l => [
      tid, id, navn, epost, tekst(d.telefon, 40),
      l.navn, kommer ? "Ja" : "Nei",
      l.torsdag, l.fredag, kommer ? "Ja" : "", l.brunsj, l.overnatting,
      l.allergier, kommer ? l.sum : ""
    ].map(trygg));

    const ark = bok.getSheetByName("Svar");
    ark.getRange(ark.getLastRow() + 1, 1, rader.length, KOLONNER.length).setValues(rader);

    // Svaret er lagret. Feiler e-posten, skal påmeldingen likevel regnes som mottatt.
    if (inn.sendEpost) {
      try { sendOppsummering(inn, navn, epost, kommer, linjer); }
      catch (err) { console.error("E-post feilet: " + err); }
    }
    return svar({ ok: true });
  } catch (err) {
    return svar({ ok: false, feil: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function lesInnstillinger(bok) {
  const v = bok.getSheetByName("Innstillinger").getRange(1, 2, INNSTILLINGER.length, 1).getDisplayValues().map(r => String(r[0]).trim());
  const tall = s => Number(String(s).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  return {
    kode: v[0],
    prisOvernatting: tall(v[1]),
    prisBrunsj: tall(v[2]),
    betaling: v[3],
    sendEpost: v[4].toLowerCase() !== "nei",
    svarTil: /^\S+@\S+\.\S+$/.test(v[5]) ? v[5] : ""
  };
}

function sendOppsummering(inn, navn, epost, kommer, linjer) {
  // Fornavn til alle i påmeldingen: «Sigve», «Sigve og Sofie», «Sigve, Sofie og Ola»
  const fornavn = linjer.map(l => String(l.navn).trim().split(/\s+/)[0]).filter(Boolean);
  if (!fornavn.length) fornavn.push(String(navn).trim().split(/\s+/)[0]);
  const navneliste = fornavn.length > 1 ? fornavn.slice(0, -1).join(", ") + " og " + fornavn[fornavn.length - 1] : fornavn[0];
  const du = fornavn.length > 1 ? "dere" : "du";

  const tekstLinjer = ["Hei " + navneliste + "!", ""];
  if (!kommer) {
    tekstLinjer.push("Tusen takk for at " + du + " svarte på invitasjonen til bryllupet vårt. Vi har registrert at " + du + " dessverre ikke kan komme:", "");
    linjer.forEach(l => tekstLinjer.push("– " + l.navn));
    tekstLinjer.push("", (du === "du" ? "Du" : "Dere") + " blir savnet!");
  } else {
    tekstLinjer.push("Tusen takk for at " + du + " svarte på invitasjonen til bryllupet vårt. Dette er det vi har registrert:", "");
    linjer.forEach(l => {
      tekstLinjer.push("– " + l.navn + ": " + [
        l.overnatting === "Ja" ? "overnatter på Krogerup lør–søn" : "overnatter ikke på Krogerup",
        l.brunsj === "Ja" ? "brunsj søndag" : "ikke brunsj",
        "torsdag: " + l.torsdag.toLowerCase(),
        "fredag: " + l.fredag.toLowerCase()
      ].join(", ") + (l.allergier ? ". Matallergi: " + l.allergier : ""));
    });
    const nOv = linjer.filter(l => l.overnatting === "Ja").length;
    const nBr = linjer.filter(l => l.brunsj === "Ja").length;
    const sum = linjer.reduce((s, l) => s + l.sum, 0);
    if (sum > 0) {
      const deler = [];
      if (nOv) deler.push(nOv + " × overnatting à " + inn.prisOvernatting + " NOK");
      if (nBr) deler.push(nBr + " × brunsj à " + inn.prisBrunsj + " NOK");
      tekstLinjer.push("", "Å betale: " + sum + " NOK (" + deler.join(", ") + ").");
      if (inn.betaling) tekstLinjer.push(inn.betaling);
    }
    tekstLinjer.push("", "Vi gleder oss til å feire med " + (du === "du" ? "deg" : "dere") + "!");
  }
  tekstLinjer.push("", "Har " + du + " spørsmål eller vil " + du + " endre noe? Svar på denne e-posten eller ring oss på:",
    "– Sigve: " + KONTAKT.sigve, "– Sofie: " + KONTAKT.sofie);

  // HTML-versjon med navnetrekket nederst (bildet ligger på nettsiden). Ren tekst er reserve for e-postprogrammer uten HTML.
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = '<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#5E4F51;max-width:560px">' +
    tekstLinjer.map(l => l === "" ? "<br>" : esc(l) + "<br>").join("") +
    '<br><img src="' + NAVNETREKK_URL + '" alt="Sofie ♡ Sigve" width="220" style="display:block;width:220px;height:auto;margin-top:8px"></div>';

  const melding = {
    to: epost,
    subject: "Vi har fått svaret ditt – bryllup Sofie & Sigve 17.07.2027",
    body: tekstLinjer.concat(["", "Sofie ♡ Sigve"]).join("\n"),
    htmlBody: html,
    name: "Sofie & Sigve"
  };
  if (inn.svarTil) melding.replyTo = inn.svarTil;
  MailApp.sendEmail(melding);
}

function tekst(v, maks) {
  return String(v == null ? "" : v).trim().slice(0, maks);
}

// Ja / Nei. Tåler også true/false fra eldre versjoner av siden.
function jaNei(v) {
  return v === true || v === "Ja" ? "Ja" : "Nei";
}

// Ja / Nei / Vet ikke
function treValg(v) {
  if (v === true || v === "Ja") return "Ja";
  return v === "Vet ikke" ? "Vet ikke" : "Nei";
}

// Hindrer at tekst fra skjemaet tolkes som formler i regnearket
function trygg(v) {
  return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function svar(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Lager fanene. Trygg å kjøre på nytt: svarene og verdiene i Innstillinger beholdes. */
function oppsett() {
  const bok = SpreadsheetApp.getActive();

  const svarArk = bok.getSheetByName("Svar") || bok.insertSheet("Svar");
  svarArk.getRange(1, 1, 1, KOLONNER.length).setValues([KOLONNER]).setFontWeight("bold");
  svarArk.setFrozenRows(1);

  // Innstillinger: ledetekstene skrives alltid, verdiene bare der cellen er tom
  const inn = bok.getSheetByName("Innstillinger") || bok.insertSheet("Innstillinger");
  INNSTILLINGER.forEach(([ledetekst, standard], i) => {
    inn.getRange(i + 1, 1).setValue(ledetekst).setFontWeight("bold");
    const celle = inn.getRange(i + 1, 2);
    if (celle.getDisplayValue() === "" && standard !== "") celle.setValue(standard);
  });
  inn.setColumnWidth(1, 300);
  inn.setColumnWidth(2, 420);

  const o = bok.getSheetByName("Oversikt") || bok.insertSheet("Oversikt", 0);
  o.clear();

  // Skilletegn i formler følger regnearkets språk: komma (engelsk) eller semikolon (norsk m.fl.).
  // Vi prøver en testformel og ser hvilken som virker.
  const prove = o.getRange("A1");
  prove.setFormula("=SUM(1,1)");
  SpreadsheetApp.flush();
  const s = prove.getDisplayValue() === "2" ? "," : ";";
  prove.clear();

  const tall = [
    ["Kommer", `=COUNTIF(Svar!G2:G${s}"Ja")`],
    ["Kan ikke komme", `=COUNTIF(Svar!G2:G${s}"Nei")`],
    ["Torsdag – ja", `=COUNTIF(Svar!H2:H${s}"Ja")`],
    ["Torsdag – vet ikke", `=COUNTIF(Svar!H2:H${s}"Vet ikke")`],
    ["Fredag – ja", `=COUNTIF(Svar!I2:I${s}"Ja")`],
    ["Fredag – vet ikke", `=COUNTIF(Svar!I2:I${s}"Vet ikke")`],
    ["Lørdag", `=COUNTIF(Svar!J2:J${s}"Ja")`],
    ["Søndag brunsj", `=COUNTIF(Svar!K2:K${s}"Ja")`],
    ["Overnatting lør–søn", `=COUNTIF(Svar!L2:L${s}"Ja")`],
    ["Antall påmeldinger", "=COUNTUNIQUE(Svar!B2:B)"],
    ["Sum å betale (NOK)", "=SUM(Svar!N2:N)"]
  ];
  o.getRange("A1:B1").setValues([["Oversikt", "Antall"]]).setFontWeight("bold");
  tall.forEach(([navn, f], i) => {
    o.getRange(i + 2, 1).setValue(navn);
    o.getRange(i + 2, 2).setFormula(f);
  });
  const allergiRad = tall.length + 3;
  o.getRange(allergiRad, 1, 1, 2).setValues([["Allergier / mathensyn", ""]]).setFontWeight("bold");
  o.getRange(allergiRad + 1, 1).setFormula(`=IFERROR(FILTER(Svar!F2:F${s}Svar!M2:M<>"")${s}"Ingen ennå")`);
  o.getRange(allergiRad + 1, 2).setFormula(`=IFERROR(FILTER(Svar!M2:M${s}Svar!M2:M<>"")${s}"")`);
  o.setColumnWidth(1, 220);
  o.setColumnWidth(2, 260);

  const standard = bok.getSheetByName("Ark1") || bok.getSheetByName("Sheet1");
  if (standard && bok.getSheets().length > 1) bok.deleteSheet(standard);
}
