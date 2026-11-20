"use strict";

const factors = Object.freeze({
  lactico: 0.1000,
  acetico: 0.0667,
  "citrico-anhidro": 0.0711,
  "citrico-monohidratado": 0.0778
});

// perBase: unidades de cada tipo que caben en la unidad base (1 L = 1000 mL, 1 kg = 1000 g).
const quantityUnits = Object.freeze({
  L: { base: "L", perBase: 1 },
  mL: { base: "L", perBase: 1000 },
  kg: { base: "kg", perBase: 1 },
  g: { base: "kg", perBase: 1000 },
  mg: { base: "kg", perBase: 1000000 }
});

const byId = (id) => document.getElementById(id);
const form = byId("calculator-form");
const acid = byId("acid");
const modePh = byId("mode-ph");
const phFactor = byId("ph-factor");
const pilotSection = byId("pilot");
const usePilot = byId("use-pilot");
const pilotFields = byId("pilot-fields");
const pilotStatus = byId("pilot-status");
const formError = byId("form-error");
const resultMass = byId("result-mass");
const massValue = byId("mass-value");
const resultMode = byId("result-mode");
const resultMessage = byId("result-message");
const resultDelta = byId("result-delta");
const resultFactor = byId("result-factor");
const resultWork = byId("result-work");
const placeholder = "—";
const defaultDensityNote = "Densidad medida de la crema. Se usa para pasar entre masa y volumen.";
const errors = new Map();

// Los formatos solo se usan para mostrar. Las casillas editables nunca llevan separador de miles.
const gramsFormat = new Intl.NumberFormat("es", {
  useGrouping: false,
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
});
const deltaFormat = new Intl.NumberFormat("es", { useGrouping: false, maximumFractionDigits: 4 });
const factorFormat = new Intl.NumberFormat("es", {
  useGrouping: false,
  minimumFractionDigits: 4,
  maximumFractionDigits: 6
});
const scientificFormat = new Intl.NumberFormat("es", {
  notation: "scientific",
  maximumFractionDigits: 4
});
const editableFormat = new Intl.NumberFormat("es", { useGrouping: false, maximumSignificantDigits: 15 });

function spaceGroups(text) {
  return text.replace(/^\d+/, (integer) => integer.replace(/\B(?=(\d{3})+(?!\d))/g, " "));
}

function formatValue(value, formatter) {
  const scientific = value >= 1e9 || (value > 0 && value < 0.0001);
  return spaceGroups((scientific ? scientificFormat : formatter).format(value));
}

function number(value) {
  return formatValue(value, deltaFormat);
}

// Elimina el ruido de punto flotante de restas como 6,6 − 6,3.
function cleanNumber(value) {
  return Number(value.toPrecision(12));
}

const decimalPattern = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;

function parseDecimal(raw) {
  const text = raw.trim();
  return decimalPattern.test(text) ? Number(text.replace(",", ".")) : NaN;
}

function showError(field, message) {
  if (errors.has(field)) {
    return;
  }
  const description = field.getAttribute("aria-describedby");
  const error = document.createElement("span");
  error.className = "field-error";
  error.id = `${field.id}-error`;
  error.textContent = message;
  field.closest(".field").append(error);
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", description ? `${description} ${error.id}` : error.id);
  errors.set(field, { error, description });
}

function clearErrors() {
  for (const [field, { error, description }] of errors) {
    field.removeAttribute("aria-invalid");
    if (description) {
      field.setAttribute("aria-describedby", description);
    } else {
      field.removeAttribute("aria-describedby");
    }
    error.remove();
  }
  errors.clear();
  formError.hidden = true;
  formError.textContent = "";
}

function readDecimal(id, { positive = false, percent = false, ph = false } = {}) {
  const field = byId(id);
  const raw = field.value.trim();
  if (raw === "") {
    showError(field, "Completa este campo.");
    return null;
  }

  const value = parseDecimal(raw);
  if (!Number.isFinite(value) || (value === 0 && /[1-9]/.test(raw))) {
    showError(field, "Escribe un número válido de 0 o más, sin separador de miles.");
    return null;
  }
  if (percent && (value <= 0 || value > 100)) {
    showError(field, "Ingresa un porcentaje mayor que 0 y hasta 100.");
    return null;
  }
  if (ph && value > 14) {
    showError(field, "Ingresa un pH entre 0 y 14.");
    return null;
  }
  if (positive && value <= 0) {
    showError(field, "Ingresa un valor mayor que 0.");
    return null;
  }
  return value;
}

/* ---------- Cantidades con unidad y conversión ---------- */

function createQuantity(ids) {
  const select = byId(ids.unit);
  return {
    input: byId(ids.input),
    select,
    densityField: byId(ids.densityField),
    densityInput: byId(ids.density),
    applyButton: byId(ids.apply),
    note: byId(ids.note),
    unit: select.value, // unidad confirmada; el selector puede ir por delante mientras falta la densidad
    exact: null,        // cantidad física sin redondear tras una conversión
    pending: null       // unidad solicitada que espera una densidad válida
  };
}

const batch = createQuantity({
  input: "volume", unit: "batch-unit", densityField: "density-field",
  density: "density", apply: "density-apply", note: "density-note"
});
const pilot = createQuantity({
  input: "pilot-volume", unit: "pilot-unit", densityField: "pilot-density-field",
  density: "pilot-density", apply: "pilot-density-apply", note: "pilot-density-note"
});
const quantities = [batch, pilot];

const baseOf = (unit) => quantityUnits[unit].base;
const isMass = (quantity) => baseOf(quantity.unit) === "kg";

// Cantidad física en la unidad base (L o kg). Usa el valor exacto si el texto no se editó.
function amountOf(quantity) {
  const text = quantity.input.value;
  const base = baseOf(quantity.unit);
  const exact = quantity.exact;
  if (exact && exact.unit === quantity.unit && exact.text === text) {
    return { amount: exact.amount, base };
  }
  const typed = parseDecimal(text);
  return Number.isFinite(typed) ? { amount: typed / quantityUnits[quantity.unit].perBase, base } : null;
}

function currentDensity() {
  const value = parseDecimal(batch.densityInput.value);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function changeBase(amount, from, to, density) {
  if (from === to || amount === 0) {
    return from === to ? amount : 0;
  }
  return from === "kg" ? amount / density : amount * density;
}

function setDensityNote(quantity, message = defaultDensityNote) {
  quantity.note.textContent = message;
}

function syncDensityUi(quantity) {
  const visible = isMass(quantity) || quantity.pending !== null;
  quantity.densityField.hidden = !visible;
  quantity.densityInput.disabled = !visible;
  quantity.applyButton.hidden = quantity.pending === null;
  if (quantity.pending !== null) {
    quantity.applyButton.textContent = `Convertir a ${quantity.pending}`;
  }
}

function cancelPending(quantity) {
  quantity.pending = null;
  setDensityNote(quantity);
}

function resetQuantity(quantity) {
  quantity.select.value = "L";
  quantity.unit = "L";
  quantity.exact = null;
  cancelPending(quantity);
}

function commitUnit(quantity, unit, baseAmount) {
  quantity.unit = unit;
  quantity.select.value = unit;
  if (baseAmount === null) {
    quantity.exact = null;
  } else {
    const text = editableFormat.format(baseAmount * quantityUnits[unit].perBase);
    quantity.input.value = text;
    quantity.exact = { text, unit, amount: baseAmount };
  }
  setDensityNote(quantity);
  setFieldVisibility();
}

function changeUnit(quantity) {
  const next = quantity.select.value;
  const previous = quantity.unit;
  cancelPending(quantity);
  if (next === previous) {
    setFieldVisibility();
    return;
  }

  const current = amountOf(quantity);
  if (current === null) {
    commitUnit(quantity, next, null); // casilla vacía o inválida: no hay número que convertir
    return;
  }

  const targetBase = baseOf(next);
  const density = currentDensity();
  if (current.base !== targetBase && current.amount !== 0 && density === null) {
    quantity.select.value = previous; // conserva el número y la unidad anteriores
    quantity.pending = next;
    setDensityNote(quantity, `Para pasar de ${previous} a ${next} escribe la densidad de la crema. Se conserva ${quantity.input.value.trim()} ${previous} hasta convertir.`);
    setFieldVisibility();
    if (quantity.densityInput.value.trim() !== "") {
      showError(quantity.densityInput, "Escribe una densidad válida mayor que 0, en kg/L.");
    }
    quantity.densityInput.focus();
    return;
  }
  commitUnit(quantity, next, changeBase(current.amount, current.base, targetBase, density));
}

function applyPending(quantity) {
  if (quantity.pending === null) {
    return;
  }
  clearErrors();
  const density = readDecimal(quantity.densityInput.id, { positive: true });
  if (density === null) {
    quantity.densityInput.focus();
    return;
  }
  const next = quantity.pending;
  quantity.pending = null;
  const current = amountOf(quantity);
  commitUnit(quantity, next, current === null ? null : changeBase(current.amount, current.base, baseOf(next), density));
}

function readQuantity(quantity) {
  const typed = readDecimal(quantity.input.id, { positive: true });
  if (typed === null) {
    return null;
  }
  const { amount, base } = amountOf(quantity);
  return { amount, base, typed, unit: quantity.unit };
}

function toLiters(entry, density) {
  return entry.base === "L" ? entry.amount : entry.amount / density;
}

function quantityText({ typed, unit }, liters) {
  const entered = `${number(typed)} ${unit}`;
  return unit === "L" ? entered : `${entered} equivalen a ${number(liters)} L`;
}

/* ---------- Modo, piloto y resultado ---------- */

function clearResult() {
  if (massValue.textContent !== placeholder) {
    massValue.textContent = placeholder;
  }
  resultMass.classList.remove("mass-long");
  resultMode.hidden = true;
  resultMessage.textContent = "Completa los datos del lote para obtener la dosis.";
  resultDelta.textContent = placeholder;
  resultFactor.textContent = placeholder;
  resultWork.hidden = true;
}

function usesPilot() {
  return !modePh.checked && usePilot.checked;
}

function setFieldVisibility() {
  pilotFields.hidden = !usesPilot();
  pilotFields.disabled = !usesPilot();
  quantities.forEach(syncDensityUi);
}

function updateMode() {
  const ph = modePh.checked;
  document.querySelectorAll("[data-dornic]").forEach((element) => {
    element.textContent = ph ? element.dataset.ph : element.dataset.dornic;
  });
  document.body.dataset.mode = ph ? "ph" : "dornic";
  pilotSection.hidden = ph;
  usePilot.disabled = ph;
  byId("ph-factor-field").hidden = !ph;
  phFactor.disabled = !ph;
  byId("method-dornic").hidden = ph;
  byId("method-ph").hidden = !ph;
  setFieldVisibility();
  clearResult();
}

function resetPilot() {
  const pilotInputs = [...pilotFields.querySelectorAll("input:not(.density-input)")];
  const hadMeasurements = usePilot.checked || pilotInputs.some((field) => field.value !== "");
  usePilot.checked = false;
  pilotInputs.forEach((field) => { field.value = ""; });
  resetQuantity(pilot);
  return hadMeasurements;
}

function readPilot() {
  const quantity = readQuantity(pilot);
  const initial = readDecimal("pilot-initial");
  const final = readDecimal("pilot-final");
  const mass = readDecimal("pilot-mass", { positive: true });
  const purity = readDecimal("pilot-purity", { percent: true });
  const delta = initial !== null && final !== null ? cleanNumber(final - initial) : NaN;
  if (initial !== null && final !== null && delta <= 0) {
    showError(byId("pilot-final"), "La acidez medida debe ser mayor que la inicial.");
  }
  return { quantity, delta, mass, purity };
}

function renderResult({ mass, delta, mode, detail, steps }) {
  const massText = formatValue(mass, gramsFormat);
  massValue.textContent = massText;
  resultMass.classList.toggle("mass-long", massText.length > 9);
  resultMode.textContent = mode;
  resultMode.hidden = false;
  resultDelta.textContent = modePh.checked ? number(delta) : `${number(delta)} °D`;
  resultFactor.textContent = detail;
  resultMessage.textContent = delta === 0
    ? "La medición objetivo ya coincide con la inicial."
    : `De producto comercial · ${acid.selectedOptions[0].textContent.toLowerCase()}`;
  byId("worked-steps").replaceChildren(...steps.map((step) => {
    const element = document.createElement("li");
    element.textContent = step;
    return element;
  }));
  resultWork.hidden = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  byId("result-card").scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
}

function showValidationErrors() {
  const fields = [...errors.keys()].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  if (fields.some((field) => pilotFields.contains(field))) {
    pilotSection.open = true;
  }
  formError.textContent = "Revisa los campos indicados para calcular la dosis.";
  formError.hidden = false;
  fields[0].focus();
}

function estimateDose(lot, pilotData, referenceFactor, quantityStep) {
  const ph = modePh.checked;
  const factor = pilotData
    ? (pilotData.mass * (pilotData.purity / 100)) / (pilotData.normalized * pilotData.delta)
    : referenceFactor;
  const mass = lot.normalized * lot.delta * factor / (lot.purity / 100);
  const factorUnit = ph ? "g/L/pH" : "g/L/°D";
  const factorText = `${formatValue(factor, factorFormat)} ${factorUnit}`;
  const changeStep = ph
    ? `Bajada deseada. ${number(lot.initial)} − ${number(lot.target)} = ${number(lot.delta)} unidades de pH.`
    : `Aumento deseado. ${number(lot.target)} − ${number(lot.initial)} = ${number(lot.delta)} °D.`;
  let factorStep = `Factor teórico del ácido seleccionado. ${factorText}.`;
  if (ph) {
    factorStep = `Factor de pH ingresado. ${factorText}.`;
  } else if (pilotData) {
    factorStep = `Factor del piloto. (${number(pilotData.mass)} g × ${number(pilotData.purity)} ÷ 100) ÷ (${number(pilotData.normalized)} L × ${number(pilotData.delta)} °D) ≈ ${factorText}.`;
  }
  return {
    mass,
    delta: lot.delta,
    mode: ph ? "Factor de pH" : (pilotData ? "Factor piloto" : "Factor teórico"),
    detail: factorText,
    steps: [
      quantityStep,
      changeStep,
      factorStep,
      `Dosis comercial. ${number(lot.normalized)} L × ${number(lot.delta)} ${ph ? "pH" : "°D"} × ${factorText} ÷ (${number(lot.purity)} ÷ 100) ≈ ${formatValue(mass, gramsFormat)} g.`
    ]
  };
}

/* ---------- Eventos ---------- */

form.addEventListener("input", () => {
  byId("clear-status").textContent = "";
  clearErrors();
  clearResult();
  setFieldVisibility();
});

form.addEventListener("change", (event) => {
  if (event.target.name === "mode") {
    byId("initial").value = "";
    byId("target").value = "";
    phFactor.value = "";
    resetPilot();
    cancelPending(batch);
    pilotStatus.textContent = "";
    pilotSection.open = false;
    updateMode();
  }
});

for (const quantity of quantities) {
  quantity.select.addEventListener("change", () => changeUnit(quantity));
  quantity.applyButton.addEventListener("click", () => applyPending(quantity));
  quantity.densityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && quantity.pending !== null) {
      event.preventDefault();
      applyPending(quantity);
    }
  });
  // La densidad es una sola; las dos casillas se mantienen iguales.
  quantity.densityInput.addEventListener("input", () => {
    for (const other of quantities) {
      other.densityInput.value = quantity.densityInput.value;
    }
  });
}

acid.addEventListener("change", () => {
  phFactor.value = "";
  if (resetPilot()) {
    pilotStatus.textContent = "Cambió el ácido. Ingresa las mediciones del piloto para el nuevo ácido.";
  }
  setFieldVisibility();
});

usePilot.addEventListener("change", () => {
  pilotStatus.textContent = "";
  setFieldVisibility();
});

byId("clear-form").addEventListener("click", () => {
  const keepPh = modePh.checked;
  form.reset();
  if (keepPh) {
    modePh.checked = true;
  }
  quantities.forEach(resetQuantity);
  pilotSection.open = false;
  pilotStatus.textContent = "";
  resultWork.open = false;
  byId("worked-steps").replaceChildren();
  clearErrors();
  updateMode();
  byId("volume").focus();
  byId("clear-status").textContent = "Se borraron los datos y el resultado.";
});

updateMode();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();
  clearResult();

  const ph = modePh.checked;
  const lotQuantity = readQuantity(batch);
  const initial = readDecimal("initial", { ph });
  const target = readDecimal("target", { ph });
  const purity = readDecimal("purity", { percent: true });
  const referenceFactor = factors[acid.value];

  if (!Number.isFinite(referenceFactor)) {
    showError(acid, "Selecciona un tipo de ácido.");
  }
  const hasMeasurements = initial !== null && target !== null;
  const delta = hasMeasurements ? cleanNumber(ph ? initial - target : target - initial) : NaN;
  if (hasMeasurements && delta < 0) {
    showError(byId("target"), ph
      ? "Agregar ácido baja el pH. Usa un objetivo igual o menor que el pH inicial."
      : "Agregar ácido solo permite aumentar los °D. Usa un objetivo igual o mayor que la acidez inicial.");
  }

  if (hasMeasurements && delta === 0) {
    if (errors.size > 0) {
      showValidationErrors();
      return;
    }
    renderResult({ mass: 0, delta, mode: "Sin adición", detail: placeholder, steps: ["La medición inicial coincide con el objetivo. La dosis es 0 g."] });
    return;
  }

  const factor = ph ? readDecimal("ph-factor", { positive: true }) : referenceFactor;
  const pilotData = usesPilot() ? readPilot() : null;
  const densitySource = isMass(batch) ? batch : (pilotData && isMass(pilot) ? pilot : null);
  const density = densitySource ? readDecimal(densitySource.densityInput.id, { positive: true }) : null;
  if (errors.size > 0) {
    showValidationErrors();
    return;
  }

  const normalized = toLiters(lotQuantity, density);
  const lot = { normalized, initial, target, delta, purity };
  const checked = [normalized];
  let quantityStep = `Cantidad del lote. ${quantityText(lotQuantity, normalized)}.`;
  if (pilotData) {
    pilotData.normalized = toLiters(pilotData.quantity, density);
    checked.push(pilotData.normalized);
    quantityStep += ` Cantidad del piloto. ${quantityText(pilotData.quantity, pilotData.normalized)}.`;
  }
  if (density !== null) {
    quantityStep += ` Para pasar de kg a L, se divide entre ${number(density)} kg/L.`;
  }

  const result = estimateDose(lot, pilotData, factor, quantityStep);
  if (![...checked, result.mass].every((value) => Number.isFinite(value) && value > 0)) {
    formError.textContent = "El cálculo queda fuera del rango numérico. Revisa la escala y las unidades de los datos.";
    formError.hidden = false;
    return;
  }

  renderResult(result);
});
