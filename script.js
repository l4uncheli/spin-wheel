const canvas = document.getElementById("wheelCanvas");
const context = canvas.getContext("2d");

const sectorList = document.getElementById("sectorList");
const rigSelect = document.getElementById("rigSelect");
const spinButton = document.getElementById("spinButton");
const rigButton = document.getElementById("rigButton");
const addSectorButton = document.getElementById("addSectorButton");
const resultText = document.getElementById("resultText");

const wheelColors = [
  "#E76F51",
  "#F4A261",
  "#E9C46A",
  "#2A9D8F",
  "#457B9D",
  "#8D5A97",
  "#EF476F",
  "#118AB2",
  "#06D6A0",
  "#FF8C42",
];

const state = {
  sectors: [
    "Пицца",
    "Кино",
    "Прогулка",
    "Кофе",
    "Суши",
    "Игры",
    "Подарок",
    "Выходной",
  ],
  rotation: 0,
  spinning: false,
  animationFrameId: 0,
};

const wheelConfig = {
  size: canvas.width,
  center: canvas.width / 2,
  radius: canvas.width / 2 - 30,
};

// Плавное замедление, чтобы колесо останавливалось естественно.
function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function normalizeAngle(angle) {
  const fullCircle = Math.PI * 2;
  return ((angle % fullCircle) + fullCircle) % fullCircle;
}

function getSectorColor(index) {
  return wheelColors[index % wheelColors.length];
}

function sanitizeSectors() {
  const cleaned = state.sectors
    .map((sector) => sector.trim())
    .filter((sector) => sector.length > 0);

  state.sectors = cleaned.length > 0 ? cleaned : ["Новый сектор"];
}

function updateControlState() {
  const disabled = state.spinning;

  spinButton.disabled = disabled;
  rigButton.disabled = disabled;
  rigSelect.disabled = disabled;
  addSectorButton.disabled = disabled;

  const inputs = sectorList.querySelectorAll("input, button");
  inputs.forEach((element) => {
    element.disabled = disabled;
  });
}

function renderSectorList() {
  sectorList.innerHTML = "";

  state.sectors.forEach((sector, index) => {
    const item = document.createElement("div");
    item.className = "sector-item";

    const colorDot = document.createElement("div");
    colorDot.className = "sector-color";
    colorDot.style.background = getSectorColor(index);
    colorDot.title = `Цвет сектора ${index + 1}`;

    const input = document.createElement("input");
    input.className = "sector-input";
    input.type = "text";
    input.value = sector;
    input.placeholder = `Сектор ${index + 1}`;
    input.addEventListener("input", (event) => {
      state.sectors[index] = event.target.value;
      syncRigSelect();
      drawWheel();
    });
    input.addEventListener("blur", () => {
      sanitizeSectors();
      renderAll();
    });

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.title = `Удалить сектор ${index + 1}`;
    removeButton.addEventListener("click", () => {
      if (state.sectors.length === 1) {
        state.sectors[0] = "Новый сектор";
      } else {
        state.sectors.splice(index, 1);
      }

      renderAll();
    });

    item.append(colorDot, input, removeButton);
    sectorList.appendChild(item);
  });
}

function syncRigSelect() {
  const previousValue = rigSelect.value;
  rigSelect.innerHTML = "";

  state.sectors.forEach((sector, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = sector.trim() || `Сектор ${index + 1}`;
    rigSelect.appendChild(option);
  });

  if (rigSelect.options.length === 0) {
    return;
  }

  const hasPrevious = [...rigSelect.options].some(
    (option) => option.value === previousValue
  );

  rigSelect.value = hasPrevious ? previousValue : "0";
}

function drawWheel() {
  const { size, center, radius } = wheelConfig;
  const sectorCount = state.sectors.length;
  const sliceAngle = (Math.PI * 2) / sectorCount;

  context.clearRect(0, 0, size, size);

  context.save();
  context.translate(center, center);
  context.rotate(state.rotation);

  for (let index = 0; index < sectorCount; index += 1) {
    const startAngle = -Math.PI / 2 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = getSectorColor(index);
    context.fill();

    context.lineWidth = 3;
    context.strokeStyle = "rgba(255, 248, 238, 0.85)";
    context.stroke();

    context.save();
    context.rotate(startAngle + sliceAngle / 2);
    context.textAlign = "right";
    context.fillStyle = "#fffaf4";
    context.font = "700 30px Segoe UI";
    context.shadowColor = "rgba(0, 0, 0, 0.18)";
    context.shadowBlur = 8;

    const label = state.sectors[index].trim() || `Сектор ${index + 1}`;
    const shortened = label.length > 16 ? `${label.slice(0, 14)}...` : label;
    context.fillText(shortened, radius - 28, 10);
    context.restore();
  }

  context.restore();

  context.beginPath();
  context.arc(center, center, 34, 0, Math.PI * 2);
  context.fillStyle = "#fff7ea";
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = "#8f3f24";
  context.stroke();
}

function getResultIndex() {
  const sliceAngle = (Math.PI * 2) / state.sectors.length;
  // Определяем, какой сектор сейчас находится под верхним указателем.
  const angleFromTop = normalizeAngle(-state.rotation);
  return Math.floor(angleFromTop / sliceAngle) % state.sectors.length;
}

function setResultText(text) {
  resultText.textContent = text;
}

function finishSpin() {
  const resultIndex = getResultIndex();
  const resultLabel = state.sectors[resultIndex].trim() || `Сектор ${resultIndex + 1}`;
  state.spinning = false;
  updateControlState();
  setResultText(`Выпал сектор: ${resultLabel}`);
}

function animateSpin(targetRotation, duration) {
  cancelAnimationFrame(state.animationFrameId);
  state.spinning = true;
  updateControlState();

  const startRotation = state.rotation;
  const rotationDelta = targetRotation - startRotation;
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    state.rotation = startRotation + rotationDelta * eased;
    drawWheel();

    if (progress < 1) {
      state.animationFrameId = requestAnimationFrame(frame);
      return;
    }

    state.rotation = normalizeAngle(targetRotation);
    drawWheel();
    finishSpin();
  }

  state.animationFrameId = requestAnimationFrame(frame);
}

function createRandomSpinTarget() {
  const fullSpins = 6 + Math.floor(Math.random() * 3);
  const extraAngle = Math.random() * Math.PI * 2;
  return state.rotation + fullSpins * Math.PI * 2 + extraAngle;
}

function createRiggedSpinTarget(targetIndex) {
  const sectorCount = state.sectors.length;
  const sliceAngle = (Math.PI * 2) / sectorCount;

  const fullSpins = 7 + Math.floor(Math.random() * 2);
  const centerOfTarget = targetIndex * sliceAngle + sliceAngle / 2;

  // Небольшой случайный сдвиг оставляет остановку визуально естественной,
  // но гарантирует, что указатель останется внутри нужного сектора.
  const safeOffset = (Math.random() - 0.5) * sliceAngle * 0.54;
  const normalizedTarget = -(centerOfTarget + safeOffset);

  const currentNormalized = normalizeAngle(state.rotation);
  const targetNormalized = normalizeAngle(normalizedTarget);
  const delta = normalizeAngle(targetNormalized - currentNormalized);

  return state.rotation + fullSpins * Math.PI * 2 + delta;
}

function renderAll() {
  sanitizeSectors();
  renderSectorList();
  syncRigSelect();
  drawWheel();
  updateControlState();
}

spinButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  setResultText("Колесо крутится...");
  animateSpin(createRandomSpinTarget(), 5200);
});

rigButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  const targetIndex = Number(rigSelect.value);
  const targetLabel = state.sectors[targetIndex]?.trim() || `Сектор ${targetIndex + 1}`;

  setResultText(`Подкрутка активна: колесо остановится на «${targetLabel}».`);
  animateSpin(createRiggedSpinTarget(targetIndex), 5600);
});

addSectorButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  state.sectors.push(`Сектор ${state.sectors.length + 1}`);
  renderAll();
});

window.addEventListener("resize", drawWheel);

renderAll();
