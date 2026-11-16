/* REZE enhancements: section navigation, named local resume library, and accessible polish. */
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const LIBRARY_KEY = 'reze-js-library-v1';
  const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readCurrent = () => { try { return JSON.parse(localStorage.getItem('reze-js-resume-v1') || '{}'); } catch { return {}; } };
  const readLibrary = () => { try { const x=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]'); return Array.isArray(x)?x:[]; } catch { return []; } };
  const writeLibrary = x => localStorage.setItem(LIBRARY_KEY, JSON.stringify(x));

  // Add one direct Import Resume action; the main nav handler opens the upload view.
  const nav = $('#nav');
  if (nav && !nav.querySelector('[data-reze-import-nav="true"]')) {
    const b=document.createElement('button');
    b.className='nav-item'; b.type='button'; b.dataset.view='upload'; b.dataset.rezeImportNav='true';
    b.innerHTML='<span class="nav-icon">⇧</span><span>Import Resume</span>';
    b.addEventListener('click', () => window.REZEOpenUploadPicker?.());
    nav.append(b);
  }

  // Turn the long editor into guided section navigation while retaining the live preview.
  const form = $('.form-card');
  if (form && !$('#sectionRail')) {
    const rail=document.createElement('div'); rail.id='sectionRail'; rail.className='section-rail';
    rail.innerHTML='<b>Sections</b>'+[
      ['personal','Personal information'],['summary','Professional summary'],['experience','Experience'],['education','Education'],['skills','Skills'],['extras','Projects & certifications']
    ].map(([id,label],i)=>`<button type="button" data-jump="${id}" class="${i===0?'selected':''}"><span>${['♙','▤','▣','◇','✧','▱'][i]}</span>${label}</button>`).join('');
    form.insertBefore(rail, form.children[1] || null);
    const sections=[...form.querySelectorAll('.field-grid,.form-section')];
    const targets={personal:sections[0],summary:sections[1],experience:sections[2],education:sections[3],skills:sections[4],extras:sections[5]};
    rail.addEventListener('click',e=>{const b=e.target.closest('[data-jump]');if(!b)return;rail.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));targets[b.dataset.jump]?.scrollIntoView({behavior:'smooth',block:'start'});});
  }

  // Named local resume library: multiple drafts, without changing the clean blank default.
  const resumeView=$('#view-resumes');
  if (resumeView && !$('#resumeLibrary')) {
    const area=document.createElement('div'); area.id='resumeLibrary'; area.className='resume-library';
    area.innerHTML='<div class="library-head"><div><h3>Your saved versions</h3><p>Keep separate versions for different roles. Stored only in this browser.</p></div><button class="btn primary" id="saveVersion">＋ Save current as</button></div><div id="libraryItems"></div>';
    const page=resumeView.querySelector('.page-card'); page?.append(area);
    const render=()=>{const items=readLibrary();$('#libraryItems').innerHTML=items.length?items.map((x,i)=>`<div class="library-item"><div><b>${safe(x.name)}</b><small>${safe(x.title||'Untitled role')} · ${new Date(x.savedAt).toLocaleString()}</small></div><div class="library-actions"><button class="btn small secondary" data-load-version="${i}">Load</button><button class="btn small secondary" data-export-version="${i}">Export</button><button class="btn small danger" data-delete-version="${i}">Delete</button></div></div>`).join(''):'<p class="empty-library">No saved versions yet. Save a named copy to build your resume library.</p>';};
    $('#saveVersion').addEventListener('click',()=>{const current=readCurrent();const name=prompt('Name this resume version:',current.title?`${current.title} resume`:'New resume');if(!name?.trim())return;const items=readLibrary();items.unshift({name:name.trim(),title:current.title||'',savedAt:new Date().toISOString(),data:current});writeLibrary(items);render();});
    $('#libraryItems').addEventListener('click',e=>{const load=e.target.closest('[data-load-version]'),del=e.target.closest('[data-delete-version]'),exp=e.target.closest('[data-export-version]');let items=readLibrary();if(load){const item=items[+load.dataset.loadVersion];if(!item)return;localStorage.setItem('reze-js-resume-v1',JSON.stringify(item.data));alert(`Loaded “${item.name}”. Reloading the editor.`);location.reload();}if(del){const item=items[+del.dataset.deleteVersion];if(!item||!confirm(`Delete “${item.name}” from this browser?`))return;items.splice(+del.dataset.deleteVersion,1);writeLibrary(items);render();}if(exp){const item=items[+exp.dataset.exportVersion];if(!item)return;const blob=new Blob([JSON.stringify(item.data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(item.name.replace(/[^a-z0-9-_]+/gi,'-')||'resume')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});
    const resumeNav=$('[data-view="resumes"]');resumeNav?.addEventListener('click',render);render();
  }

  // Keep section navigation usable on keyboard and give the preview an explicit accessible label.
  $('#resumePreview')?.setAttribute('aria-label','Live resume preview');
  // Add a direct JSON export action without changing the existing save behavior.
  const actions=$('.toolbar-actions');
  if(actions&&!$('#exportJson')){const b=document.createElement('button');b.id='exportJson';b.className='btn secondary';b.textContent='Export JSON';b.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(readCurrent(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='reze-resume.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});actions.insertBefore(b,$('#saveBtn'));}
})();
