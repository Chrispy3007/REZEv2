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
function queueSave(){ $('#saveState').textContent='Saving…';clearTimeout(timer);timer=setTimeout(persist,300);renderPreview();updateATS();}
function readFields(){ $$('[data-field]').forEach(el=>data[el.dataset.field]=el.value); }
function fillFields(){ $$('[data-field]').forEach(el=>el.value=data[el.dataset.field]||''); $('#accent').value=data.accent||'#b77bec'; }
function renderEntryList(type){const host=$(`#${type}List`);const arr=data[type];host.innerHTML=arr.map((x,i)=>`<div class="entry" data-index="${i}"><button class="remove" data-remove="${type}" data-index="${i}">Remove ×</button><div class="entry-grid"><label>${type==='experience'?'Role / Position':'Degree / Qualification'}<input data-array="${type}" data-index="${i}" data-key="role" value="${escapeHTML(x.role)}" placeholder="${type==='experience'?'Penetration Tester':'B.Sc. Computer Science'}"></label><label>${type==='experience'?'Company':'Institution'}<input data-array="${type}" data-index="${i}" data-key="company" value="${escapeHTML(x.company)}" placeholder="Company / institution"></label><label>Start date<input data-array="${type}" data-index="${i}" data-key="start" value="${escapeHTML(x.start)}" placeholder="Jan 2023"></label><label>End date<input data-array="${type}" data-index="${i}" data-key="end" value="${escapeHTML(x.end)}" placeholder="Present"></label></div>${type==='experience'?`<label>Responsibilities / achievements<textarea data-array="${type}" data-index="${i}" data-key="details" rows="3" placeholder="One achievement per line">${escapeHTML(x.details)}</textarea></label>`:`<label>Details<input data-array="${type}" data-index="${i}" data-key="details" value="${escapeHTML(x.details)}" placeholder="Relevant coursework, honours…"></label>`}</div>`).join('');}
function renderExtras(){const host=$('#extraList');host.innerHTML=data.extras.map((x,i)=>`<div class="entry"><button class="remove" data-remove="extras" data-index="${i}">Remove ×</button><div class="entry-grid"><label>Type<input data-array="extras" data-index="${i}" data-key="type" value="${escapeHTML(x.type)}" placeholder="Certification / Project"></label><label>Name<input data-array="extras" data-index="${i}" data-key="name" value="${escapeHTML(x.name)}" placeholder="Name"></label></div><label>Description<input data-array="extras" data-index="${i}" data-key="details" value="${escapeHTML(x.details)}" placeholder="Brief details"></label></div>`).join('');}
function section(title,body){return body?`<h3>${title}</h3>${body}`:''}
function renderPreview(){const d=data;const skills=clean(d.skills).split(/[,\n]/).map(clean).filter(Boolean);const exp=d.experience.filter(x=>clean(x.role)||clean(x.company)).map(x=>`<div class="item-head"><span>${escapeHTML(x.role)}</span><span>${escapeHTML([x.start,x.end].filter(Boolean).join(' – '))}</span></div><p class="muted">${escapeHTML(x.company)}</p>${x.details?`<ul>${x.details.split('\n').map(clean).filter(Boolean).map(t=>`<li>${escapeHTML(t.replace(/^[-•]\s*/,''))}</li>`).join('')}</ul>`:''}`).join('');const edu=d.education.filter(x=>clean(x.role)||clean(x.company)).map(x=>`<div class="item-head"><span>${escapeHTML(x.role)}</span><span>${escapeHTML([x.start,x.end].filter(Boolean).join(' – '))}</span></div><p>${escapeHTML(x.company)} ${x.details?`· ${escapeHTML(x.details)}`:''}</p>`).join('');const extra=d.extras.filter(x=>clean(x.name)).map(x=>`<p><b>${escapeHTML(x.name)}</b> <span class="muted">${escapeHTML(x.type)}</span>${x.details?` — ${escapeHTML(x.details)}`:''}</p>`).join('');const html=`<header><h2>${escapeHTML(d.name||'Your Name')}</h2><div class="resume-title">${escapeHTML(d.title||'Professional Title')}</div><div class="contact">${[d.email,d.phone,d.location,d.links].filter(Boolean).map(escapeHTML).join(' &nbsp;·&nbsp; ')}</div></header>${section('Professional Summary',d.summary?`<p>${escapeHTML(d.summary)}</p>`:'')} ${section('Experience',exp)} ${section('Education',edu)} ${section('Skills',skills.length?`<div class="skills">${skills.map(s=>`<span>${escapeHTML(s)}</span>`).join('')}</div>`:'')} ${section('Projects & Certifications',extra)}`;['#resumePreview','#resumePreviewLarge'].forEach(sel=>{const el=$(sel);if(el)el.innerHTML=html;});const savedPage=localStorage.getItem('reze-page-preview-html-v1');if(savedPage&&$('#resumePreviewLarge'))$('#resumePreviewLarge').innerHTML=savedPage;document.documentElement.style.setProperty('--accent',d.accent||'#b77bec');$$('.resume-paper').forEach(el=>{el.classList.toggle('classic',d.template==='classic');el.classList.toggle('minimal',d.template==='minimal');});}
function updateATS(){const checks=[['Name',!!clean(data.name)],['Professional title',!!clean(data.title)],['Email address',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)],['Phone or contact number',!!clean(data.phone)],['Location or profile link',!!clean(data.location)||!!clean(data.links)],['Professional summary',clean(data.summary).length>=60],['Experience details',data.experience.some(x=>clean(x.role)&&clean(x.details))],['Education',data.education.some(x=>clean(x.role)||clean(x.company))],['Skills',clean(data.skills).split(/[,\n]/).filter(clean).length>=4],['Action-oriented bullet points',data.experience.some(x=>/built|led|improved|reduced|managed|tested|developed|identified|implemented|created/i.test(x.details))],['Measurable outcomes',data.experience.some(x=>/\d+\s?(%|\+|users|hours|days|projects|systems)/i.test(x.details))],['Projects or certifications',data.extras.some(x=>clean(x.name))]];const n=checks.filter(x=>x[1]).length;$('#atsScore').textContent=Math.round(n/checks.length*100)+'%';$('#atsLabel').textContent=n>=10?'Strong content coverage':n>=7?'Good start — a few gaps remain':'Add more detail to improve completeness';$('#atsChecks').innerHTML=checks.map(([t,ok])=>`<div class="check ${ok?'':'missing'}"><span>${escapeHTML(t)}</span><em>${ok?'✓ Complete':'＋ Needs attention'}</em></div>`).join('');}
function switchView(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='preview')renderPreview();if(view==='ats')updateATS();if(view==='resumes')$('#savedResume').textContent=localStorage.getItem(KEY)?'A saved resume is available in this browser.':'No saved resume yet.';}
function add(type){data[type].push(type==='extras'?{type:'',name:'',details:''}:{role:'',company:'',start:'',end:'',details:''});if(type==='extras')renderExtras();else renderEntryList(type);queueSave();}
function exportJSON(){readFields();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});download(blob,'reze-resume.json');}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importJSON(obj){data={...blank(),...obj,experience:Array.isArray(obj.experience)?obj.experience:[],education:Array.isArray(obj.education)?obj.education:[],extras:Array.isArray(obj.extras)?obj.extras:[]};fillFields();renderAll();queueSave();}
function renderAll(){renderEntryList('experience');renderEntryList('education');renderExtras();renderPreview();updateATS();}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)switchView(b.dataset.view)});$$('.tabs').forEach(t=>t.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)switchView(b.dataset.view)}));
document.addEventListener('input',e=>{const el=e.target;if(el.matches('[data-field]')){data[el.dataset.field]=el.value;queueSave();}if(el.matches('[data-array]')){const a=data[el.dataset.array][+el.dataset.index];a[el.dataset.key]=el.value;queueSave();}});
document.addEventListener('click',e=>{const r=e.target.closest('[data-remove]');if(r){data[r.dataset.remove].splice(+r.dataset.index,1);r.dataset.remove==='extras'?renderExtras():renderEntryList(r.dataset.remove);queueSave();}const t=e.target.closest('[data-template]');if(t){data.template=t.dataset.template;$$('[data-template]').forEach(x=>x.classList.toggle('selected',x===t));renderPreview();queueSave();}});
$('#addExperience').onclick=()=>add('experience');$('#addEducation').onclick=()=>add('education');$('#addExtra').onclick=()=>add('extras');$('#saveBtn').onclick=()=>{readFields();persist();};$('#clearBtn').onclick=()=>{if(confirm('Clear the current resume? This does not delete exported files.')){data=blank();fillFields();renderAll();persist();}};$('#accent').oninput=e=>{data.accent=e.target.value;queueSave();};
const THEME_KEY='reze-theme-v1';
function setTheme(theme){const light=theme==='light';document.body.classList.toggle('light',light);document.documentElement.dataset.theme=light?'light':'dark';$('#appearance').value=light?'light':'dark';$('#themeToggle').textContent=light?'☾':'☼';$('#themeToggle').setAttribute('aria-label',light?'Switch to dark mode':'Switch to light mode');try{localStorage.setItem(THEME_KEY,light?'light':'dark')}catch{}}
setTheme(localStorage.getItem(THEME_KEY)||'dark');
$('#themeToggle').onclick=()=>setTheme(document.body.classList.contains('light')?'dark':'light');
$('#appearance').onchange=e=>setTheme(e.target.value);$('#cursorSize').oninput=e=>document.documentElement.style.setProperty('--cursor',e.target.value+'px');
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
  const bytes=new Uint8Array(await file.arrayBuffer());
  const pdf=await pdfjs.getDocument({data:bytes}).promise;
  const pages=[];
  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    const page=await pdf.getPage(pageNo);
    const content=await page.getTextContent();
    let line='', lines=[];
    for(const item of content.items){
      if(!item.str) continue;
      const text=item.str.trim();
      if(!text) continue;
      if(line && item.hasEOL) { lines.push(line); line=''; }
      else if(line && item.transform && item.transform[5]!==undefined && Math.abs(item.transform[5]-(page._rezeLastY??item.transform[5]))>3) { lines.push(line); line=''; }
      line+=(line?' ':'')+text;
      if(item.transform) page._rezeLastY=item.transform[5];
    }
    if(line) lines.push(line);
    pages.push(lines.join('\n'));
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
const ORIGINAL_DB='reze-original-files-v1';
function openOriginalDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(ORIGINAL_DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('originals',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function storeOriginalFile(file){const db=await openOriginalDB();return new Promise((resolve,reject)=>{const tx=db.transaction('originals','readwrite');tx.objectStore('originals').put({id:'latest',name:file.name,type:file.type,blob:file,lastModified:file.lastModified});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
async function getOriginalFile(){const db=await openOriginalDB();return new Promise((resolve,reject)=>{const req=db.transaction('originals').objectStore('originals').get('latest');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
async function downloadOriginalFile(){const rec=await getOriginalFile();if(!rec){alert('No original PDF/DOCX has been imported in this browser yet.');return;}const url=URL.createObjectURL(rec.blob);const a=document.createElement('a');a.href=url;a.download=rec.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function downloadWorkingCopy(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='REZE-working-copy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
async function importDocument(file, extension) {
  const saveState=$('#saveState');
  saveState.textContent='Reading document…';
  await storeOriginalFile(file);
  const extracted=extension==='pdf'?await extractPdfText(file):await extractDocxText(file);
  if(!extracted || extracted.length<20) throw new Error('No readable text was found. The file may be scanned/image-only or protected. Try an OCR-enabled PDF or a text-based DOCX.');
  const parsed=parseResumeText(extracted);
  const hasStructured=!!(parsed.name||parsed.email||parsed.summary||parsed.skills||parsed.experience.length||parsed.education.length||parsed.extras.length);
  if(!hasStructured) parsed.summary=extracted;
  const confirmImport=confirm(`Extracted ${extracted.length.toLocaleString()} characters from ${file.name}.\n\nREZE will map recognisable sections into your resume fields. Please review the result because PDF/DOCX layouts and section headings vary.\n\nImport this content into the current draft? Your original file will not be modified.`);
  if(!confirmImport){saveState.textContent='Import cancelled';return;}
  data={...blank(),...parsed,template:data.template||'modern',accent:data.accent||'#b77bec'};
  fillFields();renderAll();queueSave();switchView('editor');
  alert(`Imported text from ${file.name}.\n\nPlease review every section and correct any fields that were mapped imperfectly. The original file was left unchanged.`);
  saveState.textContent='✓ Imported locally'; const status=$('#originalFileStatus'); if(status)status.textContent=`Original preserved: ${file.name}. Edit the working copy; download the untouched original any time.`;
}

$('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const name=f.name.toLowerCase();if(name.endsWith('.json')){importJSON(JSON.parse(await f.text()));}else if(name.endsWith('.txt')){data.summary=await f.text();fillFields();renderAll();queueSave();alert('Text imported into the summary field. Please organise it into the correct sections.');}else if(name.endsWith('.docx')){await importDocument(f,'docx');}else if(name.endsWith('.pdf')){await importDocument(f,'pdf');}else alert('Please select a JSON, TXT, PDF or DOCX resume file.');}catch(err){console.error('REZE import error:',err);alert('Could not import this file: '+err.message+'\n\nYour original file has not been changed.');$('#saveState').textContent='Import failed';}e.target.value='';};
$('#runMatch').onclick=()=>{readFields();const jd=clean($('#jobDescription').value).toLowerCase();if(!jd){$('#matchResults').innerHTML='<p class="hint">Paste a job description first.</p>';return;}const terms=[...new Set((clean(data.skills)+' '+clean(data.summary)+' '+data.experience.map(x=>x.role+' '+x.details).join(' ')).toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g)||[])];const matched=terms.filter(t=>jd.includes(t));const missing=[...new Set((jd.match(/[a-z][a-z0-9+#.-]{3,}/g)||[]))].filter(t=>!terms.includes(t)).filter(t=>!['with','that','this','from','your','will','have','work','team','years','role','able','and','the','for','are','our','you'].includes(t)).slice(0,24);const pct=Math.round(matched.length/Math.max(terms.length,1)*100);$('#matchResults').innerHTML=`<div class="score-row"><div class="score">${pct}%</div><div><b>Keyword overlap</b><small>Simple text comparison, not semantic scoring.</small></div></div><h3>Matched terms</h3>${matched.map(x=>`<span class="match-tag">${escapeHTML(x)}</span>`).join('')||'<p>None found yet.</p>'}<h3>Terms to review</h3>${missing.map(x=>`<span class="match-tag">${escapeHTML(x)}</span>`).join('')}<p class="hint">Only include missing terms if they accurately describe your skills and experience.</p>`;};
function improve(text,concise){let s=clean(text).replace(/^[-•]\s*/, '').replace(/\s+/g,' ');if(concise)return s.replace(/\b(responsible for|worked on|in order to|helped to)\b/gi,'').replace(/\s+/g,' ').trim();if(!s)return '';if(!/^(Built|Led|Developed|Implemented|Analysed|Analyzed|Managed|Tested|Identified|Designed|Automated|Improved|Delivered|Created|Conducted)\b/i.test(s))s='Implemented '+s.charAt(0).toLowerCase()+s.slice(1);if(!/[.!]$/.test(s))s+='.';return s;}
$('#rewriteBullet').onclick=()=>$('#assistantOutput').value=improve($('#assistantInput').value,false);$('#makeConcise').onclick=()=>$('#assistantOutput').value=improve($('#assistantInput').value,true);$('#useSuggestion').onclick=()=>{const s=clean($('#assistantOutput').value);if(s){const old=clean(data.summary);data.summary=old?old+'\n'+s:s;fillFields();queueSave();}};
$('#loadSaved').onclick=()=>{hydrate();fillFields();renderAll();switchView('editor');};
window.addEventListener('beforeprint',renderPreview);
hydrate();fillFields();renderAll();persist();
})();
