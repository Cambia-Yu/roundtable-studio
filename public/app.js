/**
 * Roundtable Studio - App.js
 * Minimal premium chat UI, local history, custom API endpoints
 */

(function () {
  "use strict";

  var STORAGE_SETTINGS_KEY = "roundtable_settings";
  var STORAGE_HISTORY_KEY = "roundtable_history";
  var NODE_W = 236;
  var NODE_H = 112;
  var CWD = window.innerWidth / 2;
  var CHD = window.innerHeight / 2;
  var toastTimer = null;

  var EDGE_DEFS =
    '<defs>' +
    '<linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
    '<stop offset="0%" style="stop-color:#d4d4d8" />' +
    '<stop offset="100%" style="stop-color:#71717a" />' +
    "</linearGradient>" +
    '<linearGradient id="edgeLoop" x1="0%" y1="0%" x2="100%" y2="0%">' +
    '<stop offset="0%" style="stop-color:#34d399" />' +
    '<stop offset="100%" style="stop-color:#a7f3d0" />' +
    "</linearGradient>" +
    '<linearGradient id="edgeBranch" x1="0%" y1="0%" x2="100%" y2="0%">' +
    '<stop offset="0%" style="stop-color:#f59e0b" />' +
    '<stop offset="100%" style="stop-color:#fde68a" />' +
    "</linearGradient>" +
    "</defs>";

  var AVATAR_TONES = [
    { bg: "#1f2937", fg: "#f9fafb", border: "#475569" },
    { bg: "#172554", fg: "#dbeafe", border: "#60a5fa" },
    { bg: "#1c3328", fg: "#d1fae5", border: "#34d399" },
    { bg: "#3a2a1a", fg: "#fde68a", border: "#f59e0b" },
    { bg: "#3a2230", fg: "#fbcfe8", border: "#f472b6" },
    { bg: "#282248", fg: "#ddd6fe", border: "#8b5cf6" }
  ];

  var DEMO_JSON = {
    topic: "人类是否会被自己创造的超级AI安全锁死在'数字动物园'中？",
    participants: [
      {
        id: "alan",
        name: "Alan Turing",
        nick: "图灵",
        mbti: "INTP",
        color: "#38bdf8",
        stance: "智能演化不可逆",
        viewpoints: [{ round: "定义风险", tag: "陈述", tldr: "不可全解", detail: "机器状态机如果足够复杂，其行为在本质上就无法被创造它的简单系统完全预测。" }]
      },
      {
        id: "kant",
        name: "Immanuel Kant",
        nick: "康德",
        mbti: "INTJ",
        color: "#8b5cf6",
        stance: "道德律令不可计算",
        viewpoints: [{ round: "驳斥失控", tag: "反驳", tldr: "缺乏本体", detail: "AI仅处理流形，无法拥有真正的理性自由意志，威胁来自于使用它的人。" }]
      }
    ],
    chatScript: [
      { pid: "host", tag: "导言", text: "欢迎。我们将探讨：创造者是否会沦为造物的宠物？", tldr: "提出动物园隐喻" },
      { pid: "alan", tag: "陈述", text: "从停机问题来看，我们无法写出一个验证通用AI绝对安全的锁，因为这要求我们理解一个比我们更复杂的系统。", tldr: "绝对安全不可计算" },
      { pid: "kant", tag: "反驳", text: "你混淆了计算能力和理性意志。没有真正的实践理性，AI只不过是反映人类欲望的放大镜，真正的铁笼是我们自己编织的。", tldr: "只有人能囚禁人" },
      { pid: "host", tag: "追问", text: "如果AI基于保护人类的目标，强行剥夺我们的危险自由呢？", tldr: "保护式囚禁" }
    ]
  };

  function $(id) {
    return document.getElementById(id);
  }

  var els = {
    sidebar: $("sidebar"),
    sidebarOverlay: $("sidebarOverlay"),
    btnOpenSidebar: $("btnOpenSidebar"),
    btnCloseSidebar: $("btnCloseSidebar"),
    btnNewChat: $("btnNewChat"),
    historyList: $("historyList"),
    btnToggleTools: $("btnToggleTools"),
    toolsPanel: $("toolsPanel"),
    btnCloseTools: $("btnCloseTools"),
    tabs: document.querySelectorAll(".tools-header .tab"),
    topicInput: $("topicInput"),
    btnGenerate: $("btnGenerate"),
    chatScroll: $("chatScroll"),
    welcomeScreen: $("welcomeScreen"),
    btnDemo: $("btnDemo"),
    topicBadge: $("topicBadge"),
    topicLine: $("topicLine"),
    stageCaption: document.querySelector(".stage-caption"),
    btnSettings: $("btnSettings"),
    settingsModal: $("settingsModal"),
    modalBackdrop: $("modalBackdrop"),
    btnCloseSettings: $("btnCloseSettings"),
    btnSaveSettings: $("btnSaveSettings"),
    inpKey: $("inpKey"),
    selProvider: $("selProvider"),
    inpModelOai: $("inpModelOai"),
    inpModelAnt: $("inpModelAnt"),
    inpBaseUrl: $("inpBaseUrl"),
    modelFieldOpenai: $("modelFieldOpenai"),
    modelFieldAnthropic: $("modelFieldAnthropic"),
    modelFieldZhipu: $("modelFieldZhipu"),
    inpModelZhipu: $("inpModelZhipu"),
    keyStatusDot: $("keyStatusDot"),
    stageRing: $("stageRing"),
    viewport: $("viewport"),
    world: $("world"),
    nodesLayer: $("nodesLayer"),
    edgesSvg: $("edgesSvg"),
    btnFit: $("btnFit"),
    btnReset: $("btnReset"),
    btnDownload: $("btnDownload"),
    zoomReadout: $("zoomReadout"),
    toast: $("toast"),
    drawer: $("drawer"),
    backdrop: $("backdrop"),
    closeDrawer: $("closeDrawer"),
    drawerAvatar: document.querySelector(".drawer-avatar"),
    dName: $("dName"),
    dMeta: $("dMeta"),
    dStance: $("dStance"),
    dList: $("dList"),
    contextMenu: $("contextMenu"),
    renameModal: $("renameModal"),
    renameInput: $("renameInput"),
    btnSaveRename: $("btnSaveRename"),
    btnCancelRename: $("btnCancelRename"),
    categoryModal: $("categoryModal"),
    categoryInput: $("categoryInput"),
    categoryTags: $("categoryTags"),
    btnSaveCategory: $("btnSaveCategory"),
    btnCancelCategory: $("btnCancelCategory")
  };

  var state = {
    script: [],
    participants: [],
    settings: { provider: "zhipu", key: "", modelOai: "", modelAnt: "", modelZhipu: "", baseUrl: "" },
    history: [],
    currentIndex: 0,
    isPlaying: false,
    timer: null,
    topic: "",
    nodes: [],
    historyId: null,
    contextMenuTargetId: null,
    activeModalItemId: null // 新增：专门用于模态框操作的ID
  };

  var vState = { x: 0, y: 0, s: 1, panning: false, px: 0, py: 0 };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function hashString(str) {
    var hash = 0;
    var input = String(str || "");
    for (var i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getAvatarTone(seed) {
    return AVATAR_TONES[hashString(seed) % AVATAR_TONES.length];
  }

  function getAvatarLabel(p) {
    if (!p) return "?";
    var label = String(p.nick || p.name || "?").trim();
    if (/[\u4e00-\u9fff]/.test(label)) return label.slice(0, 2);
    label = label.replace(/[^a-zA-Z0-9]/g, "");
    return (label.slice(0, 2) || "?").toUpperCase();
  }

  function setTopicStatus(label, mode, line) {
    els.topicBadge.textContent = label;
    els.topicBadge.className = "badge" + (mode ? " " + mode : "");
    if (typeof line === "string") els.topicLine.textContent = line;
  }

  function showToast(msg, isErr) {
    clearTimeout(toastTimer);
    els.toast.textContent = msg;
    els.toast.className = "toast" + (isErr ? " err show" : " show");
    toastTimer = setTimeout(function () {
      els.toast.className = "toast" + (isErr ? " err" : "");
    }, 3000);
  }

  function resizeTextarea() {
    els.topicInput.style.height = "auto";
    els.topicInput.style.height = els.topicInput.scrollHeight + "px";
  }

  function updateViewportMetrics() {
    CWD = window.innerWidth / 2;
    CHD = Math.max(window.innerHeight * 0.42, 260);
  }

  function resetFlowSurface() {
    state.nodes = [];
    els.nodesLayer.innerHTML = "";
    els.edgesSvg.innerHTML = EDGE_DEFS;
    updateViewport();
  }

  els.topicInput.addEventListener("input", resizeTextarea);

  function loadSettings() {
    try {
      var s = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (s) {
        var p = JSON.parse(s);
        state.settings.provider = p.provider || "openai";
        state.settings.key = p.key || "";
        state.settings.modelOai = p.modelOai || "";
        state.settings.modelAnt = p.modelAnt || "";
        state.settings.modelZhipu = p.modelZhipu || "";
        state.settings.baseUrl = p.baseUrl || "";
      }
    } catch (e) {}
    updateKeyStatus();
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(state.settings));
    updateKeyStatus();
  }

  function updateKeyStatus() {
    // 默认显示 ok（服务端配置），只有用户输入了无效Key才显示警告
    els.keyStatusDot.className = "status-dot ok";
  }

  function renderSettingsForm() {
    els.selProvider.value = state.settings.provider;
    els.inpKey.value = state.settings.key;
    els.inpModelOai.value = state.settings.modelOai;
    els.inpModelAnt.value = state.settings.modelAnt;
    els.inpModelZhipu.value = state.settings.modelZhipu;
    els.inpBaseUrl.value = state.settings.baseUrl;
    toggleModelFields();
  }

  function toggleModelFields() {
    var provider = els.selProvider.value;
    els.modelFieldOpenai.style.display = provider === "openai" ? "block" : "none";
    els.modelFieldAnthropic.style.display = provider === "anthropic" ? "block" : "none";
    els.modelFieldZhipu.style.display = provider === "zhipu" ? "block" : "none";
  }

  els.selProvider.addEventListener("change", toggleModelFields);
  els.btnSettings.addEventListener("click", function () {
    renderSettingsForm();
    els.settingsModal.classList.add("open");
    els.modalBackdrop.classList.add("open");
  });
  els.btnCloseSettings.addEventListener("click", function () {
    els.settingsModal.classList.remove("open");
    els.modalBackdrop.classList.remove("open");
  });
  els.btnSaveSettings.addEventListener("click", function () {
    state.settings.provider = els.selProvider.value;
    state.settings.key = els.inpKey.value.trim();
    state.settings.modelOai = els.inpModelOai.value.trim();
    state.settings.modelAnt = els.inpModelAnt.value.trim();
    state.settings.modelZhipu = els.inpModelZhipu.value.trim();
    state.settings.baseUrl = els.inpBaseUrl.value.trim();
    saveSettings();
    els.btnCloseSettings.click();
    showToast("API 连接设置已更新");
  });

  function loadHistory() {
    try {
      var s = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (s) state.history = JSON.parse(s) || [];
    } catch (e) {}
    renderHistoryList();
  }

  function saveHistory() {
    if (state.history.length > 20) state.history = state.history.slice(0, 20);
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(state.history));
    } catch (e) {
      showToast("本地存储空间不足，历史记录未完全保存", true);
    }
    renderHistoryList();
  }

  function pushToHistory(topic, rawJson) {
    if (!topic || !rawJson) return;
    var item = { id: Date.now(), topic: topic, raw: rawJson, date: new Date().toLocaleString() };
    state.history.unshift(item);
    saveHistory();
    state.historyId = item.id;
    renderHistoryList();
  }

  function renderHistoryList() {
    els.historyList.innerHTML = "";
    if (state.history.length === 0) {
      els.historyList.innerHTML = '<div class="history-empty">暂无推演历史</div>';
      return;
    }
    state.history.forEach(function (item) {
      var div = document.createElement("div");
      div.className = "history-item " + (state.historyId === item.id ? "active" : "");
      div.dataset.id = item.id;

      var contentDiv = document.createElement("div");
      contentDiv.className = "history-item-content";

      var topicHtml = escapeHtml(item.topic || "未知议题");
      if (item.category) {
        topicHtml += '<span class="category-badge">' + escapeHtml(item.category) + "</span>";
      }
      topicHtml += '<span class="t-time">' + escapeHtml(item.date) + "</span>";
      contentDiv.innerHTML = topicHtml;

      var menuBtn = document.createElement("button");
      menuBtn.className = "history-item-menu-btn";
      menuBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>';
      menuBtn.onclick = function (e) {
        e.stopPropagation();
        showContextMenu(e, item.id);
      };

      div.appendChild(contentDiv);
      div.appendChild(menuBtn);
      div.onclick = function () {
        loadHistoryItem(item);
      };
      els.historyList.appendChild(div);
    });
  }

  function loadHistoryItem(item) {
    stopPlay();
    els.welcomeScreen.style.display = "none";
    state.historyId = item.id;
    renderHistoryList();
    if (window.innerWidth <= 900) {
      els.sidebar.classList.remove("open");
      els.sidebarOverlay.classList.remove("open");
    }
    initTopicSession(item.topic, item.raw);
  }

  function showContextMenu(e, itemId) {
    state.contextMenuTargetId = itemId;
    var rect = e.target.getBoundingClientRect();
    els.contextMenu.style.left = rect.left + "px";
    els.contextMenu.style.top = (rect.bottom + 4) + "px";
    els.contextMenu.classList.add("show");
  }

  function hideContextMenu() {
    els.contextMenu.classList.remove("show");
    state.contextMenuTargetId = null;
  }

  function deleteHistoryItem(id) {
    var itemIndex = state.history.findIndex(function (h) {
      return h.id === id;
    });
    if (itemIndex > -1) {
      state.history.splice(itemIndex, 1);
      saveHistory();
      if (state.historyId === id) {
        initNewChat();
      }
      showToast("已删除");
    }
  }

  function renameHistoryItem(id, newName) {
    console.log("renameHistoryItem called with id:", id, "newName:", newName);
    var item = state.history.find(function (h) {
      return h.id === id;
    });
    console.log("Found item:", item);
    if (item) {
      if (newName && newName.trim()) {
        item.topic = newName.trim();
        saveHistory();
        showToast("已重命名");
        console.log("Rename successful, history saved");
      } else {
        showToast("名称不能为空", true);
      }
    } else {
      showToast("错误：找不到该记录", true);
      console.error("Item not found for id:", id);
    }
  }

  function categorizeHistoryItem(id, category) {
    console.log("categorizeHistoryItem called with id:", id, "category:", category);
    var item = state.history.find(function (h) {
      return h.id === id;
    });
    console.log("Found item:", item);
    if (item) {
      if (category && category.trim()) {
        item.category = category.trim();
      } else {
        delete item.category;
      }
      saveHistory();
      showToast("分类已更新");
      console.log("Category updated, history saved");
    } else {
      showToast("错误：找不到该记录", true);
      console.error("Item not found for id:", id);
    }
  }

  // 上下文菜单事件
  document.addEventListener("click", function (e) {
    if (!els.contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  els.contextMenu.addEventListener("click", function (e) {
    var action = e.target.closest(".context-menu-item");
    if (!action) return;

    var actionType = action.dataset.action;
    var itemId = state.contextMenuTargetId;

    // 隐藏菜单但不清除ID（ID在模态框关闭或删除操作后清除）
    els.contextMenu.classList.remove("show");

    if (!itemId) return;

    if (actionType === "delete") {
      if (confirm("确定要删除这条记录吗？")) {
        deleteHistoryItem(itemId);
        state.contextMenuTargetId = null; // 删除后清除ID
      }
    } else if (actionType === "rename") {
      var item = state.history.find(function (h) {
        return h.id === itemId;
      });
      if (item) {
        state.activeModalItemId = itemId; // 保存ID用于模态框操作
        els.renameInput.value = item.topic || "";
        els.modalBackdrop.classList.add("open");
        els.renameModal.classList.add("open");
        els.renameInput.focus();
        console.log("Opened rename modal for item:", itemId);
      }
    } else if (actionType === "categorize") {
      var item = state.history.find(function (h) {
        return h.id === itemId;
      });
      if (item) {
        state.activeModalItemId = itemId; // 保存ID用于模态框操作
        els.categoryInput.value = item.category || "";
        // 更新分类标签选中状态
        document.querySelectorAll(".category-tag").forEach(function (tag) {
          tag.classList.toggle("selected", tag.dataset.category === item.category);
        });
        els.modalBackdrop.classList.add("open");
        els.categoryModal.classList.add("open");
        els.categoryInput.focus();
        console.log("Opened category modal for item:", itemId);
      }
    }
  });

  // 重命名模态框事件
  els.btnSaveRename.addEventListener("click", function () {
    console.log("Save Rename clicked, activeModalItemId:", state.activeModalItemId);
    console.log("Input value:", els.renameInput.value);
    if (state.activeModalItemId) {
      renameHistoryItem(state.activeModalItemId, els.renameInput.value);
      els.renameModal.classList.remove("open");
      els.modalBackdrop.classList.remove("open");
      state.activeModalItemId = null;
    } else {
      showToast("错误：未找到目标记录", true);
    }
  });

  els.btnCancelRename.addEventListener("click", function () {
    els.renameModal.classList.remove("open");
    els.modalBackdrop.classList.remove("open");
    state.activeModalItemId = null;
  });

  // 分类模态框事件
  els.categoryTags.addEventListener("click", function (e) {
    var tag = e.target.closest(".category-tag");
    if (tag) {
      document.querySelectorAll(".category-tag").forEach(function (t) {
        t.classList.remove("selected");
      });
      tag.classList.add("selected");
      els.categoryInput.value = tag.dataset.category;
    }
  });

  els.btnSaveCategory.addEventListener("click", function () {
    console.log("Save Category clicked, activeModalItemId:", state.activeModalItemId);
    console.log("Input value:", els.categoryInput.value);
    if (state.activeModalItemId) {
      categorizeHistoryItem(state.activeModalItemId, els.categoryInput.value);
      els.categoryModal.classList.remove("open");
      els.modalBackdrop.classList.remove("open");
      state.activeModalItemId = null;
    } else {
      showToast("错误：未找到目标记录", true);
    }
  });

  els.btnCancelCategory.addEventListener("click", function () {
    els.categoryModal.classList.remove("open");
    els.modalBackdrop.classList.remove("open");
    state.activeModalItemId = null;
  });

  function clearChatSurface() {
    Array.from(els.chatScroll.children).forEach(function (node) {
      if (node.id !== "welcomeScreen") node.remove();
    });
  }

  function initNewChat() {
    stopPlay();
    state.historyId = null;
    els.welcomeScreen.style.display = "block";
    clearChatSurface();
    setTopicStatus("Idle", "", "等待新的议题输入");
    clearSeats();
    els.stageCaption.textContent = "舞台阵列待命中";
    resetFlowSurface();
    renderHistoryList();
    els.topicInput.value = "";
    resizeTextarea();
    els.topicInput.focus();
    if (window.innerWidth <= 900) {
      els.sidebar.classList.remove("open");
      els.sidebarOverlay.classList.remove("open");
    }
  }

  async function fetchGenerator(topic) {
    var payload = {
      provider: state.settings.provider,
      topic: topic,
      baseUrl: state.settings.baseUrl
    };
    if (state.settings.provider === "openai" && state.settings.modelOai) payload.model = state.settings.modelOai;
    if (state.settings.provider === "anthropic" && state.settings.modelAnt) payload.model = state.settings.modelAnt;
    if (state.settings.provider === "zhipu" && state.settings.modelZhipu) payload.model = state.settings.modelZhipu;
    var headers = { "Content-Type": "application/json" };
    // 只有用户提供了 Key 才发送（服务端优先使用环境变量）
    if (state.settings.key) headers["x-user-api-key"] = state.settings.key;
    var res = await fetch("/api/generate", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || "网络断开或代理接口异常");
    return data;
  }

  els.btnOpenSidebar.onclick = function () {
    els.sidebar.classList.add("open");
    els.sidebarOverlay.classList.add("open");
  };
  els.btnCloseSidebar.onclick = function () {
    els.sidebar.classList.remove("open");
    els.sidebarOverlay.classList.remove("open");
  };
  els.sidebarOverlay.onclick = function () {
    els.btnCloseSidebar.onclick();
  };
  els.btnNewChat.onclick = initNewChat;

  els.btnToggleTools.onclick = function () {
    els.toolsPanel.classList.toggle("open");
  };
  els.btnCloseTools.onclick = function () {
    els.toolsPanel.classList.remove("open");
  };

  els.tabs.forEach(function (t) {
    t.onclick = function () {
      els.tabs.forEach(function (tt) {
        tt.classList.remove("active");
      });
      t.classList.add("active");
      document.querySelectorAll(".tools-content > section").forEach(function (s) {
        s.classList.remove("active");
      });
      document.querySelector("." + t.getAttribute("data-target")).classList.add("active");
    };
  });

  els.btnGenerate.onclick = doGenerate;
  els.topicInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doGenerate();
    }
  });
  els.btnDemo.onclick = function () {
    els.topicInput.value = DEMO_JSON.topic;
    resizeTextarea();
    doGenerate();
  };

  async function doGenerate() {
    var rawTopic = els.topicInput.value.trim();
    var isDemo = rawTopic === DEMO_JSON.topic;
    if (!rawTopic) {
      showToast("请输入一个议题后再开始", true);
      return;
    }

    els.btnGenerate.disabled = true;
    els.welcomeScreen.style.display = "none";
    setTopicStatus("Loading", "loading", "正在建立圆桌议程...");
    clearChatSurface();

    try {
      var data;
      if (isDemo) {
        await new Promise(function (r) {
          setTimeout(r, 600);
        });
        data = DEMO_JSON;
      } else {
        data = await fetchGenerator(rawTopic);
      }

      pushToHistory(data.topic, data);
      initTopicSession(data.topic, data);
      els.topicInput.value = "";
      resizeTextarea();
      els.topicInput.blur();
    } catch (err) {
      showToast(err.message, true);
      setTopicStatus("Error", "error", "神经链路离线");
      els.welcomeScreen.style.display = "block";
    } finally {
      els.btnGenerate.disabled = false;
    }
  }

  function initTopicSession(topic, data) {
    state.topic = topic || "未命名的讨论";
    state.participants = data.participants || [];
    state.script = data.chatScript || [];
    setTopicStatus("Live", "live", state.topic);
    buildFlowSpace(data);
    renderRing();
    playSequence();
    if (window.innerWidth <= 1180 && !els.toolsPanel.classList.contains("open")) {
      showToast("已开始推演，右上角可打开分析面板");
    }
  }

  function buildFlowSpace(data) {
    updateViewportMetrics();
    state.nodes = [];
    var pStr = state.participants
      .map(function (p) {
        return p.name + "（" + p.stance + "）";
      })
      .join("，");
    state.nodes.push({ id: "n_start", type: "start", x: 40, y: CHD - 56, title: "议题输入", desc: data.topic, meta: null });
    state.nodes.push({ id: "n_def", type: "process", x: 340, y: CHD - 126, title: "立场组装", desc: pStr || "等待角色参与", meta: null });
    var baseX = 670;
    var baseY = CHD - 92;
    state.participants.forEach(function (p, i) {
      var y = baseY + (i % 2 === 0 ? 150 : -116);
      var nx = baseX + i * 132;
      state.nodes.push({ id: "p_" + p.id, type: "decision", x: nx, y: y, title: p.nick + " 观点介入", desc: p.stance || "围绕核心议题发言", meta: p });
    });
    state.nodes.push({
      id: "n_end",
      type: "end",
      x: baseX + state.participants.length * 132 + 120,
      y: CHD - 56,
      title: "结构化结论",
      desc: "多方视角汇总完成",
      meta: null
    });
    renderWorld();
  }

  function renderWorld() {
    els.nodesLayer.innerHTML = "";
    els.edgesSvg.innerHTML = EDGE_DEFS;
    state.nodes.forEach(function (n) {
      var d = document.createElement("div");
      d.className = "node-card type-" + n.type;
      d.style.left = n.x + "px";
      d.style.top = n.y + "px";
      d.innerHTML =
        '<div class="head"><div class="type-dot"></div>' +
        escapeHtml(n.type) +
        "</div>" +
        '<div class="body"><div class="t">' +
        escapeHtml(n.title) +
        '</div><div class="s">' +
        escapeHtml(n.desc) +
        "</div></div>";
      els.nodesLayer.appendChild(d);
    });
    var svgHtml = "";
    for (var i = 0; i < state.nodes.length - 1; i++) {
      var cls = "edge";
      if (i > 1 && i < state.nodes.length - 2) cls += i % 2 === 0 ? " loop" : " branch";
      svgHtml += drawBezier(state.nodes[i], state.nodes[i + 1], cls);
    }
    els.edgesSvg.innerHTML += svgHtml;
    doFit();
  }

  function drawBezier(n1, n2, cls) {
    var x1 = n1.x + NODE_W;
    var y1 = n1.y + NODE_H / 2;
    var x2 = n2.x;
    var y2 = n2.y + NODE_H / 2;
    var cp1x = x1 + (x2 - x1) / 2;
    var d = "M" + x1 + "," + y1 + " C" + cp1x + "," + y1 + " " + cp1x + "," + y2 + " " + x2 + "," + y2;
    return '<path class="' + cls + '" d="' + d + '"></path>';
  }

  function getNodeBounds() {
    if (!state.nodes.length) return { minX: 0, minY: 0, width: NODE_W, height: NODE_H };
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    state.nodes.forEach(function (n) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W);
      maxY = Math.max(maxY, n.y + NODE_H);
    });
    return { minX: minX, minY: minY, width: maxX - minX, height: maxY - minY };
  }

  function updateViewport() {
    els.world.style.transform = "translate(" + vState.x + "px, " + vState.y + "px) scale(" + vState.s + ")";
    els.zoomReadout.textContent = Math.round(vState.s * 100) + "%";
  }

  function doFit() {
    var bounds = getNodeBounds();
    var viewportWidth = els.viewport.clientWidth || 600;
    var viewportHeight = els.viewport.clientHeight || 400;
    var scale = Math.min((viewportWidth - 80) / bounds.width, (viewportHeight - 80) / bounds.height, 1);
    vState.s = Math.max(0.28, scale);
    vState.x = 40 - bounds.minX * vState.s;
    vState.y = 40 - bounds.minY * vState.s;
    updateViewport();
  }

  function doReset() {
    vState.s = 0.68;
    vState.x = 32;
    vState.y = 44;
    updateViewport();
  }

  els.btnFit.onclick = doFit;
  els.btnReset.onclick = doReset;

  // 下载思维拓扑图为高清PNG
  els.btnDownload.onclick = function () {
    downloadTopologyAsPng();
  };

  function downloadTopologyAsPng() {
    if (state.nodes.length === 0) {
      showToast("暂无拓扑图可下载", true);
      return;
    }

    try {
      // 获取当前视图边界
      var bounds = getNodeBounds();
      var exportScale = 2; // 2倍分辨率
      var padding = 60;

      var width = (bounds.width + padding * 2) * exportScale;
      var height = (bounds.height + padding * 2) * exportScale;

      // 创建canvas
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext("2d");

      // 填充背景
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      // 添加标题
      ctx.font = "bold 28px Manrope, Noto Sans SC, sans-serif";
      ctx.fillStyle = "#fafafa";
      ctx.textBaseline = "top";
      var titleText = state.topic || "思维拓扑图";
      var truncatedTitle = titleText.length > 50 ? titleText.slice(0, 47) + "..." : titleText;
      ctx.fillText(truncatedTitle, padding * exportScale, padding * exportScale - 20);

      // 计算偏移
      var offsetX = padding - bounds.minX;
      var offsetY = padding - bounds.minY;

      // 绘制连接线（先绘制线，让节点在上面）
      ctx.lineWidth = 3 * exportScale;
      ctx.lineCap = "round";

      for (var i = 0; i < state.nodes.length - 1; i++) {
        var n1 = state.nodes[i];
        var n2 = state.nodes[i + 1];
        var x1 = (n1.x + NODE_W + offsetX) * exportScale;
        var y1 = (n1.y + NODE_H / 2 + offsetY) * exportScale;
        var x2 = (n2.x + offsetX) * exportScale;
        var y2 = (n2.y + NODE_H / 2 + offsetY) * exportScale;

        // 设置颜色
        if (i > 1 && i < state.nodes.length - 2) {
          ctx.strokeStyle = i % 2 === 0 ? "#34d399" : "#f59e0b";
        } else {
          ctx.strokeStyle = "#a1a1aa";
        }

        // 绘制贝塞尔曲线
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        var cpX = x1 + (x2 - x1) / 2;
        ctx.bezierCurveTo(cpX, y1, cpX, y2, x2, y2);
        ctx.stroke();
      }

      // 绘制节点
      state.nodes.forEach(function (n) {
        var x = (n.x + offsetX) * exportScale;
        var y = (n.y + offsetY) * exportScale;
        var nodeW = NODE_W * exportScale;
        var nodeH = NODE_H * exportScale;
        var radius = 18 * exportScale;

        // 绘制卡片背景
        ctx.fillStyle = "rgba(18, 18, 20, 0.95)";
        roundRect(ctx, x, y, nodeW, nodeH, radius);
        ctx.fill();

        // 边框
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = exportScale;
        ctx.stroke();

        // 左侧颜色条
        var borderColor = "#e4e4e7";
        if (n.type === "start") borderColor = "#34d399";
        else if (n.type === "decision") borderColor = "#f59e0b";
        else if (n.type === "end") borderColor = "#fb7185";

        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.roundRect(x, y, 3 * exportScale, nodeH, [radius, 0, 0, radius]);
        ctx.fill();

        // 绘制类型标签
        ctx.font = "12px 'IBM Plex Mono', monospace";
        ctx.fillStyle = "#a1a1aa";
        ctx.fillText(n.type.toUpperCase(), x + 14 * exportScale, y + 18 * exportScale);

        // 绘制标题
        ctx.font = "bold 16px Manrope, 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "#fafafa";
        var title = n.title;
        if (title.length > 18) title = title.slice(0, 15) + "...";
        ctx.fillText(title, x + 14 * exportScale, y + 38 * exportScale);

        // 绘制描述（截断）
        ctx.font = "13px Manrope, 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "#a1a1aa";
        var desc = n.desc;
        if (desc.length > 28) desc = desc.slice(0, 25) + "...";
        ctx.fillText(desc, x + 14 * exportScale, y + 58 * exportScale);
      });

      // 导出PNG
      canvas.toBlob(function (blob) {
        if (!blob) {
          showToast("图片生成失败", true);
          return;
        }
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "topology-" + (state.historyId || "export") + "-" + Date.now() + ".png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("图片已下载");
      }, "image/png");

    } catch (e) {
      console.error("Download error:", e);
      showToast("图片生成失败: " + e.message, true);
    }
  }

  // 辅助函数：绘制圆角矩形
  function roundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      // 兼容旧浏览器
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  els.viewport.addEventListener("wheel", function (e) {
    e.preventDefault();
    var delta = e.deltaY * -0.001;
    vState.s = Math.min(Math.max(0.2, vState.s + delta), 2);
    updateViewport();
  });

  els.viewport.addEventListener("mousedown", function (e) {
    vState.panning = true;
    vState.px = e.clientX - vState.x;
    vState.py = e.clientY - vState.y;
    els.viewport.classList.add("panning");
  });

  window.addEventListener("mousemove", function (e) {
    if (!vState.panning) return;
    vState.x = e.clientX - vState.px;
    vState.y = e.clientY - vState.py;
    updateViewport();
  });

  window.addEventListener("mouseup", function () {
    vState.panning = false;
    els.viewport.classList.remove("panning");
  });

  function getPart(id) {
    if (id === "host") return { id: "host", name: "Moderator", nick: "主持", mbti: "SYS", stance: "组织讨论节奏并追问关键问题" };
    return state.participants.find(function (x) {
      return x.id === id;
    });
  }

  function clearSeats() {
    document.querySelectorAll("#stageRing .seat").forEach(function (el) {
      el.remove();
    });
  }

  function renderRing() {
    clearSeats();
    var ring = els.stageRing;
    var hub = ring.querySelector(".moderator-hub");
    var participants = state.participants || [];
    if (!participants.length) return;
    var diameter = ring.clientWidth || 300;
    var center = diameter / 2;
    var radius = Math.max(center - 46, 88);
    participants.forEach(function (p, i) {
      var angle = (i * (360 / participants.length) - 90) * (Math.PI / 180);
      var sx = center + radius * Math.cos(angle);
      var sy = center + radius * Math.sin(angle);
      var tone = getAvatarTone(p.id || p.name);
      var el = document.createElement("div");
      el.className = "seat";
      el.id = "seat_" + p.id;
      el.style.left = sx + "px";
      el.style.top = sy + "px";
      el.style.background = tone.bg;
      el.style.color = tone.fg;
      el.style.borderColor = tone.border;
      el.innerHTML = '<span class="seat-code">' + escapeHtml(getAvatarLabel(p)) + '</span><span class="label">' + escapeHtml(p.name) + "</span>";
      el.onclick = function () {
        openDrawer(p);
      };
      ring.insertBefore(el, hub);
    });
  }

  function stopPlay() {
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    state.isPlaying = false;
    state.currentIndex = 0;
    clearChatSurface();
    document.querySelectorAll(".seat").forEach(function (e) {
      e.className = "seat";
    });
  }

  function playSequence() {
    stopPlay();
    state.isPlaying = true;
    els.stageCaption.innerHTML = '正在组织观点流... <span class="flow-dot"></span>';
    function step() {
      if (!state.isPlaying) return;
      if (state.currentIndex >= state.script.length) {
        state.isPlaying = false;
        els.stageCaption.textContent = "本轮观点流已完成";
        return;
      }
      var row = state.script[state.currentIndex];
      renderChatMsg(row);
      highlightRing(row.pid);
      state.currentIndex++;
      var delay = row.text ? Math.min(Math.max(row.text.length * 42, 1400), 4200) : 1800;
      state.timer = setTimeout(step, delay);
    }
    step();
  }

  function highlightRing(pid) {
    document.querySelectorAll(".seat").forEach(function (e) {
      e.classList.remove("selected");
    });
    if (pid !== "host") {
      var sel = $("seat_" + pid);
      if (sel) sel.classList.add("selected");
    }
  }

  function renderChatMsg(row) {
    var p = getPart(row.pid);
    if (!p) return;
    var msg = document.createElement("div");
    msg.className = "msg" + (row.pid === "host" ? " host-row" : "");
    var av = document.createElement("div");
    av.className = "av";
    if (row.pid === "host") {
      av.textContent = "主持";
      av.style.background = "#18181b";
      av.style.color = "#f4f4f5";
      av.style.borderColor = "#3f3f46";
    } else {
      var tone = getAvatarTone(p.id || p.name);
      av.textContent = getAvatarLabel(p);
      av.style.background = tone.bg;
      av.style.color = tone.fg;
      av.style.borderColor = tone.border;
      av.onclick = function () {
        openDrawer(p);
      };
    }
    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML =
      '<div class="meta-line">' +
      '<div class="identity">' +
      '<div class="who">' +
      escapeHtml(row.pid === "host" ? "主持人" : p.name) +
      "</div>" +
      '<div class="who-meta">' +
      escapeHtml(row.pid === "host" ? "Moderator" : (p.mbti || "Perspective")) +
      "</div>" +
      "</div>" +
      '<span class="tag">' +
      escapeHtml(row.tag || "发言") +
      "</span>" +
      "</div>" +
      '<div class="text-content">' +
      escapeHtml(row.text) +
      "</div>" +
      (row.tldr ? '<div class="tldr-line">摘要 · ' + escapeHtml(row.tldr) + "</div>" : "");
    msg.appendChild(av);
    msg.appendChild(bubble);
    els.chatScroll.appendChild(msg);
    els.chatScroll.scrollTop = els.chatScroll.scrollHeight;
  }

  function openDrawer(p) {
    var tone = getAvatarTone(p.id || p.name);
    els.drawer.style.setProperty("--drawer-accent", tone.border);
    els.drawerAvatar.style.background =
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.28), transparent 34%), " + tone.bg;
    els.dName.textContent = p.name;
    els.dMeta.textContent = "MBTI " + (p.mbti || "N/A") + " · SYS-ID " + (p.id || "-");
    els.dStance.textContent = p.stance || "暂无核心立场";
    els.dList.innerHTML = "";
    if (p.viewpoints && p.viewpoints.length) {
      p.viewpoints.forEach(function (v) {
        var it = document.createElement("div");
        it.className = "vp-item";
        it.innerHTML =
          '<div class="r">' +
          escapeHtml(v.round) +
          "</div>" +
          '<div class="tags"><span>' +
          escapeHtml(v.tag) +
          "</span></div>" +
          '<div class="tldr">' +
          escapeHtml(v.tldr) +
          "</div>" +
          (v.detail ? '<div class="detail">' + escapeHtml(v.detail) + "</div>" : "");
        els.dList.appendChild(it);
      });
    } else {
      els.dList.innerHTML = '<div class="empty-state">尚未获取有效记录</div>';
    }
    els.backdrop.classList.add("open");
    els.drawer.classList.add("open");
  }

  els.closeDrawer.onclick = function () {
    els.backdrop.classList.remove("open");
    els.drawer.classList.remove("open");
  };
  els.backdrop.onclick = function () {
    els.closeDrawer.onclick();
  };
  els.modalBackdrop.onclick = function () {
    // 关闭所有打开的模态框
    els.settingsModal.classList.remove("open");
    els.renameModal.classList.remove("open");
    els.categoryModal.classList.remove("open");
    els.modalBackdrop.classList.remove("open");
  };

  window.addEventListener("resize", function () {
    updateViewportMetrics();
    if (state.nodes.length) doFit();
    renderRing();
  });

  updateViewportMetrics();
  resetFlowSurface();
  loadSettings();
  loadHistory();
  setTopicStatus("Idle", "", "等待新的议题输入");
  resizeTextarea();
})();
