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
  "Overnatting lør–søn", "Allergier / mathensyn", "Å betale (NOK)",
  "Adresse"
];

// Fanen Innstillinger: [ledetekst, standardverdi]. Verdiene står i kolonne B.
const INNSTILLINGER = [
  ["Kode", "123"],
  ["Pris overnatting (NOK)", 800],
  ["Pris brunsj (NOK)", 200],
  ["Betaling", "Betales med Vipps eller MobilePay til Sigve, tlf. 468 16 165."],
  ["Send oppsummering på e-post (Ja/Nei)", "Ja"],
  ["Svar på e-posten går til (valgfritt)", ""],
  ["Invitasjon: kopi til (valgfritt)", ""]
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
        // Torsdag spørres ikke lenger om (sammenkomsten er flyttet til fredag). Kolonnen står igjen så rekkefølgen ikke endres.
        torsdag: kommer && p.torsdag ? treValg(p.torsdag) : "",
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
      l.allergier, kommer ? l.sum : "",
      tekst(d.adresse, 300)
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
    svarTil: /^\S+@\S+\.\S+$/.test(v[5]) ? v[5] : "",
    kopi: /^\S+@\S+\.\S+$/.test(v[6]) ? v[6] : ""
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
        "sammenkomst fredag: " + l.fredag.toLowerCase()
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
  if (kommer) {
    tekstLinjer.push("", "Lurer " + du + " på noe om feiringen eller trenger tips til overnatting og aktiviteter rundt Humlebæk, finner " + du + " det på nettsiden sofieogsigve.no.");
    tekstLinjer.push("", "Har " + du + " spørsmål eller vil " + du + " endre noe? Svar på denne e-posten eller ring oss på:");
  } else {
    tekstLinjer.push("", "Endrer planene seg, kan " + du + " svare på denne e-posten eller ringe oss på:");
  }
  tekstLinjer.push("– Sigve: " + KONTAKT.sigve, "– Sofie: " + KONTAKT.sofie);

  // HTML-versjon med navnetrekket nederst (bildet ligger på nettsiden). Ren tekst er reserve for e-postprogrammer uten HTML.
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = '<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#5E4F51;max-width:560px">' +
    tekstLinjer.map(l => l === "" ? "<br>" : esc(l).replace("sofieogsigve.no", '<a href="https://www.sofieogsigve.no" style="color:#5E4F51">sofieogsigve.no</a>') + "<br>").join("") +
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
    ["Sammenkomst fredag – ja", `=COUNTIF(Svar!I2:I${s}"Ja")`],
    ["Sammenkomst fredag – vet ikke", `=COUNTIF(Svar!I2:I${s}"Vet ikke")`],
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

  // Gjester: listen invitasjonene sendes til. Lages bare hvis den mangler, så innholdet aldri slettes.
  if (!bok.getSheetByName("Gjester")) {
    const g = bok.insertSheet("Gjester");
    g.getRange(1, 1, 1, GJESTEKOLONNER.length).setValues([GJESTEKOLONNER]).setFontWeight("bold");
    g.setFrozenRows(1);
  }

  const standard = bok.getSheetByName("Ark1") || bok.getSheetByName("Sheet1");
  if (standard && bok.getSheets().length > 1) bok.deleteSheet(standard);
}

/* ================= Invitasjon på e-post =================
 *
 * Sendes herfra, ikke fra utkast i Gmail: Gmail sitt skrivevindu endrer lenker og
 * bilder når et utkast åpnes, og da blir oppsettet feil.
 *
 * Fanen «Gjester»: én rad per invitasjon (et par eller én person).
 *   Partner 1 | Partner 2 | Mottaker 1 | Mottaker 2 | Sendt
 *   Partner 2 og Mottaker 2 kan stå tomme. Bare fornavnet brukes i hilsenen.
 *   «Sendt» fylles ut av scriptet. Rader med noe i «Sendt» hoppes over.
 *
 * Kopi: e-postadressen i Innstillinger («Invitasjon: kopi til») settes på kopi på alle.
 * Koden i e-posten hentes fra Innstillinger!B1, samme kode som nettsiden bruker.
 *
 * 1. Kjør «testInvitasjon»: sender invitasjonen for første rad i Gjester bare til deg selv.
 * 2. Kjør «sendInvitasjoner»: sender til alle rader som ikke er sendt.
 *    Google tillater ca. 100 mottakere per døgn (kopi teller med). Når grensen nås,
 *    stopper scriptet. Kjør det igjen neste dag, så fortsetter det der det slapp.
 */
const GJESTEKOLONNER = ["Partner 1", "Partner 2", "Mottaker 1", "Mottaker 2", "Sendt"];
const INVITASJON = {
  emne: "Bryllupsinvitasjon – Sofie & Sigve 17.07.2027",
  lenke: "https://www.sofieogsigve.no/",
  svarfrist: "17. februar 2027",
  kodeForklaring: "våre fødselsmåneder",
  gifUrl: "https://www.sofieogsigve.no/media/invitasjon.gif"
};

function testInvitasjon() {
  const bok = SpreadsheetApp.getActive();
  const rader = lesGjester(bok);
  const rad = rader[0] || { navn: ["Kari", "Ola"], til: [] };
  const meg = Session.getEffectiveUser().getEmail();
  sendInvitasjon(lesInnstillinger(bok), rad.navn, [meg], "", hentInvitasjonsbilder());
  SpreadsheetApp.getActive().toast("Testinvitasjon sendt til " + meg, "Invitasjon");
}

function sendInvitasjoner() {
  const bok = SpreadsheetApp.getActive();
  const inn = lesInnstillinger(bok);
  const ark = bok.getSheetByName("Gjester");
  const rader = lesGjester(bok).filter(r => !r.sendt);
  if (!rader.length) { bok.toast("Ingen usendte invitasjoner i Gjester.", "Invitasjon"); return; }
  const bilder = hentInvitasjonsbilder();
  let sendt = 0, mangler = [];
  for (const r of rader) {
    if (!r.til.length) { mangler.push(r.navn.join(" og ")); continue; }
    const antall = r.til.length + (inn.kopi ? 1 : 0);
    if (MailApp.getRemainingDailyQuota() < antall) {
      bok.toast("Dagens grense hos Google er nådd etter " + sendt + " invitasjoner. Kjør igjen i morgen.", "Invitasjon", 15);
      return;
    }
    sendInvitasjon(inn, r.navn, r.til, inn.kopi, bilder);
    ark.getRange(r.rad, 5).setValue(new Date());
    SpreadsheetApp.flush();
    sendt++;
  }
  bok.toast(sendt + " invitasjoner sendt." + (mangler.length ? " Mangler e-post: " + mangler.join(", ") : ""), "Invitasjon", 15);
}

function lesGjester(bok) {
  const ark = bok.getSheetByName("Gjester");
  if (!ark || ark.getLastRow() < 2) return [];
  const gyldig = e => /^\S+@\S+\.\S+$/.test(e);
  return ark.getRange(2, 1, ark.getLastRow() - 1, 5).getDisplayValues().map((v, i) => ({
    rad: i + 2,
    navn: [v[0], v[1]].map(n => String(n).trim().split(/\s+/)[0]).filter(Boolean),
    til: [v[2], v[3]].map(e => String(e).trim()).filter(gyldig),
    sendt: String(v[4]).trim() !== ""
  })).filter(r => r.navn.length);
}

function hentInvitasjonsbilder() {
  return {
    invitasjon: UrlFetchApp.fetch(INVITASJON.gifUrl).getBlob().setName("invitasjon.gif"),
    navnetrekk: UrlFetchApp.fetch(NAVNETREKK_URL).getBlob().setName("sofie-og-sigve.png")
  };
}

function sendInvitasjon(inn, navn, til, kopi, bilder) {
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const dere = navn.length > 1 ? "dere" : "deg";
  const dereKan = navn.length > 1 ? "dere" : "du";
  const hilsen = "Kjære " + navn.join(" og ") + "!";
  const tekst1 = "I sommer skal vi gifte oss og vi har gledet oss til å sende " + dere + " denne invitasjonen!";
  const kode = "Kode til invitasjonen: ";
  const kodeSlutt = " (" + INVITASJON.kodeForklaring + ").";
  const frist = "Svar på invitasjonen ønskes innen ";
  const tekst2 = "Vi håper " + dereKan + " kan komme!";

  const html =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ECE4D9" style="background-color:#ECE4D9;border-collapse:collapse"><tr><td align="center" bgcolor="#ECE4D9" style="background-color:#ECE4D9;padding:40px 20px 48px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;border-collapse:collapse"><tr><td align="center" style="font-family:Georgia,\'Times New Roman\',serif;color:#5E4F51;font-size:18px;line-height:1.6;text-align:center">' +
    '<img src="cid:invitasjon" alt="Bryllupsinvitasjon – Sofie og Sigve 17.07.2027" width="520" style="display:block;width:100%;max-width:520px;height:auto;margin:0 auto 32px;border:0">' +
    '<p style="margin:0 0 6px">' + esc(hilsen) + '</p>' +
    '<p style="margin:0 0 28px">' + esc(tekst1) + '</p>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 18px;border-collapse:collapse"><tr><td bgcolor="#D6E3EA" style="background-color:#D6E3EA;border:1px solid #6E5C5E">' +
    '<a href="' + INVITASJON.lenke + '" style="display:inline-block;padding:14px 30px;font-family:Georgia,\'Times New Roman\',serif;font-size:18px;color:#5E4F51;text-decoration:none">Åpne invitasjonen</a></td></tr></table>' +
    '<p style="margin:0;font-size:16px;color:#8C7E7F">' + esc(kode) + '<b>' + esc(inn.kode) + '</b>' + esc(kodeSlutt) + '</p>' +
    '<p style="margin:0 0 36px;font-size:16px;color:#8C7E7F">' + esc(frist) + '<b>' + esc(INVITASJON.svarfrist) + '</b>.</p>' +
    '<p style="margin:0 0 14px">' + esc(tekst2) + '</p>' +
    '<img src="cid:navnetrekk" alt="Sofie ♡ Sigve" width="259" height="57" style="display:block;width:259px;height:auto;margin:0 auto;border:0">' +
    '</td></tr></table></td></tr></table>';

  const ren = [hilsen, "", tekst1, "", "Åpne invitasjonen: " + INVITASJON.lenke, "",
    kode + inn.kode + kodeSlutt, frist + INVITASJON.svarfrist + ".", "", tekst2, "", "Sofie ♡ Sigve"].join("\n");

  const melding = {
    to: til.join(","),
    subject: INVITASJON.emne,
    body: ren,
    htmlBody: html,
    inlineImages: bilder,
    name: "Sofie & Sigve"
  };
  if (kopi) melding.cc = kopi;
  if (inn.svarTil) melding.replyTo = inn.svarTil;
  MailApp.sendEmail(melding);
}
