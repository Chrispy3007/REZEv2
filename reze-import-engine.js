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
  technical:['personal.name','personal.title','personal.email','personal.phone','summary','experience[]','skillsGroups[]','projects[]','certifications[]','education[]'],
  executive:['personal.name','personal.title','personal.email','personal.phone','personal.location','summary','experience[]','education[]','skillsGroups[]','certifications[]'],
  compact:['personal.name','personal.title','personal.email','personal.phone','summary','experience[]','education[]','skillsGroups[]'],
  creative:['personal.name','personal.title','personal.email','personal.phone','personal.links','summary','experience[]','projects[]','skillsGroups[]','education[]','certifications[]']
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
   const rows=[];for(const item of items){let row=rows.find(x=>Math.abs(x.y-item.y)<=2.5);if(!row){row={y:item.y,items:[]};rows.push(row)}row.items.push(item)}
   rows.sort((a,b)=>b.y-a.y);
   // Detect columns, while preserving paired rows in two-column data tables.
   const gaps=[];rows.forEach(row=>{const rowXs=row.items.map(i=>i.x).sort((a,b)=>a-b);for(let j=1;j<rowXs.length;j++)if(rowXs[j]-rowXs[j-1]>65)gaps.push(rowXs[j]-rowXs[j-1]);});
   const split=gaps.length?Math.max(...gaps):0;
   const xs=rows.flatMap(r=>r.items.map(i=>i.x)).sort((a,b)=>a-b);
   let best={gap:0,mid:xs.length?(xs[0]+xs[xs.length-1])/2:0};
   for(let j=1;j<xs.length;j++){const gap=xs[j]-xs[j-1];if(gap>best.gap)best={gap,mid:(xs[j]+xs[j-1])/2};}
   const twoColumn=split>105&&rows.filter(r=>r.items.some(i=>i.x<best.mid)&&r.items.some(i=>i.x>=best.mid)).length>=3;
   let pageLines=[];
   if(twoColumn){
    const pairedRows=rows.map(r=>{
     const left=r.items.filter(i=>i.x<best.mid).sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim();
     const right=r.items.filter(i=>i.x>=best.mid).sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim();
     return {left,right};
    });
    const paired=pairedRows.filter(r=>r.left&&r.right);
    const tableLike=paired.filter(r=>r.left.length<=72&&r.right.length>=18).length>=5&&paired.length>=5;
    if(tableLike)pageLines=pairedRows.map(r=>r.left&&r.right?r.left+' : '+r.right:(r.left||r.right)).filter(Boolean);
    else{
     const left=[],right=[];rows.forEach(r=>r.items.forEach(i=>(i.x<best.mid?left:right).push(i)));
     const makeColumn=arr=>{const rr=[];arr.forEach(i=>{let row=rr.find(x=>Math.abs(x.y-i.y)<=2.5);if(!row){row={y:i.y,items:[]};rr.push(row)}row.items.push(i)});return rr.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean)};
     pageLines=[...makeColumn(left),...makeColumn(right)];
    }
   }else pageLines=rows.map(r=>r.items.sort((a,b)=>a.x-b.x).map(x=>x.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean);
   pages.push({page:n,lines:pageLines,twoColumn});pageLines.forEach(line=>all.push({text:line,page:n,source:'pdf-text'}));
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
 const DOMAIN_LEXICON={technology:/software|developer|programming|cloud|devops|cybersecurity|network|database|api|automation|qa|testing/i,finance:/accounting|audit|tax|financial|reconciliation|payroll|budget|forecast|treasury|compliance/i,healthcare:/clinical|patient|nursing|medical|hospital|diagnostic|pharmacy|healthcare/i,sales_marketing:/sales|revenue|pipeline|prospecting|marketing|campaign|seo|conversion|customer acquisition/i,human_resources:/recruitment|talent acquisition|human resources|employee relations|workforce|hris|payroll/i,operations:/operations|supply chain|logistics|procurement|inventory|warehouse|process improvement/i,project_management:/project manager|program manager|stakeholder|milestone|delivery|agile|scrum/i,education:/teaching|curriculum|instruction|lecturer|faculty|student|academic/i,legal:/litigation|legal|contract|counsel|paralegal|regulatory|case law/i,design:/ux|ui|user experience|graphic design|product design|figma|visual design/i,customer_service:/customer support|customer service|call centre|contact center|service desk|customer success/i};
 function inferProfessionalContext(text){
  const scores=Object.entries(DOMAIN_LEXICON).map(([domain,re])=>({domain,hits:(String(text).match(new RegExp(re.source,'ig'))||[]).length})).sort((a,b)=>b.hits-a.hits);
  const top=scores[0], second=scores[1];
  const industry=top?.hits?top.domain:'general';
  const responsibilities=[];
  const patterns=[['leadership',/led|managed|mentored|supervised|coached|directed/i],['delivery',/delivered|implemented|executed|launched|deployed|completed/i],['analysis',/analysed|analyzed|assessed|evaluated|investigated|audited|researched|identified|tested/i],['operations',/coordinated|operated|maintained|administered|streamlined|optimised|optimized/i],['customer',/supported|resolved|advised|served|retained|engaged/i],['creation',/designed|developed|created|built|authored|produced/i],['compliance',/complied|ensured compliance|governed|validated|documented|mitigated/i],['performance',/increased|reduced|improved|saved|grew|achieved|generated/i]];
  for(const [tag,re] of patterns)if(re.test(text))responsibilities.push(tag);
  return {industry,industryConfidence:top?.hits?(top.hits>=(second?.hits||0)*1.5?'medium':'low'):'low',industrySignals:scores.filter(x=>x.hits).slice(0,4),responsibilityThemes:responsibilities};
 }
 function validateAiSuggestion(payload,base){
  if(!payload||typeof payload!=='object'||!payload.resume||typeof payload.resume!=='object')throw new Error('AI response did not contain a valid resume object.');
  const incoming=payload.resume,allowed=['name','title','email','phone','location','links','summary','skills','experience','education','skillsGroups','projects','certifications','additionalInformation','customSections'];
  const out=clone(base);
  for(const k of allowed){if(incoming[k]===undefined)continue;if(['experience','education','skillsGroups','projects','certifications','additionalInformation','customSections'].includes(k)){if(!Array.isArray(incoming[k]))throw new Error('AI returned an invalid '+k+' collection.');out[k]=incoming[k].map(x=>({...x,id:typeof x.id==='string'?x.id:uid(k)}));}else if(typeof incoming[k]==='string')out[k]=incoming[k].slice(0,20000);else throw new Error('AI returned an invalid '+k+' field.');}
  // Never let the classifier silently discard source text or fabricate provenance.
  out.additionalInformation=[...(out.additionalInformation||[])];
  return migrate(out,base.metadata?.sourceDocumentId);
 }
 const AI_ENDPOINT_KEY='reze-groq-endpoint-v1';
 const defaultAiEndpoint='';
 function getAiEndpoint(){return (localStorage.getItem(AI_ENDPOINT_KEY)||defaultAiEndpoint).trim().replace(/\/$/,'');}
 async function requestAiClassification(text,base){
  const endpoint=getAiEndpoint();if(!endpoint)throw new Error('Add your Vercel API URL in Settings first.');
  const allowed=['name','title','email','phone','location','links','summary','skills','experience','education','skillsGroups','projects','certifications','additionalInformation','customSections'];
  const browserDraft={};
  for(const key of allowed){
   const value=base?.[key];
   if(typeof value==='string')browserDraft[key]=value.slice(0,12000);
   else if(Array.isArray(value))browserDraft[key]=value.slice(0,60);
  }
  const payload={task:'classify_resume',sourceText:String(text).slice(0,90000),browserDraft,schemaVersion:2};
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},mode:'cors',credentials:'omit',body:JSON.stringify(payload)});
  let body={};try{body=await response.json()}catch(_){}
  if(!response.ok)throw new Error(body.error||('Groq service returned HTTP '+response.status+'.'));
  return validateAiSuggestion(body,base);
 }
 function configureAiSettings(){
  if(typeof document.getElementById!=='function')return;
  const input=document.getElementById('rezeGroqEndpoint'),save=document.getElementById('saveGroqSettings'),test=document.getElementById('testGroq'),status=document.getElementById('groqStatus');
  if(input)input.value=getAiEndpoint();
  save?.addEventListener('click',()=>{try{const u=new URL(input.value.trim());if(!['https:','http:'].includes(u.protocol))throw new Error('Use a valid HTTPS Vercel API URL.');if(location.protocol==='https:'&&u.protocol!=='https:')throw new Error('The API must use HTTPS.');localStorage.setItem(AI_ENDPOINT_KEY,u.origin+u.pathname.replace(/\/$/,''));status.textContent='Vercel API endpoint saved in this browser.';}catch(e){status.textContent=e.message;}});
  test?.addEventListener('click',async()=>{status.textContent='Checking Vercel API…';try{const r=await fetch(getAiEndpoint(),{method:'OPTIONS',mode:'cors'});if(r.ok||r.status===204)status.textContent='Vercel endpoint is reachable. A real POST is tested during an opted-in import.';else status.textContent='Endpoint responded with HTTP '+r.status+'.';}catch(e){status.textContent='Could not reach the endpoint. Check the URL and Vercel CORS settings. '+e.message;}});
 }
 function classify(extracted,sourceId){
  const text=String(extracted.text||'').replace(/\r/g,''),lines=(extracted.lines?.length?extracted.lines:text.split('\n').map(text=>({text,page:null,source:'text'}))).map((x,i)=>({...x,index:i,text:clean(x.text).replace(/\s+/g,' ')})).filter(x=>x.text);
  const d=blank(),evidence={};
  const mark=(field,items,confidence='medium',reason='')=>{evidence[field]={confidence,reason,sources:(items||[]).map(x=>({text:x.text,page:x.page??null,source:x.source||'text'}))};};
  const headingDefs={summary:/^(professional\s+summary|summary|profile|career\s+objective|objective|about\s+me)$/i,experience:/^(professional\s+experience|work\s+experience|employment\s+history|experience|work\s+history|career\s+history)$/i,education:/^(education|academic\s+background|qualifications|academic\s+qualifications)$/i,skills:/^(skills|core\s+technical\s+skills|technical\s+skills|core\s+competencies|competencies|tools\s*(?:&|and)\s*technologies|areas\s+of\s+expertise|technical\s+expertise)$/i,certifications:/^(certifications?|licenses?|professional\s+certifications?|training|courses)$/i,projects:/^(projects?|selected\s+projects|personal\s+projects)$/i};
  const sections={intro:[]};let active='intro';const unknown=[];
  for(const l of lines){const raw=clean(l.text).replace(/[\s:：\-–—]+$/,'').replace(/\s+/g,' ').trim();const key=Object.keys(headingDefs).find(k=>headingDefs[k].test(raw));if(key){active=key;sections[key]??=[];mark('section:'+key,[l],'high','Recognised section heading');continue;}
   // Detect common unambiguous section labels while retaining all content for review.
   if(/^(awards?|honou?rs?|languages?|publications?|volunteer(?:ing)?|interests?|additional information|references|objective|achievements?)\s*:?$/i.test(raw)){active='unknown_'+raw.toLowerCase().replace(/[^a-z]+/g,'_');sections[active]??=[];mark('section:'+active,[l],'medium','Unmapped section heading');continue;}
   (sections[active]??(sections[active]=[])).push(l);
  }
  const emailPattern=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const email=text.match(emailPattern);if(email){d.email=email[0];mark('email',[{text:email[0]}],'high','Email pattern');}
  const phonePattern=/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d[\d\s().-]{7,}\d/g;
  const phoneCandidates=text.match(phonePattern)||[];const phone=phoneCandidates.find(v=>v.replace(/\D/g,'').length>=10&&v.replace(/\D/g,'').length<=15);if(phone){d.phone=phone.trim();mark('phone',[{text:phone}],'medium','Phone number pattern; verify country/extension');}
  const urls=[...text.matchAll(/(?:https?:\/\/|www\.)[^\s)]+/ig)].map(m=>m[0]);if(urls.length){d.links=urls.slice(0,3).join(' | ');mark('links',urls.map(text=>({text})),'high','URL pattern');}
  const intro=(sections.intro||[]).map(x=>({...x,text:clean(x.text).replace(emailPattern,' ').replace(phonePattern,' ').replace(/(?:https?:\/\/|www\.)[^\s)]+/ig,' ').replace(/\s+/g,' ').trim()})).filter(x=>x.text);
  const nameCandidates=intro.filter(x=>x.text.length>=3&&x.text.length<=65&&!/@|https?:\/\//i.test(x.text)&&!/\d{5,}/.test(x.text)&&!/[|•]/.test(x.text));
  const nameLine=nameCandidates.find(x=>/^[A-Z][A-Z .'-]+$/.test(x.text)||x.text.split(/\s+/).length>=2);
  if(nameLine){d.name=nameLine.text.replace(/\s+/g,' ').trim();mark('name',[nameLine],'medium','Likely name line before first section heading');}  const titleLine=intro.find(x=>x!==nameLine&&x.text.length<130&&!/@|https?:\/\//i.test(x.text)&&(/[|]/.test(x.text)||/\b(engineer|analyst|developer|manager|consultant|specialist|professional|designer|administrator|tester|architect)\b/i.test(x.text)));
  if(titleLine){d.title=titleLine.text.replace(/\s*\|\s*/g,' | ');mark('title',[titleLine],'medium','Role/title wording in document header');}
  const summaryLines=sections.summary||[];if(summaryLines.length){d.summary=summaryLines.map(x=>x.text).join('\n');mark('summary',summaryLines,'high','Content located under summary heading');}
  else{const candidates=intro.filter(x=>x!==nameLine&&x!==titleLine&&x.text.length>80);if(candidates.length){d.summary=candidates.map(x=>x.text).join('\n');mark('summary',candidates,'low','Inferred from unlabelled introductory paragraph; review');}}
  // Skills: support colon-delimited lists and two-column PDF skills tables.
  const skillLines=sections.skills||[],groups=[];
  let group=null;
  const normalizeSkillText=value=>clean(value)
    .replace(/\b([A-Z])\s+([a-z]{2,})\b/g,'$1$2')
    .replace(/\b([A-Z])\s+([A-Z]{2,})\b/g,'$1$2')
    .replace(/\s+/g,' ').trim();
  const categoryAliases=[
    ['Cloud Platforms',['Cloud Platforms']],
    ['Infrastructure as Code & Automation',['Infrastructure as Code & Automation','Infrastructure as Code']],
    ['Containers & Orchestration',['Containers & Orchestration','Containers &']],
    ['CI/CD, SCM & GitOps',['CI/CD, SCM & GitOps','CI/CD, SCM &']],
    ['Monitoring & Alerting',['Monitoring & Alerting','Monitoring']],
    ['Security & DevSecOps',['Security & DevSecOps','Security &']],
    ['Networking & DNS',['Networking & DNS','Networking &']],
    ['Application & Backend Technologies',['Application & Backend Technologies','Application &']],
    ['Messaging, Caching & Databases',['Messaging, Caching & Databases','Messaging, Caching &']],
    ['Platform & Production Operations',['Platform & Production Operations','Platform &']]
  ];
  const wrappedCategoryContinuations=[
    {match:/^&\s*Automation\b/i,from:/^Infrastructure as Code(?:\s*&\s*Automation)?$/i,to:'Infrastructure as Code & Automation'},
    {match:/^Orchestration\b/i,from:/^Containers\s*(?:&\s*(?:Orchestration)?)?$/i,to:'Containers & Orchestration'},
    {match:/^GitOps\b/i,from:/^CI\/CD,\s*SCM\s*(?:&\s*(?:GitOps)?)?$/i,to:'CI/CD, SCM & GitOps'},
    {match:/^&\s*Alerting\b/i,from:/^Monitoring(?:\s*&\s*Alerting)?$/i,to:'Monitoring & Alerting'},
    {match:/^DevSecOps\b/i,from:/^Security\s*(?:&\s*(?:DevSecOps)?)?$/i,to:'Security & DevSecOps'},
    {match:/^&\s*DNS\b/i,from:/^Networking(?:\s*&\s*DNS)?$/i,to:'Networking & DNS'},
    {match:/^Backend Technologies\b/i,from:/^Application\s*(?:&\s*(?:Backend Technologies)?)?$/i,to:'Application & Backend Technologies'},
    {match:/^Databases\b/i,from:/^Messaging,\s*Caching\s*(?:&\s*(?:Databases)?)?$/i,to:'Messaging, Caching & Databases'},
    {match:/^Production Operations\b/i,from:/^Platform\s*(?:&\s*(?:Production Operations)?)?$/i,to:'Platform & Production Operations'}
  ];
  const appendSkillText=value=>{const v=normalizeSkillText(value);if(!v)return;if(!group)group={id:uid('skill'),heading:'Technical Skills',description:v};else group.description+=(group.description?' ':'')+v;};
  for(const l of skillLines){
    let t=normalizeSkillText(l.text.replace(/^[•·▪-]\s*/,''));if(!t||/^category\s*:?[ \t]*skills?$/i.test(t))continue;
    const colon=t.match(/^([^:：]{2,65})[:：]\s*(.*)$/);
    const left=colon?normalizeSkillText(colon[1]):t;
    const right=colon?normalizeSkillText(colon[2]):'';
    const continuation=wrappedCategoryContinuations.find(x=>group&&x.from.test(group.heading)&&x.match.test(left));
    if(continuation){
      group.heading=continuation.to;
      if(right)appendSkillText(right);
      else appendSkillText(t.replace(continuation.match,''));
      continue;
    }
    const category=categoryAliases.find(([,aliases])=>aliases.some(alias=>left.toLowerCase()===alias.toLowerCase()||left.toLowerCase().startsWith(alias.toLowerCase()+' ')));
    if(category){
      const alias=category[1].sort((a,b)=>b.length-a.length).find(a=>left.toLowerCase()===a.toLowerCase()||left.toLowerCase().startsWith(a.toLowerCase()+' '));
      let remainder=left.slice(alias.length).trim();
      if(remainder&&right)remainder+=' '+right;else if(right)remainder=right;
      if(group)groups.push(group);
      group={id:uid('skill'),heading:category[0],description:remainder};
      continue;
    }
    if(colon){
      if(group)groups.push(group);
      group={id:uid('skill'),heading:left,description:right};
      continue;
    }
    appendSkillText(t);
  }
  if(group)groups.push(group);
  d.skillsGroups=groups;
  d.skills=groups.map(g=>[g.heading,g.description].filter(Boolean).join(': ')).join('; ');
  if(skillLines.length)mark('skillsGroups',skillLines,groups.some(g=>g.heading==='Technical Skills')?'medium':'high','Parsed colon-delimited skill groups and paired PDF table rows; verify any wrapped category labels');
  const dateRe=/(\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.]?\s+\d{4}|\b(?:19|20)\d{2}\b)\s*(?:[-–—]|\bto\b)\s*(Present|Current|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.]?\s+\d{4}|\b(?:19|20)\d{2}\b)?/i;
  const isBullet=s=>/^[•·▪◦*-]\s*/.test(s);const stripBullet=s=>s.replace(/^[•·▪◦*-]\s*/,'').trim();
  const parseExperience=arr=>{
   const hasLabeledProjects=arr.some(l=>/^\s*Project\s*:/i.test(l.text))&&arr.some(l=>/^\s*Role\s*:/i.test(l.text));
   if(hasLabeledProjects){
    const out=[];let cur=null;
    const ensure=()=>{if(!cur)cur={id:uid('exp'),role:'',company:'',start:'',end:'',details:''};return cur;};
    const addDetail=(label,value)=>{const v=clean(value);if(v)ensure().details+=(ensure().details?'\n':'')+(label==='•'?'• ':label?label+': ':'')+v;};
    const flush=()=>{if(cur&&(cur.role||cur.company||cur.details))out.push(cur);cur=null;};
    for(const l of arr){
     const raw=clean(l.text);if(!raw)continue;
     const project=raw.match(/^Project\s*:\s*-?\s*(.*)$/i);
     if(project){
      flush();cur={id:uid('exp'),role:'',company:'',start:'',end:'',details:''};
      const title=clean(project[1]);const date=title.match(dateRe);
      if(date){cur.start=date[1]||'';cur.end=date[2]||'';}
      const projectName=clean(title.replace(date?.[0]||'','').replace(/[|,–—-]+$/,''));
      addDetail('Project',projectName);
      continue;
     }
     const roleLine=raw.match(/^Role\s*:\s*-?\s*(.*)$/i);
     if(roleLine){
      const roleText=stripBullet(roleLine[1]);const parts=roleText.split(/\s*[|｜]\s*/).map(clean).filter(Boolean);
      ensure();
      if(parts.length>=2){cur.role=parts[0];cur.company=parts.slice(1).join(' | ');}
      else cur.role=roleText;
      continue;
     }
     const technologies=raw.match(/^Technologies?\s+Used\s*:\s*(.*)$/i);
     if(technologies){
      let value=technologies[1];const responsibilityIndex=value.search(/\s+Responsibilities\s*:\s*-?\s*/i);
      let responsibilityText='';
      if(responsibilityIndex>=0){const marker=value.match(/\s+Responsibilities\s*:\s*-?\s*/i);responsibilityText=value.slice(responsibilityIndex+(marker?.[0].length||0));value=value.slice(0,responsibilityIndex);}
      addDetail('Technologies',value);
      if(responsibilityText)addDetail('',stripBullet(responsibilityText));
      continue;
     }
     const responsibility=raw.match(/^Responsibilities\s*:\s*-?\s*(.*)$/i);
     if(responsibility){if(responsibility[1])addDetail('',stripBullet(responsibility[1]));continue;}
     const item=stripBullet(raw);
     if(item)addDetail(isBullet(raw)?'•':'',item);
    }
    flush();return out;
   }
   const out=[];let cur=null;const flush=()=>{if(cur&&(cur.role||cur.company||cur.details))out.push(cur);cur=null;};
   for(const l of arr){let t=stripBullet(l.text);if(!t)continue;const date=t.match(dateRe);const hasSep=/\s[|｜]\s/.test(t);const headerLike=!isBullet(l.text)&&t.length<220&&(hasSep||!!date||(/^[A-Z][A-Z0-9 &.,'()-]{4,}$/.test(t)&&!/[.!?]$/.test(t)));
    if(headerLike){flush();let parts=t.split(/\s*[|｜]\s*/).map(clean).filter(Boolean);let company='',role='',start='',end='';
     const dm=t.match(dateRe);if(dm){start=dm[1]||'';end=dm[2]||'';}
     if(parts.length>=2){company=parts[0];role=parts.slice(1).join(' | ').replace(dm?.[0]||'','').trim().replace(/[|｜,–—-]+$/,'').trim();}
     else{role=t.replace(dm?.[0]||'','').trim();}
     cur={id:uid('exp'),role,company,start,end,details:''};continue;
    }
    if(!cur){cur={id:uid('exp'),role:'',company:'',start:'',end:'',details:''};}
    if(date&&!cur.start){cur.start=date[1]||'';cur.end=date[2]||'';t=t.replace(date[0],'').replace(/[|,–—-]+$/,'').trim();}
    if(t){if(!cur.role&&!isBullet(l.text)&&t.length<100){cur.role=t;}else if(isBullet(l.text)){cur.details+=(cur.details?'\n':'')+'• '+t;}else{cur.details+=(cur.details?' ':'')+t;}}
   }flush();return out;
  };
  const expLines=sections.experience||[];d.experience=parseExperience(expLines);if(d.experience.length)mark('experience',expLines,d.experience.every(x=>x.company&&x.role)?'high':'medium','Grouped headers and following bullet/paragraph lines; verify ambiguous employer/title splits');
  // Education entries are often one or two lines with degree — institution | date.
  const eduLines=sections.education||[];let edu=[];for(let i=0;i<eduLines.length;i++){const l=eduLines[i],t=stripBullet(l.text);if(!t)continue;const date=t.match(dateRe)||t.match(/((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.]?\s+\d{4}|\b(?:19|20)\d{2}\b)/i);const withoutDate=t.replace(date?.[0]||'','').trim().replace(/[|｜,–—-]+$/,'').trim();const parts=withoutDate.split(/\s*[|｜]\s*|\s+[-–—]\s+/).map(clean).filter(Boolean);let role=parts[0]||withoutDate,company=parts.slice(1).join(' — '),details='';if(!company&&i+1<eduLines.length&&!date&&eduLines[i+1].text.length<110){company=stripBullet(eduLines[++i].text);}edu.push({id:uid('edu'),role,company,start:date?.[1]||'',end:date?.[2]||'',details});}d.education=edu;if(edu.length)mark('education',eduLines,'medium','Degree/institution split from separators and adjacent lines; verify dates');
  const certLines=sections.certifications||[];d.certifications=certLines.map(l=>({id:uid('cert'),name:stripBullet(l.text),details:''})).filter(x=>x.name);if(d.certifications.length)mark('certifications',certLines,'medium','Located under certification heading');
  const projectLines=sections.projects||[];let projects=[];for(const l of projectLines){const t=stripBullet(l.text);if(!t)continue;if(isBullet(l.text)&&projects.length)projects[projects.length-1].description+=(projects[projects.length-1].description?'\n':'')+t;else projects.push({id:uid('project'),name:t,description:''});}d.projects=projects;if(projects.length)mark('projects',projectLines,'medium','Located under projects heading');
  const recognised=new Set(['intro','summary','experience','education','skills','certifications','projects']);
  for(const k of Object.keys(sections)){if(!recognised.has(k)){const rows=sections[k]||[];unknown.push(...rows.map(x=>({...x,section:k.replace(/^unknown_/,'').replace(/_/g,' ')})));}}
  if(unknown.length){d.additionalInformation=unknown.map(x=>({id:uid('info'),title:x.section||'Additional Information',content:x.text,sourcePage:x.page??null}));d.customSections.push({id:uid('section'),title:'Additional Information',body:unknown.map(x=>x.text).join('\n'),visible:true});mark('additionalInformation',unknown,'low','Preserved unclassified content for manual review');}
  d.extras=[...d.projects.map(x=>({type:'Project',name:x.name,details:x.description})),...d.certifications.map(x=>({type:'Certification',name:x.name,details:x.details}))];d.metadata.sourceDocumentId=sourceId;d.metadata.professionalContext=inferProfessionalContext(text);d.provenance=evidence;
  const ctx=d.metadata.professionalContext;mark('professionalContext',lines,ctx.industryConfidence,'Industry inferred from document terminology; general is used when signals are insufficient.');
  const missing=['name','title','email','phone','summary','experience','education','skillsGroups'].filter(k=>Array.isArray(d[k])?!d[k].length:!clean(d[k]));
  return {data:migrate(d,sourceId),evidence,unknownCount:unknown.length,missingFields:missing,quality:{detectedFields:Object.keys(evidence).length,missingFields:missing,needsReview:Object.values(evidence).filter(x=>x.confidence!=='high').length}};
 }
 function ensureReviewStyles(){
  if($('#rezeImportReviewStyles'))return;
  const st=document.createElement('style');st.id='rezeImportReviewStyles';st.textContent=`
  .reze-review-backdrop{position:fixed;inset:0;z-index:99999;background:#090710d9;backdrop-filter:blur(14px);display:grid;place-items:center;padding:18px}
  .reze-review{width:min(1100px,96vw);max-height:92vh;overflow:auto;background:#1b1628;color:#f5f1ff;border:1px solid #65518c;border-radius:22px;padding:24px;box-shadow:0 30px 100px #0009}
  .reze-review h2{margin:0 0 6px;font-size:24px}.reze-review p{color:#c7bddb}.reze-review textarea{width:100%;min-height:300px;background:#100d19;color:#f5f1ff;border:1px solid #55456f;border-radius:12px;padding:14px;font:13px/1.55 ui-monospace,monospace;resize:vertical}
  .reze-review .rr-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0}.reze-review label{font-size:13px;color:#ded5f0}.reze-review select{background:#100d19;color:#fff;border:1px solid #66548b;border-radius:9px;padding:9px}.reze-review button{border:1px solid #7964a2;border-radius:10px;padding:10px 15px;background:#302344;color:#fff;cursor:pointer}.reze-review button.primary{background:#b9a4ff;color:#171222;border-color:#b9a4ff;font-weight:700}.reze-review button:disabled{opacity:.45;cursor:not-allowed}.reze-review .rr-status{font-size:12px;color:#c7b4ff}.reze-review .rr-conflicts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.reze-review .rr-conflict{padding:10px;border:1px solid #514267;border-radius:10px}.reze-review .rr-warning{color:#f4c78a}.rr-evidence-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:7px;margin:12px 0}.rr-evidence{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;border:1px solid #514267;border-radius:9px;font-size:12px}.rr-evidence b{text-transform:capitalize}.rr-high{color:#8fe0b3}.rr-medium{color:#f2d18b}.rr-low{color:#ffadad}.rr-raw-data{margin:12px 0}.rr-raw-data summary{cursor:pointer;color:#c7b4ff;font-size:13px;padding:8px 0}.rr-raw-data textarea{margin-top:8px}
  `;
  document.head.appendChild(st);
 }
 function showReview({data,evidence,warning,quality,originalText,file,record}){
  ensureReviewStyles();
  return new Promise(resolve=>{
   const active=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}})();
   const backdrop=document.createElement('div');backdrop.className='reze-review-backdrop';
   const status=warning?`<p class="rr-warning">${esc(warning)}</p>`:'';
   backdrop.innerHTML=`<section class="reze-review" role="dialog" aria-modal="true" aria-labelledby="rrTitle">
    <div class="rr-row" style="justify-content:space-between"><div><div class="eyebrow">REZE · IMPORT REVIEW</div><h2 id="rrTitle">Review extracted resume data</h2><p>${esc(file.name)} · Original document remains stored separately and unchanged.</p></div><span class="rr-status">${Object.keys(evidence||{}).length} fields/sections detected · ${quality?.missingFields?.length||0} missing · ${quality?.needsReview||0} need review</span></div>
    ${status}<p>REZE has prepared an editable resume draft. High-confidence fields can be used immediately; check uncertain fields and missing information before approval. Original content remains available separately.</p><div class="rr-row"><span class="rr-status">Missing: ${esc((quality?.missingFields||[]).join(', ')||'None detected')}</span><span class="rr-status">Low confidence: ${esc(String(quality?.needsReview||0))}</span></div>
    <div class="rr-evidence-grid">${Object.entries(evidence||{}).map(([field,item])=>`<div class="rr-evidence"><span>${esc(field.replace(/^section:/,''))}</span><b class="rr-${esc(item.confidence||'low')}">${esc(item.confidence||'unknown')}</b></div>`).join('')||'<span class="rr-status">No field evidence available.</span>'}</div>
    <details class="rr-raw-data"><summary>Advanced: inspect or edit structured resume data</summary><textarea id="rrJson" spellcheck="false" aria-label="Extracted resume data">${esc(JSON.stringify(data,null,2))}</textarea></details>
    <div class="rr-row"><label>Resume template <select id="rrTemplate"><option value="modern">Modern</option><option value="classic">Classic</option><option value="minimal">Minimal</option><option value="technical">Technical</option><option value="executive">Executive</option><option value="compact">Compact</option><option value="creative">Creative</option></select></label><label>Import destination <select id="rrDestination"><option value="new">Create a new resume</option><option value="merge">Merge into the currently open resume</option></select></label><label><input id="rrAiConsent" type="checkbox"> I consent to send the extracted text (not the original file) to REZE’s configured Vercel server and Groq for AI-assisted classification for this import.</label><button type="button" id="rrAiAnalyse">Analyse with Groq AI</button><span id="rrAiStatus" class="rr-status">Hybrid mode: browser rules are already applied. Groq can improve ambiguous mappings; manual approval is still required.</span></div>
    <div class="rr-row"><div id="rrTemplatePreview" class="rr-status">Template mapping preview will appear here.</div></div><div id="rrConflictPanel" hidden><p><b>Resolve top-level field conflicts</b> — choose which version to keep for each populated field.</p><div class="rr-conflicts" id="rrConflicts"></div><p class="rr-warning">Repeating entries will be added as separate entries; possible duplicates are not merged automatically.</p></div>
    <div class="rr-row" style="justify-content:space-between"><span class="rr-status">Nothing is applied until you approve this review.</span><div class="rr-row" style="margin:0"><button type="button" id="rrCancel">Cancel import</button><button type="button" class="primary" id="rrApprove">Approve & import</button></div></div>
   </section>`;
   document.body.appendChild(backdrop);
   const json=$('#rrJson',backdrop),dest=$('#rrDestination',backdrop),panel=$('#rrConflictPanel',backdrop),conflicts=$('#rrConflicts',backdrop),template=$('#rrTemplate',backdrop),templatePreview=$('#rrTemplatePreview',backdrop);
   template.value=data.template||'modern';
   const refreshTemplate=()=>{let v;try{v=JSON.parse(json.value)}catch{templatePreview.textContent='Correct the JSON to preview template mapping.';return}const fields=registry[template.value]||registry.modern;const mapped=fields.filter(path=>{const key=path.replace('[]','').split('.').pop();if(path.includes('[]'))return Array.isArray(v[path.split('.')[0]])&&v[path.split('.')[0]].length>0;return !!String(v[key]??'').trim()});templatePreview.textContent=`${template.options[template.selectedIndex].text} template · ${mapped.length} of ${fields.length} placeholder groups currently populated. Empty fields remain blank.`;};
   template.addEventListener('change',refreshTemplate);json.addEventListener('input',refreshTemplate);refreshTemplate();
   const aiConsent=$('#rrAiConsent',backdrop),aiButton=$('#rrAiAnalyse',backdrop),aiStatus=$('#rrAiStatus',backdrop);
   if(aiButton)aiButton.addEventListener('click',async()=>{
    if(!aiConsent?.checked){aiStatus.textContent='Please provide consent for this import before sending resume text.';return;}
    aiButton.disabled=true;aiStatus.textContent='Sending extracted text to the configured Vercel API and Groq…';
    try{const current=getImported();const suggested=await requestAiClassification(originalText,current);json.value=JSON.stringify(suggested,null,2);refreshTemplate();aiStatus.textContent='Groq suggestions received. Review every field and approve manually; nothing has been applied.';}
    catch(err){aiStatus.textContent='Groq classification failed: '+err.message+' Your browser rules-based draft is unchanged and can still be approved.';}
    finally{aiButton.disabled=false;}
   });
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
  const approved=await showReview({data:result.data,evidence:result.evidence,quality:result.quality,warning:extracted.warning||'',originalText:extracted.text,file,record});
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
 window.REZEImportEngine={importFile,registry,migrate,classify,inferProfessionalContext,requestAiClassification};
 configureAiSettings();
 migrateStoredResumes();
})();
