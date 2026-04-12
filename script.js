const canvas = document.getElementById("wheelCanvas");
const context = canvas.getContext("2d");

const sectorList = document.getElementById("sectorList");
const spinButton = document.getElementById("spinButton");
const addSectorButton = document.getElementById("addSectorButton");
const resultText = document.getElementById("resultText");
const tabList = document.getElementById("tabList");

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

// Здесь настраивается скрытая логика зависимых результатов между вкладками.
// Ключ — результат из первой вкладки, значения — что должно выпасть во 2 и 3 вкладках.
const crossTabRigRules = {
  "елисей": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
  "арина": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
  "аня": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
  "геля": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
  "петя": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
  "настя": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
  "ваня": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
};

const state = {
  tabs: [
    createTab("Имена", [
      "Вариант 1",
      "Вариант 2",
      "Вариант 3",
      "Вариант 4",
    ]),
    createTab("Тональность", [
      "C-dur",
      "G-dur",
      "D-dur",
      "A-dur",
      "E-dur",
      "H-dur",
      "Fis-dur",
      "Cis-dur",
      "F-dur",
      "B-dur",
      "Es-dur",
      "As-dur",
      "Des-dur",
      "Ges-dur",
      "Ces-dur",
      "a-moll",
      "e-moll",
      "h-moll",
      "fis-moll",
      "cis-moll",
      "gis-moll",
      "dis-moll",
      "ais-moll",
      "d-moll",
      "g-moll",
      "c-moll",
      "f-moll",
      "b-moll",
      "es-moll",
      "as-moll",
    ]),
    createTab("Модуляция", [
      "Тональность II ст.",
      "Тональность III ст.",
      "Тональность IV ст.",
      "Тональность V ст.",
      "Тональность VI ст.",
      "Тональность VII ст."
    ]),
  ],
  activeTabId: 1,
  spinning: false,
  animationFrameId: 0,
};

const wheelConfig = {
  size: canvas.width,
  center: canvas.width / 2,
  radius: canvas.width / 2 - 30,
};

function createTab(name, sectors) {
  createTab.nextId = (createTab.nextId || 0) + 1;

  return {
    id: createTab.nextId,
    name,
    sectors: sectors.slice(),
    rotation: 0,
    lastResult: "",
  };
}

// Плавное замедление, чтобы колесо останавливалось естественно.
function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function normalizeAngle(angle) {
  const fullCircle = Math.PI * 2;
  return ((angle % fullCircle) + fullCircle) % fullCircle;
}

function normalizeLabel(label) {
  return label.trim().toLowerCase();
}

function getSectorColor(index) {
  return wheelColors[index % wheelColors.length];
}

function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0];
}

function getTabById(tabId) {
  return state.tabs.find((tab) => tab.id === tabId);
}

function sanitizeSectors(tab = getActiveTab()) {
  const cleaned = tab.sectors
    .map((sector) => sector.trim())
    .filter((sector) => sector.length > 0);

  tab.sectors = cleaned.length > 0 ? cleaned : ["Новый сектор"];
}

function updateControlState() {
  const disabled = state.spinning;

  spinButton.disabled = disabled;
  addSectorButton.disabled = disabled;

  const inputs = sectorList.querySelectorAll("input, button");
  inputs.forEach((element) => {
    element.disabled = disabled;
  });

  const tabButtons = tabList.querySelectorAll("button");
  tabButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

function renderTabs() {
  tabList.innerHTML = "";

  state.tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.className = `tab-button${tab.id === state.activeTabId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>${tab.name}</span>
      <span class="tab-count">${tab.sectors.length} сект.</span>
    `;

    button.addEventListener("click", () => {
      if (state.spinning) {
        return;
      }

      state.activeTabId = tab.id;
      renderAll();
    });

    tabList.appendChild(button);
  });
}

function renderSectorList() {
  const activeTab = getActiveTab();
  sectorList.innerHTML = "";

  activeTab.sectors.forEach((sector, index) => {
    const item = document.createElement("div");
    item.className = "sector-item";

    const colorDot = document.createElement("div");
    colorDot.className = "sector-color";
    colorDot.style.background = getSectorColor(index);

    const input = document.createElement("input");
    input.className = "sector-input";
    input.type = "text";
    input.value = sector;
    input.placeholder = `Сектор ${index + 1}`;
    input.addEventListener("input", (event) => {
      activeTab.sectors[index] = event.target.value;
      drawWheel();
      renderTabs();
    });
    input.addEventListener("blur", () => {
      sanitizeSectors(activeTab);
      renderAll();
    });

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.title = `Удалить сектор ${index + 1}`;
    removeButton.addEventListener("click", () => {
      if (activeTab.sectors.length === 1) {
        activeTab.sectors[0] = "Новый сектор";
      } else {
        activeTab.sectors.splice(index, 1);
      }

      sanitizeSectors(activeTab);
      renderAll();
    });

    item.append(colorDot, input, removeButton);
    sectorList.appendChild(item);
  });
}

function drawWheel() {
  const activeTab = getActiveTab();
  const { size, center, radius } = wheelConfig;
  const sectorCount = activeTab.sectors.length;
  const sliceAngle = (Math.PI * 2) / sectorCount;

  context.clearRect(0, 0, size, size);

  context.save();
  context.translate(center, center);
  context.rotate(activeTab.rotation);

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

    const label = activeTab.sectors[index].trim() || `Сектор ${index + 1}`;
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

function getResultIndex(tab = getActiveTab()) {
  const sliceAngle = (Math.PI * 2) / tab.sectors.length;
  const angleFromTop = normalizeAngle(-tab.rotation);
  return Math.floor(angleFromTop / sliceAngle) % tab.sectors.length;
}

function setResultText(text) {
  resultText.textContent = text;
}

function findRiggedTargetIndex(tab) {
  if (tab.id === 1) {
    return -1;
  }

  const baseTab = getTabById(1);
  const baseResult = normalizeLabel(baseTab?.lastResult || "");
  const rule = crossTabRigRules[baseResult];

  if (!rule) {
    return -1;
  }

  const targetLabel = rule[tab.id];
  if (!targetLabel) {
    return -1;
  }

  return tab.sectors.findIndex(
    (sector) => normalizeLabel(sector) === normalizeLabel(targetLabel)
  );
}

function finishSpin() {
  const activeTab = getActiveTab();
  const resultIndex = getResultIndex(activeTab);
  const resultLabel = activeTab.sectors[resultIndex].trim() || `Сектор ${resultIndex + 1}`;

  activeTab.lastResult = resultLabel;
  state.spinning = false;
  updateControlState();
  setResultText(`Во вкладке «${activeTab.name}» выпал сектор: ${resultLabel}`);
}

function animateSpin(targetRotation, duration) {
  const activeTab = getActiveTab();

  cancelAnimationFrame(state.animationFrameId);
  state.spinning = true;
  updateControlState();

  const startRotation = activeTab.rotation;
  const rotationDelta = targetRotation - startRotation;
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    activeTab.rotation = startRotation + rotationDelta * eased;
    drawWheel();

    if (progress < 1) {
      state.animationFrameId = requestAnimationFrame(frame);
      return;
    }

    activeTab.rotation = normalizeAngle(targetRotation);
    drawWheel();
    finishSpin();
  }

  state.animationFrameId = requestAnimationFrame(frame);
}

function createRandomSpinTarget(tab) {
  const fullSpins = 6 + Math.floor(Math.random() * 3);
  const extraAngle = Math.random() * Math.PI * 2;
  return tab.rotation + fullSpins * Math.PI * 2 + extraAngle;
}

function createRiggedSpinTarget(tab, targetIndex) {
  const sliceAngle = (Math.PI * 2) / tab.sectors.length;
  const fullSpins = 8;
  const centerOfTarget = targetIndex * sliceAngle + sliceAngle / 2;
  const normalizedTarget = -centerOfTarget;
  const currentNormalized = normalizeAngle(tab.rotation);
  const targetNormalized = normalizeAngle(normalizedTarget);
  const delta = normalizeAngle(targetNormalized - currentNormalized);

  return tab.rotation + fullSpins * Math.PI * 2 + delta;
}

function getSpinPlan(tab) {
  const riggedIndex = findRiggedTargetIndex(tab);

  if (riggedIndex >= 0) {
    return {
      targetRotation: createRiggedSpinTarget(tab, riggedIndex),
      duration: 5600,
    };
  }

  return {
    targetRotation: createRandomSpinTarget(tab),
    duration: 5200,
  };
}

function renderAll() {
  const activeTab = getActiveTab();

  sanitizeSectors(activeTab);
  renderTabs();
  renderSectorList();
  drawWheel();
  updateControlState();
}

spinButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  const activeTab = getActiveTab();
  const spinPlan = getSpinPlan(activeTab);

  setResultText("Колесо крутится...");
  animateSpin(spinPlan.targetRotation, spinPlan.duration);
});

addSectorButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  const activeTab = getActiveTab();
  activeTab.sectors.push(`Сектор ${activeTab.sectors.length + 1}`);
  renderAll();
});

window.addEventListener("resize", drawWheel);

renderAll();
