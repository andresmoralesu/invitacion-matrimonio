/**
 * RSVP → Google Sheets (Apps Script ligado a la hoja)
 *
 * PASOS:
 * 1. Crea una hoja nueva en https://sheets.google.com
 * 2. Menú Extensiones > Apps Script. Borra el contenido por defecto y pega TODO este archivo.
 * 3. Guarda el proyecto (💾) y autoriza permisos la primera vez que ejecutes o despliegues.
 * 4. Implementar > Nueva implementación > selecciona tipo "Aplicación web"
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario  ← necesario para que invitados sin cuenta Google envíen
 * 5. Copia la URL de la aplicación web (debe terminar en /exec)
 * 6. Pégala en index.html en el atributo data-google-script-url del formulario #rsvp-form
 *
 * Opcional: cambia INVITE_URL a la URL pública de tu invitación (para el enlace "Volver").
 *    Debe ser la URL donde está publicado index.html (GitHub Pages, etc.), NO la URL /exec del script.
 */

var INVITE_URL = "https://ejemplo.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("RSVP");
    if (!sheet) {
      sheet = ss.insertSheet("RSVP");
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha y hora",
        "Asistencia",
        "Nombre y apellido",
        "Alergias / intolerancias",
        "Canción",
        "Mensaje"
      ]);
      sheet.setFrozenRows(1);
    }
    var p = e.parameter;
    var asistTxt = p.asistencia === "si" ? "Sí, allí estaré" : "No podrá asistir";
    sheet.appendRow([
      new Date(),
      asistTxt,
      String(p.nombre || "").trim(),
      String(p.alergias || ""),
      String(p.cancion || ""),
      String(p.mensaje || "")
    ]);
    lock.releaseLock();
    return HtmlService.createHtmlOutput(buildThanksHtml()).setTitle("Gracias");
  } catch (err) {
    try {
      lock.releaseLock();
    } catch (x) {}
    return HtmlService.createHtmlOutput(
      "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Error</title></head><body style='font-family:Georgia,serif;text-align:center;padding:2rem'>No se pudo guardar la respuesta. Intenta de nuevo más tarde.</body></html>"
    ).setTitle("Error");
  }
}

function buildThanksHtml() {
  var href = INVITE_URL && INVITE_URL !== "#" ? escapeAttr(INVITE_URL) : "#";
  var styles =
    "body{font-family:Georgia,'Times New Roman',serif;text-align:center;padding:2.5rem 1.25rem;background:#f0ece4;color:#2d2d2d;line-height:1.65;margin:0}" +
    "p{font-size:1.15rem;margin:0 0 1.25rem}a{color:#6b8c6e;font-weight:600}";
  return (
    "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Gracias</title><style>" +
    styles +
    "</style></head><body><p>¡Gracias! Hemos recibido tu respuesta.</p><p><a href='" +
    href +
    "' target='_top' rel='noopener noreferrer'>Volver a la invitación</a></p></body></html>"
  );
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function doGet() {
  return ContentService.createTextOutput(
    "Formulario RSVP: esta URL solo recibe envíos POST desde la invitación."
  );
}
