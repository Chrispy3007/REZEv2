/* REZE page preview: width-normalized, content-aware A4/Letter pagination. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const state = { zoom: 1, liveZoom: 1, size: 'A4', pages: [], fitScale: 1, refreshQueued: false, editing: false, editSaveTimer: null };
  const dimensions = () => state.size === 'Letter' ? { width: 816, height: 1056 } : { width: 794, height: 1123 };
  let measureRoot;

  function ensureMeasureRoot() {
    if (measureRoot?.isConnected) return measureRoot;
    measureRoot = document.createElement('div');
    measureRoot.id = 'reze-page-measure-root';
    measureRoot.setAttribute('aria-hidden', 'true');
    Object.assign(measureRoot.style, {
      position: 'fixed', left: '-20000px', top: '0', width: `${dimensions().width}px`,
      visibility: 'hidden', pointerEvents: 'none', zIndex: '-1', display: 'block',
      contain: 'layout style paint'
    });
    document.body.appendChild(measureRoot);
    return measureRoot;
  }

  function makePage() {
    const { width, height } = dimensions();
    const page = document.createElement('article');
    page.className = 'resume-paper preview-page';
    page.style.width = `${width}px`;
    page.style.height = `${height}px`;
    page.style.minHeight = `${height}px`;
    page.style.boxSizing = 'border-box';
    const content = document.createElement('div');
    content.className = 'preview-page-content';
    page.appendChild(content);
    ensureMeasureRoot().appendChild(page);
    return { page, content };
  }

  const isHeading = node => node.nodeType === 1 && /^H[1-4]$/.test(node.tagName);
  const hasContent = page => !!page.content.childNodes.length;
  const overflows = content => content.scrollHeight > content.clientHeight + 1;
  const copyAttrs = (from, to) => [...from.attributes].forEach(attr => {
    if (!['style', 'width', 'height'].includes(attr.name)) to.setAttribute(attr.name, attr.value);
  });
  const collectNodes = source => [...source.childNodes].filter(node =>
    node.nodeType === 1 || (node.nodeType === 3 && node.textContent.trim())
  );

  function nextPage(pages) {
    const page = makePage();
    pages.push(page);
    return page;
  }

  function movePendingHeading(current, pages, pendingHeading) {
    if (!pendingHeading) return current;
    if (pendingHeading.parentNode === current.content) current.content.removeChild(pendingHeading);
    if (hasContent(current)) current = nextPage(pages);
    current.content.appendChild(pendingHeading);
    return current;
  }

  // Split a long paragraph into word-safe fragments without allowing it to exceed a sheet.
  function splitParagraph(element, current, pages) {
    const text = element.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return current;
    const words = text.split(' ');
    let chunk = [];
    const flush = () => {
      if (!chunk.length) return;
      const part = element.cloneNode(false);
      part.textContent = chunk.join(' ');
      current.content.appendChild(part);
      if (overflows(current.content)) {
        current.content.removeChild(part);
        if (hasContent(current)) current = nextPage(pages);
        current.content.appendChild(part);
      }
      chunk = [];
    };
    for (const word of words) {
      chunk.push(word);
      const probe = element.cloneNode(false);
      probe.textContent = chunk.join(' ');
      current.content.appendChild(probe);
      const fits = !overflows(current.content);
      current.content.removeChild(probe);
      if (!fits && chunk.length > 1) {
        chunk.pop();
        flush();
        chunk.push(word);
      }
    }
    flush();
    return current;
  }

  function appendList(original, current, pages, pendingHeading) {
    let list = document.createElement(original.tagName.toLowerCase());
    copyAttrs(original, list);
    current.content.appendChild(list);
    let firstItem = true;
    for (const originalItem of [...original.children]) {
      const item = originalItem.cloneNode(true);
      list.appendChild(item);
      if (!overflows(current.content)) {
        firstItem = false;
        continue;
      }
      list.removeChild(item);
      if (!list.children.length) list.remove();
      if (firstItem && pendingHeading) current = movePendingHeading(current, pages, pendingHeading);
      else if (hasContent(current)) current = nextPage(pages);
      list = document.createElement(original.tagName.toLowerCase());
      copyAttrs(original, list);
      current.content.appendChild(list);
      list.appendChild(item);
      if (overflows(current.content)) {
        list.removeChild(item);
        if (!list.children.length) list.remove();
        // A single unusually long bullet is split into valid list fragments across sheets.
        const words = originalItem.textContent.replace(/\s+/g, ' ').trim().split(' ');
        let chunk = [];
        for (const word of words) {
          chunk.push(word);
          const probeList = document.createElement(original.tagName.toLowerCase());
          const probeItem = document.createElement('li');
          probeItem.textContent = chunk.join(' ');
          probeList.appendChild(probeItem);
          current.content.appendChild(probeList);
          const fits = !overflows(current.content);
          current.content.removeChild(probeList);
          if (!fits && chunk.length > 1) {
            chunk.pop();
            if (chunk.length) {
              const partList = document.createElement(original.tagName.toLowerCase());
              const partItem = document.createElement('li');
              partItem.textContent = chunk.join(' ');
              partList.appendChild(partItem);
              current.content.appendChild(partList);
            }
            current = nextPage(pages);
            chunk = [word];
          }
        }
        if (chunk.length) {
          const partList = document.createElement(original.tagName.toLowerCase());
          const partItem = document.createElement('li');
          partItem.textContent = chunk.join(' ');
          partList.appendChild(partItem);
          current.content.appendChild(partList);
          if (overflows(current.content) && hasContent(current)) {
            current.content.removeChild(partList);
            current = nextPage(pages);
            current.content.appendChild(partList);
          }
        }
        list = document.createElement(original.tagName.toLowerCase());
        copyAttrs(original, list);
        current.content.appendChild(list);
      }
      firstItem = false;
    }
    return current;
  }

  function paginate() {
    const source = $('#resumePreviewLarge');
    const host = $('#previewPages');
    if (!source || !host || !document.body) return;
    const { width } = dimensions();
    document.body.dataset.paperSize = state.size;
    const root = ensureMeasureRoot();
    root.style.width = `${width}px`;
    root.replaceChildren();

    const pages = [];
    let current = makePage();
    pages.push(current);
    let pendingHeading = null;

    for (const original of collectNodes(source)) {
      if (isHeading(original)) {
        const heading = original.cloneNode(true);
        current.content.appendChild(heading);
        if (overflows(current.content)) {
          current.content.removeChild(heading);
          if (hasContent(current)) current = nextPage(pages);
          current.content.appendChild(heading);
        }
        pendingHeading = heading;
        continue;
      }

      if (original.nodeType === 1 && ['UL', 'OL'].includes(original.tagName)) {
        current = appendList(original, current, pages, pendingHeading);
        pendingHeading = null;
        continue;
      }

      const node = original.cloneNode(true);
      current.content.appendChild(node);
      if (overflows(current.content)) {
        current.content.removeChild(node);
        if (pendingHeading) current = movePendingHeading(current, pages, pendingHeading);
        else if (hasContent(current)) current = nextPage(pages);
        current.content.appendChild(node);
        if (overflows(current.content)) {
          current.content.removeChild(node);
          if (node.tagName === 'P') current = splitParagraph(original, current, pages);
          else {
            // Keep structured blocks intact where possible; flatten only oversized unknown blocks.
            const fallback = document.createElement('p');
            fallback.textContent = node.textContent.trim();
            current = splitParagraph(fallback, current, pages);
          }
        }
      }
      pendingHeading = null;
    }

    while (pages.length > 1 && !hasContent(pages[pages.length - 1])) {
      const removed = pages.pop();
      removed.page.remove();
    }
    decoratePageSections(pages);
    pages.forEach((page, index) => {
      page.page.dataset.pageIndex = String(index);
      const number = document.createElement('div');
      number.className = 'preview-page-number';
      number.textContent = `${index + 1} / ${pages.length}`;
      page.page.appendChild(number);
    });

    host.replaceChildren(...pages.map(page => {
      const frame = document.createElement('div');
      frame.className = 'preview-page-frame';
      frame.appendChild(page.page);
      return frame;
    }));

    const miniHost = $('#editorPreviewPages');
    if (miniHost) {
      const fragment = document.createDocumentFragment();
      pages.forEach(page => {
        const shell = document.createElement('div');
        shell.className = 'editor-mini-page-shell';
        const frame = document.createElement('div');
        frame.className = 'editor-mini-page-frame';
        const mini = page.page.cloneNode(true);
        mini.classList.add('editor-mini-page');
        frame.appendChild(mini);
        const miniScale = (270 / dimensions().width) * state.liveZoom;
        const miniWidth = dimensions().width * miniScale;
        const miniHeight = dimensions().height * miniScale;
        shell.style.width = `${miniWidth}px`;
        shell.style.height = `${miniHeight}px`;
        shell.style.flexBasis = `${miniHeight}px`;
        frame.style.width = `${miniWidth}px`;
        frame.style.height = `${miniHeight}px`;
        mini.style.setProperty('transform', `scale(${miniScale})`, 'important');
        mini.style.setProperty('transform-origin', 'top left', 'important');
        shell.appendChild(frame);
        fragment.appendChild(shell);
      });
      const label = document.createElement('div');
      label.className = 'editor-mini-page-count';
      label.textContent = `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`;
      fragment.appendChild(label);
      miniHost.replaceChildren(fragment);
    }

    state.pages = pages;
    const count = $('#pageCountLabel');
    if (count) count.textContent = `${pages.length} ${pages.length === 1 ? 'page' : 'pages'} · ${state.size}`;
    applyZoom();
  }

  function applyZoom() {
    const host = $('#previewPages');
    const stage = $('.page-preview-stage');
    if (!host || !stage) return;
    const { width, height } = dimensions();
    const available = Math.max(180, stage.clientWidth - 36);
    state.fitScale = Math.min(1, available / width);
    const scale = state.fitScale * state.zoom;
    host.querySelectorAll('.preview-page-frame').forEach(frame => {
      frame.style.width = `${width * scale}px`;
      frame.style.height = `${height * scale}px`;
      const page = frame.firstElementChild;
      if (page) {
        page.style.setProperty('transform', `scale(${scale})`, 'important');
        page.style.setProperty('transform-origin', 'top left', 'important');
      }
    });
    const zoom = $('#largeZoomValue');
    if (zoom) zoom.textContent = `${Math.round(state.zoom * 100)}%`;
    const miniScale = (270 / width) * state.liveZoom;
    const miniWidth = width * miniScale;
    const miniHeight = height * miniScale;
    document.querySelectorAll('.editor-mini-page-shell').forEach(shell => {
      shell.style.width = `${miniWidth}px`;
      shell.style.height = `${miniHeight}px`;
      shell.style.flexBasis = `${miniHeight}px`;
    });
    document.querySelectorAll('.editor-mini-page-frame').forEach(frame => {
      const page = frame.firstElementChild;
      frame.style.width = `${miniWidth}px`;
      frame.style.height = `${miniHeight}px`;
      if (page) {
        page.style.setProperty('transform', `scale(${miniScale})`, 'important');
        page.style.setProperty('transform-origin', 'top left', 'important');
      }
    });
    const liveLabel = $('#zoomValue');
    if (liveLabel) liveLabel.textContent = `${Math.round(state.liveZoom * 100)}%`;
  }

  const refresh = () => {
    if (state.editing) return;
    if (state.refreshQueued) return;
    state.refreshQueued = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      state.refreshQueued = false;
      paginate();
    }));
  };

  // The visible preview groups each resume category into an editable card. Flatten
  // those presentation wrappers before persisting so the source resume stays semantic.
  function currentPageHTML() {
    const output = document.createElement('div');
    document.querySelectorAll('#previewPages .preview-page-content').forEach(pageContent => {
      [...pageContent.childNodes].forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('resume-section-card')) {
          if (!node.hasAttribute('data-continuation')) {
            const heading = node.querySelector('.resume-section-card-title');
            if (heading) {
              const h3 = document.createElement('h3');
              h3.textContent = heading.textContent;
              output.appendChild(h3);
            }
          }
          const body = node.querySelector('.resume-section-card-body');
          if (body) [...body.childNodes].forEach(child => output.appendChild(child.cloneNode(true)));
        } else {
          output.appendChild(node.cloneNode(true));
        }
      });
    });
    return output.innerHTML;
  }

  function decoratePageSections(pages) {
    let currentSectionTitle = '';
    pages.forEach(page => {
      const content = page.content;
      const originalNodes = [...content.childNodes];
      const fragment = document.createDocumentFragment();
      let card = null;
      let body = null;
      const makeCard = (title, continued = false) => {
        card = document.createElement('section');
        card.className = 'resume-section-card';
        if (continued) card.dataset.continuation = 'true';
        const head = document.createElement('div');
        head.className = 'resume-section-card-head';
        const label = document.createElement('h3');
        label.className = 'resume-section-card-title';
        label.textContent = title;
        head.appendChild(label);
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'resume-section-edit-action';
        edit.setAttribute('contenteditable', 'false');
        edit.setAttribute('aria-label', `Edit ${title}`);
        edit.title = `Edit ${title}`;
        edit.textContent = '✎';
        head.appendChild(edit);
        card.appendChild(head);
        body = document.createElement('div');
        body.className = 'resume-section-card-body';
        card.appendChild(body);
        fragment.appendChild(card);
      };
      originalNodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'H3') {
          currentSectionTitle = node.textContent.trim();
          makeCard(currentSectionTitle, false);
          return;
        }
        if (node.nodeType === 1 && node.tagName === 'HEADER') {
          fragment.appendChild(node);
          card = null;
          body = null;
          return;
        }
        if (!card) makeCard(currentSectionTitle ? `${currentSectionTitle} · continued` : 'Resume details', true);
        body.appendChild(node);
      });
      content.replaceChildren(fragment);
    });
  }

  function persistInlineEdit() {
    if (!state.editing) return;
    window.REZECore?.setPreviewOverride?.(currentPageHTML());
  }

  function setEditing(enabled, focusTarget = null) {
    state.editing = !!enabled;
    const pages = document.querySelectorAll('#previewPages .preview-page-content');
    pages.forEach(content => {
      if (state.editing) {
        content.setAttribute('contenteditable', 'true');
        content.setAttribute('spellcheck', 'true');
        content.setAttribute('aria-label', 'Edit resume page content');
        content.classList.add('is-inline-editing');
      content.querySelectorAll('.resume-section-card-body').forEach(body => body.setAttribute('contenteditable', 'true'));
      content.querySelectorAll('.resume-section-edit-action').forEach(button => button.setAttribute('contenteditable', 'false'));
      } else {
        content.removeAttribute('contenteditable');
        content.removeAttribute('aria-label');
        content.classList.remove('is-inline-editing');
        content.querySelectorAll('.resume-section-card-body').forEach(body => body.removeAttribute('contenteditable'));
      }
    });
    document.body.classList.toggle('reze-page-inline-editing', state.editing);
    const toggle = $('#togglePreviewEdit');
    const tools = $('#previewEditTools');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(state.editing));
      toggle.textContent = state.editing ? '✓ Editing on page' : '✎ Edit on page';
      toggle.classList.toggle('primary', !state.editing);
      toggle.classList.toggle('secondary', state.editing);
    }
    if (tools) tools.hidden = !state.editing;
    if (state.editing) {
      const target = focusTarget || document.querySelector('#previewPages .preview-page-content');
      target?.focus?.({ preventScroll: true });
    } else {
      clearTimeout(state.editSaveTimer);
      const html = currentPageHTML();
      window.REZECore?.setPreviewOverride?.(html);
      const source = $('#resumePreviewLarge');
      if (source) source.innerHTML = html;
      refresh();
    }
  }

  function bindInlineEditing() {
    $('#togglePreviewEdit')?.addEventListener('click', () => setEditing(!state.editing));
    $('#finishPreviewEdit')?.addEventListener('click', () => setEditing(false));
    $('#previewEditTools')?.querySelectorAll('[data-preview-command]').forEach(button => {
      button.addEventListener('mousedown', event => event.preventDefault());
      button.addEventListener('click', () => {
        const command = button.dataset.previewCommand;
        document.execCommand(command, false, null);
        persistInlineEdit();
      });
    });
    $('#previewPages')?.addEventListener('click', event => {
      const editButton = event.target.closest('.resume-section-edit-action');
      if (!editButton) return;
      const card = editButton.closest('.resume-section-card');
      if (!state.editing) setEditing(true, card?.querySelector('.resume-section-card-body'));
      const body = card?.querySelector('.resume-section-card-body');
      body?.focus?.({ preventScroll: true });
    });
    $('#previewPages')?.addEventListener('input', event => {
      if (!state.editing || !event.target.closest('.preview-page-content')) return;
      clearTimeout(state.editSaveTimer);
      state.editSaveTimer = setTimeout(persistInlineEdit, 350);
    });
  }

  function bind() {
    bindInlineEditing();
    $('#largeZoomOut')?.addEventListener('click', () => { state.zoom = Math.max(.5, Math.round((state.zoom - .1) * 100) / 100); applyZoom(); });
    $('#largeZoomIn')?.addEventListener('click', () => { state.zoom = Math.min(1.5, Math.round((state.zoom + .1) * 100) / 100); applyZoom(); });
    $('#zoomOut')?.addEventListener('click', () => { state.liveZoom = Math.max(.5, Math.round((state.liveZoom - .1) * 100) / 100); applyZoom(); });
    $('#zoomIn')?.addEventListener('click', () => { state.liveZoom = Math.min(3, Math.round((state.liveZoom + .1) * 100) / 100); applyZoom(); });
    $('#fitPreview')?.addEventListener('click', () => { state.liveZoom = 1; applyZoom(); });
    $('#editFromPreview')?.addEventListener('click', () => { if (state.editing) setEditing(false); document.querySelector('[data-view="editor"]')?.click(); });
    $('#previewPaperSize')?.addEventListener('change', event => {
      state.size = event.target.value;
      const other = $('#paperSize'); if (other) other.value = state.size;
      refresh();
    });
    $('#paperSize')?.addEventListener('change', event => {
      state.size = event.target.value;
      const other = $('#previewPaperSize'); if (other) other.value = state.size;
      refresh();
    });
    const source = $('#resumePreviewLarge');
    if (source) new MutationObserver(refresh).observe(source, { childList: true, subtree: true, characterData: true });
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(applyZoom);
      const stage = $('.page-preview-stage');
      if (stage) observer.observe(stage);
    }
    window.addEventListener('resize', applyZoom);
    window.addEventListener('beforeprint', () => {
      state.zoom = 1;
      state.pages.forEach((page, index) => {
        page.page.style.setProperty('break-before', 'auto', 'important');
        page.page.style.setProperty('page-break-before', 'auto', 'important');
        const after = index === state.pages.length - 1 ? 'auto' : 'page';
        page.page.style.setProperty('break-after', after, 'important');
        page.page.style.setProperty('page-break-after', after, 'important');
        page.page.style.setProperty('page-break-after', 'auto', 'important');
      });
      applyZoom();
    });
    refresh();
  }

  window.REZEPagePreview = { refresh, paginate };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
