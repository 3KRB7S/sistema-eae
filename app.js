/* ==========================================================================
   LÓGICA DEL CLIENTE - SISTEMA DE EXPEDIENTE ADMINISTRATIVO ELECTRÓNICO (EAE)
   INDECOPI - COMISIÓN DE PROTECCIÓN AL CONSUMIDOR - SEDE REGIONAL PUNO
   Expediente N.° 14-2026/CPC-INDECOPI-PUN
   ========================================================================== */

// ==========================================================================
// PERSISTENCIA LOCAL DE ESTADO Y ARCHIVOS (INDEXEDDB)
// ==========================================================================
const dbHelper = {
  db: null,
  init: function(callback) {
    const request = indexedDB.open("IndecopiEaeDB", 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files");
      }
      if (!db.objectStoreNames.contains("state")) {
        db.createObjectStore("state");
      }
    };
    request.onsuccess = (e) => {
      this.db = e.target.result;
      if (callback) callback();
    };
    request.onerror = (e) => {
      console.warn("IndexedDB no disponible, usando fallback en memoria:", e);
      if (callback) callback();
    };
  },
  saveState: function(key, val) {
    if (!this.db) return;
    try {
      const tx = this.db.transaction("state", "readwrite");
      tx.objectStore("state").put(val, key);
    } catch (err) {
      console.warn("Error guardando estado:", err);
    }
  },
  getState: function(key, callback) {
    if (!this.db) {
      callback(null);
      return;
    }
    try {
      const tx = this.db.transaction("state", "readonly");
      const req = tx.objectStore("state").get(key);
      req.onsuccess = () => callback(req.result);
      req.onerror = () => callback(null);
    } catch (err) {
      callback(null);
    }
  },
  saveFile: function(key, fileBlob) {
    if (!this.db) return;
    try {
      const tx = this.db.transaction("files", "readwrite");
      tx.objectStore("files").put(fileBlob, key);
    } catch (err) {
      console.warn("Error guardando archivo:", err);
    }
  },
  getFile: function(key, callback) {
    if (!this.db) {
      callback(null);
      return;
    }
    try {
      const tx = this.db.transaction("files", "readonly");
      const req = tx.objectStore("files").get(key);
      req.onsuccess = () => callback(req.result);
      req.onerror = () => callback(null);
    } catch (err) {
      callback(null);
    }
  }
};

// ==========================================================================
// BASE DE DATOS DEL PROCEDIMIENTO ADMINISTRATIVO SANCIONADOR (PAS)
// 13 ACTOS PROCESALES EN SECUENCIA CRONOLÓGICA (FOJAS 001 - 288)
// ==========================================================================
const DOCUMENTOS_EXPEDIENTE = [
  {
    index: 1,
    fojas: "Fojas 001 - 026",
    date: "23/01/2026",
    tipo: "Escrito",
    type: "escrito",
    typeBadgeClass: "badge-type-denuncia",
    status: "Denuncia Ingresada y Calificada",
    statusClass: "status-admitida",
    title: "Denuncia administrativa por presunta infracción al deber de idoneidad interpuesta por D******* P**** C******* contra BANCO BBVA PERÚ S.A.",
    desc: "El denunciante interpone denuncia administrativa por presunta vulneración del deber de idoneidad y afectación a sus derechos como consumidor frente a la falta de respuesta favorable ante tres transferencias no autorizadas por un total de S/ 60,000.00 debitadas de su cuenta de ahorros a favor de la empresa Terasys Perú SAC. Solicita como medida correctiva reparadora la devolución total del importe sustraído, la aplicación de medidas sancionadoras (multa), y el pago de costas y costos del procedimiento.",
    sender: "D******* P**** C*******",
    recipient: "Comisión de Protección al Consumidor — Sede Regional Puno",
    pdfPrincipal: "documentos/1_denuncia/principal.pdf",
    pdfComplementario: {
      path: "documentos/1_denuncia/anexos.pdf",
      tipo: "anexos",
      label: "Ver Anexos"
    },
    cvd: "0948-2847-1940-5821",
    firmante: "D******* P**** C*******",
    cargo: "Administrado Denunciante [Ley N.° 29733]",
    fechaFirma: "23/01/2026 09:14:22 -05:00"
  },
  {
    index: 2,
    fojas: "Fojas 027 - 030",
    date: "02/02/2026",
    tipo: "Escrito",
    type: "escrito",
    typeBadgeClass: "badge-type-descargos",
    status: "Escrito Ingresado",
    statusClass: "status-reserva",
    title: "Rectifica error material",
    desc: "El denunciante solicita subsanar un error material incurrido en el petitorio (medida correctiva) y en la narración de los hechos de la denuncia inicial, precisando que las tres transferencias no autorizadas por la suma total de S/ 60,000.00 se realizaron los días 14, 15 y 16 de enero del año 2026, y no del 2025 como se consignó erróneamente.",
    sender: "D******* P**** C*******",
    recipient: "Comisión de Protección al Consumidor — Sede Regional Puno",
    pdfPrincipal: "documentos/2_escrito/principal.pdf",
    pdfComplementario: {
      path: "documentos/2_escrito/anexos.pdf",
      tipo: "anexos",
      label: "Ver Anexos"
    },
    cvd: "1482-3920-5819-2041",
    firmante: "D******* P**** C*******",
    cargo: "Administrado Denunciante [Ley N.° 29733]",
    fechaFirma: "02/02/2026 15:40:11 -05:00"
  },
  {
    index: 3,
    fojas: "Fojas 031 - 046",
    date: "24/02/2026",
    tipo: "Resolución",
    type: "resolucion",
    typeBadgeClass: "badge-type-resolucion",
    status: "Imputación Notificada Formalmente",
    statusClass: "status-imputacion",
    title: "Resolución N° 1 (Expediente N° 14-2026/CPC-INDECOPI-PUN)",
    desc: "La Secretaría Técnica resuelve admitir a trámite la denuncia interpuesta por Dionicio Ponce Checalla contra el Banco BBVA Perú S.A. por presunta infracción al deber de idoneidad (artículo 19° del Código de Protección y Defensa del Consumidor), al no haber adoptado presuntamente las medidas de seguridad necesarias permitiendo tres débitos no reconocidos por S/ 20,000.00 cada uno (totalizando S/ 60,000.00) en favor de Terasys Perú SAC. Asimismo, corre traslado de la denuncia y del escrito rectificatorio a la entidad bancaria otorgándole un plazo de 5 días hábiles para formular sus descargos y fija apercibimientos de ley, requiriéndole además exhibir los estados de cuenta y las grabaciones de video/audio del 13 de enero de 2026.",
    sender: "Órgano Instructor — CPC Sede Regional Puno",
    recipient: "BANCO BBVA PERÚ S.A. & D******* P**** C*******",
    pdfPrincipal: "documentos/3_resolucion/principal.pdf",
    pdfComplementario: {
      path: "documentos/3_resolucion/notificaciones.pdf",
      tipo: "notificaciones",
      label: "Diligencias de Notificación"
    },
    cvd: "3049-5829-1029-4726",
    firmante: "Waldir Crystiam Zanabria Ortega",
    cargo: "Órgano Instructor — CPC INDECOPI Sede Puno",
    fechaFirma: "24/02/2026 16:45:00 -05:00"
  },
  {
    index: 4,
    fojas: "Fojas 047 - 050",
    date: "13/03/2026",
    tipo: "Escrito",
    type: "escrito",
    typeBadgeClass: "badge-type-descargos",
    status: "Prórroga en Evaluación",
    statusClass: "status-tramite",
    title: "Se corrija resolución",
    desc: "El denunciante solicita la corrección y aclaración del numeral Décimo Segundo de la parte resolutiva de la Resolución N° 1, señalando que por error material se requirió la exhibición documental al Banco de Crédito del Perú S.A. cuando la entidad denunciada es el Banco BBVA Perú S.A., solicitando subsanar dicha mención y el texto de su acápite (i) a efectos de evitar objeciones formales durante el procedimiento.",
    sender: "D******* P**** C*******",
    recipient: "Comisión de Protección al Consumidor — Sede Regional Puno",
    pdfPrincipal: "documentos/4_escrito/principal.pdf",
    pdfComplementario: null,
    cvd: "4192-5810-2948-3819",
    firmante: "D******* P**** C*******",
    cargo: "Administrado Denunciante [Ley N.° 29733]",
    fechaFirma: "13/03/2026 11:20:30 -05:00"
  },
  {
    index: 5,
    fojas: "Fojas 051 - 61",
    date: "19/03/2026",
    tipo: "Escrito",
    type: "escrito",
    typeBadgeClass: "badge-type-descargos",
    status: "Descargos Presentados y Admitidos",
    statusClass: "status-reserva",
    title: "Solicitamos prórroga",
    desc: "El Banco denunciado se apersona mediante su apoderado, fija casilla electrónica procesal (N° 45457) y solicita formalmente una prórroga al amparo del artículo 147° del TUO de la Ley N° 27444 para presentar sus descargos y posición respecto a las imputaciones admitidas en la Resolución N° 1, señalando que requiere recabar y evaluar antecedentes en sus archivos que excederán el plazo inicial otorgado.",
    sender: "BANCO BBVA PERÚ S.A. (Apoderado: F******* D****** S******)",
    recipient: "Comisión de Protección al Consumidor — Sede Regional Puno",
    pdfPrincipal: "documentos/5_escrito/principal.pdf",
    pdfComplementario: {
      path: "documentos/5_escrito/anexos.pdf",
      tipo: "anexos",
      label: "Ver Anexos"
    },
    cvd: "7401-2948-5819-3019",
    firmante: "F******* D****** S******",
    cargo: "Apoderado Judicial — BANCO BBVA PERÚ S.A.",
    fechaFirma: "19/03/2026 17:10:45 -05:00"
  },
  {
    index: 6,
    fojas: "Fojas 062 - 072",
    date: "23/03/2026",
    tipo: "Resolución",
    type: "resolucion",
    typeBadgeClass: "badge-type-resolucion",
    status: "Traslado Notificado Electrónicamente",
    statusClass: "status-notificado",
    title: "Resolución N° 2 (Expediente N° 14-2026/CPC-INDECOPI-PUN)",
    desc: "La Secretaría Técnica resuelve tener por apersonado al Banco BBVA Perú S.A. mediante su apoderado Fernando Delgado Sánchez; agrega los escritos del 13 y 19 de marzo de 2026 corriendo traslado a las partes; rectifica el error material advertido en el numeral Décimo Segundo de la Resolución N° 1 precisando que el requerimiento documental se formula contra el Banco BBVA Perú S.A. y no contra el Banco de Crédito del Perú; y concede a la entidad bancaria una prórroga de diez (10) días hábiles para presentar sus descargos.",
    sender: "Órgano Instructor — CPC Sede Regional Puno",
    recipient: "BANCO BBVA PERÚ S.A. & D******* P**** C*******",
    pdfPrincipal: "documentos/6_resolucion/principal.pdf",
    pdfComplementario: {
      path: "documentos/6_resolucion/notificaciones.pdf",
      tipo: "notificaciones",
      label: "Diligencias de Notificación"
    },
    cvd: "6194-8201-4928-1029",
    firmante: "Waldir Crystiam Zanabria Ortega",
    cargo: "Órgano Instructor — CPC INDECOPI Sede Puno",
    fechaFirma: "18/03/2026 14:15:20 -05:00"
  },
  {
    index: 7,
    fojas: "Fojas 073 - 213",
    date: "16/04/2026",
    tipo: "Escrito",
    type: "escrito",
    typeBadgeClass: "badge-type-denuncia",
    status: "Absolución Agregada al Expediente",
    statusClass: "status-admitida",
    title: "Descargos",
    desc: "El Banco BBVA Perú formula sus descargos frente a la imputación de presunta infracción al deber de idoneidad, sosteniendo que las tres operaciones por S/ 20,000.00 a favor de Terasys Perú SAC fueron autorizadas válidamente mediante mecanismos de autenticación reforzada bajo la Resolución SBS N° 504-2021 (contraseña web/móvil y Token Digital OTP-OCRA). Asimismo, acredita el envío oportuno de las constancias por correo electrónico, señala que los montos se encuentran dentro del patrón habitual de movimientos del denunciante y solicita la reserva y confidencialidad indefinida respecto a los informes técnicos de seguridad aportados como medios de prueba.",
    sender: "BANCO BBVA PERÚ S.A. (Apoderado: F******* D****** S******)",
    recipient: "Comisión de Protección al Consumidor — Sede Regional Puno",
    pdfPrincipal: "documentos/7_escrito/principal.pdf",
    pdfComplementario: {
      path: "documentos/7_escrito/anexos.pdf",
      tipo: "anexos",
      label: "Ver Anexos"
    },
    cvd: "7284-1029-4820-9182",
    firmante: "F******* D****** S******",
    cargo: "Apoderado Judicial — BANCO BBVA PERÚ S.A.",
    fechaFirma: "16/04/2026 10:05:18 -05:00"
  },
  {
    index: 8,
    fojas: "Fojas 214 - 224",
    date: "21/05/2026",
    tipo: "Resolución",
    type: "resolucion",
    typeBadgeClass: "badge-type-resolucion",
    status: "Citación a Audiencia Notificada",
    statusClass: "status-imputacion",
    title: "Resolución de Trámite N° 004-2026/CPC-INDECOPI-PUN",
    desc: "La Comisión de la Oficina Regional del Indecopi Puno tiene por presentados los descargos formulados por el Banco BBVA Perú Sociedad Anónima y declara confidencial y reservada la información técnica contenida en los documentos denominados \"Modelo de Seguridad\" (anexo D) y \"Línea Base de Controles de Seguridad\" (anexo G), así como las secciones del escrito donde se reproducen o citan dichos informes. En consecuencia, ordena correr traslado a Dionicio Ponce Checalla de los descargos y anexos resguardando estrictamente la información declarada confidencial.",
    sender: "Comisión de Protección al Consumidor — Sede Regional Puno",
    recipient: "BANCO BBVA PERÚ S.A. & D******* P**** C*******",
    pdfPrincipal: "documentos/8_resolucion/principal.pdf",
    pdfComplementario: {
      path: "documentos/8_resolucion/notificaciones.pdf",
      tipo: "notificaciones",
      label: "Diligencias de Notificación"
    },
    cvd: "8291-4920-1849-5920",
    firmante: "William Paz Casapía Guisberth",
    cargo: "Presidente de Comisión — INDECOPI Sede Puno",
    fechaFirma: "21/05/2026 16:30:00 -05:00"
  },
  {
    index: 9,
    fojas: "Fojas 225 - 236",
    date: "07/07/2026",
    tipo: "Informe",
    type: "informe",
    typeBadgeClass: "badge-type-informe",
    status: "Audiencia Oral Concluida",
    statusClass: "status-audiencia",
    title: "Informe Final de Instrucción N° 044-2026/ST-CPC-INDECOPI-PUN",
    desc: "La Secretaría Técnica concluye la etapa de instrucción concluyendo que el Banco BBVA Perú S.A. incurrió en infracción al deber de idoneidad (artículo 19° del Código), puesto que no cumplió con acreditar el segundo requisito de autenticación reforzada previsto en el literal b) del artículo 19° del Reglamento de Ciberseguridad (generación de un código criptográfico independiente de los factores de autenticación). En consecuencia, recomienda a la Comisión declarar fundada la denuncia y propone sancionar a la entidad financiera con una multa de 22.97 UIT.",
    sender: "Secretaría Técnica — Sede Regional Puno",
    recipient: "Comisión de Protección al Consumidor",
    pdfPrincipal: "documentos/9_resolucion/principal.pdf",
    pdfComplementario: null,
    cvd: "9102-4829-1940-2849",
    firmante: "Waldir Crystiam Zanabria Ortega",
    cargo: "Secretario Técnico / Instructor — CPC Sede Puno",
    fechaFirma: "07/07/2026 12:45:00 -05:00"
  },
  {
    index: 10,
    fojas: "Fojas 237 - 246",
    date: "21/07/2026",
    tipo: "Resolución",
    type: "resolucion",
    typeBadgeClass: "badge-type-resolucion",
    status: "Requerimiento Técnico Notificado",
    statusClass: "status-imputacion",
    title: "Resolución N° 3 (Expediente N° 14-2026/CPC-INDECOPI-PUN)",
    desc: "La Secretaría Técnica resuelve agregar formalmente al expediente el Informe Final de Instrucción N° 044-2026/ST-CPC-INDECOPI-PUN del 7 de julio de 2026, ponerlo en conocimiento de las partes procesales y otorgarles un plazo improrrogable de cinco (5) días hábiles para que formulen sus respectivos descargos u observaciones finales.",
    sender: "Secretaría Técnica — Sede Regional Puno",
    recipient: "BANCO BBVA PERÚ S.A. & D******* P**** C*******",
    pdfPrincipal: "documentos/10_resolucion/principal.pdf",
    pdfComplementario: {
      path: "documentos/10_resolucion/notificaciones.pdf",
      tipo: "notificaciones",
      label: "Diligencias de Notificación"
    },
    cvd: "1029-4820-9184-7291",
    firmante: "Waldir Crystiam Zanabria Ortega",
    cargo: "Secretario Técnico / Instructor — CPC Sede Puno",
    fechaFirma: "21/07/2026 15:50:12 -05:00"
  },
  {
    index: 11,
    fojas: "Fojas 247 - 254",
    date: "18/08/2026",
    tipo: "Escrito",
    type: "escrito",
    typeBadgeClass: "badge-type-descargos",
    status: "Información Pericial Recibida",
    statusClass: "status-reserva",
    title: "Presenta informe (Absolución/Observaciones al Informe Final de Instrucción)",
    desc: "El denunciante expresa conformidad con el sentido del Informe Final de Instrucción N° 044-2026/ST-CPC-INDECOPI-PUN en el extremo que propone sancionar a la denunciada con 22.97 UIT por infracción al deber de idoneidad; sin embargo, advierte que no hubo pronunciamiento expreso sobre la medida correctiva reparadora (devolución de S/ 60,000.00) ni sobre costas y costos. Asimismo, solicita considerar la afectación a intereses difusos como circunstancia agravante para la graduación de la sanción y reitera la responsabilidad de la entidad financiera bajo la Resolución SBS N° 2286-2024 al no haber acreditado la ruptura del nexo causal.",
    sender: "D******* P**** C*******",
    recipient: "Comisión de Protección al Consumidor — Sede Regional Puno",
    pdfPrincipal: "documentos/11_escrito/principal.pdf",
    pdfComplementario: null,
    cvd: "1149-2849-5829-3910",
    firmante: "D******* P**** C*******",
    cargo: "Administrado Denunciante [Ley N.° 29733]",
    fechaFirma: "18/08/2026 18:22:40 -05:00"
  },
  {
    index: 12,
    fojas: "Fojas 255 - 264",
    date: "18/08/2026",
    tipo: "Escrito",
    type: "escrito",
    typeBadgeClass: "badge-type-escrito",
    status: "Instrucción Concluida — Pasa a Decisión",
    statusClass: "status-informe",
    title: "Descargos al IFI N° 044-2026/ST-CPC-INDECOPI-PUN",
    desc: "El Banco BBVA Perú presenta descargos contra el Informe Final de Instrucción N° 044-2026/ST-CPC-INDECOPI-PUN, refutando el criterio de la Secretaría Técnica al precisar que el Token Digital (semilla que el usuario posee) y el código dinámico OTP (código criptográfico generado por única vez) son componentes distintos que cumplen de forma concurrente con los literales a) y b) del artículo 19° del Reglamento de Ciberseguridad. Asimismo, alega vulneración del deber de debida motivación y de los principios de razonabilidad, proporcionalidad y presunción de licitud respecto a la graduación de la multa propuesta de 22.97 UIT, solicitando declarar infundada la denuncia o dejar sin efecto la sanción.",
    sender: "BANCO BBVA PERÚ S.A. (Apoderado: H***** M**** N**** V***)",
    recipient: "Comisión de Protección al Consumidor — Sede Regional Puno",
    pdfPrincipal: "documentos/12_escrito/principal.pdf",
    pdfComplementario: null,
    cvd: "1284-9102-3849-4829",
    firmante: "H***** M**** N**** V***",
    cargo: "Apoderado Judicial — BANCO BBVA PERÚ S.A.",
    fechaFirma: "18/08/2026 11:30:00 -05:00"
  },
  {
    index: 13,
    fojas: "Fojas 265 - 288",
    date: "20/08/2026",
    tipo: "Resolución",
    type: "resolucion-final",
    typeBadgeClass: "badge-type-final",
    status: "Sanción Firme en 1ra Instancia",
    statusClass: "status-sancion",
    title: "Resolución Final N° 087-2026/CPC-INDECOPI-PUN",
    desc: "La Comisión de la Oficina Regional del Indecopi Puno resuelve declarar fundada la denuncia contra el Banco BBVA Perú S.A. por infracción al deber de idoneidad (artículo 19° del Código), al acreditarse que no implementó adecuadamente las medidas de seguridad al permitir tres operaciones no reconocidas por un total de S/ 60,000.00 debitadas de la cuenta de ahorros del denunciante. Sanciona a la entidad financiera con una multa de 22.97 UIT (equivalente a S/ 126,335.00), le ordena como medida correctiva reparadora la devolución íntegra de los S/ 60,000.00 en un plazo de 15 días hábiles (bajo apercibimiento de multa coercitiva), dispone el reembolso de costas por S/ 36.00 y su eventual inscripción en el Registro de Infracciones y Sanciones.",
    sender: "Presidente de Comisión: William Paz Casapía Guisberth",
    recipient: "BANCO BBVA PERÚ S.A. & D******* P**** C*******",
    pdfPrincipal: "documentos/13_resolucion/principal.pdf",
    pdfComplementario: {
      path: "documentos/13_resolucion/notificaciones.pdf",
      tipo: "notificaciones",
      label: "Diligencias de Notificación"
    },
    cvd: "9940-5829-1049-7721",
    firmante: "William Paz Casapía Guisberth",
    cargo: "Presidente de la Comisión de Protección al Consumidor — Sede Regional Puno",
    fechaFirma: "20/08/2026 12:10:00 -05:00"
  }
];

// ==========================================================================
// BANDEJA DE NOTIFICACIONES EN CASILLA ELECTRÓNICA CUE (INDECOPI)
// ==========================================================================
const NOTIFICACIONES_CASILLA = [
  {
    id: "CUE-2026-004128",
    resolutionIndex: 3,
    resolutionTitle: "RESOLUCIÓN N.° 01: INICIO DEL PAS E IMPUTACIÓN DE CARGOS",
    recipient: "denunciado",
    recipientName: "BANCO BBVA PERÚ SOCIEDAD ANÓNIMA",
    casillaNumber: "BBVA-LIMA-00412",
    sendDate: "24/02/2026",
    receivedDate: "24/02/2026",
    status: "Depositado en Casilla CUE",
    fojas: "Fojas 051 - 062",
    pdfPath: "documentos/3_resolucion/notificaciones.pdf"
  },
  {
    id: "CUE-2026-004129",
    resolutionIndex: 3,
    resolutionTitle: "RESOLUCIÓN N.° 01: INICIO DEL PAS E IMPUTACIÓN DE CARGOS",
    recipient: "denunciante",
    recipientName: "D******* P**** C*******",
    casillaNumber: "CASILLA PERSONAL 01******",
    sendDate: "24/02/2026",
    receivedDate: "24/02/2026",
    status: "Leído por el Administrado",
    fojas: "Fojas 051 - 062",
    pdfPath: "documentos/3_resolucion/notificaciones.pdf"
  },
  {
    id: "CUE-2026-005910",
    resolutionIndex: 13,
    resolutionTitle: "RESOLUCIÓN FINAL N.° 087-2026/CPC-INDECOPI-PUN (SANCIÓN 22.97 UIT)",
    recipient: "denunciado",
    recipientName: "BANCO BBVA PERÚ SOCIEDAD ANÓNIMA",
    casillaNumber: "BBVA-LIMA-00412",
    sendDate: "20/08/2026",
    receivedDate: "20/08/2026",
    status: "Depositado en Casilla CUE",
    fojas: "Fojas 196 - 288",
    pdfPath: "documentos/13_resolucion/notificaciones.pdf"
  },
  {
    id: "CUE-2026-005911",
    resolutionIndex: 13,
    resolutionTitle: "RESOLUCIÓN FINAL N.° 087-2026/CPC-INDECOPI-PUN (SANCIÓN Y MEDIDAS)",
    recipient: "denunciante",
    recipientName: "D******* P**** C*******",
    casillaNumber: "CASILLA PERSONAL 01******",
    sendDate: "20/08/2026",
    receivedDate: "20/08/2026",
    status: "Leído por el Administrado",
    fojas: "Fojas 196 - 288",
    pdfPath: "documentos/13_resolucion/notificaciones.pdf"
  }
];

// ==========================================================================
// SERVICIOS DE INTEROPERABILIDAD PIDE (RENIEC Y SUNAT)
// ==========================================================================
const MOCK_PIDE_RENIEC = {
  "01845814": {
    dni: "01******",
    apellidos: "P**** C*******",
    nombres: "D*******",
    fechaNac: "**/**/1978 [DATO RESERVADO - LEY 29733]",
    sexo: "MASCULINO",
    estadoCivil: "CASADO",
    direccion: "Jr. Tacna N.° ***, Barrio Bellavista, Puno [DATO RESERVADO - LEY 29733]",
    ubigeo: "210101 (PUNO - PUNO - PUNO)",
    fechaEmision: "12/03/2021",
    foto: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=60",
    signature: "D. P**** Ch."
  },
  "02845814": {
    dni: "01******",
    apellidos: "P**** C*******",
    nombres: "D*******",
    fechaNac: "**/**/1978 [DATO RESERVADO - LEY 29733]",
    sexo: "MASCULINO",
    estadoCivil: "CASADO",
    direccion: "Jr. Tacna N.° ***, Barrio Bellavista, Puno [DATO RESERVADO - LEY 29733]",
    ubigeo: "210101 (PUNO - PUNO - PUNO)",
    fechaEmision: "12/03/2021",
    foto: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=60",
    signature: "D. P**** Ch."
  },
  "41859620": {
    dni: "41***620",
    apellidos: "ZANABRIA ORTEGA",
    nombres: "WALDIR CRYSTIAM",
    fechaNac: "**/**/1982 [DATO RESERVADO - LEY 29733]",
    sexo: "MASCULINO",
    estadoCivil: "CASADO",
    direccion: "Av. Floral N.° ***, Puno [DATO RESERVADO - LEY 29733]",
    ubigeo: "210101 (PUNO - PUNO - PUNO)",
    fechaEmision: "05/08/2022",
    foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
    signature: "Abg. W. Zanabria O."
  }
};

// ==========================================================================
// VARIABLES DE ESTADO Y SEGURIDAD RBAC
// ==========================================================================
// Roles posibles: 'CIUDADANO' (Solo Lectura) | 'INDECOPI_STAFF' (Gestión Total)
let currentUserRole = 'CIUDADANO';
let FILES_CARGADOS = {};
let FILES_NOTIFICACIONES_CARGADOS = {};
let currentNotifFilter = 'all';
let captchaValido = "";
let documentoActualEnVisor = null;
let indexDocDestinoSubida = null;
let activeAccessMethod = 'captcha';

// ==========================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================================================
function iniciarRelojOficial() {
  const actualizarReloj = () => {
    const ahora = new Date();
    const dateDisplay = document.getElementById("currentDateDisplay");
    const timeDisplay = document.getElementById("serverTimeDisplay");

    if (dateDisplay) {
      const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
      dateDisplay.textContent = ahora.toLocaleDateString('es-PE', opciones);
    }

    if (timeDisplay) {
      const hh = String(ahora.getHours()).padStart(2, '0');
      const mm = String(ahora.getMinutes()).padStart(2, '0');
      const ss = String(ahora.getSeconds()).padStart(2, '0');
      timeDisplay.textContent = `${hh}:${mm}:${ss} -05:00 (Sello de Tiempo INDECOPI)`;
    }
  };

  actualizarReloj();
  setInterval(actualizarReloj, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  // Iniciar reloj oficial dinámico continuo (segundos en tiempo real)
  iniciarRelojOficial();

  // Comprobar modal de aviso legal (Ley 29733)
  initLegalNoticeModal();

  // Generar código captcha
  generarCaptcha();

  // Listeners de Acceso Oficial por CUP (INDECOPI)
  document.getElementById("btnCupBuscar")?.addEventListener("click", buscarPorCup);
  document.getElementById("btnCupLimpiar")?.addEventListener("click", limpiarFormularioCup);
  document.getElementById("cupNumberInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") buscarPorCup();
  });

  // Listeners de Acceso (Fallback / Legacy)
  document.getElementById("refreshCaptchaBtn")?.addEventListener("click", generarCaptcha);
  document.getElementById("btnAccessSubmit")?.addEventListener("click", validarAcceso);
  
  document.getElementById("captchaInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validarAcceso();
  });

  document.getElementById("systemUsername")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validarAcceso();
  });

  document.getElementById("systemPassword")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validarAcceso();
  });

  // Búsqueda de Expediente
  document.getElementById("btnConsultarExpediente")?.addEventListener("click", realizarBusquedaExpediente);
  document.getElementById("expedienteSearchInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") realizarBusquedaExpediente();
  });

  document.getElementById("btnLogout")?.addEventListener("click", logout);

  // Visor de Documentos
  document.getElementById("btnModalClose")?.addEventListener("click", cerrarModalDocumento);
  document.getElementById("btnModalPrint")?.addEventListener("click", imprimirDocumentoActual);
  document.getElementById("btnModalDownload")?.addEventListener("click", descargarDocumentoActual);
  document.getElementById("btnToggleViewerSidebar")?.addEventListener("click", toggleViewerSidebar);
  document.getElementById("btnCopyCvd")?.addEventListener("click", copiarCvdVisor);
  document.getElementById("docViewerModal")?.addEventListener("click", (e) => {
    if (e.target.id === "docViewerModal") cerrarModalDocumento();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const m = document.getElementById("docViewerModal");
      if (m && !m.classList.contains("hidden")) cerrarModalDocumento();
    }
  });

  // PIDE (RENIEC / SUNAT)
  document.getElementById("btnReniecSearch")?.addEventListener("click", buscarEnReniec);
  document.getElementById("reniecDniSearch")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") buscarEnReniec();
  });
  document.getElementById("btnSunatSearch")?.addEventListener("click", buscarEnSunat);

  // Asistente Virtual ChatBot IA Indecopi
  document.getElementById("sanibotTriggerBtn")?.addEventListener("click", toggleSanibotChat);
  document.getElementById("btnCloseChat")?.addEventListener("click", toggleSanibotChat);
  document.getElementById("btnChatSend")?.addEventListener("click", enviarMensajeChat);
  document.getElementById("chatInputText")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensajeChat();
  });

  // Listeners de carga de archivos (solo autorizados para INDECOPI)
  document.getElementById("globalTimelineFileInput")?.addEventListener("change", procesarSubidaArchivo);
  document.getElementById("globalNotifFileInput")?.addEventListener("change", procesarSubidaArchivoNotif);

  // --------------------------------------------------------------------------
  // TAREA 2: LIMPIEZA DE CACHÉ LOCAL (LOCALSTORAGE / INDEXEDDB)
  // Fuerza la actualización inmediata para que prevalezca estrictamente el
  // arreglo DOCUMENTOS_EXPEDIENTE modificado en el código fuente.
  // --------------------------------------------------------------------------
  const CACHE_VERSION_KEY = "INDECOPI_EXP_14_2026_V4";
  try {
    const versionGuardada = localStorage.getItem("EXPEDIENTE_CACHE_VERSION");
    if (versionGuardada !== CACHE_VERSION_KEY) {
      localStorage.removeItem("DOCUMENTOS_EXPEDIENTE");
      localStorage.removeItem("DOCUMENTOS_EXPEDIENTE_CACHE");
      localStorage.setItem("EXPEDIENTE_CACHE_VERSION", CACHE_VERSION_KEY);
    }
    // Sincronizar versión actual del código fuente en localStorage
    localStorage.setItem("DOCUMENTOS_EXPEDIENTE", JSON.stringify(DOCUMENTOS_EXPEDIENTE));
  } catch (errCache) {
    console.warn("Aviso al sincronizar localStorage:", errCache);
  }

  // Inicializar IndexedDB y sincronizar datos fidedignos
  dbHelper.init(() => {
    dbHelper.getState("DOCUMENTOS_EXPEDIENTE", (savedDocs) => {
      // Preservar piezas procesales adicionales (> 13) incorporadas manualmente en sesión
      if (savedDocs && Array.isArray(savedDocs) && savedDocs.length > 13) {
        const extraDocs = savedDocs.slice(13);
        extraDocs.forEach((extra) => {
          if (!DOCUMENTOS_EXPEDIENTE.some(d => d.index === extra.index)) {
            DOCUMENTOS_EXPEDIENTE.push(extra);
          }
        });
      }
      
      // Forzar que prevalezca el arreglo actual del código fuente en la persistencia
      dbHelper.saveState("DOCUMENTOS_EXPEDIENTE", DOCUMENTOS_EXPEDIENTE);

      // Cargar archivos subidos por el personal si existen
      dbHelper.getState("FILES_CARGADOS", (savedFiles) => {
        if (savedFiles) {
          FILES_CARGADOS = savedFiles;
        }
        renderTimeline();
      });

      dbHelper.getState("NOTIFICACIONES_CASILLA", (savedNotifs) => {
        const notifRefresh = !savedNotifs || savedNotifs.length !== 4 || 
          !savedNotifs[2] || savedNotifs[2].sendDate !== "20/08/2026";

        if (!notifRefresh) {
          NOTIFICACIONES_CASILLA.length = 0;
          NOTIFICACIONES_CASILLA.push(...savedNotifs);
        } else {
          dbHelper.saveState("NOTIFICACIONES_CASILLA", NOTIFICACIONES_CASILLA);
        }
        
        renderNotifications();
      });
    });
  });
});

// ==========================================================================
// AVISO INICIAL: SIMULADOR ACADÉMICO (ONLOAD BLOCKING)
// ==========================================================================
function initLegalNoticeModal() {
  const modal = document.getElementById("legalNoticeModal");
  const btnAccept = document.getElementById("btnAcceptLegalNotice");

  if (!modal || !btnAccept) return;

  // Verificar si ya fue aceptado en la sesión
  const accepted = sessionStorage.getItem("INDECOPI_LEGAL_TERMS_ACCEPTED");
  if (accepted === "true") {
    modal.classList.add("hidden");
    return;
  }

  // Bloquear el scroll de la página hasta que acepte
  document.body.style.overflow = "hidden";
  modal.classList.remove("hidden");

  btnAccept.addEventListener("click", () => {
    sessionStorage.setItem("INDECOPI_LEGAL_TERMS_ACCEPTED", "true");
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  });
}

// ==========================================================================
// TAREA 3: CORRECCIÓN DE SEGURIDAD Y PERMISOS (RBAC)
// ==========================================================================
function switchAccessMethod(method) {
  activeAccessMethod = method;
  const captchaTab = document.getElementById("btnAccessTabCaptcha");
  const passwordTab = document.getElementById("btnAccessTabPassword");
  const captchaBody = document.getElementById("captchaFormBody");
  const passwordBody = document.getElementById("passwordFormBody");

  if (method === 'captcha') {
    captchaTab.classList.add("active");
    passwordTab.classList.remove("active");
    captchaBody.classList.remove("hidden");
    passwordBody.classList.add("hidden");
    currentUserRole = 'CIUDADANO';
  } else {
    captchaTab.classList.remove("active");
    passwordTab.classList.add("active");
    captchaBody.classList.add("hidden");
    passwordBody.classList.remove("hidden");
    currentUserRole = 'INDECOPI_STAFF';
  }
  document.getElementById("accessErrorMessage")?.classList.add("hidden");
}

function generarCaptcha() {
  const canvas = document.getElementById("captchaCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 4; i++) {
    randomCode += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  captchaValido = randomCode;

  // Líneas de interferencia de seguridad
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(158, 0, 89, 0.25)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Dibujar caracteres en guinda institucional
  ctx.font = "bold 26px 'Outfit', Inter, monospace";
  for (let i = 0; i < captchaValido.length; i++) {
    const char = captchaValido[i];
    ctx.fillStyle = "#9E0059";
    ctx.save();
    const x = 25 + i * 36;
    const y = 35 + (Math.random() * 6 - 3);
    const angle = (Math.random() * 20 - 10) * Math.PI / 180;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(char, -8, 0);
    ctx.restore();
  }

  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(128, 0, 71, 0.2)`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function validarAcceso() {
  const errMsg = document.getElementById("accessErrorMessage");
  if (errMsg) errMsg.classList.add("hidden");

  if (activeAccessMethod === 'captcha') {
    const inputVal = document.getElementById("captchaInput") ? document.getElementById("captchaInput").value.trim().toUpperCase() : "";
    if (inputVal === captchaValido) {
      currentUserRole = 'CIUDADANO';
      ingresarAlPortal();
    } else {
      if (errMsg) {
        errMsg.classList.remove("hidden");
        errMsg.textContent = "Código de validación incorrecto. Verifique los caracteres e intente nuevamente.";
      }
      generarCaptcha();
    }
  } else {
    const userVal = document.getElementById("systemUsername") ? document.getElementById("systemUsername").value.trim() : "";
    const passVal = document.getElementById("systemPassword") ? document.getElementById("systemPassword").value.trim() : "";

    // En la pestaña "Acceso a Funcionarios", permitir el ingreso con usuario y contraseña institucional (o cualquier texto de prueba) activando el rol con permisos de gestión
    if (passVal.length > 0 || userVal.length > 0) {
      currentUserRole = 'INDECOPI_STAFF';
      ingresarAlPortal();
    } else {
      if (errMsg) {
        errMsg.classList.remove("hidden");
        errMsg.textContent = "Ingrese sus credenciales de funcionario institucional.";
      }
    }
  }
}

function ingresarAlPortal() {
  const accessScreen = document.getElementById("accessScreen");
  if (accessScreen) accessScreen.classList.add("hidden");
  realizarBusquedaExpediente();
}

// ==========================================================================
// VALIDACIÓN Y CONSULTA POR NÚMERO DE CUP (PORTAL OFICIAL INDECOPI)
// ==========================================================================
function buscarPorCup() {
  const cupInput = document.getElementById("cupNumberInput");
  const recaptchaCheck = document.getElementById("recaptchaCheck");
  const errorMsg = document.getElementById("cupErrorMessage");

  if (!cupInput) return;

  const cupVal = cupInput.value.trim();

  // Ocultar mensaje previo
  if (errorMsg) {
    errorMsg.classList.add("hidden");
    errorMsg.textContent = "";
  }

  // Clave de acceso única válida: "002837" o "2026-002837"
  const esCodigoValido = (cupVal === "002837" || cupVal === "2026-002837");

  // Si no coincide con el CUP válido, mostrar el aviso oficial
  if (!esCodigoValido) {
    if (errorMsg) {
      errorMsg.textContent = "No se encontraron expedientes asociados al CUP ingresado.";
      errorMsg.classList.remove("hidden");
    }
    return;
  }

  // Validar casilla "No soy un robot"
  if (!recaptchaCheck || !recaptchaCheck.checked) {
    if (errorMsg) {
      errorMsg.textContent = "Por favor, marque la casilla de verificación 'No soy un robot'.";
      errorMsg.classList.remove("hidden");
    }
    return;
  }

  // Acceso concedido: rol Administrado/Ciudadano (Principio de Publicidad)
  currentUserRole = 'CIUDADANO';
  const accessScreen = document.getElementById("accessScreen");
  if (accessScreen) accessScreen.classList.add("hidden");

  // Abre de inmediato la vista del expediente
  realizarBusquedaExpediente();
}

function limpiarFormularioCup() {
  const cupInput = document.getElementById("cupNumberInput");
  const recaptchaCheck = document.getElementById("recaptchaCheck");
  const errorMsg = document.getElementById("cupErrorMessage");

  if (cupInput) cupInput.value = "";
  if (recaptchaCheck) recaptchaCheck.checked = false;
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }
}

function realizarBusquedaExpediente() {
  const searchInputEl = document.getElementById("expedienteSearchInput");
  const searchInput = searchInputEl ? searchInputEl.value.trim() : "";
  const numExp = searchInput || "14-2026/CPC-INDECOPI-PUN";

  const caseSidebar = document.getElementById("caseNumberSidebar");
  if (caseSidebar) caseSidebar.textContent = numExp;

  const cintilloTitle = document.getElementById("cintilloExpedienteTitle");
  if (cintilloTitle) cintilloTitle.textContent = `EXPEDIENTE ADMINISTRATIVO ELECTRÓNICO N.° ${numExp}`;

  document.getElementById("searchScreen")?.classList.add("hidden");
  document.getElementById("appContainer")?.classList.remove("hidden");

  // Aplicar RBAC en la UI según el rol verificado
  aplicarPermisosRbac();
  renderTimeline();
  renderNotifications();
}

function aplicarPermisosRbac() {
  const staffElements = document.querySelectorAll(".rbac-staff-only");

  if (currentUserRole === 'CIUDADANO') {
    // OCULTAR COMPLETAMENTE LOS BOTONES DE SUBIDA PARA CIUDADANOS (SOLO LECTURA)
    staffElements.forEach(el => {
      el.classList.add("hidden");
      el.style.display = "none";
    });
  } else {
    // MOSTRAR BOTONES DE SUBIDA PARA EL PERSONAL INDECOPI (GESTIÓN TOTAL)
    staffElements.forEach(el => {
      el.classList.remove("hidden");
      el.style.display = "inline-flex";
    });
  }
}

function logout() {
  document.getElementById("appContainer")?.classList.add("hidden");
  document.getElementById("searchScreen")?.classList.add("hidden");
  document.getElementById("accessScreen")?.classList.remove("hidden");
  limpiarFormularioCup();
  currentUserRole = 'CIUDADANO';
}

// ==========================================================================
// TAREA 1: SINCRONIZACIÓN DINÁMICA DE CATEGORÍAS, BADGES Y BOTONES
// ==========================================================================
function determinarCategoriaActo(doc) {
  if (!doc) {
    return {
      categoria: "ACTO",
      badgeClass: "badge-type-escrito",
      btnPrincipalText: "Visualizar Documento",
      defaultSecondaryLabel: "Ver Anexos",
      isResolucion: false,
      isEscrito: false,
      isInforme: false
    };
  }

  const tipoStr = (doc.tipo || "").trim();
  const tipoLower = tipoStr.toLowerCase();
  const tituloLower = (doc.title || "").toLowerCase();

  // 1. Escrito: tipo es "Escrito" o título contiene "Denuncia", "Escrito", "Descargos", "Rectifica", "Observaciones"
  // Escrito: Si tipo es "Escrito" o título contiene "Denuncia", "Escrito", "Descargos", "Rectifica", "Observaciones"
  // (Nota: Si el título contiene "Observaciones" o "Descargos", es un escrito aunque cite "informe" o "ifi")
  const coincideEscrito = tipoLower === "escrito" ||
    /denuncia|escrito|descargo|rectifica|observaci/i.test(tituloLower);

  // Informe: Si tipo es "Informe" o título contiene "Informe" o "IFI" (salvo que sea un escrito de observaciones/descargos)
  const coincideInforme = (tipoLower === "informe" || /\binforme\b|\bifi\b/i.test(tituloLower)) &&
    !/observaci|descargo/i.test(tituloLower) && tipoLower !== "escrito";

  // Resolución: Si tipo es "Resolución" o título contiene "Resolución" (salvo que sea un escrito que solicita corregir resolución)
  const coincideResolucion = (tipoLower === "resolución" || tipoLower === "resolucion" || /resoluci[oó]n/i.test(tituloLower)) &&
    !coincideEscrito && !coincideInforme;

  if (coincideEscrito) {
    const isDenuncia = /denuncia/i.test(tituloLower);
    return {
      categoria: "ESCRITO",
      badgeClass: isDenuncia ? "badge-type-denuncia" : "badge-type-escrito",
      btnPrincipalText: "Visualizar Escrito",
      defaultSecondaryLabel: "Ver Anexos",
      isResolucion: false,
      isEscrito: true,
      isInforme: false
    };
  }

  if (coincideInforme) {
    return {
      categoria: "INFORME",
      badgeClass: "badge-type-informe",
      btnPrincipalText: "Visualizar Informe",
      defaultSecondaryLabel: "",
      isResolucion: false,
      isEscrito: false,
      isInforme: true
    };
  }

  if (coincideResolucion) {
    return {
      categoria: "RESOLUCIÓN",
      badgeClass: "badge-type-resolucion",
      btnPrincipalText: "Visualizar Resolución",
      defaultSecondaryLabel: "Diligencias de Notificación",
      isResolucion: true,
      isEscrito: false,
      isInforme: false
    };
  }

  // Fallback seguro
  return {
    categoria: tipoStr.toUpperCase() || "ACTO",
    badgeClass: "badge-type-escrito",
    btnPrincipalText: `Visualizar ${tipoStr || "Documento"}`,
    defaultSecondaryLabel: "Ver Anexos",
    isResolucion: false,
    isEscrito: false,
    isInforme: false
  };
}

// ==========================================================================
// TAREA 3: SECUENCIA CRONOLÓGICA DE ACTOS DEL PAS (RENDERIZADO FIDEDIGNO)
// ==========================================================================
function renderTimeline() {
  const container = document.getElementById("timelineContainer");
  if (!container) return;

  container.innerHTML = "";

  DOCUMENTOS_EXPEDIENTE.forEach((doc) => {
    const card = document.createElement("div");
    card.className = "pas-act-card";
    if (doc.type === "resolucion-final" || doc.index === 13) {
      card.classList.add("final-decision");
    }

    const tieneArchivoCustom = FILES_CARGADOS[doc.index] ? true : false;
    const cat = determinarCategoriaActo(doc);

    // Botón Principal Condicional según categoría oficial del acto
    const btnPrincipalLabel = cat.btnPrincipalText;
    const btnPrincipalHtml = `
      <button type="button" class="btn-view-doc" onclick="abrirVisorActo(${doc.index}, 'principal')" title="${btnPrincipalLabel}">
        <svg class="w-3.5 h-3.5 inline mr-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        <span>${btnPrincipalLabel}</span>
      </button>
    `;

    // Botón Secundario Condicional (solo si existe archivo complementario)
    let btnSecundarioHtml = "";
    if (doc.pdfComplementario && doc.pdfComplementario.path) {
      let compLabel = doc.pdfComplementario.label;
      if (!compLabel) {
        compLabel = cat.isResolucion ? 'Diligencias de Notificación' : 'Ver Anexos';
      }
      const isNotif = cat.isResolucion || doc.pdfComplementario.tipo === 'notificaciones' || compLabel.toLowerCase().includes('notificaci');
      const compIcon = isNotif ? `
        <svg class="w-3.5 h-3.5 inline mr-1 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
      ` : `
        <svg class="w-3.5 h-3.5 inline mr-1 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
      `;
      btnSecundarioHtml = `
        <button type="button" class="btn-secondary-doc" onclick="abrirVisorActo(${doc.index}, 'complementario')" title="${compLabel}">
          ${compIcon}
          <span>${compLabel}</span>
        </button>
      `;
    }

    // Botón rápido de gestión para funcionarios INDECOPI
    const staffActionHtml = (currentUserRole === 'INDECOPI_STAFF') ? `
      <button type="button" class="btn-staff-quick rbac-staff-only" onclick="abrirSelectorSubida(${doc.index})" title="Adjuntar o reemplazar pieza digital">
        <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        <span>Gestionar</span>
      </button>
    ` : '';

    const actNumStr = `Acto ${String(doc.index).padStart(2, '0')}`;
    const fojaExacta = doc.fojas || "";
    const fechaExacta = tieneArchivoCustom ? FILES_CARGADOS[doc.index].fechaCarga : doc.date;
    const tituloExacto = doc.title || "Actuación Procesal";

    card.innerHTML = `
      <div class="card-inner-minimal">
        <div class="act-card-header">
          <div class="act-meta-left">
            <span class="act-number-badge">${actNumStr}</span>
            <span class="act-type-pill ${cat.badgeClass}">${cat.categoria}</span>
            <span class="act-fojas-pill">${fojaExacta}</span>
          </div>
          <span class="act-date-pill">${fechaExacta}</span>
        </div>

        <h4 class="act-formal-title">${tituloExacto}</h4>

        <div class="act-card-actions">
          ${btnPrincipalHtml}
          ${btnSecundarioHtml}
          ${staffActionHtml}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function expandirQr(index) {
  const doc = DOCUMENTOS_EXPEDIENTE.find(d => d.index === index);
  if (!doc) return;

  alert(`INSTITUTO NACIONAL DE DEFENSA DE LA COMPETENCIA Y DE LA PROTECCIÓN DE LA PROPIEDAD INTELECTUAL (INDECOPI)\n\nVerificación de Documento Digital\nExpediente: 14-2026/CPC-INDECOPI-PUN\nActuación: Acto N.° ${index} - ${doc.title}\n${doc.fojas}\nCódigo de Verificación Digital (CVD): ${doc.cvd}\n\nFirma Digital Calificada amparada en la Ley N.° 27269.`);
}

// ==========================================================================
// VISOR DE DOCUMENTOS ELECTRÓNICOS (SPLIT VIEW CON METADATOS PROCESALES)
// ==========================================================================
let currentPdfUrl = "";

function abrirVisorActo(index, subTipo = 'principal') {
  const doc = DOCUMENTOS_EXPEDIENTE.find(d => d.index === index);
  if (!doc) return;
  documentoActualEnVisor = doc;

  const cat = determinarCategoriaActo(doc);

  if (subTipo === 'complementario' && doc.pdfComplementario) {
    const compLabel = doc.pdfComplementario.label || (cat.isResolucion ? 'Diligencias de Notificación' : 'Ver Anexos');
    abrirVisorPdf(doc.pdfComplementario.path, `${doc.title} — ${compLabel}`, doc.fojas, doc.index, compLabel);
  } else {
    // Si hay un archivo propio subido por el personal INDECOPI
    if (FILES_CARGADOS[doc.index]) {
      const customFile = FILES_CARGADOS[doc.index];
      const modal = document.getElementById("docViewerModal");
      const vIndex = document.getElementById("viewerDocIndex");
      const vTitle = document.getElementById("viewerDocTitle");
      const vContent = document.getElementById("legalDocumentContent");
      const iframe = document.getElementById("pdfViewerFrame");
      if (vIndex) vIndex.textContent = (doc.fojas || "").toUpperCase();
      if (vTitle) vTitle.textContent = doc.title;
      if (iframe) {
        iframe.style.display = "none";
        iframe.src = "";
      }
      if (vContent) {
        vContent.style.display = "block";
        renderCustomUploadedFile(customFile, vContent, doc);
      }
      actualizarMetadatosVisor(doc, null);
      if (modal) modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    } else {
      abrirVisorPdf(doc.pdfPrincipal, doc.title, doc.fojas, doc.index, null);
    }
  }
}

function abrirVisorPdf(pdfUrl, title, fojas, docIndex = null, subTipoLabel = null) {
  if (!pdfUrl) return;
  currentPdfUrl = pdfUrl;

  const modal = document.getElementById("docViewerModal");
  const vIndex = document.getElementById("viewerDocIndex");
  const vTitle = document.getElementById("viewerDocTitle");
  const iframe = document.getElementById("pdfViewerFrame");
  const pageCounter = document.getElementById("viewerPageCounter");
  const textContent = document.getElementById("legalDocumentContent");

  if (vIndex) vIndex.textContent = (fojas || "").toUpperCase();
  if (vTitle) vTitle.textContent = title || "Pieza Procesal Electrónica";
  if (pageCounter) {
    const filename = pdfUrl.split('/').pop();
    pageCounter.textContent = `Archivo: ${filename} • Expediente N.° 14-2026/CPC-INDECOPI-PUN`;
  }

  if (textContent) textContent.style.display = "none";

  if (iframe) {
    iframe.style.display = "block";
    iframe.src = `${pdfUrl}#toolbar=1`;
  }

  // Identificar el acto para actualizar la ficha de metadatos procesales
  let doc = null;
  if (docIndex) {
    doc = DOCUMENTOS_EXPEDIENTE.find(d => d.index === docIndex);
  } else if (documentoActualEnVisor) {
    doc = documentoActualEnVisor;
  } else {
    doc = DOCUMENTOS_EXPEDIENTE.find(d => d.pdfPrincipal === pdfUrl || (d.pdfComplementario && d.pdfComplementario.path === pdfUrl));
  }

  if (doc) {
    documentoActualEnVisor = doc;
    actualizarMetadatosVisor(doc, subTipoLabel);
  }

  if (modal) modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function actualizarMetadatosVisor(doc, subTipoLabel) {
  if (!doc) return;

  const cat = determinarCategoriaActo(doc);

  const badgeEl = document.getElementById("viewerMetaActBadge");
  const resumenEl = document.getElementById("viewerMetaResumen");
  const remitenteEl = document.getElementById("viewerMetaRemitente");
  const destinatarioEl = document.getElementById("viewerMetaDestinatario");
  const estadoEl = document.getElementById("viewerMetaEstado");
  const cvdEl = document.getElementById("viewerMetaCvd");
  const firmanteEl = document.getElementById("viewerMetaFirmante");
  const fechaFirmaEl = document.getElementById("viewerMetaFechaFirma");
  const btnCopyText = document.getElementById("btnCopyCvdText");

  if (badgeEl) {
    const actNum = String(doc.index).padStart(2, '0');
    badgeEl.textContent = `Acto ${actNum} • ${cat.categoria}`;
  }

  if (resumenEl) {
    if (subTipoLabel) {
      resumenEl.textContent = `[Pieza Complementaria: ${subTipoLabel}] ${doc.desc || ''}`;
    } else {
      resumenEl.textContent = doc.desc || 'Sin resumen descriptivo registrado';
    }
  }

  if (remitenteEl) remitenteEl.textContent = doc.sender || "—";
  if (destinatarioEl) destinatarioEl.textContent = doc.recipient || "—";
  if (estadoEl) estadoEl.textContent = doc.status || "Registrado";
  if (cvdEl) cvdEl.textContent = doc.cvd || "0000-0000-0000-0000";
  if (firmanteEl) firmanteEl.textContent = `${doc.firmante || '—'} (${doc.cargo || 'Funcionario INDECOPI'})`;
  if (fechaFirmaEl) fechaFirmaEl.textContent = doc.fechaFirma || doc.date || "Fecha certificada";
}

function copiarCvdVisor() {
  const cvdEl = document.getElementById("viewerMetaCvd");
  const btnCopyText = document.getElementById("btnCopyCvdText");
  const text = cvdEl ? cvdEl.textContent.trim() : "";
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    if (btnCopyText) {
      const original = btnCopyText.textContent;
      btnCopyText.textContent = "¡Copiado!";
      setTimeout(() => {
        btnCopyText.textContent = original;
      }, 2000);
    }
  }).catch(err => {
    console.warn("No se pudo copiar automáticamente al portapapeles:", err);
  });
}

function toggleViewerSidebar() {
  const container = document.getElementById("viewerSplitContainer");
  const btnText = document.getElementById("btnToggleSidebarText");
  if (!container) return;

  const isCollapsed = container.classList.toggle("sidebar-collapsed");
  if (btnText) {
    btnText.textContent = isCollapsed ? "Ver Ficha" : "Ficha del Acto";
  }
}

function cerrarModalDocumento() {
  const modal = document.getElementById("docViewerModal");
  const iframe = document.getElementById("pdfViewerFrame");
  if (iframe) iframe.src = "";
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  documentoActualEnVisor = null;
  currentPdfUrl = "";
}
const cerrarVisorPdf = cerrarModalDocumento;

function imprimirDocumentoActual() {
  const iframe = document.getElementById("pdfViewerFrame");
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      return;
    } catch (e) {
      console.warn("Impresión directa no disponible en iframe sandbox, abriendo ventana:", e);
    }
  }
  if (currentPdfUrl) {
    window.open(currentPdfUrl, "_blank");
  } else {
    window.print();
  }
}

function descargarDocumentoActual() {
  if (!currentPdfUrl) return;
  const a = document.createElement("a");
  a.href = currentPdfUrl;
  a.download = currentPdfUrl.split('/').pop() || "documento_indecopi.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function visualizarDocumento(index) {
  abrirVisorActo(index, 'principal');
}

function generarHojaA4Institucional(doc) {
  const contenidoEspecifico = obtenerContenidoLegalPorActo(doc.index);

  return `
    <div class="a4-sheet">
      <!-- 1. MEMBRETE OFICIAL INDECOPI -->
      <div class="a4-header-membrete">
        <div class="membrete-left">
          <div class="membrete-shield-box">
            <svg class="w-7 h-7 text-[#9E0059]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z"></path><path d="M12 7v10m-4-6h8"></path></svg>
          </div>
          <div class="membrete-texts">
            <div class="membrete-peru">REPÚBLICA DEL PERÚ</div>
            <div class="membrete-indecopi">INDECOPI</div>
            <div class="membrete-comision">COMISIÓN DE PROTECCIÓN AL CONSUMIDOR</div>
            <div class="membrete-sede">SEDE REGIONAL PUNO</div>
          </div>
        </div>
        <div class="membrete-right-meta">
          <span class="membrete-fojas-box">${doc.fojas}</span>
          <div>EXP. N.° 14-2026/CPC-INDECOPI-PUN</div>
          <div>FECHA: ${doc.date}</div>
        </div>
      </div>

      <!-- Título de la Pieza Administrativa -->
      <h3 class="a4-doc-act-title">${doc.title.toUpperCase()}</h3>

      <!-- Metadatos del Expediente -->
      <table class="a4-meta-table">
        <tr>
          <td class="label">EXPEDIENTE:</td>
          <td class="value"><strong>14-2026/CPC-INDECOPI-PUN</strong></td>
        </tr>
        <tr>
          <td class="label">DENUNCIANTE:</td>
          <td class="value">
            D******* P**** C******* 
            <span class="dato-reservado" title="Dato Protegido por Ley N.° 29733">[DATO RESERVADO - LEY 29733: DNI 01******]</span>
          </td>
        </tr>
        <tr>
          <td class="label">DENUNCIADO:</td>
          <td class="value">
            <strong>BANCO BBVA PERÚ SOCIEDAD ANÓNIMA</strong> (RUC: 20100130204)
          </td>
        </tr>
        <tr>
          <td class="label">MATERIA:</td>
          <td class="value">PROTECCIÓN AL CONSUMIDOR — FALTA DE IDONEIDAD EN EL SERVICIO FINANCIERO (ART. 19 LEY N.° 29571)</td>
        </tr>
        <tr>
          <td class="label">PROCEDIMIENTO:</td>
          <td class="value">PROCEDIMIENTO ADMINISTRATIVO SANCIONADOR (PAS)</td>
        </tr>
      </table>

      <!-- 2. CUERPO DEL DOCUMENTO CON DATOS SENSIBLES TACHADOS -->
      <div class="a4-legal-body">
        ${contenidoEspecifico}
      </div>

      <!-- 3. RECUADRO ESTANDARIZADO DE FIRMA DIGITAL CALIFICADA (LEY 27269) -->
      <div class="digital-signature-box">
        <div class="sig-seal-icon">
          <svg class="w-6 h-6 text-[#9E0059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        </div>
        <div class="sig-info-content">
          <div class="sig-header-title">
            <span>FIRMA DIGITAL CALIFICADA</span>
            <span class="text-[10px] bg-[#9E0059] text-white px-2 py-0.5 rounded">LEY N.° 27269</span>
          </div>
          <div class="sig-signer-name">${doc.firmante}</div>
          <div class="sig-signer-role">${doc.cargo} — INDECOPI REPÚBLICA DEL PERÚ</div>
          
          <div class="sig-meta-grid">
            <div>Fecha y Hora: ${doc.fechaFirma}</div>
            <div>Sellado de Tiempo: TSA-INDECOPI-PKI-2026</div>
            <div>Algoritmo: SHA-256 with RSA 2048-bit</div>
            <div>Certificador: Entidad de Certificación RENIEC / INDECOPI</div>
          </div>
          
          <div class="sig-legal-cert">
            Documento electrónico firmado digitalmente con pleno valor probatorio y eficacia jurídica conforme al Art. 1 de la Ley N.° 27269 y Art. 10 del D.S. N.° 052-2008-PCM.
          </div>
        </div>
      </div>

      <!-- 4. CÓDIGO DE VERIFICACIÓN DIGITAL (CVD) CON VALIDADOR WEB OFICIAL -->
      <div class="cvd-verification-box">
        <div class="cvd-left">
          <div class="cvd-title">CÓDIGO DE VERIFICACIÓN DIGITAL (CVD)</div>
          <div class="cvd-code">${doc.cvd}</div>
          <div class="text-[11px] text-slate-600 mt-1">
            Valide la integridad de esta pieza procesal ingresando el código CVD en el portal oficial:
          </div>
          <a href="https://enlinea.indecopi.gob.pe/verificardoc/?cvd=${doc.cvd}&exp=14-2026-CPC-PUN" target="_blank" class="cvd-link">
            https://enlinea.indecopi.gob.pe/verificardoc/
          </a>
        </div>
        <div class="text-right">
          <span class="inline-block bg-[#9E0059] text-white text-[10px] font-bold px-2 py-1 rounded">
            AUTENTICIDAD VERIFICABLE
          </span>
        </div>
      </div>

    </div>
  `;
}

function obtenerContenidoLegalPorActo(index) {
  switch(index) {
    case 1:
      return `
        <div class="a4-legal-section-header">I. PETITORIO Y HECHOS DE LA DENUNCIA ADMINISTRATIVA</div>
        <p>
          Que, en fecha 23 de enero de 2026, don D******* P**** C*******, identificado con documento de identidad <span class="dato-reservado">[DATO RESERVADO - LEY 29733: DNI 01******]</span>, con domicilio real disociado en <span class="dato-reservado">[DATO RESERVADO - LEY 29733: Jr. Tacna N.° ***, Puno]</span>, interpone formal denuncia administrativa en contra de la entidad financiera BANCO BBVA PERÚ S.A., con RUC N.° 20100130204, por infracción al deber de idoneidad estipulado en el artículo 19 de la Ley N.° 29571 (Código de Protección y Defensa del Consumidor).
        </p>
        <p>
          El administrado sostiene que, siendo titular de su cuenta de ahorros, constató tres transferencias interbancarias no autorizadas ni reconocidas por un monto total acumulado de S/ 60,000.00 (Sesenta Mil y 00/100 Soles) dirigidas a la empresa Terasys Perú S.A.C., sin que la entidad financiera adoptara medidas preventivas ni remitiera alertas de seguridad inmediatas ante transacciones que rompían radicalmente su perfil transaccional histórico.
        </p>
        <p>
          Refiere el denunciante que de inmediato reclamó al Banco solicitando la reversión y bloqueo, declarándose improcedente su reclamo bajo el argumento genérico de uso de claves. Solicita la restitución total del dinero debitado, intereses legales y la sanción más severa.
        </p>
      `;
    case 2:
      return `
        <div class="a4-legal-section-header">INFORME TÉCNICO DE INTEROPERABILIDAD — SECRETARÍA TÉCNICA</div>
        <p>
          La Secretaría Técnica de la Comisión de Protección al Consumidor — Sede Regional Puno, en aplicación del principio de celeridad y la interoperabilidad estatal (Decreto Supremo N.° 083-2011-PCM), procedió a efectuar la verificación de personería de las partes procesales a través de la Plataforma de Interoperabilidad del Estado Peruano (PIDE):
        </p>
        <p>
          1. <strong>INTEROPERABILIDAD PIDE-RENIEC:</strong> Se validó la identidad del denunciante don D******* P**** C*******. Conforme al artículo 13 de la Ley N.° 29733 (Ley de Protección de Datos Personales), se procedió a la disociación en el expediente público de los datos personales sensibles correspondientes al DNI <span class="dato-reservado">[DATO RESERVADO - LEY 29733: 01******]</span> y domicilio en <span class="dato-reservado">[DATO RESERVADO - LEY 29733]</span>.
        </p>
        <p>
          2. <strong>INTEROPERABILIDAD PIDE-SUNAT:</strong> Se constató el estado tributario de la empresa denunciada BANCO BBVA PERÚ SOCIEDAD ANÓNIMA con RUC N.° 20100130204, verificándose condición de ACTIVO y HABIDO, con facultades de representación legal registradas, y Casilla Electrónica CUE N.° BBVA-LIMA-00412 habilitada en el Sistema de Notificaciones del INDECOPI. Por tanto, se concluye que concurren los presupuestos procesales de legitimidad para obrar y personería.
        </p>
      `;
    case 3:
      return `
        <div class="a4-legal-section-header">RESOLUCIÓN N.° 01-2026/CPC-INDECOPI-PUN — IMPUTACIÓN DE CARGOS</div>
        <p>
          <strong>VISTO:</strong> El escrito de denuncia administrativa de fojas 001 a 042 y el informe de verificación de personería de fojas 043 a 050; y, <strong>CONSIDERANDO:</strong>
        </p>
        <p>
          Que, el artículo 19 de la Ley N.° 29571 establece que los proveedores responden por la idoneidad y calidad de los productos y servicios ofrecidos. En la actividad de intermediación financiera, las empresas del sistema bancario tienen el deber de adoptar mecanismos de monitoreo preventivo y mitigación de fraudes para detectar patrones de consumo inusuales.
        </p>
        <p>
          <strong>SE RESUELVE:</strong>
          <br><strong>PRIMERO:</strong> INICIAR Procedimiento Administrativo Sancionador contra el <strong>BANCO BBVA PERÚ SOCIEDAD ANÓNIMA</strong> por presunta infracción al artículo 19 del Código de Protección y Defensa del Consumidor, al no haber garantizado la debida seguridad e idoneidad en la cuenta de ahorros del denunciante, permitiendo tres transferencias no autorizadas por S/ 60,000.00 a favor de Terasys Perú S.A.C.
          <br><strong>SEGUNDO:</strong> CONCEDER a la entidad denunciada el plazo improrrogable de <strong>CINCO (05) DÍAS HÁBILES</strong> para que formule sus descargos por escrito y ofrezca los medios probatorios pertinentes, bajo apercibimiento de declararse en rebeldía procesal.
        </p>
      `;
    case 4:
      return `
        <div class="a4-legal-section-header">CÉDULA Y CONSTANCIA DE DEPÓSITO ELECTRÓNICO EN CASILLA CUE</div>
        <p>
          Por medio de la presente, la Oficina de Trámite Documentario y Notificaciones del INDECOPI deja constancia que, al amparo del Decreto Legislativo N.° 1308 y la Directiva N.° 001-2018-DIR/COD-INDECOPI, se procedió a notificar a la entidad denunciada BANCO BBVA PERÚ S.A. en su Casilla Única Electrónica (CUE) asignada:
        </p>
        <p>
          • <strong>Código de Casilla CUE:</strong> BBVA-LIMA-00412<br>
          • <strong>Acto Notificado:</strong> Resolución N.° 01-2026/CPC-INDECOPI-PUN (Imputación de Cargos)<br>
          • <strong>Fecha y Hora de Depósito:</strong> 24/02/2026 a las 08:30:10 horas (-05:00)<br>
          • <strong>Sello de Tiempo Criptográfico:</strong> TSA-INDECOPI-2026-DEP-004128<br>
          • <strong>Efecto Procesal:</strong> De conformidad con la ley, la notificación surtió efectos al primer día hábil siguiente al depósito en la casilla electrónica.
        </p>
      `;
    case 5:
      return `
        <div class="a4-legal-section-header">ESCRITO DE DESCARGOS DEL BANCO BBVA — RESERVA DE SECRETO BANCARIO</div>
        <p>
          El BANCO BBVA PERÚ S.A., a través de su apoderado judicial F******* D****** S******, absuelve el traslado de imputación de cargos en los siguientes términos:
        </p>
        <p>
          1. Niega toda responsabilidad administrativa, señalando que las tres operaciones fueron procesadas mediante factores de autenticación y claves digitales personales del cliente.
        </p>
        <p>
          2. <strong>SOLICITUD DE CONFIDENCIALIDAD:</strong> Adjunta a fojas 066 a 110 los registros informáticos de auditoría (logs transaccionales, números IP, trazabilidad y extractos de cuenta <span class="dato-reservado">[DATO RESERVADO - SECRETO BANCARIO ART. 140 LEY 26702]</span>). Invoca expresamente el derecho de reserva y SECRETO BANCARIO tutelado en el artículo 140 de la Ley N.° 26702 y la protección de datos personales (Ley 29733), solicitando que no se expongan públicamente dichos anexos técnicos.
        </p>
      `;
    case 6:
      return `
        <div class="a4-legal-section-header">RESOLUCIÓN FINAL N.° 087-2026/CPC-INDECOPI-PUN — SANCIÓN Y MEDIDAS CORRECTIVAS</div>
        <p>
          <strong>CONSIDERANDO:</strong>
          <br>Que, conforme a reiterada jurisprudencia de la Sala Especializada en Protección al Consumidor del Tribunal del INDECOPI, en los casos de desconocimiento de operaciones financieras opera la inversión de la carga de la prueba. El banco no solo debe acreditar el ingreso de factores de autenticación, sino que debe probar que sus sistemas antifraude funcionaron oportunamente al advertir transacciones atípicas continuas hacia una empresa no habitual como Terasys Perú S.A.C.
        </p>
        <p>
          Que, de la valoración conjunta de autos, se concluye que BANCO BBVA PERÚ S.A. no acreditó haber activado alertas preventivas ni validaciones biométricas adicionales ante un patrón atípico de transferencias interbancarias continuas por S/ 60,000.00, vulnerando el deber de idoneidad (Art. 19 Ley 29571).
        </p>
        <p>
          <strong>LA COMISIÓN DE PROTECCIÓN AL CONSUMIDOR RESUELVE:</strong>
          <br><strong>1. DECLARAR FUNDADA</strong> la denuncia administrativa interpuesta por don D******* P**** C******* en contra del BANCO BBVA PERÚ SOCIEDAD ANÓNIMA.
          <br><strong>2. SANCIONAR</strong> al BANCO BBVA PERÚ SOCIEDAD ANÓNIMA con una <strong>MULTA de 22.97 Unidades Impositivas Tributarias (UIT)</strong> (equivalente a S/ 126,335.00).
          <br><strong>3. ORDENAR COMO MEDIDA CORRECTIVA</strong> que, en el plazo perentorio de cinco (05) días hábiles, el BANCO BBVA PERÚ S.A. restituya a la cuenta del administrado la suma de <strong>S/ 60,000.00</strong>, más los intereses legales correspondientes calculados a la fecha de pago efectivo.
          <br><strong>4. CONDENAR</strong> a la empresa denunciada al pago de las costas y costos del procedimiento (S/ 36.00). Notifíquese a las partes en sus respectivas Casillas CUE.
        </p>
      `;
    default:
      return `<p>Actuación administrativa registrada en el expediente electrónico.</p>`;
  }
}

function renderCustomUploadedFile(customFile, container, doc) {
  if (customFile.type.startsWith("image/")) {
    container.innerHTML = `
      <div class="a4-sheet text-center" style="display:flex; flex-direction:column; align-items:center;">
        <div class="a4-header-membrete" style="width:100%;">
          <div class="membrete-left">
            <div class="membrete-shield-box">
              <svg class="w-7 h-7 text-[#9E0059]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z"></path><path d="M12 7v10m-4-6h8"></path></svg>
            </div>
            <div class="membrete-texts">
              <div class="membrete-peru">REPÚBLICA DEL PERÚ</div>
              <div class="membrete-indecopi">INDECOPI — ARCHIVO DIGITALIZADO</div>
            </div>
          </div>
          <div class="membrete-right-meta">
            <span class="membrete-fojas-box">${doc.fojas}</span>
          </div>
        </div>
        <h4 style="color:#9E0059; margin-bottom:15px; font-weight:700;">${customFile.name}</h4>
        <img src="${customFile.blobUrl}" alt="${customFile.name}" style="max-width:100%; max-height:700px; border:1px solid #CBD5E1; border-radius:4px; box-shadow:var(--shadow-md);">
        <p style="color:#64748B; font-size:0.8rem; margin-top:12px;">Archivo incorporado digitalmente al expediente: ${(customFile.size/1024).toFixed(1)} KB • Fecha de carga: ${customFile.fechaCarga}</p>
      </div>
    `;
  } else if (customFile.type === "application/pdf" || customFile.name.toLowerCase().endsWith(".pdf")) {
    container.innerHTML = `
      <div class="a4-sheet" style="padding: 20px; height: 85vh; display: flex; flex-direction: column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #E2E8F0; padding-bottom:8px;">
          <strong style="color:#9E0059; font-size:0.9rem;">Visualización de Archivo PDF Incorporado al Expediente</strong>
          <span style="font-size:0.75rem; color:#64748B;">${customFile.name} (${(customFile.size/1024).toFixed(1)} KB)</span>
        </div>
        <object data="${customFile.blobUrl}" type="application/pdf" style="width:100%; flex:1; border:none; border-radius:4px;">
          <iframe src="${customFile.blobUrl}" style="width:100%; height:100%; border:none;">
            <p>Su navegador no soporta el visor embebido de PDFs. Descárguelo usando el botón superior.</p>
          </iframe>
        </object>
      </div>
    `;
  } else {
    const textContent = (customFile.textContent || "Contenido no disponible").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    container.innerHTML = `
      <div class="a4-sheet">
        <div class="a4-header-membrete">
          <div class="membrete-left">
            <div class="membrete-shield-box">
              <svg class="w-7 h-7 text-[#9E0059]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z"></path><path d="M12 7v10m-4-6h8"></path></svg>
            </div>
            <div class="membrete-texts">
              <div class="membrete-peru">REPÚBLICA DEL PERÚ</div>
              <div class="membrete-indecopi">INDECOPI — PIEZA PROCESAL DIGITAL</div>
            </div>
          </div>
          <div class="membrete-right-meta">
            <span class="membrete-fojas-box">${doc.fojas}</span>
          </div>
        </div>
        <h3 class="a4-doc-act-title">${customFile.name}</h3>
        <pre style="background:#F8FAFC; border:1px solid #E2E8F0; padding:20px; border-radius:6px; font-family:'JetBrains Mono', monospace; font-size:0.85rem; line-height:1.5; white-space:pre-wrap;">${textContent}</pre>
      </div>
    `;
  }
}

function descargarDocumentoActual() {
  if (currentPdfUrl) {
    const link = document.createElement("a");
    link.href = currentPdfUrl;
    link.download = currentPdfUrl.split('/').pop() || "documento_expediente.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  if (!documentoActualEnVisor) return;

  const doc = documentoActualEnVisor;
  if (FILES_CARGADOS[doc.index]) {
    const custom = FILES_CARGADOS[doc.index];
    const link = document.createElement("a");
    link.href = custom.blobUrl;
    link.download = custom.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (doc.pdfPrincipal) {
    const link = document.createElement("a");
    link.href = doc.pdfPrincipal;
    link.download = doc.pdfPrincipal.split('/').pop() || "documento_expediente.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ==========================================================================
// SUBIDA DE ARCHIVOS (RBAC: EXCLUSIVO PERSONAL INDECOPI)
// ==========================================================================
function abrirSelectorSubida(index) {
  if (currentUserRole !== 'INDECOPI_STAFF') {
    alert("Acceso Restringido: El rol Ciudadano / Administrado cuenta únicamente con permisos de lectura. Ingrese con clave institucional para incorporar actuaciones.");
    return;
  }

  indexDocDestinoSubida = index;
  const modal = document.getElementById("uploadTimelineModal");
  if (index !== null) {
    const doc = DOCUMENTOS_EXPEDIENTE.find(d => d.index === index);
    if (doc) {
      document.getElementById("timelineUploadTitle").value = doc.title;
      document.getElementById("timelineUploadFojas").value = doc.fojas;
      document.getElementById("timelineUploadDesc").value = doc.desc;
    }
  } else {
    document.getElementById("timelineUploadTitle").value = "";
    document.getElementById("timelineUploadFojas").value = "Fojas 059 - 065";
    document.getElementById("timelineUploadDesc").value = "";
  }
  document.getElementById("timelineSelectedFileName").textContent = "Ningún archivo seleccionado";
  document.getElementById("btnConfirmTimelineUpload").disabled = true;

  modal.classList.remove("hidden");
}

function cerrarModalSubidaTimeline() {
  document.getElementById("uploadTimelineModal").classList.add("hidden");
  indexDocDestinoSubida = null;
}

function activarSelectorArchivoTimeline() {
  document.getElementById("globalTimelineFileInput").click();
}

function procesarSubidaArchivo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileNameLabel = document.getElementById("timelineSelectedFileName");
  if (fileNameLabel) fileNameLabel.textContent = file.name;
  document.getElementById("btnConfirmTimelineUpload").disabled = false;
}

function confirmarSubidaTimeline() {
  const fileInput = document.getElementById("globalTimelineFileInput");
  const file = fileInput.files[0];
  if (!file) return;

  const titleVal = document.getElementById("timelineUploadTitle").value.trim() || file.name;
  const fojasVal = document.getElementById("timelineUploadFojas").value.trim() || "Fojas 059 - 065";
  const descVal = document.getElementById("timelineUploadDesc").value.trim() || "Pieza procesal incorporada por la Secretaría Técnica.";
  const fechaActual = new Date().toLocaleDateString('es-PE');
  const blobUrl = URL.createObjectURL(file);

  const idx = (indexDocDestinoSubida !== null) ? indexDocDestinoSubida : (DOCUMENTOS_EXPEDIENTE.length + 1);

  const finishUpload = (textContent) => {
    FILES_CARGADOS[idx] = {
      name: file.name,
      type: file.type,
      size: file.size,
      fechaCarga: fechaActual,
      blobUrl: blobUrl,
      textContent: textContent || ""
    };

    if (indexDocDestinoSubida === null) {
      // Nueva pieza procesal
      DOCUMENTOS_EXPEDIENTE.push({
        index: idx,
        fojas: fojasVal,
        title: titleVal,
        date: fechaActual,
        type: "anexo",
        sender: "Secretaría Técnica INDECOPI",
        recipient: "Expediente Administrativo Sancionador",
        status: "Incorporado al PAS",
        statusClass: "status-pide",
        typeBadgeClass: "badge-type-informe",
        desc: descVal,
        cvd: `99${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}`,
        firmante: "Dra. María Elena Quispe Vilca",
        cargo: "Secretaria Técnica - CPC Puno",
        fechaFirma: `${fechaActual} 10:00:00 -05:00`
      });
    }

    dbHelper.saveFile("timeline_" + idx, file);
    dbHelper.saveState("FILES_CARGADOS", FILES_CARGADOS);
    dbHelper.saveState("DOCUMENTOS_EXPEDIENTE", DOCUMENTOS_EXPEDIENTE);

    cerrarModalSubidaTimeline();
    renderTimeline();
    fileInput.value = "";
    
    agregarMensajeChatbot(`Actuación procesal incorporada exitosamente. Se ha registrado el archivo **${file.name}** en **${fojasVal}**.`);
  };

  if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
    const reader = new FileReader();
    reader.onload = (e) => finishUpload(e.target.result);
    reader.readAsText(file, "UTF-8");
  } else {
    finishUpload("");
  }
}

// ==========================================================================
// CASILLA ELECTRÓNICA CUE (NOTIFICACIONES)
// ==========================================================================
function renderNotifications() {
  const grid = document.getElementById("notificationsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = NOTIFICACIONES_CASILLA.filter((n) => {
    if (currentNotifFilter === 'all') return true;
    return n.recipient === currentNotifFilter;
  });

  const unreadCount = NOTIFICACIONES_CASILLA.length;
  const badge = document.getElementById("notifBadgeCount");
  if (badge) badge.textContent = unreadCount;

  filtered.forEach((n) => {
    const card = document.createElement("div");
    card.className = "cue-notif-card";

    const badgeClass = n.recipient === 'denunciante' ? 'cue-target-denunciante' : 'cue-target-denunciado';
    const recipientLabel = n.recipient === 'denunciante' ? 'Denunciante (D******* P**** C*******)' : 'Denunciado (BANCO BBVA PERÚ S.A.)';

    card.innerHTML = `
      <div>
        <div class="cue-notif-header">
          <span class="cue-id-stamp">${n.id}</span>
          <span class="cue-target-badge ${badgeClass}">${recipientLabel}</span>
        </div>
        <div class="cue-notif-body">
          <h4>${n.resolutionTitle}</h4>
          <p class="cue-meta-row"><strong>Casilla CUE:</strong> <span class="font-mono">${n.casillaNumber}</span></p>
          <p class="cue-meta-row"><strong>Destinatario Oficial:</strong> ${n.recipientName}</p>
          <p class="cue-meta-row"><strong>Piezas Anexadas:</strong> ${n.fojas}</p>
        </div>
      </div>
      <div class="cue-notif-footer">
        <span class="cue-date-info">Depósito CUE: ${n.sendDate} • Conforme</span>
        <button class="btn-indecopi-action flex items-center gap-1.5" onclick="visualizarNotificacion('${n.id}')">
          <span>Ver Cédula CUE</span>
          <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function filterNotifications(type) {
  currentNotifFilter = type;
  document.getElementById("btnFilterNotifAll")?.classList.remove("active");
  document.getElementById("btnFilterNotifDem")?.classList.remove("active");
  document.getElementById("btnFilterNotifDep")?.classList.remove("active");

  if (type === 'all') document.getElementById("btnFilterNotifAll")?.classList.add("active");
  if (type === 'denunciante') document.getElementById("btnFilterNotifDem")?.classList.add("active");
  if (type === 'denunciado') document.getElementById("btnFilterNotifDep")?.classList.add("active");

  renderNotifications();
}

function visualizarNotificacion(id) {
  const notif = NOTIFICACIONES_CASILLA.find(n => n.id === id);
  if (!notif) return;

  if (notif.pdfPath) {
    abrirVisorPdf(notif.pdfPath, `Cédula de Notificación CUE N.° ${notif.id} — ${notif.resolutionTitle}`, notif.fojas);
    return;
  }

  const modal = document.getElementById("docViewerModal");
  const vIndex = document.getElementById("viewerDocIndex");
  const vTitle = document.getElementById("viewerDocTitle");
  const vContent = document.getElementById("legalDocumentContent");

  vIndex.textContent = `CASILLA CUE • ${notif.id}`;
  vTitle.textContent = `CÉDULA DE NOTIFICACIÓN ELECTRÓNICA INDECOPI N.° ${notif.id}`;

  vContent.innerHTML = `
    <div class="a4-sheet">
      <div class="a4-header-membrete">
        <div class="membrete-left">
          <div class="membrete-shield-box">
            <svg class="w-7 h-7 text-[#9E0059]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z"></path><path d="M12 7v10m-4-6h8"></path></svg>
          </div>
          <div class="membrete-texts">
            <div class="membrete-peru">REPÚBLICA DEL PERÚ • INDECOPI</div>
            <div class="membrete-indecopi">SISTEMA DE NOTIFICACIONES ELECTRÓNICAS (CUE)</div>
            <div class="membrete-comision">DECRETO LEGISLATIVO N.° 1308</div>
          </div>
        </div>
        <div class="membrete-right-meta">
          <span class="membrete-fojas-box">${notif.fojas}</span>
          <div>REGISTRO: ${notif.id}</div>
        </div>
      </div>

      <h3 class="a4-doc-act-title">CONSTANCIA Y CÉDULA DE DEPÓSITO ELECTRÓNICO EN CASILLA CUE</h3>

      <table class="a4-meta-table">
        <tr>
          <td class="label">EXPEDIENTE N.°:</td>
          <td class="value"><strong>14-2026/CPC-INDECOPI-PUN</strong></td>
        </tr>
        <tr>
          <td class="label">DESTINATARIO:</td>
          <td class="value"><strong>${notif.recipientName}</strong></td>
        </tr>
        <tr>
          <td class="label">CASILLA CUE:</td>
          <td class="value"><span class="font-mono text-[#9E0059] font-bold">${notif.casillaNumber}</span></td>
        </tr>
        <tr>
          <td class="label">ACTO NOTIFICADO:</td>
          <td class="value"><strong>${notif.resolutionTitle}</strong></td>
        </tr>
        <tr>
          <td class="label">FECHA DE DEPÓSITO:</td>
          <td class="value">${notif.sendDate} a las 08:30:10 horas (-05:00)</td>
        </tr>
      </table>

      <div class="a4-legal-body">
        <p>
          Por medio de la presente, la Secretaría Técnica de la Comisión de Protección al Consumidor — Sede Regional Puno NOTIFICA al administrado destinatario con la resolución administrativa emitida en el Procedimiento Administrativo Sancionador seguido en contra de BANCO BBVA PERÚ S.A.
        </p>
        <p>
          La presente notificación se tiene por válidamente efectuada con el depósito del documento en la Casilla Única Electrónica (CUE), en cumplimiento de lo establecido en el Decreto Legislativo N.° 1308 y la Directiva N.° 001-2018-DIR/COD-INDECOPI. Los plazos procesales se computan a partir del primer día hábil siguiente a la fecha del depósito.
        </p>
      </div>

      <div class="digital-signature-box">
        <div class="sig-seal-icon">
          <svg class="w-6 h-6 text-[#9E0059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        </div>
        <div class="sig-info-content">
          <div class="sig-header-title">SELLO DE TIEMPO Y FIRMA DIGITAL CUE</div>
          <div class="sig-signer-name">MÓDULO DE CASILLA ÚNICA ELECTRÓNICA — INDECOPI</div>
          <div class="sig-signer-role">Constancia de Depósito Electrónico Automatizado</div>
          <div class="sig-legal-cert">
            Registro oficial con validez y eficacia legal plena (Art. 1 Ley N.° 27269).
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function abrirSelectorSubidaNotif() {
  if (currentUserRole !== 'INDECOPI_STAFF') {
    alert("Permiso Denegado: Solo el personal del INDECOPI puede emitir cédulas en la Casilla CUE.");
    return;
  }
  document.getElementById("uploadNotifModal").classList.remove("hidden");
}

function cerrarModalSubidaNotif() {
  document.getElementById("uploadNotifModal").classList.add("hidden");
}

function activarSelectorArchivoNotif() {
  document.getElementById("globalNotifFileInput").click();
}

function procesarSubidaArchivoNotif(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById("notifSelectedFileName").textContent = file.name;
  document.getElementById("btnConfirmNotifUpload").disabled = false;
}

function confirmarSubidaNotif() {
  const file = document.getElementById("globalNotifFileInput").files[0];
  if (!file) return;

  const title = document.getElementById("notifUploadTitle").value.trim() || "Cédula de Notificación";
  const recipient = document.getElementById("notifUploadRecipient").value;
  const fechaActual = new Date().toLocaleDateString('es-PE');
  const randomId = `CUE-2026-${Math.floor(100000 + Math.random()*900000)}`;

  NOTIFICACIONES_CASILLA.unshift({
    id: randomId,
    resolutionIndex: null,
    resolutionTitle: title.toUpperCase(),
    recipient: recipient,
    recipientName: recipient === 'denunciante' ? 'D******* P**** C*******' : 'BANCO BBVA PERÚ SOCIEDAD ANÓNIMA',
    casillaNumber: recipient === 'denunciante' ? 'CASILLA PERSONAL 01******' : 'BBVA-LIMA-00412',
    sendDate: fechaActual,
    receivedDate: fechaActual,
    status: "Depositado en Casilla CUE",
    fojas: "Pieza Notificada"
  });

  dbHelper.saveState("NOTIFICACIONES_CASILLA", NOTIFICACIONES_CASILLA);
  cerrarModalSubidaNotif();
  renderNotifications();
  agregarMensajeChatbot(`Cédula depositada con éxito en la Casilla CUE. ID: **${randomId}** asignada a **${recipient === 'denunciante' ? 'D******* P**** C*******' : 'BANCO BBVA PERÚ S.A.'}**.`);
}

// ==========================================================================
// TABS DE NAVEGACIÓN PRINCIPAL
// ==========================================================================
function switchMainTab(tab) {
  const btnTimeline = document.getElementById("btnTabTimeline");
  const btnNotifs = document.getElementById("btnTabNotifications");
  const btnReniec = document.getElementById("btnTabReniec");

  const tabTimeline = document.getElementById("tabContentTimeline");
  const tabNotifs = document.getElementById("tabContentNotifications");
  const tabReniec = document.getElementById("tabContentReniec");

  btnTimeline?.classList.remove("active");
  btnNotifs?.classList.remove("active");
  btnReniec?.classList.remove("active");

  tabTimeline?.classList.add("hidden");
  tabNotifs?.classList.add("hidden");
  tabReniec?.classList.add("hidden");

  if (tab === 'timeline') {
    btnTimeline?.classList.add("active");
    tabTimeline?.classList.remove("hidden");
  } else if (tab === 'notifications') {
    btnNotifs?.classList.add("active");
    tabNotifs?.classList.remove("hidden");
  } else if (tab === 'reniec') {
    btnReniec?.classList.add("active");
    tabReniec?.classList.remove("hidden");
  }
}

function switchPideTab(subTab) {
  const btnReniec = document.getElementById("tabBtnPideReniec");
  const btnSunat = document.getElementById("tabBtnPideSunat");
  const secReniec = document.getElementById("pideSectionReniec");
  const secSunat = document.getElementById("pideSectionSunat");

  if (subTab === 'reniec') {
    btnReniec.classList.add("active");
    btnSunat.classList.remove("active");
    secReniec.classList.remove("hidden");
    secSunat.classList.add("hidden");
  } else {
    btnReniec.classList.remove("active");
    btnSunat.classList.add("active");
    secReniec.classList.add("hidden");
    secSunat.classList.remove("hidden");
  }
}

// ==========================================================================
// BÚSQUEDA INTEROPERABILIDAD PIDE (RENIEC / SUNAT)
// ==========================================================================
function buscarEnReniec() {
  const query = document.getElementById("reniecDniSearch").value.trim();
  const empty = document.getElementById("reniecEmptyState");
  const card = document.getElementById("reniecBiometricCard");

  if (!query) {
    alert("Por favor ingrese un número de DNI.");
    return;
  }

  const match = MOCK_PIDE_RENIEC[query] || MOCK_PIDE_RENIEC["01845814"] || MOCK_PIDE_RENIEC["02845814"];

  empty.classList.add("hidden");
  card.classList.remove("hidden");

  document.getElementById("bioDni").innerHTML = `${match.dni} <span class="tag-anon">[DISOCIADO]</span>`;
  document.getElementById("bioApellidos").textContent = match.apellidos;
  document.getElementById("bioNombres").textContent = match.nombres;
  document.getElementById("bioFechaNac").innerHTML = `${match.fechaNac}`;
  document.getElementById("bioSexo").textContent = match.sexo;
  document.getElementById("bioEstadoCivil").textContent = match.estadoCivil;
  document.getElementById("bioDireccion").innerHTML = `${match.direccion}`;
  document.getElementById("bioGrupoVotacion").textContent = match.ubigeo;
  document.getElementById("bioFechaEmision").textContent = match.fechaEmision;
  document.getElementById("bioSignature").textContent = match.signature;
  document.getElementById("bioPhoto").src = match.foto;
}

function fillReniecSearch(dni) {
  document.getElementById("reniecDniSearch").value = dni;
  buscarEnReniec();
}

function buscarEnSunat() {
  const query = document.getElementById("sunatRucSearch").value.trim();
  if (query !== "20100130204") {
    alert("Consulta PIDE-SUNAT: Mostrando los datos oficiales correspondientes al Banco BBVA Perú S.A. (RUC 20100130204).");
  }
  document.getElementById("sunatRucSearch").value = "20100130204";
}

function fillSunatSearch(ruc) {
  document.getElementById("sunatRucSearch").value = ruc;
  buscarEnSunat();
}

// ==========================================================================
// ASISTENTE VIRTUAL CHATBOT IA INDECOPI (PROTECCIÓN AL CONSUMIDOR)
// ==========================================================================
function toggleSanibotChat() {
  const chatBox = document.getElementById("sanibotChatBox");
  chatBox.classList.toggle("hidden");
  if (!chatBox.classList.contains("hidden")) {
    document.getElementById("chatInputText").focus();
  }
}

function agregarMensajeChatbot(texto) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble bot";
  bubble.innerHTML = formatearTexto(texto);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
const agregarMensajeSanibot = agregarMensajeChatbot;

function enviarMensajeChat() {
  const inputEl = document.getElementById("chatInputText");
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  const chatMessages = document.getElementById("chatMessages");
  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user";
  userBubble.textContent = text;
  chatMessages.appendChild(userBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    const respuesta = responderConsultaChatbot(text);
    agregarMensajeChatbot(respuesta);
  }, 600);
}

function sendSuggestedMessage(text) {
  document.getElementById("chatInputText").value = text;
  enviarMensajeChat();
}

function responderConsultaChatbot(query) {
  const q = query.toLowerCase();

  // 1. Marco Normativo General / Base Legal
  if (q.includes("marco normativo") || q.includes("base legal") || q.includes("leyes") || q.includes("normas") || q.includes("normativa")) {
    return "El marco normativo aplicable al **Expediente N.° 14-2026/CPC-INDECOPI-PUN** comprende:<br><br>" +
      "• **Ley N.° 29571 (Código de Protección y Defensa del Consumidor):** Deber de idoneidad en servicios financieros (Art. 19), medidas correctivas de restitución patrimonial y régimen sancionador.<br>" +
      "• **TUO de la Ley N.° 27444 (Ley del Procedimiento Administrativo General):** Principios del debido procedimiento, verdad material y plazo perentorio de 5 días para descargos.<br>" +
      "• **Decreto Legislativo N.° 1412 (Ley de Gobierno Digital):** Validez jurídica del Expediente Administrativo Electrónico (EAE) e interoperabilidad PIDE con RENIEC y SUNAT.<br>" +
      "• **Ley N.° 29733 (Ley de Protección de Datos Personales):** Disociación obligatoria de datos sensibles del denunciante y confidencialidad procesal.<br>" +
      "• **Ley N.° 27269 y D. Leg. N.° 1308:** Validez de Firmas Digitales con sello de tiempo y notificaciones en Casilla Única Electrónica (CUE).";
  }

  // 2. TUO Ley 27444 / Debido Procedimiento / Descargo
  if (q.includes("27444") || q.includes("procedimiento administrativo general") || q.includes("lpag") || q.includes("debido procedimiento")) {
    return "Bajo el **TUO de la Ley N.° 27444 (D.S. N.° 004-2019-JUS)**, se rigen las garantías del PAS: la Resolución N.° 01 formula cargos e imputaciones, otorgando al Banco BBVA un plazo legal de 5 días hábiles para presentar descargos (Fojas 016-022), respetando la presunción de licitud y la separación funcional entre la instrucción y la sanción final.";
  }

  // 3. D. Leg. 1412 / Gobierno Digital / PIDE / Interoperabilidad
  if (q.includes("1412") || q.includes("gobierno digital") || q.includes("pide") || q.includes("interoperabilidad")) {
    return "El **Decreto Legislativo N.° 1412 (Ley de Gobierno Digital)** fundamenta la equivalencia funcional del Expediente Administrativo Electrónico (EAE) y la interoperabilidad mediante la **PIDE**, permitiendo consultar en línea sin costo para el administrado la personería en RENIEC (identidad) y SUNAT (RUC y domicilio fiscal).";
  }

  // 4. Ley 29733 / Datos Personales / Disociación / Secreto Bancario
  if (q.includes("29733") || q.includes("datos") || q.includes("proteccion") || q.includes("anonimizado") || q.includes("disociad") || q.includes("secreto bancario")) {
    return "En cumplimiento estricto de la **Ley N.° 29733 (Ley de Protección de Datos Personales)**, todos los datos sensibles del denunciante (número completo de DNI, dirección domiciliaria y cuentas de ahorros) se encuentran disociados bajo la etiqueta `[DATO RESERVADO - LEY 29733]`. A su vez, los estados de cuenta presentados por el BBVA gozan de reserva por secreto bancario (Art. 140 Ley 26702).";
  }

  // 5. Materia / Idoneidad / Ley 29571
  if (q.includes("materia") || q.includes("caso") || q.includes("expediente") || q.includes("idoneidad") || q.includes("29571") || q.includes("consumidor")) {
    return "El **Expediente N.° 14-2026/CPC-INDECOPI-PUN** versa sobre **Falta de Idoneidad en el Servicio (Art. 19 de la Ley N.° 29571)** en la actividad de intermediación monetaria, por tres transferencias interbancarias no autorizadas que sumaron **S/ 60,000.00** a favor de Terasys Perú S.A.C. desde la cuenta del denunciante D******* P**** C*******.";
  }

  // 6. Sanción / BBVA / Multa / Resolución Final
  if (q.includes("sancion") || q.includes("bbva") || q.includes("multa") || q.includes("resolución final") || q.includes("142-2026") || q.includes("087-2026") || q.includes("medida correctiva")) {
    return "Mediante la **Resolución Final N.° 087-2026/CPC-INDECOPI-PUN** suscrita por William Paz Casapía Guisberth, la Comisión declaró fundada la denuncia y sancionó a **BANCO BBVA PERÚ S.A.** con una multa de **22.97 UIT (S/ 126,335.00)**, ordenando como medida correctiva la devolución inmediata de los **S/ 60,000.00** debitados más intereses legales y el reembolso de costas y costos (S/ 36.00).";
  }

  // 7. Cronología de 13 Actos
  if (q.includes("13 actos") || q.includes("6 actos") || q.includes("actos") || q.includes("cronologia") || q.includes("secuencia") || q.includes("fojas")) {
    return "Las 13 actuaciones procesales registradas en el PAS abarcan desde la Denuncia formal (Fojas 001 - 042) hasta la Resolución Final N.° 087-2026/CPC-INDECOPI-PUN (Fojas 196 - 288), sumando **288 fojas** digitalizadas con Firma Digital Calificada (Ley N.° 27269) y validación CVD.";
  }

  // 8. Casilla CUE / Notificaciones / D.L. 1308
  if (q.includes("cue") || q.includes("notificacion") || q.includes("casilla") || q.includes("1308")) {
    return "Conforme al **Decreto Legislativo N.° 1308**, las notificaciones administrativas tienen eficacia jurídica al ser depositadas en la **Casilla Única Electrónica (CUE)**. Los plazos procesales se computan a partir del primer día hábil siguiente a la fecha del depósito.";
  }

  // 9. Roles / Permisos RBAC
  if (q.includes("rol") || q.includes("permiso") || q.includes("rbac") || q.includes("subir")) {
    return `Su perfil activo es **${currentUserRole === 'CIUDADANO' ? 'Ciudadano / Administrado (Solo Lectura)' : 'Funcionario INDECOPI (Gestión Total)'}**. ${currentUserRole === 'CIUDADANO' ? 'Puede consultar y descargar los actuados públicos del expediente.' : 'Cuenta con facultades para incorporar piezas procesales y emitir notificaciones en Casilla CUE.'}`;
  }

  return "Como asistente técnico de INDECOPI, le oriento que las actuaciones del PAS cuentan con sustento en la **Ley N.° 29571**, **TUO de la Ley N.° 27444**, **D. Leg. N.° 1412** y **Ley N.° 29733**, con plena autenticidad probatoria respaldada en **Firma Digital Calificada (Ley N.° 27269)** y **Código CVD** oficial.";
}
const responderConsultaSanibot = responderConsultaChatbot;

function formatearTexto(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}
