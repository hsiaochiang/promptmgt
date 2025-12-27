const taxonomy = {
  projectStatuses: [
    { code: "ACTIVE", name: "進行中" },
    { code: "PAUSED", name: "暫停" },
    { code: "ARCHIVED", name: "已封存" },
  ],
  projectTypes: [
    { code: "PRESALES", name: "售前/提案（對客戶）" },
    { code: "DELIVERY", name: "交付/導入（對客戶）" },
    { code: "INTERNAL_PRODUCT", name: "內部工具/產品化" },
    { code: "AUTOMATION", name: "自動化工作流" },
    { code: "TEST_QA", name: "測試/品質" },
    { code: "TRAINING", name: "教材/課程/內訓" },
    { code: "RESEARCH", name: "研究/選型/技術探索" },
    { code: "OTHER", name: "其他" },
  ],
  conversationCategories: [
    { code: "PROMPT_DRAFT", name: "提示詞撰寫/拆解" },
    { code: "PROMPT_REVIEW", name: "提示詞審閱/調整策略" },
    { code: "PROMPT_TEST", name: "提示詞測試（輸入/輸出驗證）" },
    { code: "PROMPT_REFACTOR", name: "提示詞重構（結構化/模組化）" },
    { code: "KNOWLEDGE_PACK", name: "知識/資料整理（RAG/文件抽取）" },
    { code: "OUTPUT_DRAFT", name: "產出物生成（簡報/報告/文件）" },
    { code: "INTEGRATION", name: "工具整合" },
    { code: "RETROSPECTIVE", name: "回顧/決策/下一步" },
  ],
  promptStages: [
    { code: "IDEA", name: "構想" },
    { code: "DRAFT", name: "草稿" },
    { code: "RUN", name: "已跑測試" },
    { code: "EVAL", name: "評估/對照" },
    { code: "ITERATE", name: "迭代中" },
    { code: "FINAL", name: "已定稿" },
    { code: "DEPRECATED", name: "已淘汰" },
  ],
  platformTags: [
    { code: "CHATGPT", name: "ChatGPT" },
    { code: "GEMINI", name: "Gemini" },
    { code: "CLAUDE", name: "Claude" },
    { code: "COPILOT", name: "GitHub Copilot" },
    { code: "CODEX", name: "Codex" },
    { code: "N8N", name: "n8n" },
    { code: "POWER_PLATFORM", name: "Power Platform" },
  ],
  deliverableTags: [
    { code: "MD", name: "Markdown" },
    { code: "PPTX", name: "PPT" },
    { code: "PDF", name: "PDF" },
    { code: "MERMAID", name: "Mermaid/流程圖" },
    { code: "JSON", name: "JSON" },
    { code: "XLSX", name: "Excel" },
    { code: "CODE", name: "程式碼/腳本" },
    { code: "SCRIPT", name: "逐字稿/講稿" },
  ],
  audienceTags: [
    { code: "CLIENT", name: "對客戶" },
    { code: "MANAGER", name: "對主管" },
    { code: "INTERNAL", name: "內部" },
    { code: "TRAINING", name: "教育訓練" },
  ],
  commonTags: [
    { code: "REUSABLE", name: "可重用" },
    { code: "NEED_CONFIRM", name: "待確認" },
    { code: "DECISION", name: "決策" },
    { code: "BLOCKED", name: "卡關" },
    { code: "GOOD_RESULT", name: "效果佳" },
    { code: "NEED_REWORK", name: "需重作" },
    { code: "SENSITIVE", name: "敏感資訊" },
  ],
};

const data = {
  projects: [
    {
      id: "p1",
      name: "產品策略整理",
      status: "ACTIVE",
      projectType: "INTERNAL_PRODUCT",
      updatedAt: "2025-01-18 14:30",
      summary: "彙整市場訪談、產品定位與 MVP 範圍，並整理跨部門共識。",
      promptCount: 6,
      audienceTags: ["INTERNAL"],
      platformTags: ["CHATGPT", "CODEX"],
      deliverableTags: ["MD"],
      tags: ["REUSABLE", "DECISION"],
      files: [
        { name: "定位草稿.md", size: "18 KB", type: "md", date: "2025-01-18", desc: "初版定位草稿" },
        { name: "訪談摘要.pdf", size: "420 KB", type: "pdf", date: "2025-01-14", desc: "訪談摘要彙整" },
      ],
      progress: [
        { id: "pg1", date: "2025-01-18", note: "完成核心情境與定位草稿", link: "https://chatgpt.com/share/xxxx", stage: "關鍵" },
        { id: "pg2", date: "2025-01-12", note: "整理使用者痛點清單", link: "", stage: "一般" },
      ],
    },
    {
      id: "p2",
      name: "內容製作流程",
      status: "PAUSED",
      projectType: "TRAINING",
      updatedAt: "2025-01-16 09:10",
      summary: "規劃內容 SOP，建立寫作、審稿、發布的提示詞庫。",
      promptCount: 4,
      audienceTags: ["TRAINING"],
      platformTags: ["CHATGPT"],
      deliverableTags: ["MD", "PPTX"],
      tags: ["NEED_CONFIRM"],
      files: [{ name: "內容SOP.xlsx", size: "64 KB", type: "xlsx", date: "2025-01-15", desc: "草案版本" }],
      progress: [{ id: "pg3", date: "2025-01-16", note: "整理內容節奏與輸出格式", link: "https://gemini.google.com/share/xxxx", stage: "進行中" }],
    },
    {
      id: "p3",
      name: "客戶需求彙整",
      status: "ARCHIVED",
      projectType: "PRESALES",
      updatedAt: "2024-12-28 18:05",
      summary: "保存重要會議摘要與需求問答，供後續參考。",
      promptCount: 2,
      audienceTags: ["CLIENT"],
      platformTags: ["GEMINI"],
      deliverableTags: ["PDF"],
      tags: ["SENSITIVE"],
      files: [],
      progress: [{ id: "pg4", date: "2024-12-28", note: "完成全部會議歸檔", link: "", stage: "一般" }],
    },
  ],
  prompts: [
    {
      id: "r1",
      projectId: "p1",
      title: "產品定位整理",
      status: "使用中",
      tags: ["REUSABLE", "DECISION"],
      category: "PROMPT_DRAFT",
      promptStage: "ITERATE",
      platformTags: ["CHATGPT", "CODEX"],
      audienceTags: ["INTERNAL"],
      deliverableTags: ["MD"],
      updatedAt: "2025-01-18 14:10",
      content: "請協助整理產品定位，包含目標客群、核心價值與差異化。",
    },
    {
      id: "r2",
      projectId: "p1",
      title: "競品比較輸出",
      status: "使用中",
      tags: ["GOOD_RESULT"],
      category: "PROMPT_TEST",
      promptStage: "RUN",
      platformTags: ["CHATGPT"],
      audienceTags: ["INTERNAL"],
      deliverableTags: ["PPTX"],
      updatedAt: "2025-01-16 09:40",
      content: "請用表格比較三個競品的功能與價格，並說明差異。",
    },
    {
      id: "r3",
      projectId: "p2",
      title: "內容大綱生成",
      status: "草稿",
      tags: ["NEED_CONFIRM"],
      category: "OUTPUT_DRAFT",
      promptStage: "DRAFT",
      platformTags: ["CHATGPT"],
      audienceTags: ["TRAINING"],
      deliverableTags: ["MD"],
      updatedAt: "2025-01-15 11:20",
      content: "請根據主題生成文章大綱，包含三層級標題。",
    },
    {
      id: "r4",
      projectId: "p2",
      title: "審稿檢查清單",
      status: "使用中",
      tags: ["REUSABLE"],
      category: "PROMPT_REVIEW",
      promptStage: "FINAL",
      platformTags: ["CHATGPT"],
      audienceTags: ["TRAINING"],
      deliverableTags: ["MD"],
      updatedAt: "2025-01-16 08:20",
      content: "請以條列列出審稿時需要確認的項目。",
    },
    {
      id: "r5",
      projectId: "p3",
      title: "需求會議摘要",
      status: "封存",
      tags: ["SENSITIVE"],
      category: "RETROSPECTIVE",
      promptStage: "DEPRECATED",
      platformTags: ["GEMINI"],
      audienceTags: ["CLIENT"],
      deliverableTags: ["PDF"],
      updatedAt: "2024-12-28 18:02",
      content: "請濃縮會議紀錄成 5 點摘要。",
    },
  ],
  scratchpadItems: [
    {
      id: "sp1",
      title: "會議備忘",
      content: "請整理會議紀錄成三段式摘要：背景/討論/決議。",
      updatedAt: "2025-01-18 15:30",
    },
    {
      id: "sp2",
      title: "輸出格式提示",
      content: "請以表格列出比較項目，並附結論段。",
      updatedAt: "2025-01-17 10:05",
    },
  ],
};

const state = {
  page: "projects",
  selectedProjectId: "p1",
  selectedPromptId: "r1",
  editor: null,
  dirty: false,
  isNew: false,
  scratchpad: "把零碎想法放在這裡，稍後整理成提示詞。",
  editingProgressId: null,
  progressDraft: null,
  editingFileName: null,
  projectFilters: { status: "ALL", type: "ALL", tag: "ALL" },
  promptFilters: { category: "ALL", stage: "ALL", tag: "ALL", platform: "ALL" },
};

const mainEl = document.getElementById("main");
const sideEl = document.getElementById("side");
const toastEl = document.getElementById("toast");
const modalEl = document.getElementById("modal");

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function getTaxName(list, code) {
  const item = list.find((entry) => entry.code === code);
  return item ? item.name : code;
}

function renderTagChips(list, codes, variant = "neutral") {
  if (!codes || !codes.length) return `<span class="chip chip-muted">未標記</span>`;
  return codes.map((code) => `<span class="chip chip-${variant}">${getTaxName(list, code)}</span>`).join(" ");
}

function formatTags(tags) {
  return renderTagChips(taxonomy.commonTags, tags);
}

function renderTagChecklist(list, field, selected, variant) {
  return list
    .map((item) => {
      const checked = (selected || []).includes(item.code);
      return `
        <button class="chip chip-${variant} ${checked ? "chip-active" : ""}" data-action="toggle-tag" data-field="${field}" data-code="${item.code}">
          ${checked ? "✓ " : ""}${item.name}
        </button>
      `;
    })
    .join("");
}

function renderProjectTagChecklist(list, field, selected, variant) {
  return list
    .map((item) => {
      const checked = (selected || []).includes(item.code);
      return `
        <button class="chip chip-${variant} ${checked ? "chip-active" : ""}" data-action="toggle-project-tag" data-field="${field}" data-code="${item.code}">
          ${checked ? "✓ " : ""}${item.name}
        </button>
      `;
    })
    .join("");
}

function getProject(id) {
  return data.projects.find((project) => project.id === id);
}

function getPrompt(id) {
  return data.prompts.find((prompt) => prompt.id === id);
}

function getPromptsByProject(projectId) {
  return data.prompts.filter((prompt) => prompt.projectId === projectId);
}

function updateProject(projectId, patch) {
  const target = data.projects.find((project) => project.id === projectId);
  if (!target) return;
  Object.assign(target, patch);
}

function startEditProgress(progressId, progress) {
  state.editingProgressId = progressId;
  state.progressDraft = { ...progress };
}

function saveProgress(projectId) {
  const project = getProject(projectId);
  if (!project || !state.progressDraft) return;
  project.progress = (project.progress || []).map((item) => (item.id === state.editingProgressId ? { ...item, ...state.progressDraft } : item));
  state.editingProgressId = null;
  state.progressDraft = null;
  showToast("已更新進度紀錄");
  renderProjectDetail();
}

function cancelProgressEdit() {
  state.editingProgressId = null;
  state.progressDraft = null;
  renderProjectDetail();
}

function addProjectFile(projectId, file) {
  const project = getProject(projectId);
  if (!project) return;
  project.files = project.files || [];
  const type = file.type ? file.type.split("/").pop() : "file";
  project.files.unshift({
    name: file.name,
    size: `${Math.ceil(file.size / 1024)} KB`,
    type: type || "file",
    date: formatDate(new Date()),
    desc: "待補充",
  });
  showToast("已加入檔案（原型示意）");
  renderProjectDetail();
}

function addProgressEntry(projectId) {
  const project = getProject(projectId);
  if (!project) return;
  const id = `pg${Math.floor(Math.random() * 10000)}`;
  const entry = {
    id,
    date: formatDate(new Date()),
    note: "新增進度摘要",
    link: "",
    stage: "進行中",
  };
  project.progress = [entry, ...(project.progress || [])];
  startEditProgress(id, entry);
  renderProjectDetail();
}

function setActiveTab() {
  document.querySelectorAll(".tab").forEach((tab) => {
    const action = tab.getAttribute("data-action");
    const isActive =
      (action === "nav-projects" && state.page.startsWith("project")) ||
      (action === "nav-prompts" && state.page.startsWith("prompt")) ||
      (action === "nav-scratchpad" && state.page === "scratchpad");
    tab.classList.toggle("active", isActive);
  });
}

function renderProjects() {
  const filteredProjects = data.projects.filter((project) => {
    if (state.projectFilters.status !== "ALL" && project.status !== state.projectFilters.status) return false;
    if (state.projectFilters.type !== "ALL" && project.projectType !== state.projectFilters.type) return false;
    if (state.projectFilters.tag !== "ALL" && !(project.tags || []).includes(state.projectFilters.tag)) return false;
    return true;
  });

  const items = filteredProjects
    .map(
      (project, index) => `
        <div class="card fade-stagger" style="--delay: ${index * 80}ms" data-action="open-project" data-id="${project.id}">
          <div class="header-row">
            <div>
              <div class="section-title">${project.name}</div>
              <div class="section-sub">${project.summary}</div>
            </div>
            <span class="badge badge-accent">${getTaxName(taxonomy.projectStatuses, project.status)}</span>
          </div>
          <div class="tag-group" style="margin-top: 10px">
            <span class="badge badge-brand">${getTaxName(taxonomy.projectTypes, project.projectType)}</span>
            ${formatTags(project.tags)}
          </div>
          <div class="grid-2" style="margin-top: 12px">
            <div>
              <div class="section-sub">提示詞數</div>
              <strong>${project.promptCount}</strong>
            </div>
            <div>
              <div class="section-sub">更新時間</div>
              <strong>${project.updatedAt}</strong>
            </div>
          </div>
        </div>
      `
    )
    .join("");

  mainEl.innerHTML = `
    <div class="header-row">
      <div>
        <h1 class="section-title">Projects 專案列表</h1>
        <div class="section-sub">單主欄排列，支援分類與標籤篩選。</div>
      </div>
      <div class="editor-actions">
        <button class="btn btn-ghost" data-action="nav-prompts">查看全部提示詞</button>
        <button class="btn btn-primary" data-action="new-project">新增專案</button>
      </div>
    </div>
    <div style="margin-top: 20px" class="grid-2">
      <input class="input" placeholder="搜尋專案名稱" />
      <select class="select" data-filter="status" data-scope="project">
        <option value="ALL">所有狀態</option>
        ${taxonomy.projectStatuses
          .map((status) => `<option value="${status.code}" ${status.code === state.projectFilters.status ? "selected" : ""}>${status.name}</option>`)
          .join("")}
      </select>
    </div>
    <div style="margin-top: 12px" class="grid-2">
      <select class="select" data-filter="type" data-scope="project">
        <option value="ALL">所有分類</option>
        ${taxonomy.projectTypes
          .map((type) => `<option value="${type.code}" ${type.code === state.projectFilters.type ? "selected" : ""}>${type.name}</option>`)
          .join("")}
      </select>
      <select class="select" data-filter="tag" data-scope="project">
        <option value="ALL">全部標籤</option>
        ${taxonomy.commonTags
          .map((tag) => `<option value="${tag.code}" ${tag.code === state.projectFilters.tag ? "selected" : ""}>${tag.name}</option>`)
          .join("")}
      </select>
    </div>
    <div class="list" style="margin-top: 20px">
      ${filteredProjects.length ? items : `<div class="card">目前沒有符合條件的專案。</div>`}
    </div>
  `;

  sideEl.innerHTML = `
    <div class="section-title">專案概覽</div>
    <div class="section-sub" style="margin-top: 6px">聚焦於近期的內容更新節奏。</div>
    <div class="kpi-grid" style="margin-top: 16px">
      <div class="kpi">
        <div class="section-sub">進行中</div>
        <strong>${data.projects.filter((p) => p.status === "ACTIVE").length}</strong>
      </div>
      <div class="kpi">
        <div class="section-sub">暫停</div>
        <strong>${data.projects.filter((p) => p.status === "PAUSED").length}</strong>
      </div>
      <div class="kpi">
        <div class="section-sub">封存</div>
        <strong>${data.projects.filter((p) => p.status === "ARCHIVED").length}</strong>
      </div>
    </div>
    <div style="margin-top: 24px" class="card">
      <div class="section-title">使用建議</div>
      <div class="section-sub" style="margin-top: 8px">先挑 1 個專案確認動線，再進入提示詞編輯。</div>
      <button class="btn btn-accent" style="margin-top: 16px" data-action="open-project" data-id="${state.selectedProjectId}">進入最近專案</button>
    </div>
  `;
}

function renderProjectDetail() {
  const project = getProject(state.selectedProjectId);
  const prompts = getPromptsByProject(project.id);

  const promptRows = prompts
    .map(
      (prompt, index) => `
        <div class="row fade-stagger" style="--delay: ${index * 60}ms" data-action="open-prompt" data-id="${prompt.id}">
          <div>
            <div>${prompt.title}</div>
            <div class="prompt-tags">${renderTagChips(taxonomy.commonTags, prompt.tags, "neutral")}</div>
          </div>
          <div>${prompt.updatedAt}</div>
          <div><span class="badge badge-brand">${prompt.status}</span></div>
          <div>›</div>
        </div>
      `
    )
    .join("");

  const progressItems = project.progress
    .map((item) => {
      const isEditing = state.editingProgressId === item.id;
      if (isEditing && state.progressDraft) {
        return `
          <div class="card">
            <div class="header-row">
              <div>
                <div class="progress-meta">
                  <span class="section-sub">${state.progressDraft.date}</span>
                  <span class="chip chip-soft">${state.progressDraft.stage || "進行中"}</span>
                </div>
                <div>${state.progressDraft.note}</div>
              </div>
              <button class="btn btn-ghost" data-action="cancel-progress">收合</button>
            </div>
            <div class="expand-panel">
              <div class="progress-grid">
                <input class="input input-short" data-progress-field="date" value="${state.progressDraft.date}" placeholder="YYYY-MM-DD" />
                <select class="select select-short" data-progress-field="stage">
                  ${["一般", "關鍵", "進行中"]
                    .map((option) => `<option value="${option}" ${option === state.progressDraft.stage ? "selected" : ""}>${option}</option>`)
                    .join("")}
                </select>
                <input class="input" data-progress-field="link" value="${state.progressDraft.link || ""}" placeholder="對話連結（ChatGPT/Gemini）" />
              </div>
              <textarea class="textarea" style="min-height: 140px; margin-top: 12px" data-progress-field="note" placeholder="更新內容">${state.progressDraft.note}</textarea>
              <div class="editor-actions" style="margin-top: 12px; justify-content: flex-end">
                <button class="btn btn-primary" data-action="save-progress" data-id="${item.id}">儲存</button>
              </div>
            </div>
          </div>
        `;
      }
      const linkEl = item.link ? `<a class="btn btn-link" href="${item.link}" target="_blank">連結</a>` : "";
      return `
        <div class="card card-click" data-action="edit-progress" data-id="${item.id}">
          <div class="header-row">
            <div>
              <div class="progress-meta">
                <span class="section-sub">${item.date}</span>
                <span class="chip chip-soft">${item.stage || "進行中"}</span>
              </div>
              <div>${item.note}</div>
            </div>
            <div class="inline-actions">
              ${linkEl}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  mainEl.innerHTML = `
    <div class="header-row">
      <div>
        <div class="section-sub">專案 / ${project.name}</div>
        <h1 class="section-title">${project.name}</h1>
      </div>
      <div class="editor-actions">
        <button class="btn btn-ghost" data-action="nav-projects">回到專案列表</button>
        <button class="btn btn-primary" data-action="new-prompt" data-project="${project.id}">新增提示詞</button>
      </div>
    </div>

    <div class="card" style="margin-top: 20px">
      <div class="section-title">專案摘要</div>
      <div class="section-sub" style="margin-top: 6px">${project.summary}</div>
    </div>

    <div style="margin-top: 24px">
      <div class="header-row">
        <div>
          <div class="section-title">提示詞清單</div>
          <div class="section-sub">從這裡直接進入編輯。</div>
        </div>
        <button class="btn btn-ghost" data-action="nav-prompts">查看全部提示詞</button>
      </div>
      <div class="table-head" style="margin-top: 12px">
        <div>標題</div>
        <div>更新時間</div>
        <div>狀態</div>
        <div></div>
      </div>
      <div class="list" style="margin-top: 10px">${promptRows}</div>
    </div>

    <div style="margin-top: 24px">
      <div class="header-row">
        <div>
          <div class="section-title">檔案上傳</div>
          <div class="section-sub">新增日期、描述欄位（原型示意）。</div>
        </div>
        <label class="btn btn-ghost">
          上傳檔案
          <input type="file" data-action="upload-file" data-id="${project.id}" style="display:none" />
        </label>
      </div>
      <div class="table-head file-head" style="margin-top: 12px">
        <div>檔名</div>
        <div>日期</div>
        <div>描述</div>
      </div>
      <div class="list" style="margin-top: 10px">
        ${(project.files || []).length
          ? project.files
              .map((file) => {
                const isEditing = state.editingFileName === file.name;
                if (isEditing) {
                  return `
                    <div class="row row-files">
                      <div>${file.name}</div>
                      <div>${file.date || "-"}</div>
                      <div><input class="input input-inline" data-file-desc="${file.name}" value="${file.desc || ""}" placeholder="補充描述" /></div>
                    </div>
                  `;
                }
                return `
                  <div class="row row-files card-click" data-action="edit-file" data-id="${file.name}">
                    <div>${file.name}</div>
                    <div>${file.date || "-"}</div>
                    <div class="section-sub">${file.desc || "點擊輸入描述"}</div>
                  </div>
                `;
              })
              .join("")
          : `<div class="card">目前沒有檔案，點上方按鈕新增。</div>`}
      </div>
    </div>

    <div style="margin-top: 24px">
      <div class="section-title">進度紀錄</div>
      <div class="section-sub">點擊卡片展開編輯，連結只顯示為「連結」。</div>
      <div class="editor-actions" style="margin-top: 10px; justify-content: flex-end">
        <button class="btn btn-primary" data-action="add-progress">新增進度</button>
      </div>
      <div class="list" style="margin-top: 12px">${progressItems}</div>
    </div>
  `;

  sideEl.innerHTML = `
    <div class="section-title">專案資訊</div>
    <div class="card" style="margin-top: 16px">
      <div class="info-grid">
        <div>
          <div class="section-sub">狀態</div>
          <strong>${getTaxName(taxonomy.projectStatuses, project.status)}</strong>
        </div>
        <div>
          <div class="section-sub">更新時間</div>
          <strong>${project.updatedAt}</strong>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="header-row">
        <div>
          <div class="section-title">分類與標籤</div>
          <div class="section-sub">可直接點選調整。</div>
        </div>
        <span class="chip chip-strong">${getTaxName(taxonomy.projectTypes, project.projectType)}</span>
      </div>
      <div class="chip-grid" style="margin-top: 14px">
        <div class="chip-block">
          <div class="chip-title">平台</div>
          <div class="chip-row">${renderProjectTagChecklist(taxonomy.platformTags, "platformTags", project.platformTags, "brand")}</div>
        </div>
        <div class="chip-block">
          <div class="chip-title">受眾</div>
          <div class="chip-row">${renderProjectTagChecklist(taxonomy.audienceTags, "audienceTags", project.audienceTags, "accent")}</div>
        </div>
        <div class="chip-block">
          <div class="chip-title">交付物</div>
          <div class="chip-row">${renderProjectTagChecklist(taxonomy.deliverableTags, "deliverableTags", project.deliverableTags, "soft")}</div>
        </div>
        <div class="chip-block">
          <div class="chip-title">共通標籤</div>
          <div class="chip-row">${renderProjectTagChecklist(taxonomy.commonTags, "tags", project.tags, "neutral")}</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">快速操作</div>
      <button class="btn btn-primary" style="margin-top: 12px" data-action="new-prompt" data-project="${project.id}">新增提示詞</button>
      <button class="btn btn-ghost" style="margin-top: 8px" data-action="nav-prompts">切換到提示詞列表</button>
    </div>
  `;
}

function renderPrompts() {
  const filteredPrompts = data.prompts.filter((prompt) => {
    if (state.promptFilters.category !== "ALL" && prompt.category !== state.promptFilters.category) return false;
    if (state.promptFilters.stage !== "ALL" && prompt.promptStage !== state.promptFilters.stage) return false;
    if (state.promptFilters.tag !== "ALL" && !(prompt.tags || []).includes(state.promptFilters.tag)) return false;
    if (state.promptFilters.platform !== "ALL" && !(prompt.platformTags || []).includes(state.promptFilters.platform)) return false;
    return true;
  });

  const rows = filteredPrompts
    .map(
      (prompt, index) => {
        const project = getProject(prompt.projectId);
        return `
          <div class="row fade-stagger" style="--delay: ${index * 60}ms" data-action="open-prompt" data-id="${prompt.id}">
            <div>
              <div>${prompt.title}</div>
              <div class="section-sub">${project?.name ?? "未分類"} · ${getTaxName(taxonomy.conversationCategories, prompt.category)} · ${getTaxName(taxonomy.promptStages, prompt.promptStage)}</div>
            </div>
            <div>${prompt.updatedAt}</div>
            <div><span class="badge badge-brand">${prompt.status}</span></div>
            <div>›</div>
          </div>
        `;
      }
    )
    .join("");

  mainEl.innerHTML = `
    <div class="header-row">
      <div>
        <h1 class="section-title">提示詞列表</h1>
        <div class="section-sub">集中管理與快速搜尋，點擊進入編輯。</div>
      </div>
      <div class="editor-actions">
        <button class="btn btn-ghost" data-action="nav-projects">回到專案</button>
        <button class="btn btn-primary" data-action="new-prompt">新增提示詞</button>
      </div>
    </div>
    <div style="margin-top: 20px" class="grid-2">
      <input class="input" placeholder="搜尋標題或標籤" />
      <select class="select" data-filter="category" data-scope="prompt">
        <option value="ALL">所有分類</option>
        ${taxonomy.conversationCategories
          .map((item) => `<option value="${item.code}" ${item.code === state.promptFilters.category ? "selected" : ""}>${item.name}</option>`)
          .join("")}
      </select>
    </div>
    <div style="margin-top: 12px" class="grid-2">
      <select class="select" data-filter="stage" data-scope="prompt">
        <option value="ALL">所有階段</option>
        ${taxonomy.promptStages
          .map((item) => `<option value="${item.code}" ${item.code === state.promptFilters.stage ? "selected" : ""}>${item.name}</option>`)
          .join("")}
      </select>
      <select class="select" data-filter="platform" data-scope="prompt">
        <option value="ALL">所有平台</option>
        ${taxonomy.platformTags
          .map((item) => `<option value="${item.code}" ${item.code === state.promptFilters.platform ? "selected" : ""}>${item.name}</option>`)
          .join("")}
      </select>
    </div>
    <div style="margin-top: 12px" class="grid-2">
      <select class="select" data-filter="tag" data-scope="prompt">
        <option value="ALL">全部標籤</option>
        ${taxonomy.commonTags
          .map((item) => `<option value="${item.code}" ${item.code === state.promptFilters.tag ? "selected" : ""}>${item.name}</option>`)
          .join("")}
      </select>
      <div class="card" style="padding: 12px">
        <div class="section-sub">篩選結果</div>
        <strong>${filteredPrompts.length} 筆</strong>
      </div>
    </div>
    <div class="table-head" style="margin-top: 20px">
      <div>標題</div>
      <div>更新時間</div>
      <div>狀態</div>
      <div></div>
    </div>
    <div class="list" style="margin-top: 10px">
      ${filteredPrompts.length ? rows : `<div class="card">目前沒有符合條件的提示詞。</div>`}
    </div>
  `;

  sideEl.innerHTML = `
    <div class="section-title">提示詞概覽</div>
    <div class="section-sub" style="margin-top: 6px">快速掌握狀態與標籤分佈。</div>
    <div class="card" style="margin-top: 16px">
      <div class="section-sub">使用中</div>
      <strong>${data.prompts.filter((p) => p.status === "使用中").length}</strong>
      <div class="section-sub" style="margin-top: 12px">草稿</div>
      <strong>${data.prompts.filter((p) => p.status === "草稿").length}</strong>
      <div class="section-sub" style="margin-top: 12px">封存</div>
      <strong>${data.prompts.filter((p) => p.status === "封存").length}</strong>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">友善提醒</div>
      <div class="section-sub" style="margin-top: 6px">先完成「新增 → 編輯 → 儲存」，再回到列表確認。</div>
    </div>
  `;
}

function renderPromptDetail() {
  const editor = state.editor || getPrompt(state.selectedPromptId);
  const projectOptions = data.projects
    .map((project) => `<option value="${project.id}" ${project.id === editor.projectId ? "selected" : ""}>${project.name}</option>`)
    .join("");

  mainEl.innerHTML = `
    <div class="editor-head">
      <div>
        <div class="section-sub">提示詞 / 編輯</div>
        <div class="editor-title">${editor.title || "未命名提示詞"}</div>
      </div>
      <div class="editor-actions">
        <span class="badge ${state.dirty ? "badge-accent" : "badge-brand"}">
          <span class="status-dot"></span>
          ${state.dirty ? "尚未儲存" : "已儲存"}
        </span>
        <button class="btn btn-ghost" data-action="back-to-prompts">回到列表</button>
        <button class="btn btn-accent" data-action="copy-prompt">複製</button>
        <button class="btn btn-primary" data-action="save-prompt">儲存並回列表</button>
      </div>
    </div>

    <div style="margin-top: 16px" class="card">
      <label class="section-sub">標題</label>
      <input class="input" id="prompt-title" value="${editor.title}" placeholder="輸入提示詞標題" />
    </div>

    <div style="margin-top: 16px" class="card">
      <label class="section-sub">提示詞內容</label>
      <textarea class="textarea" id="prompt-content" placeholder="寫下你的提示詞...">${editor.content}</textarea>
    </div>
  `;

  sideEl.innerHTML = `
    <div class="section-title">提示詞資訊</div>
    <div class="card" style="margin-top: 16px">
      <label class="section-sub">所屬專案</label>
      <select class="select" id="prompt-project">${projectOptions}</select>
      <label class="section-sub" style="margin-top: 12px">狀態</label>
      <select class="select" id="prompt-status">
        <option ${editor.status === "使用中" ? "selected" : ""}>使用中</option>
        <option ${editor.status === "草稿" ? "selected" : ""}>草稿</option>
        <option ${editor.status === "封存" ? "selected" : ""}>封存</option>
      </select>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">分類設定</div>
      <label class="section-sub" style="margin-top: 10px">分類</label>
      <select class="select" id="prompt-category">
        ${taxonomy.conversationCategories
          .map((item) => `<option value="${item.code}" ${item.code === editor.category ? "selected" : ""}>${item.name}</option>`)
          .join("")}
      </select>
      <label class="section-sub" style="margin-top: 12px">階段</label>
      <select class="select" id="prompt-stage">
        ${taxonomy.promptStages
          .map((item) => `<option value="${item.code}" ${item.code === editor.promptStage ? "selected" : ""}>${item.name}</option>`)
          .join("")}
      </select>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">平台標籤</div>
      <div class="chip-row" style="margin-top: 10px">
        ${renderTagChecklist(taxonomy.platformTags, "platformTags", editor.platformTags, "brand")}
      </div>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">交付物標籤</div>
      <div class="chip-row" style="margin-top: 10px">
        ${renderTagChecklist(taxonomy.deliverableTags, "deliverableTags", editor.deliverableTags, "soft")}
      </div>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">受眾標籤</div>
      <div class="chip-row" style="margin-top: 10px">
        ${renderTagChecklist(taxonomy.audienceTags, "audienceTags", editor.audienceTags, "accent")}
      </div>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">共通標籤</div>
      <div class="chip-row" style="margin-top: 10px">
        ${renderTagChecklist(taxonomy.commonTags, "tags", editor.tags, "neutral")}
      </div>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-title">快捷操作</div>
      <button class="btn btn-ghost" style="margin-top: 10px" data-action="duplicate-prompt">另存為副本</button>
      <button class="btn btn-danger" style="margin-top: 10px" data-action="archive-prompt">封存提示詞</button>
    </div>
  `;

  bindPromptEditor();
}

function renderScratchpad() {
  const items = data.scratchpadItems
    .map(
      (item) => `
      <div class="card">
        <div class="header-row">
          <div>
            <div class="section-title">${item.title}</div>
            <div class="section-sub">${item.updatedAt}</div>
          </div>
          <div class="inline-actions">
            <button class="btn btn-ghost" data-action="copy-scratch" data-id="${item.id}">複製</button>
            <button class="btn btn-primary" data-action="scratch-to-prompt" data-id="${item.id}">轉成提示詞</button>
          </div>
        </div>
        <div class="section-sub" style="margin-top: 10px">${item.content}</div>
      </div>
    `
    )
    .join("");

  mainEl.innerHTML = `
    <div class="header-row">
      <div>
        <h1 class="section-title">剪貼簿</h1>
        <div class="section-sub">快速取用內容，複製後即可離開。</div>
      </div>
      <div class="editor-actions">
        <button class="btn btn-ghost" data-action="clear-scratchpad">清空輸入</button>
        <button class="btn btn-accent" data-action="scratchpad-to-prompt">存成提示詞</button>
        <button class="btn btn-primary" data-action="add-scratch-item">加入列表</button>
      </div>
    </div>
    <div class="card" style="margin-top: 20px">
      <div class="section-title">快速新增</div>
      <div class="section-sub">貼上內容後加入剪貼簿列表。</div>
      <textarea class="textarea" id="scratchpad-input">${state.scratchpad}</textarea>
    </div>
    <div style="margin-top: 24px">
      <div class="section-title">剪貼簿列表</div>
      <div class="section-sub">一鍵複製或直接轉成提示詞。</div>
      <div class="list" style="margin-top: 12px">
        ${items || `<div class="card">目前沒有紀錄，先加入一筆內容。</div>`}
      </div>
    </div>
  `;

  sideEl.innerHTML = `
    <div class="section-title">剪貼簿操作</div>
    <div class="card" style="margin-top: 16px">
      <div class="section-sub">常用動作</div>
      <div class="chip-row" style="margin-top: 10px">
        <span class="chip chip-neutral">複製內容</span>
        <span class="chip chip-neutral">轉成提示詞</span>
        <span class="chip chip-neutral">快速新增</span>
      </div>
    </div>
    <div class="card" style="margin-top: 16px">
      <div class="section-sub">列表數量</div>
      <strong>${data.scratchpadItems.length}</strong>
    </div>
  `;

  const input = document.getElementById("scratchpad-input");
  input.addEventListener("input", (event) => {
    state.scratchpad = event.target.value;
  });
}

function bindPromptEditor() {
  const titleEl = document.getElementById("prompt-title");
  const contentEl = document.getElementById("prompt-content");
  const projectEl = document.getElementById("prompt-project");
  const statusEl = document.getElementById("prompt-status");
  const categoryEl = document.getElementById("prompt-category");
  const stageEl = document.getElementById("prompt-stage");

  [titleEl, contentEl, projectEl, statusEl, categoryEl, stageEl].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", () => {
      const editor = state.editor || getPrompt(state.selectedPromptId);
      if (!editor) return;
      state.editor = {
        ...editor,
        title: titleEl.value,
        content: contentEl.value,
        projectId: projectEl.value,
        status: statusEl.value,
        category: categoryEl ? categoryEl.value : editor.category,
        promptStage: stageEl ? stageEl.value : editor.promptStage,
      };
      state.dirty = true;
      renderPromptDetail();
    });
  });
}

function createNewPrompt(projectId) {
  const newPrompt = {
    id: `r${Math.floor(Math.random() * 10000)}`,
    projectId: projectId || state.selectedProjectId,
    title: "新提示詞",
    status: "草稿",
    tags: [],
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    content: "",
  };
  state.editor = newPrompt;
  state.isNew = true;
  state.dirty = true;
  state.page = "promptDetail";
  render();
}

function savePrompt() {
  const editor = state.editor;
  if (!editor) return;
  editor.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  if (state.isNew) {
    data.prompts.unshift(editor);
  } else {
    const index = data.prompts.findIndex((prompt) => prompt.id === editor.id);
    if (index >= 0) data.prompts[index] = editor;
  }
  state.isNew = false;
  state.dirty = false;
  state.editor = null;
  state.page = "prompts";
  showToast("已儲存，回到提示詞列表");
  render();
}

function openPrompt(id) {
  state.selectedPromptId = id;
  state.editor = { ...getPrompt(id) };
  state.dirty = false;
  state.isNew = false;
  state.page = "promptDetail";
  render();
}

function openProject(id) {
  state.selectedProjectId = id;
  state.page = "projectDetail";
  render();
}

function copyPrompt() {
  const editor = state.editor || getPrompt(state.selectedPromptId);
  if (!editor) return;
  const text = editor.content || "";
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast("已複製提示詞內容"));
  } else {
    showToast("已複製提示詞內容");
  }
}

function render() {
  setActiveTab();
  if (state.page === "projects") return renderProjects();
  if (state.page === "projectDetail") return renderProjectDetail();
  if (state.page === "prompts") return renderPrompts();
  if (state.page === "promptDetail") return renderPromptDetail();
  return renderScratchpad();
}

function openHelp() {
  modalEl.classList.remove("hidden");
}

function closeHelp() {
  modalEl.classList.add("hidden");
}

function archivePrompt() {
  const editor = state.editor || getPrompt(state.selectedPromptId);
  if (!editor) return;
  editor.status = "封存";
  state.editor = editor;
  state.dirty = true;
  showToast("提示詞已標記為封存");
  renderPromptDetail();
}

function duplicatePrompt() {
  const editor = state.editor || getPrompt(state.selectedPromptId);
  if (!editor) return;
  const copy = {
    ...editor,
    id: `r${Math.floor(Math.random() * 10000)}`,
    title: `${editor.title}（副本）`,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
  data.prompts.unshift(copy);
  showToast("已建立副本，請在列表查看");
}

function scratchpadToPrompt() {
  createNewPrompt(state.selectedProjectId);
  state.editor.content = state.scratchpad;
  state.editor.title = "剪貼簿整理";
  state.dirty = true;
  render();
}

function clearScratchpad() {
  state.scratchpad = "";
  renderScratchpad();
}

function addScratchItem() {
  const text = state.scratchpad.trim();
  if (!text) {
    showToast("請先輸入內容再加入列表");
    return;
  }
  const title = text.split("\n")[0].slice(0, 18) || "剪貼簿內容";
  data.scratchpadItems.unshift({
    id: `sp${Math.floor(Math.random() * 10000)}`,
    title,
    content: text,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  });
  state.scratchpad = "";
  showToast("已加入剪貼簿列表");
  renderScratchpad();
}

function copyScratchItem(id) {
  const item = data.scratchpadItems.find((entry) => entry.id === id);
  if (!item) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(item.content).then(() => showToast("已複製剪貼簿內容"));
  } else {
    showToast("已複製剪貼簿內容");
  }
}

function scratchToPrompt(id) {
  const item = data.scratchpadItems.find((entry) => entry.id === id);
  if (!item) return;
  createNewPrompt(state.selectedProjectId);
  state.editor.content = item.content;
  state.editor.title = item.title;
  state.dirty = true;
  render();
}

function handleClick(event) {
  if (event.target.matches("input, textarea, select")) return;
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.getAttribute("data-action");
  const id = target.getAttribute("data-id");
  const projectId = target.getAttribute("data-project");
  const field = target.getAttribute("data-field");
  const code = target.getAttribute("data-code");

  switch (action) {
    case "nav-projects":
      state.page = "projects";
      return render();
    case "nav-prompts":
      state.page = "prompts";
      return render();
    case "nav-scratchpad":
      state.page = "scratchpad";
      return render();
    case "open-project":
      return openProject(id);
    case "open-prompt":
      return openPrompt(id);
    case "edit-progress": {
      if (state.editingProgressId === id) {
        return cancelProgressEdit();
      }
      const project = getProject(state.selectedProjectId);
      const progress = (project.progress || []).find((item) => item.id === id);
      if (!progress) return null;
      startEditProgress(id, progress);
      return renderProjectDetail();
    }
    case "save-progress":
      return saveProgress(state.selectedProjectId);
    case "cancel-progress":
      return cancelProgressEdit();
    case "add-progress":
      return addProgressEntry(state.selectedProjectId);
    case "edit-file": {
      if (state.editingFileName === id) {
        state.editingFileName = null;
      } else {
        state.editingFileName = id;
      }
      return renderProjectDetail();
    }
    case "new-prompt":
      return createNewPrompt(projectId);
    case "save-prompt":
      return savePrompt();
    case "back-to-prompts":
      state.page = "prompts";
      state.editor = null;
      return render();
    case "copy-prompt":
      return copyPrompt();
    case "duplicate-prompt":
      return duplicatePrompt();
    case "archive-prompt":
      return archivePrompt();
    case "add-scratch-item":
      return addScratchItem();
    case "copy-scratch":
      return copyScratchItem(id);
    case "scratch-to-prompt":
      return scratchToPrompt(id);
    case "toggle-tag": {
      const editor = state.editor || getPrompt(state.selectedPromptId);
      if (!editor) return null;
      const selected = new Set(editor[field] || []);
      if (selected.has(code)) {
        selected.delete(code);
      } else {
        selected.add(code);
      }
      state.editor = { ...editor, [field]: Array.from(selected) };
      state.dirty = true;
      return renderPromptDetail();
    }
    case "toggle-project-tag": {
      const project = getProject(state.selectedProjectId);
      if (!project) return null;
      const selected = new Set(project[field] || []);
      if (selected.has(code)) {
        selected.delete(code);
      } else {
        selected.add(code);
      }
      project[field] = Array.from(selected);
      return renderProjectDetail();
    }
    case "scratchpad-to-prompt":
      return scratchpadToPrompt();
    case "clear-scratchpad":
      return clearScratchpad();
    case "open-help":
      return openHelp();
    case "close-help":
      return closeHelp();
    default:
      return null;
  }
}

function handleInput(event) {
  const target = event.target;
  if (target && target.id === "scratchpad-input") {
    state.scratchpad = target.value;
  }
  if (target && target.hasAttribute("data-file-desc")) {
    const project = getProject(state.selectedProjectId);
    if (!project) return;
    const name = target.getAttribute("data-file-desc");
    project.files = (project.files || []).map((file) => (file.name === name ? { ...file, desc: target.value } : file));
  }
  if (target && target.hasAttribute("data-progress-field")) {
    const field = target.getAttribute("data-progress-field");
    if (!state.progressDraft) return;
    state.progressDraft = { ...state.progressDraft, [field]: target.value };
  }
}

function handleChange(event) {
  const target = event.target;
  if (!target) return;
  if (target.matches('[data-action="upload-file"]')) {
    const file = target.files && target.files[0];
    const projectId = target.getAttribute("data-id");
    if (file && projectId) {
      addProjectFile(projectId, file);
      target.value = "";
    }
  }
  if (target.matches("[data-filter][data-scope]")) {
    const scope = target.getAttribute("data-scope");
    const filterKey = target.getAttribute("data-filter");
    if (scope === "project") {
      state.projectFilters = { ...state.projectFilters, [filterKey]: target.value };
      return renderProjects();
    }
    if (scope === "prompt") {
      state.promptFilters = { ...state.promptFilters, [filterKey]: target.value };
      return renderPrompts();
    }
  }
  if (target && target.hasAttribute("data-progress-field")) {
    const field = target.getAttribute("data-progress-field");
    if (!state.progressDraft) return;
    state.progressDraft = { ...state.progressDraft, [field]: target.value };
    return;
  }
}

document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);

render();
