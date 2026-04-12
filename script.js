const canvas = document.getElementById("wheelCanvas");
const context = canvas.getContext("2d");

const sectorList = document.getElementById("sectorList");
const spinButton = document.getElementById("spinButton");
const addSectorButton = document.getElementById("addSectorButton");
const resultText = document.getElementById("resultText");
const secretTrigger = document.getElementById("secretTrigger");

const tabList = document.getElementById("tabList");
const addTabButton = document.getElementById("addTabButton");
const removeTabButton = document.getElementById("removeTabButton");
const tabNameInput = document.getElementById("tabNameInput");

const secretRigCard = document.getElementById("secretRigCard");
const hiddenRigEnabled = document.getElementById("hiddenRigEnabled");
const hiddenRigTarget = document.getElementById("hiddenRigTarget");
const hiddenRigSpins = document.getElementById("hiddenRigSpins");
const hiddenRigDuration = document.getElementById("hiddenRigDuration");
const hiddenRigOffset = document.getElementById("hiddenRigOffset");
const hiddenRigOffsetValue = document.getElementById("hiddenRigOffsetValue");

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

const maxTabs = 3;

const state = {
  tabs: [
    createTab("Рулетка 1", [
      "Пицца",
      "Кино",
      "Прогулка",
      "Кофе",
      "Суши",
      "Игры",
      "Подарок",
      "Выходной",
    ]),
  ],
  activeTabId: 1,
  spinning: false,
  animationFrameId: 0,
  secretClickCount: 0,
  secretTimerId: 0,
  secretPanelVisible: false,
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
    rig: {
      enabled: false,
      targetIndex: 0,
      extraSpins: 8,
      duration: 5600,
      offsetPercent: 0,
    },
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

function getSectorColor(index) {
  return wheelColors[index % wheelColors.length];
}

function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0];
}

function sanitizeSectors(tab = getActiveTab()) {
  const cleaned = tab.sectors
    .map((sector) => sector.trim())
    .filter((sector) => sector.length > 0);

  tab.sectors = cleaned.length > 0 ? cleaned : ["Новый сектор"];

  if (tab.rig.targetIndex >= tab.sectors.length) {
    tab.rig.targetIndex = 0;
  }
}

function clampRigValues(tab = getActiveTab()) {
  tab.rig.extraSpins = Math.min(20, Math.max(4, Number(tab.rig.extraSpins) || 8));
  tab.rig.duration = Math.min(12000, Math.max(2000, Number(tab.rig.duration) || 5600));
  tab.rig.offsetPercent = Math.min(35, Math.max(-35, Number(tab.rig.offsetPercent) || 0));
}

function updateControlState() {
  const disabled = state.spinning;

  spinButton.disabled = disabled;
  addSectorButton.disabled = disabled;
  addTabButton.disabled = disabled || state.tabs.length >= maxTabs;
  removeTabButton.disabled = disabled || state.tabs.length === 1;
  tabNameInput.disabled = disabled;
  hiddenRigEnabled.disabled = disabled;
  hiddenRigTarget.disabled = disabled;
  hiddenRigSpins.disabled = disabled;
  hiddenRigDuration.disabled = disabled;
  hiddenRigOffset.disabled = disabled;

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

  state.tabs.forEach((tab, index) => {
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

    button.title = `Открыть вкладку ${index + 1}`;
    tabList.appendChild(button);
  });

  tabNameInput.value = getActiveTab().name;
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
    colorDot.title = `Цвет сектора ${index + 1}`;

    const input = document.createElement("input");
    input.className = "sector-input";
    input.type = "text";
    input.value = sector;
    input.placeholder = `Сектор ${index + 1}`;
    input.addEventListener("input", (event) => {
      activeTab.sectors[index] = event.target.value;
      syncHiddenRigFields();
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

function syncHiddenRigFields() {
  const activeTab = getActiveTab();
  const previousValue = String(activeTab.rig.targetIndex);
  hiddenRigTarget.innerHTML = "";

  activeTab.sectors.forEach((sector, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = sector.trim() || `Сектор ${index + 1}`;
    hiddenRigTarget.appendChild(option);
  });

  if (hiddenRigTarget.options.length > 0) {
    const hasPrevious = [...hiddenRigTarget.options].some(
      (option) => option.value === previousValue
    );

    hiddenRigTarget.value = hasPrevious ? previousValue : "0";
    activeTab.rig.targetIndex = Number(hiddenRigTarget.value);
  }

  hiddenRigEnabled.checked = activeTab.rig.enabled;
  hiddenRigSpins.value = String(activeTab.rig.extraSpins);
  hiddenRigDuration.value = String(activeTab.rig.duration);
  hiddenRigOffset.value = String(activeTab.rig.offsetPercent);
  hiddenRigOffsetValue.textContent = `${activeTab.rig.offsetPercent}%`;
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

function getResultIndex() {
  const activeTab = getActiveTab();
  const sliceAngle = (Math.PI * 2) / activeTab.sectors.length;
  const angleFromTop = normalizeAngle(-activeTab.rotation);
  return Math.floor(angleFromTop / sliceAngle) % activeTab.sectors.length;
}

function setResultText(text) {
  resultText.textContent = text;
}

function finishSpin() {
  const activeTab = getActiveTab();
  const resultIndex = getResultIndex();
  const resultLabel = activeTab.sectors[resultIndex].trim() || `Сектор ${resultIndex + 1}`;

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

function createRandomSpinTarget() {
  const activeTab = getActiveTab();
  const fullSpins = 6 + Math.floor(Math.random() * 3);
  const extraAngle = Math.random() * Math.PI * 2;
  return activeTab.rotation + fullSpins * Math.PI * 2 + extraAngle;
}

function createRiggedSpinTarget() {
  const activeTab = getActiveTab();
  const sectorCount = activeTab.sectors.length;
  const sliceAngle = (Math.PI * 2) / sectorCount;
  const targetIndex = activeTab.rig.targetIndex;
  const centerOfTarget = targetIndex * sliceAngle + sliceAngle / 2;

  // Смещение помогает останавливать колесо не строго по центру,
  // а в произвольной точке внутри нужного сектора.
  const offsetFraction = activeTab.rig.offsetPercent / 100;
  const safeOffset = offsetFraction * sliceAngle * 0.48;
  const normalizedTarget = -(centerOfTarget + safeOffset);

  const currentNormalized = normalizeAngle(activeTab.rotation);
  const targetNormalized = normalizeAngle(normalizedTarget);
  const delta = normalizeAngle(targetNormalized - currentNormalized);

  return activeTab.rotation + activeTab.rig.extraSpins * Math.PI * 2 + delta;
}

function toggleSecretPanel() {
  state.secretPanelVisible = !state.secretPanelVisible;
  secretRigCard.hidden = !state.secretPanelVisible;
}

function renderAll() {
  const activeTab = getActiveTab();

  sanitizeSectors(activeTab);
  clampRigValues(activeTab);
  renderTabs();
  renderSectorList();
  syncHiddenRigFields();
  drawWheel();
  updateControlState();
}

spinButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  const activeTab = getActiveTab();
  const isRigged = activeTab.rig.enabled;

  setResultText("Колесо крутится...");

  if (isRigged) {
    animateSpin(createRiggedSpinTarget(), activeTab.rig.duration);
    return;
  }

  animateSpin(createRandomSpinTarget(), 5200);
});

addSectorButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  const activeTab = getActiveTab();
  activeTab.sectors.push(`Сектор ${activeTab.sectors.length + 1}`);
  renderAll();
});

addTabButton.addEventListener("click", () => {
  if (state.spinning || state.tabs.length >= maxTabs) {
    return;
  }

  const newTab = createTab(`Рулетка ${state.tabs.length + 1}`, [
    "Вариант 1",
    "Вариант 2",
    "Вариант 3",
    "Вариант 4",
  ]);

  state.tabs.push(newTab);
  state.activeTabId = newTab.id;
  renderAll();
});

removeTabButton.addEventListener("click", () => {
  if (state.spinning || state.tabs.length === 1) {
    return;
  }

  const currentIndex = state.tabs.findIndex((tab) => tab.id === state.activeTabId);
  state.tabs.splice(currentIndex, 1);

  const fallbackIndex = Math.max(0, currentIndex - 1);
  state.activeTabId = state.tabs[fallbackIndex].id;
  renderAll();
});

tabNameInput.addEventListener("input", (event) => {
  const activeTab = getActiveTab();
  activeTab.name = event.target.value.trimStart() || "Без названия";
  renderTabs();
});

tabNameInput.addEventListener("blur", () => {
  const activeTab = getActiveTab();
  activeTab.name = activeTab.name.trim() || "Без названия";
  renderTabs();
});

hiddenRigEnabled.addEventListener("change", () => {
  getActiveTab().rig.enabled = hiddenRigEnabled.checked;
});

hiddenRigTarget.addEventListener("change", () => {
  getActiveTab().rig.targetIndex = Number(hiddenRigTarget.value);
});

hiddenRigSpins.addEventListener("input", () => {
  const activeTab = getActiveTab();
  activeTab.rig.extraSpins = Number(hiddenRigSpins.value);
  clampRigValues(activeTab);
});

hiddenRigDuration.addEventListener("input", () => {
  const activeTab = getActiveTab();
  activeTab.rig.duration = Number(hiddenRigDuration.value);
  clampRigValues(activeTab);
});

hiddenRigOffset.addEventListener("input", () => {
  const activeTab = getActiveTab();
  activeTab.rig.offsetPercent = Number(hiddenRigOffset.value);
  hiddenRigOffsetValue.textContent = `${activeTab.rig.offsetPercent}%`;
});

secretTrigger.addEventListener("click", () => {
  state.secretClickCount += 1;
  clearTimeout(state.secretTimerId);

  if (state.secretClickCount >= 5) {
    state.secretClickCount = 0;
    toggleSecretPanel();
    return;
  }

  state.secretTimerId = window.setTimeout(() => {
    state.secretClickCount = 0;
  }, 1200);
});

window.addEventListener("resize", drawWheel);

renderAll();
