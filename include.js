/* =========================================================
   include.js
   - Faz fetch() do template-padrao.html
   - Injeta header/hero/footer via <template>
   - Configura hero via atributos no <html>
   - Marca item ativo do menu via <html data-active="...">
   - Resolve imagens por nome-base (HEAD): .png .jpeg .jpg
   - Controla menu mobile (aria-* correto)
   ========================================================= */

(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const html = document.documentElement;

  // Aviso amigável caso o usuário abra via file:// (fetch será bloqueado)
  if (location.protocol === "file:") {
    console.warn("[Recinject] Abra via Live Server/servidor local. fetch() não funciona em file://");
  }

  async function headExists(url) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Resolve uma imagem da raiz pelo "nome base" (sem extensão),
   * tentando: .png, .jpeg, .jpg
   * Ex.: "capa-home" -> "capa-home.png" ou "capa-home.jpeg" ...
   */
  async function resolveBaseImage(baseName) {
    const exts = [".png", ".jpeg", ".jpg"];
    for (const ext of exts) {
      const candidate = `${baseName}${ext}`;
      if (await headExists(candidate)) return candidate;
    }
    // Se não encontrar, retorna o primeiro candidato como fallback (vai quebrar, mas é rastreável)
    return `${baseName}.jpg`;
  }

  function cloneTemplate(doc, id) {
    const tpl = doc.getElementById(id);
    if (!tpl) throw new Error(`Template não encontrado: ${id}`);
    return tpl.content.cloneNode(true);
  }

  function markActiveNav(rootEl) {
    const active = (html.dataset.active || "").trim(); // home | quem | prod | cont
    if (!active) return;

    $$("[data-nav]", rootEl).forEach((a) => {
      const key = a.getAttribute("data-nav");
      const isActive = key === active;

      a.classList.toggle("is-active", isActive);
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function buildBreadcrumbs() {
    const map = {
      home: { label: "Início", href: "index.html" },
      quem: { label: "Quem Somos", href: "quem-somos.html" },
      prod: { label: "Produtos e Serviços", href: "produtos-servicos.html" },
      cont: { label: "Contato", href: "contato.html" },
    };

    const active = (html.dataset.active || "home").trim();
    const current = map[active] || map.home;

    if (active === "home") return "Início";

    return `Início  /  ${current.label}`;
  }

  function setupMobileMenu() {
    const btn = $("[data-menu-btn]");
    const panel = $("[data-mobile-panel]");

    if (!btn || !panel) return;

    const open = () => {
      btn.classList.add("menu-open");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Fechar menu");

      panel.hidden = false;
      // força reflow para animação consistente
      panel.offsetHeight; // eslint-disable-line no-unused-expressions
      panel.classList.add("open");

      // trava rolagem do body em mobile
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      btn.classList.remove("menu-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Abrir menu");

      panel.classList.remove("open");
      document.body.style.overflow = "";

      // aguarda a animação antes de esconder
      window.setTimeout(() => { panel.hidden = true; }, 220);
    };

    const toggle = () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    };

    btn.addEventListener("click", toggle);

    // fecha ao clicar em qualquer link do menu
    $$("a", panel).forEach((a) => a.addEventListener("click", close));

    // fecha ao apertar ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") close();
    });

    // fecha ao clicar fora do painel (somente quando aberto)
    document.addEventListener("click", (e) => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;

      const clickInside = panel.contains(e.target) || btn.contains(e.target);
      if (!clickInside) close();
    });
  }

  async function setupHero(rootEl) {
    const title = (html.dataset.heroTitle || "").trim();
    if (!title) throw new Error("data-hero-title é obrigatório no <html>.");

    const heroImgBase = (html.dataset.heroImg || "capa-home").trim();
    const overlay = (html.dataset.heroOverlay || "").trim();
    const showLogo = (html.dataset.heroShowLogo || "false").trim();
    const subtitle = (html.dataset.heroSubtitle || "").trim();
    const lead = (html.dataset.heroLead || "").trim();

    const showButton = (html.dataset.heroShowButton || "false").trim();
    const buttonHref = (html.dataset.heroButtonHref || "").trim();
    const buttonText = (html.dataset.heroButtonText || "").trim();

    // Overlay (opcional)
    if (overlay) {
      // aplica CSS var no root para o hero
      rootEl.querySelector(".hero")?.style.setProperty("--hero-overlay", overlay);
    }

    // Background image (resolve por nome-base)
    const bg = rootEl.querySelector("[data-hero-bg]");
    if (bg) {
      const url = await resolveBaseImage(heroImgBase);
      bg.style.backgroundImage = `url('${url}')`;
    }

    // Logo no hero (on/off)
    const logoEl = rootEl.querySelector("[data-hero-logo]");
    const shouldShowLogo = showLogo === "true";
    if (logoEl) logoEl.style.display = shouldShowLogo ? "" : "none";

    // Title
    const h1 = rootEl.querySelector("[data-hero-title]");
    if (h1) h1.textContent = title;

    // Subtitle (opcional)
    const subEl = rootEl.querySelector("[data-hero-subtitle]");
    if (subEl) {
      if (subtitle) {
        subEl.hidden = false;
        subEl.textContent = subtitle;
      } else {
        subEl.hidden = true;
      }
    }

    // Lead (opcional)
    const leadEl = rootEl.querySelector("[data-hero-lead]");
    if (leadEl) {
      if (lead) {
        leadEl.hidden = false;
        leadEl.textContent = lead;
      } else {
        leadEl.hidden = true;
      }
    }

    // Breadcrumbs
    const crumbs = rootEl.querySelector("[data-hero-crumbs]");
    if (crumbs) crumbs.textContent = buildBreadcrumbs();

    // Botão (opcional)
    const actions = rootEl.querySelector("[data-hero-actions]");
    const btn = rootEl.querySelector("[data-hero-button]");
    const shouldShowBtn = showButton === "true" && buttonHref && buttonText;

    if (actions && btn) {
      if (shouldShowBtn) {
        actions.hidden = false;
        btn.setAttribute("href", buttonHref);
        btn.textContent = buttonText;
      } else {
        actions.hidden = true;
      }
    }
  }

  function setupFooterYear(rootEl) {
    const yearEl = rootEl.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  async function injectIncludes() {
    let res;
    try {
      res = await fetch("template-padrao.html.txt", { cache: "no-cache" });
    } catch (err) {
      console.error(err);
      throw new Error("Falha ao carregar template-padrao.html.txt. Rode via Live Server ou GitHub Pages.");
    }

    if (!res.ok) {
      throw new Error(`Não foi possível carregar template-padrao.html.txt (HTTP ${res.status}).`);
    }

    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");

    // 1) Injeta CSS global do template no <head> (apenas uma vez)
    const globalStyle = doc.querySelector("style[data-global-style]");
    if (globalStyle && !document.getElementById(globalStyle.id)) {
      document.head.appendChild(globalStyle.cloneNode(true));
    }

    // 2) Injetar header/hero/footer
    const targets = $$("[data-include]");
    for (const target of targets) {
      const what = target.getAttribute("data-include");
      const map = {
        header: "tpl-header",
        hero: "tpl-hero",
        footer: "tpl-footer",
      };
      const tplId = map[what];
      if (!tplId) continue;

      const frag = cloneTemplate(doc, tplId);
      target.replaceWith(frag);
    }

    // 3) Após inserir: marcar menu ativo, configurar hero, mobile, ano
    markActiveNav(document);
    await setupHero(document);
    setupMobileMenu();
    setupFooterYear(document);
  }

  // Inicializa
  injectIncludes().catch((err) => {
    console.error(err);

    // Mensagem simples na tela (ajuda o cliente a entender rápido)
    const msg = document.createElement("div");
    msg.style.cssText = `
      margin:16px;
      padding:14px 16px;
      border-radius:14px;
      background:#fff;
      border:1px solid rgba(0,0,0,.15);
      box-shadow:0 12px 30px rgba(0,0,0,.12);
      font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial;
    `;
    msg.innerHTML = `
      <strong>Não foi possível carregar o template do site.</strong><br/>
      ${location.protocol === "file:" ? "Você está abrindo via <code>file://</code>. Use o <b>Live Server</b> no VS Code." : "Verifique se o arquivo <code>template-padrao.html.txt</code> está na raiz e acessível."}
    `;
    document.body.prepend(msg);
  });
 
})();
