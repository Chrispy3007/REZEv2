/* REZE page preview: width-normalized, content-aware A4/Letter pagination. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const state = { zoom: 1, size: 'A4', pages: [], fitScale: 1, refreshQueued: false };
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
        const miniScale = 270 / dimensions().width;
        shell.style.height = `${dimensions().height * miniScale}px`;
        shell.style.flexBasis = `${dimensions().height * miniScale}px`;
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
    document.querySelectorAll('.editor-mini-page-frame').forEach(frame => {
      const page = frame.firstElementChild;
      const miniScale = 270 / width;
      frame.style.width = '270px';
      frame.style.height = `${height * miniScale}px`;
      if (page) {
        page.style.setProperty('transform', `scale(${miniScale})`, 'important');
        page.style.setProperty('transform-origin', 'top left', 'important');
      }
    });
  }

  const refresh = () => {
    if (state.refreshQueued) return;
    state.refreshQueued = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      state.refreshQueued = false;
      paginate();
    }));
  };

  function bind() {
    $('#largeZoomOut')?.addEventListener('click', () => { state.zoom = Math.max(.5, state.zoom - .1); applyZoom(); });
    $('#largeZoomIn')?.addEventListener('click', () => { state.zoom = Math.min(1.5, state.zoom + .1); applyZoom(); });
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
