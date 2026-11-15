/* REZE Phase 2 — section editor, custom sections, reordering and rich-text helpers. */
(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const KEY='reze-js-resume-v1';
 const presets=['Publications','Volunteer Work','Awards','Training','Languages','Memberships','Interests','References'];
 const sanitizeHTML=html=>{const t=document.createElement('template');t.innerHTML=String(html||'');const allowed=new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','A']);const walk=node=>{[...node.childNodes].forEach(child=>{if(child.nodeType===1){if(!allowed.has(child.tagName)){child.replaceWith(document.createTextNode(child.textContent||''));return;}[...child.attributes].forEach(a=>{if(child.tagName!=='A'||a.name!=='href'||!/^https?:\/\//i.test(a.value))child.removeAttribute(a.name)});walk(child);}else if(child.nodeType!==3)child.remove();});};walk(t.content);return t.innerHTML;};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const get=()=>window.REZECore?.getData?.();
 const save=()=>window.REZECore?.update?.();
 const labels={personal:'Personal information',summary:'Professional summary',experience:'Experience',education:'Education',skills:'Skills',extras:'Projects & certifications'};
 const icons={personal:'♙',summary:'▤',experience:'▣',education:'◇',skills:'✧',extras:'▱'};
 let dragged=null;
 function ensureModel(){
  const d=get();if(!d)return;
  if(!Array.isArray(d.customSections))d.customSections=[];
  if(!Array.isArray(d.sectionOrder))d.sectionOrder=['summary','experience','education','skills','extras'];
  if(!Array.isArray(d.hiddenSections))d.hiddenSections=[];
  d.customSections.forEach(c=>{if(!c.id)c.id='custom-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);if(c.visible===undefined)c.visible=true;});
 }
 function editorNodes(){
  const form=$('.form-card');if(!form)return [];
  const nodes=[...form.querySelectorAll(':scope > .field-grid,:scope > .form-section')];
  return nodes.map((el,i)=>{
   if(el.classList.contains('field-grid')){el.dataset.section='personal';return ['personal',el];}
   const h=el.querySelector('h3')?.textContent.toLowerCase()||'';
   let id=h.includes('summary')?'summary':h.includes('work experience')?'experience':h.includes('education')?'education':h.includes('skills')?'skills':h.includes('projects')?'extras':'section-'+i;
   el.dataset.section=id;return [id,el];
  });
 }
 function orderedIds(){
  const d=get();const base=['personal',...(d.sectionOrder||['summary','experience','education','skills','extras'])];
  (d.customSections||[]).forEach(c=>{const id='custom:'+c.id;if(!base.includes(id))base.push(id)});
  return base;
 }
 function renderCustomEditors(){
  const host=$('#customSectionEditorList'),d=get();if(!host||!d)return;
  host.innerHTML=(d.customSections||[]).map(c=>`<article class="custom-section-editor" data-custom-id="${esc(c.id)}">
   <div class="custom-section-title-row"><label>Section title<input data-custom-title="${esc(c.id)}" value="${esc(c.title)}" placeholder="e.g. Publications"></label><button type="button" class="mini-tool danger" data-delete-custom="${esc(c.id)}">Remove</button></div>
   <div class="rich-toolbar" data-rich-toolbar="${esc(c.id)}"><button type="button" data-rich="bold"><b>B</b></button><button type="button" data-rich="italic"><i>I</i></button><button type="button" data-rich="underline"><u>U</u></button><button type="button" data-rich="insertUnorderedList">• List</button><button type="button" data-rich="insertOrderedList">1. List</button></div>
   <div class="custom-rich-editor" contenteditable="true" data-custom-body="${esc(c.id)}" data-placeholder="Add details for this section…">${sanitizeHTML(c.bodyHtml||esc(c.body||''))}</div>
  </article>`).join('');
 }
 function renderRail(){
  ensureModel();const d=get(),form=$('.form-card');if(!form)return;
  let rail=$('#sectionRail');
  if(!rail){rail=document.createElement('nav');rail.id='sectionRail';rail.className='section-rail';form.insertBefore(rail,form.children[1]||null);}
  const ids=orderedIds().filter(id=>!id.startsWith('custom:'));const hidden=new Set(d.hiddenSections||[]);
  rail.innerHTML='<b>Sections · drag to reorder</b>'+ids.map(id=>{
   const custom=id.startsWith('custom:'),cid=custom?id.slice(7):null;
   const title=custom?(d.customSections.find(c=>c.id===cid)?.title||'Custom section'):labels[id]||id;
   const isHidden=custom?d.customSections.find(c=>c.id===cid)?.visible===false:hidden.has(id);
   return `<div class="section-rail-item ${isHidden?'is-hidden':''}" draggable="true" data-rail-id="${esc(id)}"><button type="button" class="section-jump" data-jump="${esc(id)}"><span>${custom?'✧':icons[id]||'◇'}</span>${esc(title)}</button><button type="button" class="section-visibility" data-toggle-section="${esc(id)}" title="${isHidden?'Show':'Hide'} section">${isHidden?'◉':'◌'}</button><span class="drag-grip" title="Drag to reorder">⠿</span></div>`;
  }).join('');
  applyOrderToEditor();
 }
 function applyOrderToEditor(){
  const form=$('.form-card');if(!form)return;
  const map=new Map(editorNodes());
  const library=$('.phase2-custom-section-library');
  const order=orderedIds().filter(id=>map.has(id));
  order.forEach(id=>{const node=map.get(id);if(node&&node.parentElement===form)form.insertBefore(node,library||null)});
  const d=get();(d.customSections||[]).forEach(c=>{
   const id='custom:'+c.id;let node=form.querySelector(`[data-custom-form="${CSS.escape(c.id)}"]`);
   if(!node){node=document.createElement('section');node.className='form-section custom-section-form';node.dataset.customForm=c.id;node.innerHTML=`<div class="section-head"><h3>${esc(c.title||'Custom section')}</h3><span class="hint">Custom section</span></div><p class="hint">Edit this section in the Custom Sections panel below.</p>`;}
   if(library)form.insertBefore(node,library);
  });
  // Keep library after all section content.
  if(library)form.appendChild(library);
  d.hiddenSections?.forEach(id=>{const n=map.get(id);if(n)n.classList.add('section-is-hidden')});
  map.forEach((n,id)=>{if(!d.hiddenSections?.includes(id))n.classList.remove('section-is-hidden')});
  (d.customSections||[]).forEach(c=>{const n=form.querySelector(`[data-custom-form="${CSS.escape(c.id)}"]`);n?.classList.toggle('section-is-hidden',c.visible===false)});
 }
 function addCustom(title){
  const d=get();if(!d)return;
  const c={id:'custom-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),title:title||'Additional Information',body:'',visible:true};
  d.customSections.push(c);d.sectionOrder.push('custom:'+c.id);renderCustomEditors();renderRail();save();
 }
 function setHidden(id){
  const d=get();if(!d)return;
  if(id==='personal')return;if(id.startsWith('custom:')){const c=d.customSections.find(x=>x.id===id.slice(7));if(c)c.visible=c.visible===false;}
  else{const set=new Set(d.hiddenSections||[]);set.has(id)?set.delete(id):set.add(id);d.hiddenSections=[...set];}
  renderRail();save();
 }
 function reorder(from,to){
  if(!from||!to||from===to)return;
  const d=get();const ids=orderedIds(),a=ids.indexOf(from),b=ids.indexOf(to);if(a<0||b<0)return;
  ids.splice(a,1);ids.splice(b,0,from);
  d.sectionOrder=ids.filter(x=>x!=='personal');
  renderRail();save();
 }
 function bindRichToolbar(){
  document.addEventListener('click',e=>{
   const b=e.target.closest('[data-rich]');if(!b)return;
   const toolbar=b.closest('[data-rich-toolbar]'),id=toolbar?.dataset.richToolbar,editor=$(`[data-custom-body="${CSS.escape(id||'')}"]`);if(!editor)return;
   editor.focus();document.execCommand(b.dataset.rich,false,null);
   editor.dispatchEvent(new Event('input',{bubbles:true}));
  });
  document.addEventListener('input',e=>{
   const title=e.target.closest('[data-custom-title]'),body=e.target.closest('[data-custom-body]'),d=get();if(!d)return;
   if(title){const c=d.customSections.find(x=>x.id===title.dataset.customTitle);if(c){c.title=title.value;const node=$(`[data-custom-form="${CSS.escape(c.id)}"] h3`);if(node)node.textContent=c.title||'Custom section';renderRail();}save();}
   if(body){const c=d.customSections.find(x=>x.id===body.dataset.customBody);if(c){c.body=body.innerText;c.bodyHtml=sanitizeHTML(body.innerHTML);save();}}
  });
 }
 function bind(){
  
  document.addEventListener('click',e=>{
   const jump=e.target.closest('[data-jump]');if(jump){const id=jump.dataset.jump;let target;if(id.startsWith('custom:'))target=$(`[data-custom-form="${CSS.escape(id.slice(7))}"]`);else target=$(`[data-section="${CSS.escape(id)}"]`);target?.scrollIntoView({behavior:'smooth',block:'start'});return;}
   const toggle=e.target.closest('[data-toggle-section]');if(toggle){setHidden(toggle.dataset.toggleSection);return;}
   const del=e.target.closest('[data-delete-custom]');if(del){const d=get(),id=del.dataset.deleteCustom;if(!confirm('Remove this custom section?'))return;d.customSections=d.customSections.filter(c=>c.id!==id);d.sectionOrder=d.sectionOrder.filter(x=>x!=='custom:'+id);renderCustomEditors();renderRail();save();}
  });
  const rail=$('#sectionRail');
  rail?.addEventListener('dragstart',e=>{const item=e.target.closest('[data-rail-id]');if(!item)return;dragged=item.dataset.railId;item.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragged);});
  rail?.addEventListener('dragend',e=>{e.target.closest('[data-rail-id]')?.classList.remove('dragging');dragged=null;});
  rail?.addEventListener('dragover',e=>{const item=e.target.closest('[data-rail-id]');if(item){e.preventDefault();item.classList.add('drag-over');}});
  rail?.addEventListener('dragleave',e=>e.target.closest('[data-rail-id]')?.classList.remove('drag-over'));
  rail?.addEventListener('drop',e=>{const item=e.target.closest('[data-rail-id]');if(!item)return;e.preventDefault();$$('.drag-over',rail).forEach(x=>x.classList.remove('drag-over'));reorder(dragged||e.dataTransfer.getData('text/plain'),item.dataset.railId);});
  bindRichToolbar();
 }
 function init(){
  ensureModel();
  // Remove the legacy navigation injected by enhancements.js; replace with the full control rail.
  const old=$('#sectionRail');if(old)old.remove();
  renderCustomEditors();renderRail();bind();
  const core=get();if(core){core.sectionOrder=core.sectionOrder||['summary','experience','education','skills','extras'];}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();