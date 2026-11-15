(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY='reze-js-resume-v1';
const blank=()=>({name:'',title:'',email:'',phone:'',location:'',links:'',summary:'',skills:'',experience:[],education:[],extras:[],template:'modern',accent:'#b77bec'});
let data=blank(), timer;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s||'').trim();
function hydrate(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&typeof v==='object')data={...blank(),...v,experience:Array.isArray(v.experience)?v.experience:[],education:Array.isArray(v.education)?v.education:[],extras:Array.isArray(v.extras)?v.extras:[]};}catch{} }
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));$('#saveState').textContent='✓ Saved locally';}catch{$('#saveState').textContent='Unable to save locally';}}
function queueSave(){ $('#saveState').textContent='Saving…';clearTimeout(timer);timer=setTimeout(persist,1000);renderPreview();updateATS();}
function readFields(){ $$('[data-field]').forEach(el=>data[el.dataset.field]=el.value); }
function fillFields(){ $$('[data-field]').forEach(el=>el.value=data[el.dataset.field]||''); $('#accent').value=data.accent||'#b77bec'; }
function renderEntryList(type){const host=$(`#${type}List`);const arr=data[type];host.innerHTML=arr.map((x,i)=>`<div class="entry" data-index="${i}"><button class="remove" data-remove="${type}" data-index="${i}">Remove ×</button><div class="entry-grid"><label>${type==='experience'?'Role / Position':'Degree / Qualification'}<input data-array="${type}" data-index="${i}" data-key="role" value="${escapeHTML(x.role)}" placeholder="${type==='experience'?'Penetration Tester':'B.Sc. Computer Science'}"></label><label>${type==='experience'?'Company':'Institution'}<input data-array="${type}" data-index="${i}" data-key="company" value="${escapeHTML(x.company)}" placeholder="Company / institution"></label><label>Start date<input data-array="${type}" data-index="${i}" data-key="start" value="${escapeHTML(x.start)}" placeholder="Jan 2023"></label><label>End date<input data-array="${type}" data-index="${i}" data-key="end" value="${escapeHTML(x.end)}" placeholder="Present"></label></div>${type==='experience'?`<label>Responsibilities / achievements<textarea data-array="${type}" data-index="${i}" data-key="details" rows="3" placeholder="One achievement per line">${escapeHTML(x.details)}</textarea></label>`:`<label>Details<input data-array="${type}" data-index="${i}" data-key="details" value="${escapeHTML(x.details)}" placeholder="Relevant coursework, honours…"></label>`}</div>`).join('');}
function renderExtras(){const host=$('#extraList');host.innerHTML=data.extras.map((x,i)=>`<div class="entry"><button class="remove" data-remove="extras" data-index="${i}">Remove ×</button><div class="entry-grid"><label>Type<input data-array="extras" data-index="${i}" data-key="type" value="${escapeHTML(x.type)}" placeholder="Certification / Project"></label><label>Name<input data-array="extras" data-index="${i}" data-key="name" value="${escapeHTML(x.name)}" placeholder="Name"></label></div><label>Description<input data-array="extras" data-index="${i}" data-key="details" value="${escapeHTML(x.details)}" placeholder="Brief details"></label></div>`).join('');}
function section(title,body){return body?`<h3>${title}</h3>${body}`:''}
function renderPreview(){const d=data;const skills=clean(d.skills).split(/[,\n]/).map(clean).filter(Boolean);const exp=d.experience.filter(x=>clean(x.role)||clean(x.company)).map(x=>`<div class="item-head"><span>${escapeHTML(x.role)}</span><span>${escapeHTML([x.start,x.end].filter(Boolean).join(' – '))}</span></div><p class="muted">${escapeHTML(x.company)}</p>${x.details?`<ul>${x.details.split('\n').map(clean).filter(Boolean).map(t=>`<li>${escapeHTML(t.replace(/^[-•]\s*/,''))}</li>`).join('')}</ul>`:''}`).join('');const edu=d.education.filter(x=>clean(x.role)||clean(x.company)).map(x=>`<div class="item-head"><span>${escapeHTML(x.role)}</span><span>${escapeHTML([x.start,x.end].filter(Boolean).join(' – '))}</span></div><p>${escapeHTML(x.company)} ${x.details?`· ${escapeHTML(x.details)}`:''}</p>`).join('');const extra=d.extras.filter(x=>clean(x.name)).map(x=>`<p><b>${escapeHTML(x.name)}</b> <span class="muted">${escapeHTML(x.type)}</span>${x.details?` — ${escapeHTML(x.details)}`:''}</p>`).join('');const html=`<header><h2>${escapeHTML(d.name||'Your Name')}</h2><div class="resume-title">${escapeHTML(d.title||'Professional Title')}</div><div class="contact">${[d.email,d.phone,d.location,d.links].filter(Boolean).map(escapeHTML).join(' &nbsp;·&nbsp; ')}</div></header>${section('Professional Summary',d.summary?`<p>${escapeHTML(d.summary)}</p>`:'')} ${section('Experience',exp)} ${section('Education',edu)} ${section('Skills',skills.length?`<div class="skills">${skills.map(s=>`<span>${escapeHTML(s)}</span>`).join('')}</div>`:'')} ${section('Projects & Certifications',extra)}`;['#resumePreview','#resumePreviewLarge','#templatePreview'].forEach(sel=>{const el=$(sel);if(el)el.innerHTML=html;});const savedPage=localStorage.getItem('reze-page-preview-html-v1');if(savedPage&&$('#resumePreviewLarge'))$('#resumePreviewLarge').innerHTML=savedPage;document.documentElement.style.setProperty('--accent',d.accent||'#b77bec');$$('.resume-paper').forEach(el=>{el.classList.toggle('classic',d.template==='classic');el.classList.toggle('minimal',d.template==='minimal');el.classList.toggle('executive',d.template==='executive');el.classList.toggle('technical',d.template==='technical');el.classList.toggle('compact',d.template==='compact');el.classList.toggle('creative',d.template==='creative');});}
function updateATS(){const checks=[['Name',!!clean(data.name)],['Professional title',!!clean(data.title)],['Email address',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)],['Phone or contact number',!!clean(data.phone)],['Location or profile link',!!clean(data.location)||!!clean(data.links)],['Professional summary',clean(data.summary).length>=60],['Experience details',data.experience.some(x=>clean(x.role)&&clean(x.details))],['Education',data.education.some(x=>clean(x.role)||clean(x.company))],['Skills',clean(data.skills).split(/[,\n]/).filter(clean).length>=4],['Action-oriented bullet points',data.experience.some(x=>/built|led|improved|reduced|managed|tested|developed|identified|implemented|created/i.test(x.details))],['Measurable outcomes',data.experience.some(x=>/\d+\s?(%|\+|users|hours|days|projects|systems)/i.test(x.details))],['Projects or certifications',data.extras.some(x=>clean(x.name))]];const n=checks.filter(x=>x[1]).length;$('#atsScore').textContent=Math.round(n/checks.length*100)+'%';$('#atsLabel').textContent=n>=10?'Strong content coverage':n>=7?'Good start — a few gaps remain':'Add more detail to improve completeness';$('#atsChecks').innerHTML=checks.map(([t,ok])=>`<div class="check ${ok?'':'missing'}"><span>${escapeHTML(t)}</span><em>${ok?'✓ Complete':'＋ Needs attention'}</em></div>`).join('');}
function switchView(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='preview')renderPreview();if(view==='ats')updateATS();if(view==='resumes')$('#savedResume').textContent=localStorage.getItem(KEY)?'A saved resume is available in this browser.':'No saved resume yet.';}
function add(type){data[type].push(type==='extras'?{type:'',name:'',details:''}:{role:'',company:'',start:'',end:'',details:''});if(type==='extras')renderExtras();else renderEntryList(type);queueSave();}
function exportJSON(){readFields();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});download(blob,'reze-resume.json');}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importJSON(obj){data={...blank(),...obj,experience:Array.isArray(obj.experience)?obj.experience:[],education:Array.isArray(obj.education)?obj.education:[],extras:Array.isArray(obj.extras)?obj.extras:[]};fillFields();renderAll();queueSave();}
function renderAll(){renderEntryList('experience');renderEntryList('education');renderExtras();renderPreview();updateATS();}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)switchView(b.dataset.view)});$$('.tabs').forEach(t=>t.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)switchView(b.dataset.view)}));
document.addEventListener('input',e=>{const el=e.target;if(el.matches('[data-field]')){data[el.dataset.field]=el.value;queueSave();}if(el.matches('[data-array]')){const a=data[el.dataset.array][+el.dataset.index];a[el.dataset.key]=el.value;queueSave();}});
document.addEventListener('click',e=>{const r=e.target.closest('[data-remove]');if(r){data[r.dataset.remove].splice(+r.dataset.index,1);r.dataset.remove==='extras'?renderExtras():renderEntryList(r.dataset.remove);queueSave();}const t=e.target.closest('[data-template]');if(t){data.template=t.dataset.template;$$('[data-template]').forEach(x=>x.classList.toggle('selected',x.dataset.template===data.template));renderPreview();queueSave();}});
$('#addExperience').onclick=()=>add('experience');$('#addEducation').onclick=()=>add('education');$('#addExtra').onclick=()=>add('extras');$('#saveBtn').onclick=()=>{readFields();persist();};$('#clearBtn').onclick=()=>{if(confirm('Clear the current resume? This does not delete exported files.')){data=blank();fillFields();renderAll();persist();}};$('#accent').oninput=e=>{data.accent=e.target.value;queueSave();};
$('#useTemplate')?.addEventListener('click',()=>{renderPreview();switchView('editor');});
const THEME_KEY='reze-theme-v1';
function setTheme(theme){
  const light=theme==='light';
  document.body.classList.toggle('light',light);
  document.documentElement.dataset.theme=light?'light':'dark';
  const appearance=$('#appearance'),toggle=$('#themeToggle');
  if(appearance) appearance.value=light?'light':'dark';
  if(toggle){toggle.textContent=light?'☾':'☼';toggle.setAttribute('aria-label',light?'Switch to dark mode':'Switch to light mode');toggle.title=light?'Switch to dark mode':'Switch to light mode';}
  try{localStorage.setItem(THEME_KEY,light?'light':'dark')}catch{}
}
let initialTheme='dark';
try{initialTheme=localStorage.getItem(THEME_KEY)||'dark'}catch{}
setTheme(initialTheme);
$('#themeToggle').addEventListener('click',()=>setTheme(document.body.classList.contains('light')?'dark':'light'));
$('#appearance').addEventListener('change',e=>setTheme(e.target.value));
$('#cursorSize').oninput=e=>document.documentElement.style.setProperty('--cursor',e.target.value+'px');
$('#exportPdf').onclick=$('#printBtn').onclick=()=>{renderPreview();window.print();};
$('#previewEditToggle').onclick=()=>{const page=$('#resumePreviewLarge');const enabled=page.getAttribute('contenteditable')!=='true';page.setAttribute('contenteditable',enabled?'true':'false');page.classList.toggle('page-editing',enabled);$('#previewEditToggle').textContent=enabled?'Finish editing':'Edit page';if(enabled)page.focus();};
$('#previewSaveEdit').onclick=()=>{const page=$('#resumePreviewLarge');if(page.getAttribute('contenteditable')==='true'){page.setAttribute('contenteditable','false');page.classList.remove('page-editing');$('#previewEditToggle').textContent='Edit page';}try{localStorage.setItem('reze-page-preview-html-v1',page.innerHTML);$('#saveState').textContent='✓ Page edits saved locally';}catch{alert('Could not save page edits.');}};
$('#previewUndo').onclick=()=>document.execCommand('undo');
$('#goEditor').onclick=()=>switchView('editor');
$('#downloadOriginal').onclick=downloadOriginalFile;
$('#downloadWorking').onclick=downloadWorkingCopy;
$('#view-preview').addEventListener('click',e=>{const b=e.target.closest('[data-command]');if(b){document.execCommand(b.dataset.command,false,null);$('#resumePreviewLarge').focus();}});


// PDF/DOCX text extraction. The original uploaded file is read only and never overwritten.
async function loadScriptOnce(src, test) {
  if (test()) return;
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src; script.async=true;
    script.onload=resolve; script.onerror=()=>reject(new Error('Could not load document parser from the CDN. Check your internet connection and try again.'));
    document.head.appendChild(script);
  });
  if (!test()) throw new Error('The document parser loaded but did not initialise.');
}
async function extractDocxText(file) {
  await loadScriptOnce('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js',()=>!!window.mammoth);
  const buffer=await file.arrayBuffer();
  const result=await window.mammoth.extractRawText({arrayBuffer:buffer});
  return clean(result.value).replace(/\r/g,'');
}
async function extractPdfText(file) {
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useWorkerFetch:true,isEvalSupported:false}).promise;
  const pages=[];
  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    const page=await pdf.getPage(pageNo), content=await page.getTextContent();
    const items=content.items.filter(x=>x.str&&x.str.trim()).map(x=>({text:x.str.trim(),x:x.transform?.[4]??0,y:x.transform?.[5]??0,width:x.width??0}));
    // Reconstruct visual lines by y-coordinate, then order text left-to-right.
    items.sort((a,b)=>Math.abs(b.y-a.y)>2?b.y-a.y:a.x-b.x);
    const lines=[];
    for(const item of items){let line=lines.find(l=>Math.abs(l.y-item.y)<=2.5);if(!line){line={y:item.y,parts:[]};lines.push(line);}line.parts.push(item);}
    lines.sort((a,b)=>b.y-a.y);
    pages.push(lines.map(line=>line.parts.sort((a,b)=>a.x-b.x).map(x=>x.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n'));
  }
  return clean(pages.join('\n\n'));
}

function parseResumeText(raw) {
  const text=String(raw||'').replace(/\u00a0/g,' ').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
  const parsed=blank();
  const email=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone=text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d[\d\s().-]{7,}\d/);
  if(email) parsed.email=email[0];
  if(phone) parsed.phone=phone[0].replace(/\s+/g,' ').trim();
  const headings={
    summary:/^(professional\s+summary|summary|profile|career\s+objective|objective)$/i,
    experience:/^(professional\s+experience|work\s+experience|employment\s+history|experience|work\s+history)$/i,
    education:/^(education|academic\s+background|qualifications)$/i,
    skills:/^(core\s+competencies|technical\s+skills|skills|key\s+skills|areas\s+of\s+expertise)$/i,
    extras:/^(certifications?|licenses?|projects?|personal\s+projects|achievements?|awards?)$/i
  };
  const sections={intro:[]}, current=['intro'];
  let active='intro';
  for(const line of lines){
    const key=Object.keys(headings).find(k=>headings[k].test(line.replace(/[:：]$/,'')));
    if(key){active=key;sections[active]??=[];continue;}
    sections[active]??=[]; sections[active].push(line);
  }
  const intro=sections.intro||[];
  const nonContact=intro.filter(l=>!l.includes(parsed.email||'§EMAIL§')&&!l.includes(parsed.phone||'§PHONE§'));
  if(nonContact.length){
    parsed.name=nonContact[0].length<70?nonContact[0]:'';
    if(nonContact.length>1 && nonContact[1].length<100) parsed.title=nonContact[1];
  }
  const summary=(sections.summary||[]).join(' ').trim();
  parsed.summary=summary || (intro.slice(parsed.name?1:0, parsed.title?2:1).filter(l=>l.length>45).join(' '));
  parsed.skills=(sections.skills||[]).join(', ').replace(/^[•·-]\s*/gm,'').trim();
  const toEntries=(arr,type)=>{
    const blocks=arr.join('\n').split(/\n\s*\n/).map(b=>b.split('\n').map(x=>x.trim()).filter(Boolean)).filter(b=>b.length);
    return blocks.map(b=>{
      const first=b[0].replace(/^[•·-]\s*/,'');
      const dateLine=b.find(x=>/\b(19|20)\d{2}\b/.test(x))||'';
      const dates=dateLine.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(?:19|20)\d{2}\s*(?:[-–—to]+\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(?:19|20)\d{2}))?/i);
      const body=b.filter(x=>x!==dateLine && x!==first);
      return {role:first,company:body.shift()||'',start:dates?dates[0].split(/[-–—to]+/i)[0].trim():'',end:dates?(dates[0].split(/[-–—to]+/i)[1]||'').trim():'',details:body.join('\n').replace(/^[•·]\s*/gm,'')};
    }).filter(x=>x.role);
  };
  parsed.experience=toEntries(sections.experience||[],'experience');
  parsed.education=toEntries(sections.education||[],'education');
  const extraLines=sections.extras||[];
  if(extraLines.length){
    let group='Certification';
    parsed.extras=extraLines.map(line=>{
      if(/project/i.test(line)) group='Project';
      if(/certification|certified|license/i.test(line)) group='Certification';
      return {type:group,name:line.replace(/^[•·-]\s*/,''),details:''};
    });
  }
  // Keep any content the heuristic could not confidently classify visible instead of discarding it.
  if(!parsed.summary && !parsed.experience.length && !parsed.education.length && !parsed.skills){
    parsed.summary=text;
  }
  return parsed;
}
const ORIGINAL_DB='reze-original-files-v2';

const UPLOADED_EDIT_KEY='reze-uploaded-edit-html-v1';
let uploadedEditTimer=null;
function setUploadedEditable(html,format,title){const panel=$('#uploadedEditorPanel'),editor=$('#uploadedEditableDocument');if(!panel||!editor)return;panel.hidden=false;$('#uploadedDocTitle').textContent=title||'Imported document';editor.innerHTML=html||'<p></p>';$('#uploadedEditStatus').textContent='Ready to edit';try{localStorage.setItem(UPLOADED_EDIT_KEY,editor.innerHTML);}catch{}}
function uploadedPlainText(){return ($('#uploadedEditableDocument')?.innerText||'').replace(/\u00a0/g,' ').trim();}
function saveUploadedEdits(){const editor=$('#uploadedEditableDocument');if(!editor)return;try{localStorage.setItem(UPLOADED_EDIT_KEY,editor.innerHTML);$('#uploadedEditStatus').textContent='Saved in this browser';$('#saveState').textContent='✓ Uploaded document edits saved';}catch{$('#uploadedEditStatus').textContent='Could not save';}}
async function renderUploadedOriginal(file,format){const host=$('#uploadedOriginalViewer');if(!host)return;host.innerHTML='';if(format==='pdf'){const url=URL.createObjectURL(file);const frame=document.createElement('iframe');frame.className='uploaded-pdf-frame';frame.src=url+'#toolbar=1&navpanes=0';frame.title='Original uploaded PDF';host.appendChild(frame);}else if(format==='docx'){await loadScriptOnce('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js',()=>!!window.mammoth);const result=await window.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()});const frame=document.createElement('div');frame.className='uploaded-docx-original';frame.innerHTML=result.value||'<p>No document content found.</p>';host.appendChild(frame);}else{const pre=document.createElement('pre');pre.className='uploaded-text-original';pre.textContent=await file.text();host.appendChild(pre);}}

function openOriginalDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(ORIGINAL_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('originals'))req.result.createObjectStore('originals',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
const makeFileId=()=>`file-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
async function storeOriginalFile(file){const db=await openOriginalDB();const record={id:makeFileId(),name:file.name,type:file.type||'application/octet-stream',size:file.size,blob:file,lastModified:file.lastModified,createdAt:new Date().toISOString(),status:'Stored'};return new Promise((resolve,reject)=>{const tx=db.transaction('originals','readwrite');tx.objectStore('originals').put(record);tx.oncomplete=()=>{db.close();resolve(record);};tx.onerror=()=>{db.close();reject(tx.error);};});}
async function listOriginalFiles(){const db=await openOriginalDB();return new Promise((resolve,reject)=>{const req=db.transaction('originals').objectStore('originals').getAll();req.onsuccess=()=>{db.close();resolve((req.result||[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));};req.onerror=()=>{db.close();reject(req.error);};});}
async function getOriginalFile(id){const files=await listOriginalFiles();return id?files.find(x=>x.id===id)||null:files[0]||null;}
async function deleteOriginalFile(id){const db=await openOriginalDB();return new Promise((resolve,reject)=>{const tx=db.transaction('originals','readwrite');tx.objectStore('originals').delete(id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
async function downloadOriginalFile(id){const rec=await getOriginalFile(id||selectedFileId);if(!rec){alert('No original document is stored in this browser yet.');return;}download(rec.blob,rec.name);}
async function migrateLegacyOriginal(){try{const old=await new Promise((resolve,reject)=>{const req=indexedDB.open('reze-original-files-v1');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onupgradeneeded=()=>{req.transaction.abort();reject(new Error('No legacy database'));};});if(!old.objectStoreNames.contains('originals')){old.close();return;}const item=await new Promise((resolve,reject)=>{const q=old.transaction('originals').objectStore('originals').get('latest');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});old.close();if(item?.blob){const db=await openOriginalDB();await new Promise((resolve,reject)=>{const tx=db.transaction('originals','readwrite');tx.objectStore('originals').put({...item,id:makeFileId(),createdAt:new Date().toISOString(),size:item.blob.size});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}}catch(_){}}
function downloadWorkingCopy(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='REZE-working-copy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
let selectedFileId=null;
async function importDocument(file, extension, record) {
  $('#saveState').textContent='Reading document…';
  const extracted=extension==='pdf'?await extractPdfText(file):await extractDocxText(file);
  if(!extracted||extracted.length<20)throw new Error('No readable text was found. This may be a scanned PDF or a protected document. Scanned PDFs require OCR before import.');
  await renderUploadedOriginal(file,extension);
  if(extension==='docx'){await loadScriptOnce('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js',()=>!!window.mammoth);const converted=await window.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()});setUploadedEditable(converted.value,'docx',file.name);}else{setUploadedEditable('<pre>'+escapeHTML(extracted)+'</pre>','pdf',file.name);}
  const parsed=parseResumeText(extracted);
  if(!parsed.name&&!parsed.email&&!parsed.summary&&!parsed.skills&&!parsed.experience.length&&!parsed.education.length&&!parsed.extras.length)parsed.summary=extracted;
  data={...blank(),...parsed,template:data.template||'modern',accent:data.accent||'#b77bec'};
  fillFields();renderAll();queueSave();switchView('upload');
  $('#originalFileStatus').textContent=`Original preserved: ${record.name}. Edit the uploaded document directly in the workspace below; the original remains unchanged.`;
  $('#saveState').textContent='✓ Imported locally';
}
const uploadInput=$('#importFile');
function formatBytes(n){return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(0)} KB`:`${(n/1048576).toFixed(1)} MB`;}
async function renderFileLibrary(){const host=$('#uploadFileCard');const files=await listOriginalFiles();if(!selectedFileId&&files.length)selectedFileId=files[0].id;if(selectedFileId&&!files.some(f=>f.id===selectedFileId))selectedFileId=files[0]?.id||null;if(!files.length){host.className='upload-empty';host.textContent='Your document library is empty. Upload a PDF, DOCX, TXT or JSON file to get started.';$('#uploadFileActions').hidden=true;return;}host.className='upload-library';host.innerHTML=files.map(f=>{const ext=f.name.split('.').pop().toUpperCase();return `<div class="upload-file-card ${selectedFileId===f.id?'is-selected':''}" data-file-row="${f.id}"><div class="upload-file-icon">${escapeHTML(ext)}</div><div class="upload-file-info"><b>${escapeHTML(f.name)}</b><small>${formatBytes(f.size)} · ${new Date(f.createdAt).toLocaleString()}</small><small class="file-substatus">Original stored locally · editable copy stored separately</small></div><button class="mini-tool" data-download-file="${f.id}" type="button">Download</button><button class="mini-tool danger" data-delete-file="${f.id}" type="button" aria-label="Delete ${escapeHTML(f.name)}">×</button></div>`;}).join('');$('#uploadFileActions').hidden=!selectedFileId;}
async function handleChosenFile(file){if(file.size>20*1024*1024){alert('Please choose a file smaller than 20 MB.');return;}const name=file.name.toLowerCase();try{const record=await storeOriginalFile(file);selectedFileId=record.id;await renderFileLibrary();$('#saveState').textContent='✓ Original safely stored';const ext=name.split('.').pop();if(ext==='json'){const raw=await file.text();importJSON(JSON.parse(raw));await renderUploadedOriginal(file,'txt');setUploadedEditable('<pre>'+escapeHTML(raw)+'</pre>','json',file.name);switchView('upload');}else if(ext==='txt'){const raw=await file.text();data.summary=raw;fillFields();renderAll();queueSave();await renderUploadedOriginal(file,'txt');setUploadedEditable('<pre>'+escapeHTML(raw)+'</pre>','txt',file.name);switchView('upload');}else if(ext==='docx'||ext==='pdf'){await importDocument(file,ext,record);}else throw new Error('Please select a PDF, DOCX, TXT or JSON file.');await renderFileLibrary();}catch(err){console.error(err);alert('Could not import this file: '+err.message+'\nThe original upload remains stored in your document library.');await renderFileLibrary();}}
$('#openUpload').onclick=()=>switchView('upload');
$('#browseFiles').onclick=()=>uploadInput.click();
$('#uploadDropzone').onclick=e=>{if(e.target.closest('button'))return;uploadInput.click();};
$('#uploadDropzone').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();uploadInput.click();}};
['dragenter','dragover'].forEach(type=>$('#uploadDropzone').addEventListener(type,e=>{e.preventDefault();$('#uploadDropzone').classList.add('drag-over');}));
['dragleave','drop'].forEach(type=>$('#uploadDropzone').addEventListener(type,e=>{e.preventDefault();$('#uploadDropzone').classList.remove('drag-over');}));
$('#uploadDropzone').addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)handleChosenFile(f);});
uploadInput.addEventListener('change',e=>{const f=e.target.files[0];if(f)handleChosenFile(f);e.target.value='';});
$('#uploadFileCard').addEventListener('click',async e=>{const del=e.target.closest('[data-delete-file]'),dl=e.target.closest('[data-download-file]'),row=e.target.closest('[data-file-row]');if(del){if(confirm('Delete this original file from this browser? The current resume draft will remain.')){await deleteOriginalFile(del.dataset.deleteFile);if(selectedFileId===del.dataset.deleteFile)selectedFileId=null;await renderFileLibrary();}}else if(dl){await downloadOriginalFile(dl.dataset.downloadFile);}else if(row){selectedFileId=row.dataset.fileRow;await renderFileLibrary();const rec=await getOriginalFile(selectedFileId);if(rec){const ext=rec.name.split('.').pop().toLowerCase();if(ext==='pdf'||ext==='docx'){await renderUploadedOriginal(rec.blob,ext);if(ext==='docx'){await loadScriptOnce('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js',()=>!!window.mammoth);const html=(await window.mammoth.convertToHtml({arrayBuffer:await rec.blob.arrayBuffer()})).value;setUploadedEditable(html,ext,rec.name);}else{const txt=await extractPdfText(rec.blob);setUploadedEditable('<pre>'+escapeHTML(txt)+'</pre>',ext,rec.name);}}else{const txt=await rec.blob.text();await renderUploadedOriginal(rec.blob,'txt');setUploadedEditable('<pre>'+escapeHTML(txt)+'</pre>',ext,rec.name);}switchView('upload');}}});
$('#clearUploadFile').onclick=async()=>{if(!selectedFileId)return; if(confirm('Remove the selected original from this browser?')){await deleteOriginalFile(selectedFileId);selectedFileId=null;await renderFileLibrary();}};
$('#downloadOriginalUpload').onclick=()=>downloadOriginalFile();
async function loadExportLib(kind){if(kind==='pdf')await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);else await loadScriptOnce('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js',()=>!!window.docx?.Document);}
function resumePlainText(){readFields();const lines=[data.name,data.title,[data.email,data.phone,data.location,data.links].filter(Boolean).join(' | '),'', 'PROFESSIONAL SUMMARY',data.summary,'','EXPERIENCE',...data.experience.flatMap(x=>[`${x.role||''} | ${x.company||''} | ${x.start||''} - ${x.end||''}`,x.details||'']),'','EDUCATION',...data.education.flatMap(x=>[`${x.role||''} | ${x.company||''}`,x.details||'']),'','SKILLS',data.skills,'','PROJECTS & CERTIFICATIONS',...data.extras.flatMap(x=>[`${x.name||''} (${x.type||''})`,x.details||''])];return lines.filter((x,i)=>x!==''||lines[i-1]!=='').join('\n');}
async function downloadEditedSameFormat(){readFields();const rec=await getOriginalFile(selectedFileId);if(!rec){alert('Select an original PDF or DOCX from Your files first.');return;}const ext=(rec.name.split('.').pop()||'').toLowerCase(),base=rec.name.replace(/\.[^.]+$/,'')+'-REZE-edited';const content=resumePlainText();if(ext==='pdf'){await loadExportLib('pdf');const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4'});const margin=48,width=pdf.internal.pageSize.getWidth()-96;let y=margin;pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text(data.name||'Resume',margin,y);y+=24;pdf.setFont('helvetica','normal');pdf.setFontSize(10);for(const line of content.split('\n')){if(line===data.name)continue;const chunks=pdf.splitTextToSize(line||' ',width);for(const chunk of chunks){if(y>pdf.internal.pageSize.getHeight()-margin){pdf.addPage();y=margin;}pdf.text(chunk,margin,y);y+=14;}}pdf.save(base+'.pdf');}else if(ext==='docx'){await loadExportLib('docx');const {Document,Packer,Paragraph,TextRun,HeadingLevel}=window.docx;const paras=content.split('\n').map((line,i)=>new Paragraph({children:[new TextRun({text:line||' ',bold:i===0||/^(PROFESSIONAL SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS & CERTIFICATIONS)$/.test(line)})],spacing:{after:100}}));const doc=new Document({sections:[{properties:{},children:paras}]});const blob=await Packer.toBlob(doc);download(blob,base+'.docx');}else if(ext==='txt'){download(new Blob([content],{type:'text/plain;charset=utf-8'}),base+'.txt');}else if(ext==='json'){download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),base+'.json');}else{alert('Same-format export is supported for PDF, DOCX, TXT and JSON files.');}}

$('#saveUploadedEdits').onclick=saveUploadedEdits;
$('#uploadedEditableDocument').addEventListener('input',()=>{$('#uploadedEditStatus').textContent='Unsaved changes';clearTimeout(uploadedEditTimer);uploadedEditTimer=setTimeout(saveUploadedEdits,1000);});
$$('[data-upload-command]').forEach(btn=>btn.addEventListener('click',()=>{const editor=$('#uploadedEditableDocument');editor.focus();document.execCommand(btn.dataset.uploadCommand,false,null);$('#uploadedEditStatus').textContent='Unsaved changes';}));
$('#exportUploadedEdits').onclick=async()=>{saveUploadedEdits();const rec=await getOriginalFile(selectedFileId);if(!rec){alert('Select an uploaded document first.');return;}const ext=(rec.name.split('.').pop()||'txt').toLowerCase(),base=rec.name.replace(/\.[^.]+$/,'')+'-REZE-edited';const textContent=uploadedPlainText();if(ext==='pdf'){await loadExportLib('pdf');const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4'});const margin=48,width=pdf.internal.pageSize.getWidth()-96;let y=margin;pdf.setFont('helvetica','normal');pdf.setFontSize(10);for(const line of textContent.split('\n')){for(const chunk of pdf.splitTextToSize(line||' ',width)){if(y>pdf.internal.pageSize.getHeight()-margin){pdf.addPage();y=margin;}pdf.text(chunk,margin,y);y+=14;}}pdf.save(base+'.pdf');}else if(ext==='docx'){await loadExportLib('docx');const {Document,Packer,Paragraph,TextRun}=window.docx;const paras=textContent.split('\n').map(line=>new Paragraph({children:[new TextRun({text:line||' '})],spacing:{after:100}}));download(await Packer.toBlob(new Document({sections:[{children:paras}]})),base+'.docx');}else{download(new Blob([textContent],{type:'text/plain;charset=utf-8'}),base+'.txt');}};
$('#downloadEditedUpload').onclick=()=>downloadEditedSameFormat().catch(err=>{console.error(err);alert('Could not create the edited file: '+err.message);});

$('#runMatch').onclick=()=>{readFields();const jd=clean($('#jobDescription').value).toLowerCase();if(!jd){$('#matchResults').innerHTML='<p class="hint">Paste a job description first.</p>';return;}const terms=[...new Set((clean(data.skills)+' '+clean(data.summary)+' '+data.experience.map(x=>x.role+' '+x.details).join(' ')).toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g)||[])];const matched=terms.filter(t=>jd.includes(t));const missing=[...new Set((jd.match(/[a-z][a-z0-9+#.-]{3,}/g)||[]))].filter(t=>!terms.includes(t)).filter(t=>!['with','that','this','from','your','will','have','work','team','years','role','able','and','the','for','are','our','you'].includes(t)).slice(0,24);const pct=Math.round(matched.length/Math.max(terms.length,1)*100);$('#matchResults').innerHTML=`<div class="score-row"><div class="score">${pct}%</div><div><b>Keyword overlap</b><small>Simple text comparison, not semantic scoring.</small></div></div><h3>Matched terms</h3>${matched.map(x=>`<span class="match-tag">${escapeHTML(x)}</span>`).join('')||'<p>None found yet.</p>'}<h3>Terms to review</h3>${missing.map(x=>`<span class="match-tag">${escapeHTML(x)}</span>`).join('')}<p class="hint">Only include missing terms if they accurately describe your skills and experience.</p>`;};
function improve(text,concise){let s=clean(text).replace(/^[-•]\s*/, '').replace(/\s+/g,' ');if(concise)return s.replace(/\b(responsible for|worked on|in order to|helped to)\b/gi,'').replace(/\s+/g,' ').trim();if(!s)return '';if(!/^(Built|Led|Developed|Implemented|Analysed|Analyzed|Managed|Tested|Identified|Designed|Automated|Improved|Delivered|Created|Conducted)\b/i.test(s))s='Implemented '+s.charAt(0).toLowerCase()+s.slice(1);if(!/[.!]$/.test(s))s+='.';return s;}
$('#rewriteBullet').onclick=()=>$('#assistantOutput').value=improve($('#assistantInput').value,false);$('#makeConcise').onclick=()=>$('#assistantOutput').value=improve($('#assistantInput').value,true);$('#useSuggestion').onclick=()=>{const s=clean($('#assistantOutput').value);if(s){const old=clean(data.summary);data.summary=old?old+'\n'+s:s;fillFields();queueSave();}};
$('#loadSaved').onclick=()=>{hydrate();fillFields();renderAll();switchView('editor');};
window.addEventListener('beforeprint',renderPreview);
hydrate();fillFields();renderAll();$$('[data-template]').forEach(x=>x.classList.toggle('selected',x.dataset.template===data.template));migrateLegacyOriginal().then(renderFileLibrary).catch(console.error);persist();
})();
