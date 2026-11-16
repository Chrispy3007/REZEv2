/* REZE Resume Understanding & Mapping Engine — browser-local, review-first import. */
(() => {
 'use strict';
 const KEY='reze-js-resume-v1', LIB='reze-v2-resume-library-v1', ACTIVE='reze-v2-active-resume-id';
 const $=(s,r=document)=>r.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const clean=x=>String(x??'').replace(/\u00a0/g,' ').trim();
 const blank=()=>({schemaVersion:2,id:uid('resume'),name:'',title:'',email:'',phone:'',location:'',links:'',summary:'',skills:'',skillsGroups:[],experience:[],education:[],extras:[],projects:[],certifications:[],customSections:[],additionalInformation:[],sectionOrder:['summary','experience','education','skills','extras'],hiddenSections:[],template:'modern',accent:'#b9a4ff',metadata:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),sourceDocumentId:null},provenance:{}});
 const registry={
  modern:['personal.name','personal.title','personal.email','personal.phone','personal.location','personal.links','summary','experience[]','education[]','skillsGroups[]','projects[]','certifications[]','customSections[]'],
  classic:['personal.name','personal.title','personal.email','personal.phone','personal.location','summary','experience[]','education[]','skillsGroups[]','projects[]','certifications[]'],
  minimal:['personal.name','personal.title','personal.email','personal.phone','summary','experience[]','education[]','skillsGroups[]'],
  technical:['personal.name','personal.title','personal.email','personal.phone','summary','experience[]','skillsGroups[]','projects[]','certifications[]','education[]']
 };
 const migrate=(src,sourceId)=>{
  const old=src&&typeof src==='object'?clone(src):{}, legacy=Number(old.schemaVersion||1)<2, d=blank();
  Object.assign(d,old);
  d.schemaVersion=2;d.id=old.id||d.id;
  ['experience','education','extras','skillsGroups','customSections','projects','certifications','additionalInformation'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[];});
  if(!d.skillsGroups.length&&clean(d.skills))d.skillsGroups=[{id:uid('skill'),heading:'Skills',description:clean(d.skills)}];
  d.experience=d.experience.map(x=>({...x,id:x.id||uid('exp'),role:x.role||x.position||'',company:x.company||x.employer||'',start:x.start||x.startDate||'',end:x.end||x.endDate||'',details:x.details||[...(x.responsibilities||[]),...(x.achievements||[])].join('\n')}));
  d.education=d.education.map(x=>({...x,id:x.id||uid('edu'),role:x.role||x.degree||'',company:x.company||x.institution||'',start:x.start||x.startDate||'',end:x.end||x.endDate||'',details:x.details||''}));
  d.skillsGroups=d.skillsGroups.map(x=>({...x,id:x.id||uid('skill'),heading:x.heading||'',description:x.description||''}));
  if(legacy){d.projects=[...d.projects,...d.extras.filter(x=>/project/i.test(x.type||'' )).map(x=>({id:x.id||uid('project'),name:x.name||'',description:x.details||''}))];
  d.certifications=[...d.certifications,...d.extras.filter(x=>/cert|license|training/i.test(x.type||'')).map(x=>({id:x.id||uid('cert'),name:x.name||'',details:x.details||''}))];
  d.additionalInformation=[...d.additionalInformation,...d.extras.filter(x=>!/project|cert|license|training/i.test(x.type||'' )).map(x=>({id:x.id||uid('info'),title:x.type||'Additional information',content:[x.name,x.details].filter(Boolean).join(' — ')}))];}
  d.extras=[...d.projects.map(x=>({type:'Project',name:x.name||'',details:x.description||''})),...d.certifications.map(x=>({type:'Certification',name:x.name||'',details:x.details||''}))];
  d.customSections=d.customSections.map(x=>({...x,id:x.id||uid('section')}));
  d.metadata={...(d.metadata||{}),createdAt:d.metadata?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),sourceDocumentId:sourceId||d.metadata?.sourceDocumentId||null};
  d.provenance=d.provenance||{};
  return d;
 };
 const loadScript=(src,test)=>test()?Promise.resolve():new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>test()?resolve():reject(new Error('Parser script loaded but did not initialise'));s.onerror=()=>reject(new Error('Could not load parser library. Check your internet connection.'));document.head.appendChild(s);});
 async function pdfExtract(file){
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
  const pages=[],all=[];
  for(let n=1;n<=pdf.numPages;n++){
   const page=await pdf.getPage(n), c=await page.getTextContent();
   const items=c.items.filter(i=>i.str&&i.str.trim()).map(i=>({text:i.str.trim(),x:i.transform?.[4]||0,y:i.transform?.[5]||0}));
   items.sort((a,b)=>Math.abs(a.y-b.y)>2.5?b.y-a.y:a.x-b.x);
   const lines=[];for(const item of items){let l=lines.find(x=>Math.abs(x.y-item.y)<=2.5);if(!l){l={y:item.y,items:[]};lines.push(l)}l.items.push(item)}
   lines.sort((a,b)=>b.y-a.y);
   const pageLines=lines.map(l=>l.items.sort((a,b)=>a.x-b.x).map(x=>x.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean);
   pages.push({page:n,lines:pageLines});pageLines.forEach(line=>all.push({text:line,page:n,source:'pdf-text'}));
  }
  let text=pages.map(p=>p.lines.join('\n')).join('\n\n');
  if(text.replace(/\s/g,'').length<40){
   try{
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',()=>!!window.Tesseract);
    for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),vp=page.getViewport({scale:1.8}),canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;const r=await window.Tesseract.recognize(canvas,'eng');pages[n-1].lines=clean(r.data.text).split('\n').filter(Boolean);pages[n-1].lines.forEach(line=>all.push({text:line,page:n,source:'ocr'}));}
    text=pages.map(p=>p.lines.join('\n')).join('\n\n');
   }catch(e){return {text,lines:all,pages,warning:'This PDF appears scanned. Automatic OCR could not run; check your connection or review the original manually.'};}
  }
  return {text,lines:all,pages,warning:''};
 }
 async function docxExtract(file){
  await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js',()=>!!window.mammoth);
  const buffer=await file.arrayBuffer(),raw=await window.mammoth.extractRawText({arrayBuffer:buffer});
  const converted=await window.mammoth.convertToHtml({arrayBuffer:buffer});
  const doc=new DOMParser().parseFromString(converted.value||'','text/html');
  const lines=[];
  const walk=(node,depth=0)=>{
   [...node.children].forEach(el=>{
    const tag=el.tagName.toLowerCase(),isBlock=/^(h[1-6]|p|li|tr)$/.test(tag);
    if(isBlock){const text=clean(el.innerText||el.textContent);if(text)lines.push({text:(tag==='li'?'• ':'')+text,page:null,source:tag});}
    else walk(el,depth+1);
   });
  };walk(doc.body);
  return {text:clean(raw.value).replace(/\r/g,''),lines:lines.length?lines:clean(raw.value).split('\n').map(text=>({text,page:null,source:'docx'})),pages:[],warning:converted.messages?.length?'Some DOCX formatting could not be interpreted; review the extracted fields.':''};
 }
 function classify(extracted,sourceId){
  const text=clean(extracted.text).replace(/\r/g,''),lines=(extracted.lines?.length?extracted.lines:text.split('\n').map(text=>({text,page:null,source:'text'}))).map(x=>({...x,text:clean(x.text)})).filter(x=>x.text);
  const d=blank(),evidence={};const mark=(field,items,confidence='medium')=>evidence[field]={confidence,sources:items.map(x=>({text:x.text,page:x.page??null,source:x.source||'text'}))};
  const email=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);if(email){d.email=email[0];mark('email',[{text:email[0]}],'high');}
  const phone=text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d[\d\s().-]{7,}\d/);if(phone&&phone[0].replace(/\D/g,'').length>=7){d.phone=phone[0].trim();mark('phone',[{text:phone[0]}],'medium');}
  const url=text.match(/(?:https?:\/\/|www\.)[^\s)]+/i);if(url){d.links=url[0];mark('links',[{text:url[0]}],'high');}
  const headings={
   summary:/^(professional\s+summary|summary|profile|career\s+objective|objective|about\s+me)$/i,
   experience:/^(professional\s+experience|work\s+experience|employment\s+history|experience|work\s+history|career\s+history)$/i,
   education:/^(education|academic\s+background|qualifications)$/i,
   skills:/^(skills|technical\s+skills|core\s+competencies|competencies|tools\s*(?:&|and)\s*technologies|areas\s+of\s+expertise)$/i,
   certifications:/^(certifications?|licenses?|training|courses)$/i,
   projects:/^(projects?|selected\s+projects|personal\s+projects)$/i
  };
  const sections={intro:[]};let active='intro',unknown=[];
  lines.forEach(l=>{const key=Object.keys(headings).find(k=>headings[k].test(l.text.replace(/[:：]$/,'')));if(key){active=key;sections[key]??=[];mark('section:'+key,[l],'high');}else if(l.text.length<48&&(/[:：]$/.test(l.text)||(/^[A-Z0-9 &/()-]+$/.test(l.text)&&/[A-Z]/.test(l.text)))){active='unmapped_'+l.text.toLowerCase().replace(/[^a-z0-9]+/g,'_');sections[active]??=[];sections[active].push({ ...l, text:l.text });mark('section:'+active,[l],'low');}else{sections[active]??=[];sections[active].push(l);}});
  const intro=(sections.intro||[]).filter(x=>!email||!x.text.includes(email[0]));
  const nameLine=intro.find(x=>x.text.length<65&&!/@|https?:\/\//i.test(x.text)&&!/\d{5,}/.test(x.text));
  if(nameLine){d.name=nameLine.text;mark('name',[nameLine],'medium');}
  const titleLine=intro.find(x=>x!==nameLine&&x.text.length<100&&!/@|https?:\/\//i.test(x.text));
  if(titleLine){d.title=titleLine.text;mark('title',[titleLine],'low');}
  const summary=(sections.summary||[]).map(x=>x.text).join('\n');
  if(summary){d.summary=summary;mark('summary',sections.summary,'medium');}
  else{const maybe=intro.filter(x=>x!==nameLine&&x!==titleLine&&x.text.length>55);if(maybe.length){d.summary=maybe.map(x=>x.text).join('\n');mark('summary',maybe,'low');}}
  const skillLines=sections.skills||[];
  if(skillLines.length){const combined=skillLines.map(x=>x.text.replace(/^[•·-]\s*/,''));d.skillsGroups=[{id:uid('skill'),heading:'Technical Skills',description:combined.join(', ')}];d.skills=combined.join(', ');mark('skillsGroups',skillLines,'medium');}
  const parseEntries=(arr,type)=>{
   const groups=[];let current=null;
   arr.forEach(l=>{
    const t=l.text.replace(/^[•·-]\s*/,'');
    const hasDate=/\b(?:19|20)\d{2}\b/.test(t);
    const likelyHeader=!/^[•·-]/.test(l.text)&&t.length<120;
    if(!current||(!/^[•·-]/.test(l.text)&&likelyHeader&&current.details.length>0&&!hasDate)){if(current)groups.push(current);current={id:uid(type),role:t,company:'',start:'',end:'',details:''};}
    else current.details+=(current.details?'\n':'')+t;
    const date=t.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(?:19|20)\d{2})(?:\s*[-–—to]+\s*(Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(?:19|20)\d{2}))?/i);
    if(date){current.start=date[1];current.end=date[2]||'';current.role=current.role.replace(date[0],'').trim();}
   });
   if(current)groups.push(current);
   return groups.filter(x=>x.role).map(x=>{if(type==='experience'&&!x.company&&x.details){const parts=x.details.split('\n');if(parts.length>1){x.company=parts.shift();x.details=parts.join('\n')}}return x;});
  };
  d.experience=parseEntries(sections.experience||[],'experience');if(d.experience.length)mark('experience',sections.experience,'low');
  d.education=parseEntries(sections.education||[],'education');if(d.education.length)mark('education',sections.education,'low');
  d.certifications=(sections.certifications||[]).map(x=>({id:uid('cert'),name:x.text.replace(/^[•·-]\s*/,''),details:''}));if(d.certifications.length)mark('certifications',sections.certifications,'medium');
  d.projects=(sections.projects||[]).map(x=>({id:uid('project'),name:x.text.replace(/^[•·-]\s*/,''),description:''}));if(d.projects.length)mark('projects',sections.projects,'medium');
  const recognised=new Set(['intro','summary','experience','education','skills','certifications','projects']);
  Object.keys(sections).filter(k=>!recognised.has(k)).forEach(k=>unknown.push(...sections[k]));
  const recognisedText=new Set(Object.values(sections).flat().map(x=>x.text));
  lines.forEach(l=>{if(!recognisedText.has(l.text)&&!Object.values(headings).some(r=>r.test(l.text)))unknown.push(l)});
  if(unknown.length){d.additionalInformation=unknown.map(x=>({id:uid('info'),title:'Unmapped content',content:x.text,sourcePage:x.page??null}));d.customSections.push({id:uid('section'),title:'Additional Information',body:unknown.map(x=>x.text).join('\n'),visible:true});mark('additionalInformation',unknown,'low');}
  d.extras=[...d.projects.map(x=>({type:'Project',name:x.name,details:x.description})),...d.certifications.map(x=>({type:'Certification',name:x.name,details:x.details}))];
  d.metadata.sourceDocumentId=sourceId;d.provenance=evidence;
  return {data:migrate(d,sourceId),evidence,unknownCount:unknown.length};
 }
 function ensureReviewStyles(){
  if($('#rezeImportReviewStyles'))return;
  const st=document.createElement('style');st.id='rezeImportReviewStyles';st.textContent=`
  .reze-review-backdrop{position:fixed;inset:0;z-index:99999;background:#090710d9;backdrop-filter:blur(14px);display:grid;place-items:center;padding:18px}
  .reze-review{width:min(1100px,96vw);max-height:92vh;overflow:auto;background:#1b1628;color:#f5f1ff;border:1px solid #65518c;border-radius:22px;padding:24px;box-shadow:0 30px 100px #0009}
  .reze-review h2{margin:0 0 6px;font-size:24px}.reze-review p{color:#c7bddb}.reze-review textarea{width:100%;min-height:300px;background:#100d19;color:#f5f1ff;border:1px solid #55456f;border-radius:12px;padding:14px;font:13px/1.55 ui-monospace,monospace;resize:vertical}
  .reze-review .rr-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0}.reze-review label{font-size:13px;color:#ded5f0}.reze-review select{background:#100d19;color:#fff;border:1px solid #66548b;border-radius:9px;padding:9px}.reze-review button{border:1px solid #7964a2;border-radius:10px;padding:10px 15px;background:#302344;color:#fff;cursor:pointer}.reze-review button.primary{background:#b9a4ff;color:#171222;border-color:#b9a4ff;font-weight:700}.reze-review button:disabled{opacity:.45;cursor:not-allowed}.reze-review .rr-status{font-size:12px;color:#c7b4ff}.reze-review .rr-conflicts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.reze-review .rr-conflict{padding:10px;border:1px solid #514267;border-radius:10px}.reze-review .rr-warning{color:#f4c78a}
  `;
  document.head.appendChild(st);
 }
 function showReview({data,evidence,warning,originalText,file,record}){
  ensureReviewStyles();
  return new Promise(resolve=>{
   const active=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}})();
   const backdrop=document.createElement('div');backdrop.className='reze-review-backdrop';
   const status=warning?`<p class="rr-warning">${esc(warning)}</p>`:'';
   backdrop.innerHTML=`<section class="reze-review" role="dialog" aria-modal="true" aria-labelledby="rrTitle">
    <div class="rr-row" style="justify-content:space-between"><div><div class="eyebrow">REZE · IMPORT REVIEW</div><h2 id="rrTitle">Review extracted resume data</h2><p>${esc(file.name)} · Original document remains stored separately and unchanged.</p></div><span class="rr-status">${Object.keys(evidence||{}).length} fields/sections detected</span></div>
    ${status}<p>Check the structured data before it enters your resume. Confidence and source evidence are retained in the import record. Edit the JSON below if anything needs correction.</p>
    <textarea id="rrJson" spellcheck="false" aria-label="Extracted resume data">${esc(JSON.stringify(data,null,2))}</textarea>
    <div class="rr-row"><label>Resume template <select id="rrTemplate"><option value="modern">Modern</option><option value="classic">Classic</option><option value="minimal">Minimal</option><option value="technical">Technical</option></select></label><label>Import destination <select id="rrDestination"><option value="new">Create a new resume</option><option value="merge">Merge into the currently open resume</option></select></label><label><input id="rrAiConsent" type="checkbox" disabled> Allow optional external AI classification (not configured in this browser)</label></div>
    <div class="rr-row"><div id="rrTemplatePreview" class="rr-status">Template mapping preview will appear here.</div></div><div id="rrConflictPanel" hidden><p><b>Resolve top-level field conflicts</b> — choose which version to keep for each populated field.</p><div class="rr-conflicts" id="rrConflicts"></div><p class="rr-warning">Repeating entries will be added as separate entries; possible duplicates are not merged automatically.</p></div>
    <div class="rr-row" style="justify-content:space-between"><span class="rr-status">Nothing is applied until you approve this review.</span><div class="rr-row" style="margin:0"><button type="button" id="rrCancel">Cancel import</button><button type="button" class="primary" id="rrApprove">Approve & import</button></div></div>
   </section>`;
   document.body.appendChild(backdrop);
   const json=$('#rrJson',backdrop),dest=$('#rrDestination',backdrop),panel=$('#rrConflictPanel',backdrop),conflicts=$('#rrConflicts',backdrop),template=$('#rrTemplate',backdrop),templatePreview=$('#rrTemplatePreview',backdrop);
   template.value=data.template||'modern';
   const refreshTemplate=()=>{let v;try{v=JSON.parse(json.value)}catch{templatePreview.textContent='Correct the JSON to preview template mapping.';return}const fields=registry[template.value]||registry.modern;const mapped=fields.filter(path=>{const key=path.replace('[]','').split('.').pop();if(path.includes('[]'))return Array.isArray(v[path.split('.')[0]])&&v[path.split('.')[0]].length>0;return !!String(v[key]??'').trim()});templatePreview.textContent=`${template.options[template.selectedIndex].text} template · ${mapped.length} of ${fields.length} placeholder groups currently populated. Empty fields remain blank.`;};
   template.addEventListener('change',refreshTemplate);json.addEventListener('input',refreshTemplate);refreshTemplate();
   const existing=migrate(active);
   const topFields=['name','title','email','phone','location','links','summary','skills'];
   const getImported=()=>{let v;try{v=JSON.parse(json.value)}catch(e){throw new Error('The extracted data is not valid JSON: '+e.message)}if(!v||typeof v!=='object')throw new Error('Resume data must be a JSON object.');return migrate(v,record?.id);};
   const updateConflicts=()=>{panel.hidden=dest.value!=='merge';if(panel.hidden)return;let incoming;try{incoming=getImported()}catch{return}
    conflicts.innerHTML=topFields.filter(k=>clean(existing[k])&&clean(incoming[k])).map(k=>`<div class="rr-conflict"><b>${esc(k)}</b><br><label><input type="radio" name="rr-${k}" value="existing" checked> Keep existing</label><br><label><input type="radio" name="rr-${k}" value="imported"> Use imported</label></div>`).join('')||'<p>No direct text-field conflicts.</p>';
   };
   dest.addEventListener('change',updateConflicts);updateConflicts();
   $('#rrCancel',backdrop).onclick=()=>{backdrop.remove();resolve(false)};
   $('#rrApprove',backdrop).onclick=()=>{
    try{
     const incoming=getImported();incoming.template=template.value;let finalData=incoming;
     if(dest.value==='merge'){
      finalData=clone(existing);
      topFields.forEach(k=>{if(!clean(finalData[k])&&clean(incoming[k]))finalData[k]=incoming[k];else if(clean(finalData[k])&&clean(incoming[k])){const choice=$(`input[name="rr-${k}"]:checked`,backdrop)?.value||'existing';if(choice==='imported')finalData[k]=incoming[k];}});
      ['experience','education','skillsGroups','projects','certifications','customSections','additionalInformation'].forEach(k=>{const a=finalData[k]||[],b=incoming[k]||[];finalData[k]=[...a,...b.map(x=>({...x,id:uid(k)}))]});
      finalData.extras=[...finalData.projects.map(x=>({type:'Project',name:x.name||'',details:x.description||''})),...finalData.certifications.map(x=>({type:'Certification',name:x.name||'',details:x.details||''}))];
      finalData.provenance={...(finalData.provenance||{}),...(incoming.provenance||{})};finalData.metadata={...(finalData.metadata||{}),updatedAt:new Date().toISOString()};
     }
     finalData.template=template.value;finalData=migrate(finalData,record?.id);
     const library=(()=>{try{const v=JSON.parse(localStorage.getItem(LIB)||'[]');return Array.isArray(v)?v:[]}catch{return []}})();
     if(dest.value==='new'){
      const id=uid('resume');finalData.id=id;
      library.unshift({id,name:finalData.name||file.name.replace(/\.[^.]+$/,''),data:finalData,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      localStorage.setItem(LIB,JSON.stringify(library));localStorage.setItem(ACTIVE,id);
     }else{
      const id=localStorage.getItem(ACTIVE);if(id){const ix=library.findIndex(x=>x.id===id);if(ix>=0){library[ix]={...library[ix],name:finalData.name||library[ix].name,data:finalData,updatedAt:new Date().toISOString()};localStorage.setItem(LIB,JSON.stringify(library));}}
     }
     localStorage.setItem(KEY,JSON.stringify(finalData));
     backdrop.remove();resolve({approved:true,data:finalData,destination:dest.value});
    }catch(e){alert(e.message)}
   };
   backdrop.addEventListener('click',e=>{if(e.target===backdrop){backdrop.remove();resolve(false)}});
  });
 }
 async function importFile(file,ext,record,ui){
  let extracted;
  ui.progress(55,'Extracting text and document structure');
  if(ext==='pdf')extracted=await pdfExtract(file);
  else if(ext==='docx')extracted=await docxExtract(file);
  else if(ext==='txt'){const text=await file.text();extracted={text,lines:text.split(/\r?\n/).map(text=>({text,page:null,source:'txt'})),pages:[],warning:''};}
  else if(ext==='json'){
   let parsed;try{parsed=JSON.parse(await file.text())}catch{throw new Error('The JSON file is not valid JSON.')}
   extracted={text:JSON.stringify(parsed,null,2),lines:[],pages:[],warning:''};
   const d=migrate(parsed,record?.id),result=await showReview({data:d,evidence:d.provenance||{},warning:'JSON data is being imported as structured resume data.',originalText:extracted.text,file,record});
   if(result){ui.progress(88,'Applying approved resume data');$('#loadSaved')?.click();ui.showOriginal();ui.showEditable('<pre>'+esc(extracted.text)+'</pre>','json',file.name);ui.switchView('editor');return {approved:true};}return {cancelled:true};
  }else throw new Error('Unsupported file type.');
  ui.progress(70,'Classifying sections and mapping fields');
  const result=classify(extracted,record?.id);
  const approved=await showReview({data:result.data,evidence:result.evidence,warning:extracted.warning||'',originalText:extracted.text,file,record});
  if(!approved)return {cancelled:true};
  ui.progress(90,'Applying approved resume data');
  $('#loadSaved')?.click();
  await ui.showOriginal();
  ui.showEditable('<pre>'+esc(extracted.text)+'</pre>',ext,file.name);
  ui.switchView('editor');return {approved:true};
 }
 function migrateStoredResumes(){
  try{
   const raw=localStorage.getItem(KEY);
   if(raw){const current=JSON.parse(raw);if(!current.schemaVersion||current.schemaVersion<2){localStorage.setItem('reze-schema-v2-backup-current',raw);localStorage.setItem(KEY,JSON.stringify(migrate(current)));}}
   const libRaw=localStorage.getItem(LIB);
   if(libRaw){const list=JSON.parse(libRaw);if(Array.isArray(list)){if(list.some(r=>!r.data?.schemaVersion||r.data.schemaVersion<2))localStorage.setItem('reze-schema-v2-backup-library',libRaw);localStorage.setItem(LIB,JSON.stringify(list.map(r=>({...r,data:migrate(r.data||{})}))));}}
  }catch(err){console.warn('REZE schema migration was not applied; original stored data was retained.',err);}
 }
 window.REZEImportEngine={importFile,registry,migrate,classify};
 migrateStoredResumes();
})();
