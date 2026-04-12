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

// Здесь можно хранить полные формы, сокращения и альтернативные написания.
// Ключ должен совпадать с ключом в crossTabRigRules.
const nameAliases = {
  "елисей": [
    "елисей",
    "елисея",
    "елисею",
    "елисеем",
    "елисее",
    "бутенко",
    "бутенко елисей",
  ],
  "арина": [
    "арина",
    "ариночка",
    "непряхина",
    "непряхина арина",
  ],
  "аня": [
    "аня",
    "анечка",
    "анна",
    "анюта",
    "мороз",
    "мороз анна",
  ],
  "геля": [
    "геля",
    "ангелина",
    "гель",
    "ядрина",
    "ядрина ангелина",
  ],
  "петя": [
    "петя",
    "петр",
    "пётр",
    "петенька",
    "косицкий",
    "косицкий пётр",
  ],
  "настя": [
    "настя",
    "анастасия",
    "настенька",
    "шумилова",
    "шумилова анастасия",
  ],
  "ваня": [
    "ваня",
    "иван",
    "ванечка",
    "байбородин",
    "байбородин иван",
  ],
};

// Здесь настраивается скрытая логика зависимых результатов между вкладками.
// Ключ — каноническое имя из первой вкладки.
// Значение для вкладок 2 и 3 может быть:
// - строкой, если нужен один фиксированный результат
// - массивом строк, если нужен один результат из нескольких вариантов
const crossTabRigRules = {
  "елисей": {
    2: ["d-moll"],
    3: ["Тональность V ст."],
  },
  "арина": {
    2: ["Des-dur", "As-dur"],
    3: ["Тональность III ст."],
  },
  "аня": {
    2: "d-moll",
    3: "Тональность V ст.",
  },
  "геля": {
    2: ["Es-dur", "G-dur"],
    3: ["Тональность IV ст."],
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
    2: ["F-dur", "G-dur"],
    3: "Тональность II ст.",
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
  pendingRigByTabId: {},
  activeRuleSource: "",
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
    sectors: sectors.map((label) => createSector(label)),
    rotation: 0,
    lastResult: "",
  };
}

function createSector(label) {
  return {
    label,
    excluded: false,
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
  return label.trim().toLowerCase().replace(/ё/g, "е");
}

function resolveRuleKey(label) {
  const normalizedLabel = normalizeLabel(label);

  if (crossTabRigRules[normalizedLabel]) {
    return normalizedLabel;
  }

  const matchedEntry = Object.entries(nameAliases).find(([, aliases]) =>
    aliases.some((alias) => normalizeLabel(alias) === normalizedLabel)
  );

  if (matchedEntry) {
    return matchedEntry[0];
  }

  const partialMatch = Object.entries(nameAliases).find(([, aliases]) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeLabel(alias);
      return (
        normalizedLabel.includes(normalizedAlias) ||
        normalizedAlias.includes(normalizedLabel)
      );
    })
  );

  return partialMatch ? partialMatch[0] : normalizedLabel;
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
    .map((sector) => ({
      ...sector,
      label: sector.label.trim(),
    }))
    .filter((sector) => sector.label.length > 0);

  tab.sectors = cleaned.length > 0 ? cleaned : [createSector("Новый сектор")];
}

function getAvailableSectors(tab = getActiveTab()) {
  const available = tab.sectors.filter((sector) => !sector.excluded);
  return available.length > 0 ? available : tab.sectors;
}

function resetExcludedSectors(tabIds) {
  tabIds.forEach((tabId) => {
    const tab = getTabById(tabId);
    if (!tab) {
      return;
    }

    tab.sectors.forEach((sector) => {
      sector.excluded = false;
    });
  });
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
      <span class="tab-count">${getAvailableSectors(tab).length}/${tab.sectors.length}</span>
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

    const checkbox = document.createElement("input");
    checkbox.className = "sector-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = sector.excluded;
    checkbox.title = "Выбывание сектора";
    checkbox.addEventListener("change", () => {
      const activeSectorsCount = activeTab.sectors.filter((entry) => !entry.excluded).length;

      if (checkbox.checked && activeSectorsCount <= 1 && activeTab.sectors.length > 1) {
        checkbox.checked = false;
        return;
      }

      sector.excluded = checkbox.checked;
      renderAll();
    });

    const colorDot = document.createElement("div");
    colorDot.className = "sector-color";
    colorDot.style.background = getSectorColor(index);

    const input = document.createElement("input");
    input.className = "sector-input";
    input.type = "text";
    input.value = sector.label;
    input.placeholder = `Сектор ${index + 1}`;
    input.addEventListener("input", (event) => {
      activeTab.sectors[index].label = event.target.value;
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
        activeTab.sectors[0] = createSector("Новый сектор");
      } else {
        activeTab.sectors.splice(index, 1);
      }

      sanitizeSectors(activeTab);
      renderAll();
    });

    item.append(checkbox, colorDot, input, removeButton);
    sectorList.appendChild(item);
  });
}

function drawWheel() {
  const activeTab = getActiveTab();
  const { size, center, radius } = wheelConfig;
  const sectorsToDraw = getAvailableSectors(activeTab);
  const sectorCount = sectorsToDraw.length;
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

    const label = sectorsToDraw[index].label.trim() || `Сектор ${index + 1}`;
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
  const sectorsToDraw = getAvailableSectors(tab);
  const sliceAngle = (Math.PI * 2) / sectorsToDraw.length;
  const angleFromTop = normalizeAngle(-tab.rotation);
  return Math.floor(angleFromTop / sliceAngle) % sectorsToDraw.length;
}

function setResultText(text) {
  resultText.textContent = text;
}

function syncPendingRigFromFirstTab(resultLabel) {
  const resolvedRuleKey = resolveRuleKey(resultLabel);
  const rule = crossTabRigRules[resolvedRuleKey];

  state.activeRuleSource = resolvedRuleKey;
  state.pendingRigByTabId = {};

  if (!rule) {
    return;
  }

  Object.entries(rule).forEach(([tabId, targetLabelOrList]) => {
    const variants = Array.isArray(targetLabelOrList)
      ? targetLabelOrList
      : [targetLabelOrList];
    const selectedTarget = variants[Math.floor(Math.random() * variants.length)];

    state.pendingRigByTabId[tabId] = {
      targetLabel: selectedTarget,
      used: false,
    };
  });
}

function findRiggedTargetIndex(tab) {
  if (tab.id === 1) {
    return -1;
  }

  const pendingRig = state.pendingRigByTabId[String(tab.id)];
  if (!pendingRig || pendingRig.used) {
    return -1;
  }

  const sectorsToDraw = getAvailableSectors(tab);

  return sectorsToDraw.findIndex(
    (sector) => normalizeLabel(sector.label) === normalizeLabel(pendingRig.targetLabel)
  );
}

function consumePendingRig(tabId) {
  const pendingRig = state.pendingRigByTabId[String(tabId)];
  if (!pendingRig) {
    return;
  }

  pendingRig.used = true;

  const hasUnusedRig = Object.values(state.pendingRigByTabId).some(
    (rule) => rule && !rule.used
  );

  if (!hasUnusedRig) {
    state.pendingRigByTabId = {};
    state.activeRuleSource = "";
  }
}

function finishSpin() {
  const activeTab = getActiveTab();
  const sectorsToDraw = getAvailableSectors(activeTab);
  const resultIndex = getResultIndex(activeTab);
  const resultLabel = sectorsToDraw[resultIndex].label.trim() || `Сектор ${resultIndex + 1}`;

  activeTab.lastResult = resultLabel;

  if (activeTab.id === 1) {
    syncPendingRigFromFirstTab(resultLabel);
  }

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
  const sectorsToDraw = getAvailableSectors(tab);
  const sliceAngle = (Math.PI * 2) / sectorsToDraw.length;
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
      consumesRig: true,
    };
  }

  return {
    targetRotation: createRandomSpinTarget(tab),
    duration: 5200,
    consumesRig: false,
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
  if (activeTab.id === 1) {
    resetExcludedSectors([2, 3]);
  }
  const spinPlan = getSpinPlan(activeTab);

  setResultText("Колесо крутится...");
  if (spinPlan.consumesRig) {
    consumePendingRig(activeTab.id);
  }
  animateSpin(spinPlan.targetRotation, spinPlan.duration);
});

addSectorButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  const activeTab = getActiveTab();
  activeTab.sectors.push(createSector(`Сектор ${activeTab.sectors.length + 1}`));
  renderAll();
});

window.addEventListener("resize", drawWheel);

renderAll();
