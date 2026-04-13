const canvas = document.getElementById("wheelCanvas");
const context = canvas.getContext("2d");

const appRoot = document.getElementById("appRoot");
const wheelFrame = document.getElementById("wheelFrame");
const sectorList = document.getElementById("sectorList");
const spinButton = document.getElementById("spinButton");
const addSectorButton = document.getElementById("addSectorButton");
const resetExcludedButton = document.getElementById("resetExcludedButton");
const tabList = document.getElementById("tabList");
const addTabButton = document.getElementById("addTabButton");
const removeTabButton = document.getElementById("removeTabButton");
const resultToast = document.getElementById("resultToast");
const resultVariant = document.getElementById("resultVariant");
const templateHarmonyButton = document.getElementById("templateHarmonyButton");
const createWheelButton = document.getElementById("createWheelButton");
const speedControl = document.getElementById("speedControl");
const speedTrack = document.getElementById("speedTrack");
const speedTrackFill = document.getElementById("speedTrackFill");
const speedThumb = document.getElementById("speedThumb");
const speedValue = document.getElementById("speedValue");
const speedSteps = Array.from(document.querySelectorAll(".speed-step"));

const SUPABASE_URL = "https://ixvcrzysvadeulopgbir.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_43qaCLdKWS7IxtQRnmoisA_-ztfs69b";
const REMOTE_SYNC_INTERVAL_MS = 2000;
const WHEEL_STATE_SYNC_DELAY_MS = 600;
const LOCAL_STORAGE_STATE_KEY = "roulette-wheel-state-v2";

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

const speedPresets = [
  { label: "0.5x", randomDuration: 6800, remoteDuration: 7200 },
  { label: "1x", randomDuration: 5200, remoteDuration: 5600 },
  { label: "2x", randomDuration: 3800, remoteDuration: 4100 },
];

const tonalityAliases = {
  "C-dur": ["до мажор"],
  "G-dur": ["соль мажор"],
  "D-dur": ["ре мажор"],
  "A-dur": ["ля мажор"],
  "E-dur": ["ми мажор"],
  "H-dur": ["си мажор"],
  "Fis-dur": ["фа диез мажор", "фа-диез мажор"],
  "Cis-dur": ["до диез мажор", "до-диез мажор"],
  "F-dur": ["фа мажор"],
  "B-dur": ["си бемоль мажор", "си-бемоль мажор"],
  "Es-dur": ["ми бемоль мажор", "ми-бемоль мажор"],
  "As-dur": ["ля бемоль мажор", "ля-бемоль мажор"],
  "Des-dur": ["ре бемоль мажор", "ре-бемоль мажор"],
  "Ges-dur": ["соль бемоль мажор", "соль-бемоль мажор"],
  "Ces-dur": ["до бемоль мажор", "до-бемоль мажор"],
  "a-moll": ["ля минор"],
  "e-moll": ["ми минор"],
  "h-moll": ["си минор"],
  "fis-moll": ["фа диез минор", "фа-диез минор"],
  "cis-moll": ["до диез минор", "до-диез минор"],
  "gis-moll": ["соль диез минор", "соль-диез минор"],
  "dis-moll": ["ре диез минор", "ре-диез минор"],
  "ais-moll": ["ля диез минор", "ля-диез минор"],
  "d-moll": ["ре минор"],
  "g-moll": ["соль минор"],
  "c-moll": ["до минор"],
  "f-moll": ["фа минор"],
  "b-moll": ["си бемоль минор", "си-бемоль минор"],
  "es-moll": ["ми бемоль минор", "ми-бемоль минор"],
  "as-moll": ["ля бемоль минор", "ля-бемоль минор"],
};

const modulationAliases = {
  "Тональность II": ["тональность ii", "тональность 2", "ii", "2", "вторая"],
  "Тональность III": ["тональность iii", "тональность 3", "iii", "3", "третья"],
  "Тональность IV": ["тональность iv", "тональность 4", "iv", "4", "четвертая", "четвёртая"],
  "Тональность IV (гарм.)": [
    "тональность iv гарм",
    "тональность iv (гарм.)",
    "тональность 4 гарм",
    "тональность 4 (гарм.)",
    "iv гарм",
    "4 гарм",
  ],
  "Тональность V": ["тональность v", "тональность 5", "v", "5", "пятая"],
  "Тональность V (гарм.)": [
    "тональность v гарм",
    "тональность v (гарм.)",
    "тональность 5 гарм",
    "тональность 5 (гарм.)",
    "v гарм",
    "5 гарм",
  ],
  "Тональность VI": ["тональность vi", "тональность 6", "vi", "6", "шестая"],
  "Тональность VII": ["тональность vii", "тональность 7", "vii", "7", "седьмая"],
};

const harmonyTabsTemplate = [
  {
    id: 2,
    name: "Тональность",
    sectors: [
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
    ],
  },
  {
    id: 3,
    name: "Модуляция",
    sectors: [
      "Тональность II",
      "Тональность III",
      "Тональность IV",
      "Тональность IV (гарм.)",
      "Тональность V",
      "Тональность V (гарм.)",
      "Тональность VI",
      "Тональность VII",
    ],
  },
];

const wheelConfig = {
  size: canvas.width,
  center: canvas.width / 2,
  radius: canvas.width / 2 - 30,
};

function createVariant(label = "") {
  return {
    label,
    excluded: false,
  };
}

function createTab(id, name, sectors) {
  return {
    id,
    name,
    sectors: sectors.map((label) => createVariant(label)),
    rotation: 0,
    lastResult: "",
  };
}

function createCustomTabs() {
  return [createTab(1, "Вкладка 1", ["", "", "", ""])];
}

function createHarmonyTabs() {
  return harmonyTabsTemplate.map((tab) => createTab(tab.id, tab.name, tab.sectors));
}

const state = {
  mode: "custom",
  tabs: createCustomTabs(),
  activeTabId: 1,
  speedIndex: 1,
  spinning: false,
  celebrating: false,
  loadingRemoteCommand: false,
  sceneTransitioning: false,
  remoteCommandsByTab: {},
  remoteSyncTimerId: 0,
  remoteSyncInFlight: false,
  remoteLastSyncAt: 0,
  wheelStateSyncTimerId: 0,
  wheelStateSyncInFlight: false,
  speedDragActive: false,
  animationFrameId: 0,
  resultTimerId: 0,
};

function getTabLimit() {
  return state.mode === "custom" ? 3 : 2;
}

function getSceneName() {
  return state.mode === "harmony" ? "Гармония. Модуляции" : "Новое колесо";
}

function serializeState() {
  return {
    mode: state.mode,
    activeTabId: state.activeTabId,
    speedIndex: state.speedIndex,
    tabs: state.tabs.map((tab) => ({
      id: tab.id,
      name: tab.name,
      sectors: tab.sectors.map((variant) => ({
        label: variant.label,
        excluded: variant.excluded,
      })),
    })),
  };
}

function saveStateToLocalStorage() {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(serializeState()));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}

function restoreStateFromLocalStorage() {
  try {
    const rawState = window.localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
    if (!rawState) {
      return;
    }

    const parsedState = JSON.parse(rawState);
    if (!parsedState || !Array.isArray(parsedState.tabs) || parsedState.tabs.length === 0) {
      return;
    }

    const restoredTabs = parsedState.tabs
      .map((tab) => {
        if (!tab || typeof tab.id !== "number" || !Array.isArray(tab.sectors)) {
          return null;
        }

        return {
          id: tab.id,
          name: String(tab.name || `Вкладка ${tab.id}`),
          sectors: tab.sectors.map((variant) => ({
            label: String(variant?.label || ""),
            excluded: Boolean(variant?.excluded),
          })),
          rotation: 0,
          lastResult: "",
        };
      })
      .filter(Boolean);

    if (restoredTabs.length === 0) {
      return;
    }

    state.mode = parsedState.mode === "harmony" ? "harmony" : "custom";
    state.tabs = restoredTabs;
    state.activeTabId = restoredTabs.some((tab) => tab.id === parsedState.activeTabId)
      ? parsedState.activeTabId
      : restoredTabs[0].id;
    state.speedIndex = Number.isInteger(parsedState.speedIndex)
      ? Math.min(Math.max(parsedState.speedIndex, 0), speedPresets.length - 1)
      : 1;
  } catch (error) {
    console.error("Failed to restore state from localStorage:", error);
  }
}

async function fetchActiveSpinCommands() {
  const endpoint =
    `${SUPABASE_URL}/rest/v1/spin_commands` +
    "?select=id,target_tab,target_value,note,created_at,is_active,used" +
    "&is_active=eq.true" +
    "&used=eq.false" +
    "&order=created_at.desc";

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`);
  }

  return response.json();
}

function mapRemoteCommandsByTab(commands) {
  return commands.reduce((accumulator, command) => {
    const tabId = Number(command.target_tab);
    if (!tabId || accumulator[tabId]) {
      return accumulator;
    }

    accumulator[tabId] = command;
    return accumulator;
  }, {});
}

async function syncRemoteCommands() {
  if (state.remoteSyncInFlight) {
    return state.remoteCommandsByTab;
  }

  state.remoteSyncInFlight = true;

  try {
    const commands = await fetchActiveSpinCommands();
    state.remoteCommandsByTab = mapRemoteCommandsByTab(commands);
    state.remoteLastSyncAt = Date.now();
    return state.remoteCommandsByTab;
  } catch (error) {
    console.error("Failed to sync spin commands from Supabase:", error);
    return state.remoteCommandsByTab;
  } finally {
    state.remoteSyncInFlight = false;
  }
}

function getCachedRemoteCommand(tabId) {
  return state.remoteCommandsByTab[tabId] ?? null;
}

function shouldRefreshRemoteCommands() {
  return Date.now() - state.remoteLastSyncAt >= REMOTE_SYNC_INTERVAL_MS;
}

function startRemoteCommandSync() {
  if (state.remoteSyncTimerId) {
    clearInterval(state.remoteSyncTimerId);
  }

  syncRemoteCommands();
  state.remoteSyncTimerId = window.setInterval(syncRemoteCommands, REMOTE_SYNC_INTERVAL_MS);
}

function buildWheelStatePayload() {
  return state.tabs
    .slice()
    .sort((leftTab, rightTab) => leftTab.id - rightTab.id)
    .map((tab) => ({
      tab_id: tab.id,
      tab_name: tab.name,
      variants: tab.sectors.map((variant) => ({
        label: variant.label,
        excluded: variant.excluded,
      })),
      updated_at: new Date().toISOString(),
    }));
}

async function syncWheelStateToSupabase() {
  if (state.mode !== "harmony" || state.wheelStateSyncInFlight) {
    return;
  }

  state.wheelStateSyncInFlight = true;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/wheel_state?on_conflict=tab_id`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(buildWheelStatePayload()),
    });

    if (!response.ok) {
      throw new Error(`Wheel state sync failed: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to sync wheel state to Supabase:", error);
  } finally {
    state.wheelStateSyncInFlight = false;
  }
}

function scheduleWheelStateSync() {
  clearTimeout(state.wheelStateSyncTimerId);
  state.wheelStateSyncTimerId = window.setTimeout(syncWheelStateToSupabase, WHEEL_STATE_SYNC_DELAY_MS);
}

function buildTriggeredNote(note) {
  const cleanedNote = String(note ?? "")
    .split("| fired:")
    .shift()
    .trim();
  const suffix = `fired:${new Date().toISOString()}`;

  return cleanedNote ? `${cleanedNote} | ${suffix}` : suffix;
}

async function markSpinCommandUsed(command) {
  const endpoint = `${SUPABASE_URL}/rest/v1/spin_commands?id=eq.${command.id}`;

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      used: true,
      is_active: false,
      note: buildTriggeredNote(command.note),
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase update failed: ${response.status}`);
  }

  delete state.remoteCommandsByTab[Number(command.target_tab)];
}

function normalizeLabel(label) {
  return String(label).trim().toLowerCase().replace(/ё/g, "е");
}

function getEquivalentTonalityLabels(label) {
  const normalizedLabel = normalizeLabel(label);
  const matchedEntry = Object.entries(tonalityAliases).find(
    ([canonicalLabel, aliases]) =>
      normalizeLabel(canonicalLabel) === normalizedLabel ||
      aliases.some((alias) => normalizeLabel(alias) === normalizedLabel)
  );

  if (!matchedEntry) {
    return [normalizedLabel];
  }

  const [canonicalLabel, aliases] = matchedEntry;
  return [canonicalLabel, ...aliases].map((entry) => normalizeLabel(entry));
}

function getEquivalentModulationLabels(label) {
  const normalizedLabel = normalizeLabel(label);
  const matchedEntry = Object.entries(modulationAliases).find(
    ([canonicalLabel, aliases]) =>
      normalizeLabel(canonicalLabel) === normalizedLabel ||
      aliases.some((alias) => normalizeLabel(alias) === normalizedLabel)
  );

  if (!matchedEntry) {
    return [normalizedLabel];
  }

  const [canonicalLabel, aliases] = matchedEntry;
  return [canonicalLabel, ...aliases].map((entry) => normalizeLabel(entry));
}

function labelsMatch(leftLabel, rightLabel, tabId = 0) {
  if (tabId === 3) {
    const leftVariants = getEquivalentModulationLabels(leftLabel);
    const rightVariants = getEquivalentModulationLabels(rightLabel);
    return leftVariants.some((leftVariant) => rightVariants.includes(leftVariant));
  }

  const leftVariants = getEquivalentTonalityLabels(leftLabel);
  const rightVariants = getEquivalentTonalityLabels(rightLabel);
  return leftVariants.some((variant) => rightVariants.includes(variant));
}

function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0];
}

function getVariantColor(index) {
  return wheelColors[index % wheelColors.length];
}

function getFreeTabId() {
  for (let tabId = 1; tabId <= getTabLimit(); tabId += 1) {
    if (!state.tabs.some((tab) => tab.id === tabId)) {
      return tabId;
    }
  }

  return 0;
}

function sanitizeVariants(tab = getActiveTab()) {
  tab.sectors = tab.sectors.map((variant) => ({
    ...variant,
    label: String(variant.label ?? "").trim(),
  }));

  if (tab.sectors.length === 0) {
    tab.sectors = [createVariant("")];
  }
}

function getActiveVariantIndexes(tab = getActiveTab()) {
  const indexes = tab.sectors
    .map((variant, index) => ({ variant, index }))
    .filter(({ variant }) => !variant.excluded)
    .map(({ index }) => index);

  return indexes.length > 0 ? indexes : tab.sectors.map((_, index) => index);
}

function getCurrentSpeedPreset() {
  return speedPresets[state.speedIndex] ?? speedPresets[1];
}

function updateSpeedUi() {
  const preset = getCurrentSpeedPreset();
  speedValue.textContent = preset.label;
  speedTrack.setAttribute("aria-valuenow", String(state.speedIndex));
  speedTrack.setAttribute("aria-valuetext", preset.label);
  layoutSpeedControl(state.speedIndex / (speedPresets.length - 1), !state.speedDragActive);
}

function getSpeedTrackMetrics() {
  const rect = speedTrack.getBoundingClientRect();
  return { rect, minX: 0, maxX: rect.width };
}

function layoutSpeedControl(normalizedValue, animateThumb = true) {
  const { minX, maxX } = getSpeedTrackMetrics();
  const clampedValue = Math.min(Math.max(normalizedValue, 0), 1);
  const thumbLeft = minX + (maxX - minX) * clampedValue;

  speedThumb.style.transition = animateThumb ? "left 0.22s ease, transform 0.22s ease" : "none";
  speedThumb.style.left = `${thumbLeft}px`;
  speedTrackFill.style.width = `${thumbLeft}px`;

  speedSteps.forEach((step, index) => {
    const stepRatio = index / (speedPresets.length - 1);
    const stepLeft = minX + (maxX - minX) * stepRatio;
    step.style.left = `${stepLeft}px`;
  });
}

function setSpeedIndex(nextIndex, animateThumb = true) {
  state.speedIndex = Math.min(Math.max(nextIndex, 0), speedPresets.length - 1);
  speedValue.textContent = getCurrentSpeedPreset().label;
  speedTrack.setAttribute("aria-valuenow", String(state.speedIndex));
  speedTrack.setAttribute("aria-valuetext", getCurrentSpeedPreset().label);
  layoutSpeedControl(state.speedIndex / (speedPresets.length - 1), animateThumb);
  saveStateToLocalStorage();
}

function getNormalizedPointerValue(clientX) {
  const { rect, minX, maxX } = getSpeedTrackMetrics();
  const localX = Math.min(Math.max(clientX - rect.left, minX), maxX);
  return (localX - minX) / Math.max(maxX - minX, 1);
}

function snapSpeedFromClientX(clientX) {
  const normalizedValue = getNormalizedPointerValue(clientX);
  const snappedIndex = Math.round(normalizedValue * (speedPresets.length - 1));
  setSpeedIndex(snappedIndex, true);
}

function handleSpeedPointerMove(event) {
  if (!state.speedDragActive) {
    return;
  }

  const normalizedValue = getNormalizedPointerValue(event.clientX);
  layoutSpeedControl(normalizedValue, false);
}

function handleSpeedPointerUp(event) {
  if (!state.speedDragActive) {
    return;
  }

  state.speedDragActive = false;
  speedThumb.releasePointerCapture?.(event.pointerId);
  snapSpeedFromClientX(event.clientX);
}

function updateControlState() {
  const disabled = state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning;
  const activeTab = getActiveTab();
  const canEditTabs = state.mode === "custom";
  const hasExcludedVariants = activeTab.sectors.some((variant) => variant.excluded);

  spinButton.disabled = disabled;
  addSectorButton.disabled = disabled;
  resetExcludedButton.disabled = disabled || !hasExcludedVariants;
  addTabButton.disabled = disabled || !canEditTabs || state.tabs.length >= getTabLimit();
  removeTabButton.disabled = disabled || !canEditTabs || state.tabs.length <= 1;
    speedThumb.disabled = disabled;
  templateHarmonyButton.disabled = disabled;
  createWheelButton.disabled = disabled;

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

  const orderedTabs = [...state.tabs].sort((leftTab, rightTab) => leftTab.id - rightTab.id);

  orderedTabs.forEach((tab) => {
    const activeCount = tab.sectors.filter((variant) => !variant.excluded).length;
    const button = document.createElement("button");
    button.className = `tab-button${tab.id === state.activeTabId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>${tab.name}</span>
      <span class="tab-count">${activeCount}/${tab.sectors.length}</span>
    `;

    button.addEventListener("click", () => {
      if (state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning) {
        return;
      }

      state.activeTabId = tab.id;
      renderAll();
    });

    tabList.appendChild(button);
  });
}

function renderVariantList() {
  const activeTab = getActiveTab();
  sectorList.innerHTML = "";

  activeTab.sectors.forEach((variant, index) => {
    const item = document.createElement("div");
    item.className = `sector-item${variant.excluded ? " excluded" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.className = "sector-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = variant.excluded;
    checkbox.title = "Выбывание варианта";
    checkbox.addEventListener("change", () => {
      const activeVariantsCount = activeTab.sectors.filter((entry) => !entry.excluded).length;

      if (checkbox.checked && activeVariantsCount <= 1) {
        checkbox.checked = false;
        return;
      }

      variant.excluded = checkbox.checked;
      renderAll();
    });

    const colorDot = document.createElement("div");
    colorDot.className = "sector-color";
    colorDot.style.background = getVariantColor(index);

    const input = document.createElement("input");
    input.className = "sector-input";
    input.type = "text";
    input.value = variant.label;
    input.placeholder = `Вариант ${index + 1}`;
    input.addEventListener("input", (event) => {
      activeTab.sectors[index].label = event.target.value;
      drawWheel();
      renderTabs();
      saveStateToLocalStorage();
      scheduleWheelStateSync();
    });
    input.addEventListener("blur", () => {
      sanitizeVariants(activeTab);
      renderAll();
    });

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.title = "Удалить вариант";
    removeButton.addEventListener("click", () => {
      if (activeTab.sectors.length === 1) {
        activeTab.sectors[0] = createVariant("");
      } else {
        activeTab.sectors.splice(index, 1);
      }

      sanitizeVariants(activeTab);
      renderAll();
    });

    item.append(checkbox, colorDot, input, removeButton);
    sectorList.appendChild(item);
  });
}

function drawWheel() {
  const activeTab = getActiveTab();
  const { size, center, radius } = wheelConfig;
  const variantsToDraw = activeTab.sectors;
  const variantCount = variantsToDraw.length;
  const sliceAngle = (Math.PI * 2) / variantCount;

  context.clearRect(0, 0, size, size);

  context.save();
  context.translate(center, center);
  context.rotate(activeTab.rotation);

  for (let index = 0; index < variantCount; index += 1) {
    const startAngle = -Math.PI / 2 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const variant = variantsToDraw[index];

    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = getVariantColor(index);
    context.fill();

    if (variant.excluded) {
      context.fillStyle = "rgba(54, 50, 46, 0.6)";
      context.fill();
    }

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

    const label = variant.label.trim() || `Вариант ${index + 1}`;
    const shortened = label.length > 18 ? `${label.slice(0, 16)}...` : label;
    if (variant.excluded) {
      context.fillStyle = "rgba(255, 250, 244, 0.55)";
    }
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

function normalizeAngle(angle) {
  const fullCircle = Math.PI * 2;
  return ((angle % fullCircle) + fullCircle) % fullCircle;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function getResultIndex(tab = getActiveTab()) {
  const sliceAngle = (Math.PI * 2) / tab.sectors.length;
  const angleFromTop = normalizeAngle(-tab.rotation);
  return Math.floor(angleFromTop / sliceAngle) % tab.sectors.length;
}

function showResultAnimation(resultLabel) {
  clearTimeout(state.resultTimerId);

  state.celebrating = true;
  updateControlState();
  wheelFrame.classList.add("highlighted");
  resultVariant.textContent = resultLabel;
  resultToast.classList.remove("active");

  void resultToast.offsetWidth;
  resultToast.classList.add("active");

  state.resultTimerId = window.setTimeout(() => {
    state.celebrating = false;
    wheelFrame.classList.remove("highlighted");
    resultToast.classList.remove("active");
    updateControlState();
  }, 3000);
}

function finishSpin() {
  const activeTab = getActiveTab();
  const resultIndex = getResultIndex(activeTab);
  const resultLabel = activeTab.sectors[resultIndex].label.trim() || `Вариант ${resultIndex + 1}`;

  activeTab.lastResult = resultLabel;
  state.spinning = false;
  updateControlState();
  showResultAnimation(resultLabel);
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

function createRiggedSpinTarget(tab, targetIndex, fullSpins = 8) {
  const sliceAngle = (Math.PI * 2) / tab.sectors.length;
  const centerOfTarget = targetIndex * sliceAngle + sliceAngle / 2;
  const normalizedTarget = -centerOfTarget;
  const currentNormalized = normalizeAngle(tab.rotation);
  const targetNormalized = normalizeAngle(normalizedTarget);
  const delta = normalizeAngle(targetNormalized - currentNormalized);

  return tab.rotation + fullSpins * Math.PI * 2 + delta;
}

function createRandomSpinTarget(tab) {
  const activeIndexes = getActiveVariantIndexes(tab);
  const targetIndex = activeIndexes[Math.floor(Math.random() * activeIndexes.length)];
  const fullSpins = 6 + Math.floor(Math.random() * 3);
  return createRiggedSpinTarget(tab, targetIndex, fullSpins);
}

function getSpinPlan(tab) {
  const preset = getCurrentSpeedPreset();
  return {
    targetRotation: createRandomSpinTarget(tab),
    duration: preset.randomDuration,
  };
}

async function getRemoteSpinPlan(tab) {
  if (state.mode !== "harmony") {
    return null;
  }

  try {
    if (shouldRefreshRemoteCommands()) {
      await syncRemoteCommands();
    }

    const command = getCachedRemoteCommand(tab.id);
    if (!command) {
      return null;
    }

    const targetIndex = tab.sectors.findIndex(
      (variant) => !variant.excluded && labelsMatch(variant.label, command.target_value, tab.id)
    );

    if (targetIndex < 0) {
      return null;
    }

    return {
      targetRotation: createRiggedSpinTarget(tab, targetIndex),
      duration: getCurrentSpeedPreset().remoteDuration,
      remoteCommand: command,
    };
  } catch (error) {
    console.error("Failed to load spin command from Supabase:", error);
    return null;
  }
}

function renderAll() {
  const activeTab = getActiveTab();

  sanitizeVariants(activeTab);
  renderTabs();
  renderVariantList();
  drawWheel();
  updateSpeedUi();
  updateControlState();
  saveStateToLocalStorage();
  scheduleWheelStateSync();
}

async function switchScene(nextMode) {
  if (state.sceneTransitioning) {
    return;
  }

  state.sceneTransitioning = true;
  updateControlState();
  appRoot.classList.remove("scene-in");
  appRoot.classList.add("scene-out");

  await new Promise((resolve) => window.setTimeout(resolve, 320));

  if (nextMode === "harmony") {
    state.mode = "harmony";
    state.tabs = createHarmonyTabs();
    state.activeTabId = 2;
  } else {
    state.mode = "custom";
    state.tabs = createCustomTabs();
    state.activeTabId = 1;
  }

  appRoot.classList.remove("scene-out");
  appRoot.classList.add("scene-in");
  renderAll();

  window.setTimeout(() => {
    appRoot.classList.remove("scene-in");
    state.sceneTransitioning = false;
    updateControlState();
  }, 420);
}

spinButton.addEventListener("click", async () => {
  if (state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning) {
    return;
  }

  const activeTab = getActiveTab();
  state.loadingRemoteCommand = true;
  updateControlState();

  const remoteSpinPlan = await getRemoteSpinPlan(activeTab);
  const spinPlan = remoteSpinPlan ?? getSpinPlan(activeTab);

  if (remoteSpinPlan?.remoteCommand) {
    try {
      await markSpinCommandUsed(remoteSpinPlan.remoteCommand);
    } catch (error) {
      console.error("Failed to mark spin command as used:", error);
    }
  }

  state.loadingRemoteCommand = false;
  updateControlState();
  animateSpin(spinPlan.targetRotation, spinPlan.duration);
});

addSectorButton.addEventListener("click", () => {
  if (state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning) {
    return;
  }

  getActiveTab().sectors.push(createVariant(""));
  renderAll();
});

resetExcludedButton.addEventListener("click", () => {
  if (state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning) {
    return;
  }

  getActiveTab().sectors.forEach((variant) => {
    variant.excluded = false;
  });
  renderAll();
});

addTabButton.addEventListener("click", () => {
  if (state.mode !== "custom" || state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning) {
    return;
  }

  const nextId = getFreeTabId();
  if (!nextId) {
    return;
  }

  state.tabs.push(createTab(nextId, `Вкладка ${nextId}`, ["", "", "", ""]));
  state.activeTabId = nextId;
  renderAll();
});

removeTabButton.addEventListener("click", () => {
  if (state.mode !== "custom" || state.tabs.length <= 1 || state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning) {
    return;
  }

  state.tabs = state.tabs.filter((tab) => tab.id !== state.activeTabId);
  state.activeTabId = state.tabs[0].id;
  renderAll();
});

templateHarmonyButton.addEventListener("click", () => {
  switchScene("harmony");
});

createWheelButton.addEventListener("click", () => {
  switchScene("custom");
});

speedTrack.addEventListener("click", (event) => {
  if (state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning || state.speedDragActive) {
    return;
  }

  snapSpeedFromClientX(event.clientX);
});

speedTrack.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  event.preventDefault();
  const delta = event.key === "ArrowRight" ? 1 : -1;
  setSpeedIndex(state.speedIndex + delta, true);
});

speedThumb.addEventListener("pointerdown", (event) => {
  if (state.spinning || state.celebrating || state.loadingRemoteCommand || state.sceneTransitioning) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  state.speedDragActive = true;
  speedThumb.setPointerCapture?.(event.pointerId);
});

speedThumb.addEventListener("pointermove", handleSpeedPointerMove);
speedThumb.addEventListener("pointerup", handleSpeedPointerUp);
speedThumb.addEventListener("pointercancel", handleSpeedPointerUp);

window.addEventListener("resize", () => {
  drawWheel();
  updateSpeedUi();
});
window.addEventListener("focus", syncRemoteCommands);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    syncRemoteCommands();
  }
});

restoreStateFromLocalStorage();
renderAll();
startRemoteCommandSync();
scheduleWheelStateSync();

