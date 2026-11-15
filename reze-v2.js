/* REZE v2 foundation: dashboard, named resume library, independent working copies.
   Vanilla JS only. Existing editor/import/ATS/template modules remain the rendering engine. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const RESUME_KEY='reze-js-resume-v1';
  const LIBRARY_KEY='reze-v2-resume-library-v1';
  const ACTIVE_KEY='reze-v2-active-resume-id';
  const blank=()=>({name:'',title:'',email:'',phone:'',location:'',links:'',summary:'',skills:'',experience:[],education:[],extras:[],template:'modern',accent:'#b9a4ff'});
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readCurrent=()=>{try{return JSON.parse(localStorage.getItem(RESUME_KEY)||'{}')}catch{return {}}};
  const readLibrary=()=>{try{const v=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
  const writeLibrary=v=>localStorage.setItem(LIBRARY_KEY,JSON.stringify(v));
  const activeId=()=>localStorage.getItem(ACTIVE_KEY);
  const setActive=id=>localStorage.setItem(ACTIVE_KEY,id);
  const stamp=()=>new Date().toISOString();
  const titleOf=d=>d.name?.trim()||'Untitled resume';
  const shortDate=s=>{try{return new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}catch{return 'Recently'}};
  let saveTimer=null, searchTimer=null;
  function currentRecord(){const id=activeId();return readLibrary().find(x=>x.id===id)||null;}
  function ensureActiveRecord(){
    let list=readLibrary(),id=activeId(),rec=list.find(x=>x.id===id);
    if(!rec){const d=readCurrent();rec={id:'resume-'+Date.now(),name:titleOf(d),data:d,createdAt:stamp(),updatedAt:stamp()};list.unshift(rec);setActive(rec.id);writeLibrary(list);}
    return rec;
  }
  function syncActiveRecord(){
    const d=readCurrent();if(!Object.keys(d).length)return;
    let list=readLibrary(),id=activeId(),i=list.findIndex(x=>x.id===id);
    if(i<0){const rec={id:'resume-'+Date.now(),name:titleOf(d),data:d,createdAt:stamp(),updatedAt:stamp()};list.unshift(rec);setActive(rec.id);}
    else{list[i]={...list[i],name:titleOf(d),data:d,updatedAt:stamp()};}
    try{writeLibrary(list)}catch(e){console.warn('REZE library save failed',e)}
    renderDashboard();renderLibrary();
  }
  function queueLibrarySave(){clearTimeout(saveTimer);saveTimer=setTimeout(syncActiveRecord,1100);}
  function loadRecord(id){
    const rec=readLibrary().find(x=>x.id===id);if(!rec)return;
    setActive(id);localStorage.setItem(RESUME_KEY,JSON.stringify(rec.data||blank()));
    $('#loadSaved')?.click(); // existing app hydrates and refreshes its editor
    $('#nav [data-view="editor"]')?.click();
    renderDashboard();renderLibrary();
  }
  function createResume(){
    const d=blank(),rec={id:'resume-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:'Untitled resume',data:d,createdAt:stamp(),updatedAt:stamp()};
    const list=readLibrary();list.unshift(rec);writeLibrary(list);setActive(rec.id);localStorage.setItem(RESUME_KEY,JSON.stringify(d));
    $('#loadSaved')?.click();$('#nav [data-view="editor"]')?.click();renderDashboard();renderLibrary();
    const first=$('[data-field="name"]');first?.focus();
  }
  function duplicateResume(id){
    const rec=readLibrary().find(x=>x.id===id);if(!rec)return;
    const copy=JSON.parse(JSON.stringify(rec));copy.id='resume-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);copy.name=(rec.name||'Untitled resume')+' copy';copy.createdAt=stamp();copy.updatedAt=stamp();
    const list=readLibrary();list.unshift(copy);writeLibrary(list);setActive(copy.id);localStorage.setItem(RESUME_KEY,JSON.stringify(copy.data));$('#loadSaved')?.click();renderDashboard();renderLibrary();
  }
  function renameResume(id){
    const list=readLibrary(),rec=list.find(x=>x.id===id);if(!rec)return;
    const next=prompt('Name this resume',rec.name||'Untitled resume');if(next===null)return;
    rec.name=next.trim()||'Untitled resume';rec.updatedAt=stamp();writeLibrary(list);renderDashboard();renderLibrary();
  }
  function deleteResume(id){
    const list=readLibrary(),rec=list.find(x=>x.id===id);if(!rec)return;
    if(!confirm(`Delete "${rec.name}" from My Resumes? This does not delete any original uploaded file.`))return;
    const next=list.filter(x=>x.id!==id);writeLibrary(next);
    if(activeId()===id){const fallback=next[0];if(fallback){setActive(fallback.id);localStorage.setItem(RESUME_KEY,JSON.stringify(fallback.data));$('#loadSaved')?.click()}else{localStorage.removeItem(ACTIVE_KEY);localStorage.setItem(RESUME_KEY,JSON.stringify(blank()));$('#loadSaved')?.click()}}
    renderDashboard();renderLibrary();
  }
  function miniPaper(d){
    const skills=(d.skills||'').split(/[,\n]/).filter(Boolean).slice(0,5);
    return `<div class="resume-thumb"><div class="thumb-name">${safe(d.name||'Your Name')}</div><div class="thumb-title">${safe(d.title||'Professional Title')}</div><div class="thumb-rule"></div><div class="thumb-heading">SUMMARY</div><div class="thumb-line wide"></div><div class="thumb-line"></div><div class="thumb-heading">EXPERIENCE</div><div class="thumb-line wide"></div><div class="thumb-line"></div><div class="thumb-heading">SKILLS</div><div class="thumb-tags">${skills.map(s=>`<i>${safe(s)}</i>`).join('')||'<i>Skills</i><i>Experience</i>'}</div></div>`;
  }
  function card(rec){
    const d=rec.data||{};
    return `<article class="resume-library-card"><button class="resume-card-open" type="button" data-open-resume="${safe(rec.id)}" aria-label="Open ${safe(rec.name)}">${miniPaper(d)}<div class="resume-card-meta"><b>${safe(rec.name||titleOf(d))}</b><span>${safe(d.title||'No professional title yet')}</span><small>Edited ${shortDate(rec.updatedAt)}</small></div></button><div class="resume-card-actions"><button type="button" data-rename-resume="${safe(rec.id)}">Rename</button><button type="button" data-duplicate-resume="${safe(rec.id)}">Duplicate</button><button type="button" data-delete-resume="${safe(rec.id)}">Delete</button></div></article>`;
  }
  function sortedList(){
    const q=($('#librarySearch')?.value||'').trim().toLowerCase(),sort=$('#librarySort')?.value||'updated';
    let list=readLibrary().filter(x=>!q||`${x.name} ${x.data?.title||''} ${x.data?.name||''}`.toLowerCase().includes(q));
    list.sort((a,b)=>sort==='name'?(a.name||'').localeCompare(b.name||''):sort==='created'?new Date(b.createdAt)-new Date(a.createdAt):new Date(b.updatedAt)-new Date(a.updatedAt));
    return list;
  }
  function renderLibrary(){
    const host=$('#resumeLibraryGrid');if(!host)return;
    const list=sortedList();
    host.innerHTML=list.length?list.map(card).join(''):`<div class="dashboard-empty library-empty"><div class="empty-symbol">✧</div><h3>No resumes found.</h3><p>Create a blank resume or adjust your search.</p><button class="btn primary" id="libraryEmptyCreate">Create a resume</button></div>`;
  }
  function renderDashboard(){
    const list=readLibrary().sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
    $('#dashboardDocCount')&&($('#dashboardDocCount').textContent=list.length);
    const recent=list[0];
    $('#dashboardRecentName')&&($('#dashboardRecentName').textContent=recent?.name||'—');
    $('#dashboardRecentDate')&&($('#dashboardRecentDate').textContent=recent?`Edited ${shortDate(recent.updatedAt)}`:'No recent activity');
    const host=$('#dashboardRecentGrid');if(host)host.innerHTML=list.length?list.slice(0,4).map(card).join(''):`<div class="dashboard-empty"><div class="empty-symbol">✧</div><h3>Your next chapter starts here.</h3><p>Create a blank resume or import an existing document. Your first draft will appear here.</p><button class="btn primary" id="dashboardEmptyCreate">Create your first resume</button></div>`;
  }
  function bind(){
    $('#dashboardCreate')?.addEventListener('click',createResume);
    $('#dashboardEmptyCreate')?.addEventListener('click',createResume);
    $('#libraryCreate')?.addEventListener('click',createResume);
    $('#dashboardImport')?.addEventListener('click',()=>$('#nav [data-view="upload"]')?.click());
    $('#dashboardViewAll')?.addEventListener('click',()=>$('#nav [data-view="resumes"]')?.click());
    $('#dashboardTemplates')?.addEventListener('click',()=>$('#nav [data-view="templates"]')?.click());
    $('#librarySearch')?.addEventListener('input',renderLibrary);
    $('#librarySort')?.addEventListener('change',renderLibrary);
    document.addEventListener('click',e=>{
      const open=e.target.closest('[data-open-resume]');if(open){loadRecord(open.dataset.openResume);return}
      const dup=e.target.closest('[data-duplicate-resume]');if(dup){duplicateResume(dup.dataset.duplicateResume);return}
      const ren=e.target.closest('[data-rename-resume]');if(ren){renameResume(ren.dataset.renameResume);return}
      const del=e.target.closest('[data-delete-resume]');if(del){deleteResume(del.dataset.deleteResume);return}
      if(e.target.closest('#libraryEmptyCreate'))createResume();
      const template=e.target.closest('[data-dashboard-template]');if(template){$('#nav [data-view="templates"]')?.click();setTimeout(()=>{const t=$(`[data-template="${template.dataset.dashboardTemplate}"]`);t?.click()},0)}
    });
    document.addEventListener('input',e=>{if(e.target.matches('[data-field],[data-array]'))queueLibrarySave()});
    document.addEventListener('click',e=>{if(e.target.closest('#addExperience,#addEducation,#addExtra,[data-remove]'))queueLibrarySave()});
    $('#nav')?.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b?.dataset.view==='dashboard')renderDashboard();if(b?.dataset.view==='resumes')renderLibrary()});
    $('#saveBtn')?.addEventListener('click',()=>setTimeout(syncActiveRecord,30));
    window.addEventListener('beforeunload',()=>{if(saveTimer){clearTimeout(saveTimer);syncActiveRecord()}});
  }
  function init(){
    // Migrate the current single-draft data into a named library entry, but keep it blank if blank.
    if(!readLibrary().length){const d=readCurrent();const rec={id:'resume-'+Date.now(),name:titleOf(d),data:Object.keys(d).length?d:blank(),createdAt:stamp(),updatedAt:stamp()};writeLibrary([rec]);setActive(rec.id);}
    else if(!currentRecord()){const list=readLibrary();setActive(list[0].id);if(!Object.keys(readCurrent()).length)localStorage.setItem(RESUME_KEY,JSON.stringify(list[0].data||blank()));}
    ensureActiveRecord();bind();renderDashboard();renderLibrary();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();