/* REZE AI Assistant + Sample Resume Library
   Vanilla JavaScript enhancement layer. Sample generation is local and never uses imported files.
*/
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const RESUME_KEY = 'reze-js-resume-v1';
  const LIBRARY_KEY = 'reze-v2-resume-library-v1';
  const ACTIVE_KEY = 'reze-v2-active-resume-id';
  const ENDPOINT_KEY = 'reze-ai-endpoint-v1';
  const CONTEXT_KEY = 'reze-ai-context-consent-v1';
  const GENERATED_KEY = 'reze-generated-samples-v1';
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = v => String(v ?? '').trim();
  const core = () => window.REZECore;
  const currentData = () => core()?.getData?.() || {};
  const stamp = () => new Date().toISOString();
  const randomId = prefix => prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
  const blankResume = template => ({
    name:'',title:'',email:'',phone:'',location:'',links:'',summary:'',skills:'',
    experience:[],education:[],extras:[],skillsGroups:[],customSections:[],previewHtmlOverride:'',
    sectionOrder:['summary','experience','education','skills','extras'],hiddenSections:[],
    template:template?.legacy || 'modern',rezeTemplateId:template?.id || 'reze-minimal',accent:'#b9a4ff'
  });

  /* --------------------------- Template catalogue --------------------------- */
  const templates = [
    {id:'harvard-classic',name:'Harvard Classic',style:'Professional',category:'ats',layout:'Single column',legacy:'classic',tags:['classic','formal','corporate']},
    {id:'reze-minimal',name:'REZE Minimal',style:'Minimalist',category:'ats',layout:'Single column',legacy:'minimal',tags:['minimal','modern','clean']},
    {id:'professional-sidebar',name:'Professional Sidebar',style:'Professional',category:'visual',layout:'Two column',legacy:'executive',tags:['sidebar','corporate','skills']},
    {id:'executive-elite',name:'Executive Elite',style:'Executive',category:'visual',layout:'Editorial',legacy:'executive',tags:['leadership','senior','executive']},
    {id:'tech-forward',name:'Tech Forward',style:'Technical',category:'ats',layout:'Single column',legacy:'technical',tags:['technology','developer','cybersecurity']},
    {id:'creative-studio',name:'Creative Studio',style:'Creative',category:'visual',layout:'Expressive',legacy:'creative',tags:['portfolio','design','creative']},
    {id:'fresher-first',name:'Fresher First',style:'Graduate',category:'ats',layout:'Education first',legacy:'modern',tags:['student','graduate','fresher']},
    {id:'academic-pro',name:'Academic Pro',style:'Academic',category:'ats',layout:'Research focused',legacy:'classic',tags:['research','publication','academic']},
    {id:'clinical-pro',name:'Clinical Professional',style:'Clinical',category:'ats',layout:'Credentials first',legacy:'modern',tags:['healthcare','clinical','credentials']},
    {id:'compact-pro',name:'Compact Pro',style:'Compact',category:'ats',layout:'Space efficient',legacy:'compact',tags:['compact','dense','experienced']}
  ];
  const templateById = id => templates.find(t => t.id === id) || templates[1];
  let selectedTemplate = templateById('harvard-classic');
  const styleClass = id => 'reze-style-' + (id || 'reze-minimal');
  const decoratePaper = (el, id) => {
    if (!el) return;
    templates.forEach(t => el.classList.remove(styleClass(t.id)));
    el.classList.add(styleClass(id || 'reze-minimal'));
    el.dataset.rezeTemplate = id || 'reze-minimal';
  };
  const names = ['Jordan Avery','Morgan Ellis','Taylor Brooks','Riley Bennett','Cameron Hayes','Casey Morgan','Avery Parker','Jamie Quinn','Drew Lawson','Skyler Reed','Rowan Blake','Alex Harper'];
  const fictionalCompanies = ['FablePoint Demo Systems','Cedarbridge Example Group','ExampleWorks Studio','Mockup Meridian Labs','DemoNorth Practice Co.','SamplePath Solutions','Fictional Horizon Works'];
  const fictionalSchools = ['Westbridge Example University','Sample Technical Institute','Cedar Valley Demo College','Northstar Fictional Academy','Example State University'];
  const locations = ['Austin, TX · Fictional sample','Toronto, ON · Fictional sample','Dublin, IE · Fictional sample','Remote · Fictional sample','Hyderabad, IN · Fictional sample','Singapore · Fictional sample'];
  const levelList = [
    {id:'fresher',label:'Fresher',experience:'0–1 years'},
    {id:'mid',label:'Mid-level',experience:'3–5 years'},
    {id:'senior',label:'Senior',experience:'7–10 years'}
  ];
  const industries = [
    {id:'software-it',name:'Software & IT',roles:['Software Engineer','QA Engineer','DevOps Engineer'],skills:['JavaScript','Python','REST APIs','Git','SQL','Automated testing','CI/CD','Cloud fundamentals'],field:'Computer Science',project:'Service Reliability Demo'},
    {id:'cybersecurity',name:'Cybersecurity',roles:['Cybersecurity Analyst','Penetration Tester','Security Engineer'],skills:['Vulnerability assessment','OWASP Top 10','Nmap','Burp Suite','Linux','SIEM fundamentals','Risk assessment','Security reporting'],field:'Information Security',project:'Web Security Assessment Lab'},
    {id:'data-analytics',name:'Data & Analytics',roles:['Data Analyst','Data Scientist','BI Developer'],skills:['SQL','Python','Power BI','Data visualization','Statistics','Excel','Data cleaning','Dashboard design'],field:'Data Analytics',project:'Business Insights Dashboard'},
    {id:'business-operations',name:'Business & Operations',roles:['Business Analyst','Operations Manager','Process Analyst'],skills:['Process mapping','Requirements gathering','Excel','Stakeholder management','Reporting','Documentation','KPI tracking','Continuous improvement'],field:'Business Administration',project:'Workflow Improvement Study'},
    {id:'finance-accounting',name:'Finance & Accounting',roles:['Financial Analyst','Accountant','Auditor'],skills:['Financial reporting','Excel','Budgeting','Reconciliation','Variance analysis','Forecasting','Internal controls','Documentation'],field:'Finance and Accounting',project:'Financial Planning Case Study'},
    {id:'marketing-sales',name:'Marketing & Sales',roles:['Digital Marketing Specialist','Sales Executive','Marketing Manager'],skills:['Campaign planning','CRM','Content strategy','Market research','Lead qualification','Analytics','Communication','Presentation'],field:'Marketing',project:'Integrated Campaign Plan'},
    {id:'project-product',name:'Project & Product',roles:['Project Manager','Product Manager','Scrum Master'],skills:['Agile delivery','Roadmapping','User stories','Risk management','Stakeholder updates','Jira','Prioritization','Retrospectives'],field:'Project Management',project:'Product Delivery Roadmap'},
    {id:'hr-administration',name:'HR & Administration',roles:['HR Generalist','Talent Acquisition Specialist','HR Manager'],skills:['Recruitment coordination','HR operations','Employee relations','Onboarding','HRIS','Policy documentation','Interview scheduling','Confidential records'],field:'Human Resources',project:'Candidate Experience Improvement'},
    {id:'healthcare-life-sciences',name:'Healthcare & Life Sciences',roles:['Healthcare Administrator','Registered Nurse','Medical Laboratory Scientist'],skills:['Patient coordination','Clinical documentation','Quality procedures','Safety protocols','Team communication','Record management','Quality assurance','Procedure compliance'],field:'Health Sciences',project:'Patient Flow Improvement'},
    {id:'education-training',name:'Education & Training',roles:['Teacher','Instructional Designer','Corporate Trainer'],skills:['Lesson planning','Curriculum design','Learning assessment','Facilitation','Learning technology','Student support','Content development','Feedback'],field:'Education',project:'Blended Learning Module'},
    {id:'design-creative',name:'Design & Creative',roles:['UI/UX Designer','Graphic Designer','Motion Designer'],skills:['Figma','User research','Wireframing','Prototyping','Visual design','Design systems','Accessibility','Creative direction'],field:'Visual Communication',project:'Digital Product Redesign'},
    {id:'engineering-manufacturing',name:'Engineering & Manufacturing',roles:['Mechanical Engineer','Manufacturing Engineer','Quality Manager'],skills:['CAD','Process optimization','Root cause analysis','Quality control','Technical drawings','Safety standards','Production planning','Documentation'],field:'Mechanical Engineering',project:'Production Efficiency Study'},
    {id:'customer-support-bpo',name:'Customer Support & BPO',roles:['Customer Support Associate','Process Lead','Customer Experience Manager'],skills:['Customer communication','Case management','SLA tracking','Quality monitoring','Knowledge base','Escalation handling','Process documentation','Coaching'],field:'Business Operations',project:'Customer Resolution Playbook'},
    {id:'legal-compliance',name:'Legal & Compliance',roles:['Legal Associate','Compliance Analyst','Privacy Officer'],skills:['Legal research','Policy review','Regulatory tracking','Contract administration','Risk assessment','Case documentation','Privacy principles','Attention to detail'],field:'Legal Studies',project:'Compliance Control Review'},
    {id:'hospitality-travel',name:'Hospitality & Travel',roles:['Hotel Operations Associate','Travel Consultant','Hotel Manager'],skills:['Guest relations','Reservation systems','Service recovery','Travel planning','Team scheduling','Vendor coordination','Service standards','Operations reporting'],field:'Hospitality Management',project:'Guest Experience Improvement'},
    {id:'supply-chain-logistics',name:'Supply Chain & Logistics',roles:['Logistics Coordinator','Supply Chain Analyst','Logistics Manager'],skills:['Inventory control','Demand planning','Vendor coordination','Excel','Shipment tracking','Warehouse operations','Reporting','Process optimization'],field:'Supply Chain Management',project:'Inventory Visibility Dashboard'},
    {id:'construction-real-estate',name:'Construction & Real Estate',roles:['Civil Engineer','Site Engineer','Project Director'],skills:['Project scheduling','Site coordination','Cost tracking','Safety compliance','Quantity estimation','Technical drawings','Contractor management','Progress reporting'],field:'Civil Engineering',project:'Site Progress Control Plan'},
    {id:'science-research',name:'Science & Research',roles:['Research Assistant','Research Scientist','Principal Scientist'],skills:['Research methods','Data analysis','Lab documentation','Literature review','Experimental design','Quality protocols','Scientific writing','Presentation'],field:'Applied Science',project:'Experimental Methods Study'},
    {id:'public-sector-nonprofit',name:'Public Sector & Nonprofit',roles:['Program Coordinator','Policy Analyst','Program Director'],skills:['Program coordination','Policy research','Community engagement','Grant reporting','Monitoring and evaluation','Public communication','Budget tracking','Stakeholder relations'],field:'Public Policy',project:'Community Outcomes Review'},
    {id:'media-communications',name:'Media & Communications',roles:['Content Writer','Public Relations Specialist','Communications Manager'],skills:['Editorial planning','Copywriting','Media relations','Storytelling','Content management','Research','Brand voice','Campaign reporting'],field:'Communications',project:'Editorial Content Series'},
    {id:'retail-ecommerce',name:'Retail & E-commerce',roles:['E-commerce Specialist','Merchandising Analyst','Retail Operations Manager'],skills:['Product listings','Merchandising','Inventory reporting','Conversion analysis','Customer experience','Marketplace operations','Excel','Campaign coordination'],field:'Retail Management',project:'Online Store Optimization'},
    {id:'skilled-trades-field-services',name:'Skilled Trades & Field Services',roles:['Electrical Technician','Field Service Technician','Maintenance Supervisor'],skills:['Preventive maintenance','Fault diagnosis','Safety procedures','Work orders','Equipment inspection','Technical documentation','Customer communication','Quality checks'],field:'Electrical Engineering Technology',project:'Preventive Maintenance Plan'}
  ];
  const industryById = id => industries.find(x => x.id === id) || industries[0];
  function seededRandom(seed) {
    let h = 2166136261;
    const s = String(seed);
    for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h,16777619); }
    return () => { h += 0x6D2B79F5; let t=h; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
  }
  const pick = (list,rng) => list[Math.floor(rng()*list.length)];
  function sampleDetails(role,industry,level) {
    const domain=industry.name.toLowerCase();
    if(level==='fresher') return [
      'Supported a supervised ' + domain + ' workflow and maintained clear task documentation.',
      'Completed a practical project involving ' + industry.project.toLowerCase() + ' and presented the approach to peers.',
      'Collaborated with a small project team, incorporated feedback and tracked deliverables to completion.'
    ];
    if(level==='senior') return [
      'Led cross-functional planning for ' + domain + ' initiatives and aligned delivery with agreed priorities.',
      'Introduced a repeatable review process that improved handoffs, documentation quality and accountability.',
      'Coached team members, reviewed complex work and communicated risks and options to senior stakeholders.'
    ];
    return [
      'Delivered day-to-day ' + domain + ' work and documented decisions, outcomes and follow-up actions.',
      'Partnered with colleagues to resolve issues, improve handoffs and keep work aligned with team standards.',
      'Prepared concise reports and recommendations to support operational and project decisions.'
    ];
  }
  function makeProfile(industryId,role,levelId,seed,customId) {
    const industry=industryById(industryId);
    const level=levelList.find(x=>x.id===levelId)||levelList[1];
    const rng=seededRandom(seed);
    const fullName=pick(names,rng);
    const parts=fullName.toLowerCase().split(' ');
    const email=parts[0]+'.'+parts[1]+'@example.com';
    const company=pick(fictionalCompanies,rng);
    const previousCompany=pick(fictionalCompanies.filter(x=>x!==company),rng);
    const school=pick(fictionalSchools,rng);
    const skills=[...industry.skills].sort(()=>rng()-.5).slice(0,7);
    const details=sampleDetails(role,industry,level.id).join('\n');
    let experience=[],education=[],extras=[];
    if(level.id==='fresher') {
      experience=[{role:role+' Intern',company:company,start:'Jun 2025',end:'Aug 2025',details:'Assisted with supervised ' + industry.name.toLowerCase() + ' tasks and maintained clear project notes.\nContributed to a guided team assignment and presented the completed work.\nApplied feedback to improve the final deliverable.'}];
      extras=[{type:'Academic Project',name:industry.project,details:'A fictional portfolio project demonstrating foundational ' + industry.name.toLowerCase() + ' methods.'}];
    } else if(level.id==='mid') {
      experience=[
        {role:role,company:company,start:'2023',end:'Present',details:details},
        {role:'Associate '+role,company:previousCompany,start:'2021',end:'2023',details:'Supported team delivery, maintained working documentation and resolved assigned tasks.\nWorked with internal stakeholders to clarify requirements and track open items.'}
      ];
      extras=[{type:'Project',name:industry.project,details:'A fictional work sample focused on process quality, clear reporting and practical outcomes.'}];
    } else {
      experience=[
        {role:'Senior '+role,company:company,start:'2021',end:'Present',details:details},
        {role:role,company:previousCompany,start:'2017',end:'2021',details:'Coordinated complex assignments, supported quality reviews and helped standardize team practices.\nShared knowledge with peers and kept stakeholders informed about delivery risks.'}
      ];
      extras=[{type:'Selected Initiative',name:'Team Practice and Quality Framework',details:'A fictional leadership example illustrating planning, coaching and continuous improvement.'}];
    }
    education=[{role:'Bachelor of Science in '+industry.field,company:school,start:'2017',end:'2021',details:'Fictional sample education'}];
    return {
      name:fullName,title:role,email:email,phone:'+1 202-555-01'+String(Math.floor(10+rng()*89)),
      location:pick(locations,rng),links:'portfolio.example.com/'+parts[0],
      summary:level.id==='fresher'
        ? 'Emerging '+role.toLowerCase()+' with a foundation in '+industry.skills.slice(0,3).join(', ')+'. Brings hands-on academic project experience, curiosity and a structured approach to learning.'
        : level.id==='senior'
          ? 'Experienced '+role.toLowerCase()+' with '+level.experience+' of experience guiding teams, improving working practices and delivering reliable outcomes across '+industry.name.toLowerCase()+'. Focused on clear communication, sound judgement and measurable team progress.'
          : 'Detail-oriented '+role.toLowerCase()+' with '+level.experience+' of experience contributing to '+industry.name.toLowerCase()+' projects. Skilled in '+industry.skills.slice(0,4).join(', ')+', collaboration and practical problem solving.',
      skills:'',skillsGroups:[{heading:'Core Skills',description:skills.join(' · ')}],
      experience:experience,education:education,extras:extras,customSections:[],
      sectionOrder:['summary','experience','education','skills','extras'],hiddenSections:[],
      template:'modern',rezeTemplateId:'harvard-classic',accent:'#b9a4ff',
      sampleMeta:{industryId:industry.id,industry:industry.name,role:role,levelId:level.id,level:level.label,seed:String(seed),sampleId:customId||('starter-'+industry.id+'-'+level.id)}
    };
  }
  const initialSamples = [];
  industries.forEach((industry,i)=>levelList.forEach((level,j)=>initialSamples.push(makeProfile(industry.id,industry.roles[0],level.id,'starter-'+i+'-'+j))));
  function readGenerated() { try { const v=JSON.parse(localStorage.getItem(GENERATED_KEY)||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } }
  function saveGenerated(list) { try { localStorage.setItem(GENERATED_KEY,JSON.stringify(list.slice(-80))); } catch(e) { console.warn('Could not save generated sample catalogue',e); } }
  let generatedSamples=readGenerated();
  let allSamples=initialSamples.concat(generatedSamples);
  let selectedSample=null;
  let selectedSampleTemplate='harvard-classic';
  let sampleContextReady=false;

  function resumeHTML(d) {
    const contacts=[d.email,d.phone,d.location,d.links].filter(Boolean).map(safe).join(' &nbsp;·&nbsp; ');
    const experience=(d.experience||[]).map(x =>
      '<div class="item-head"><span>'+safe(x.role)+'</span><span>'+safe([x.start,x.end].filter(Boolean).join(' – '))+'</span></div>'+
      '<p class="muted">'+safe(x.company)+'</p><ul>'+(String(x.details||'').split('\n').filter(Boolean).map(t=>'<li>'+safe(t.replace(/^[-•]\s*/,''))+'</li>').join(''))+'</ul>'
    ).join('');
    const education=(d.education||[]).map(x =>
      '<div class="item-head"><span>'+safe(x.role)+'</span><span>'+safe([x.start,x.end].filter(Boolean).join(' – '))+'</span></div><p>'+safe(x.company)+' · '+safe(x.details)+'</p>'
    ).join('');
    const skills=(d.skillsGroups||[]).map(x=>'<p><strong>'+safe(x.heading)+':</strong> '+safe(x.description)+'</p>').join('');
    const extras=(d.extras||[]).map(x=>'<p><b>'+safe(x.name)+'</b> <span class="muted">'+safe(x.type)+'</span> — '+safe(x.details)+'</p>').join('');
    return '<header><h2>'+safe(d.name)+'</h2><div class="resume-title">'+safe(d.title)+'</div><div class="contact">'+contacts+'</div></header>'+
      (d.summary?'<h3>Professional Summary</h3><p>'+safe(d.summary)+'</p>':'')+
      (experience?'<h3>Experience</h3>'+experience:'')+
      (education?'<h3>Education</h3>'+education:'')+
      (skills?'<h3>Skills</h3>'+skills:'')+
      (extras?'<h3>Projects & Certifications</h3>'+extras:'');
  }
  function sampleCard(d) {
    const m=d.sampleMeta||{};
    return '<button type="button" class="sample-card '+(selectedSample?.sampleMeta?.sampleId===m.sampleId?'selected':'')+'" data-sample-id="'+safe(m.sampleId)+'">'+
      '<span class="sample-card-top"><i>'+safe(m.level||'Sample')+'</i><b>FICTIONAL</b></span>'+
      '<span class="sample-card-role">'+safe(d.title)+'</span>'+
      '<span class="sample-card-industry">'+safe(m.industry||'')+'</span>'+
      '<span class="sample-card-skills">'+safe((d.skillsGroups||[]).map(x=>x.description).join(' · '))+'</span>'+
      '<span class="sample-card-action">Preview sample <b>↗</b></span></button>';
  }
  function fillSelect(el,options,placeholder) {
    if(!el)return;
    const prior=el.value;
    el.innerHTML='<option value="all">'+safe(placeholder||'All')+'</option>'+options.map(x=>'<option value="'+safe(x.value)+'">'+safe(x.label)+'</option>').join('');
    if(options.some(x=>x.value===prior))el.value=prior;
  }
  function filteredSamples() {
    const query=clean($('#sampleSearch')?.value).toLowerCase();
    const industry=$('#sampleIndustryFilter')?.value||'all';
    const level=$('#sampleLevelFilter')?.value||'all';
    const role=$('#sampleRoleFilter')?.value||'all';
    return allSamples.filter(d=>{
      const m=d.sampleMeta||{};
      const text=[d.title,m.industry,m.level,d.summary,(d.skillsGroups||[]).map(x=>x.description).join(' ')].join(' ').toLowerCase();
      return (!query||text.includes(query))&&(industry==='all'||m.industryId===industry)&&(level==='all'||m.levelId===level)&&(role==='all'||d.title===role);
    });
  }
  function renderSampleGrid() {
    const host=$('#sampleGrid');if(!host)return;
    const list=filteredSamples();
    $('#sampleResultCount').textContent=list.length+' sample profile'+(list.length===1?'':'s');
    host.innerHTML=list.length?list.map(sampleCard).join(''):'<div class="sample-no-results"><b>No matching samples</b><p>Change your filters or generate a role-specific fictional sample.</p></div>';
  }
  function renderSamplePreview() {
    const host=$('#samplePreviewPaper');
    if(!host)return;
    if(!selectedSample){host.innerHTML='<div class="sample-empty-state">Select a sample to see its full resume.</div>';$('#useSample').disabled=true;return;}
    host.innerHTML=resumeHTML(selectedSample);
    templates.forEach(t=>host.classList.remove(styleClass(t.id)));
    decoratePaper(host,selectedSampleTemplate);
    const m=selectedSample.sampleMeta||{};
    $('#samplePreviewTitle').textContent=selectedSample.title;
    $('#samplePreviewMeta').textContent=m.industry+' · '+m.level+' · Fictional example';
    $('#useSample').disabled=false;
  }
  function selectSample(id) {
    selectedSample=allSamples.find(d=>d.sampleMeta?.sampleId===id)||null;
    renderSampleGrid();renderSamplePreview();
  }
  function renderSampleFilters() {
    fillSelect($('#sampleIndustryFilter'),industries.map(x=>({value:x.id,label:x.name})),'All 22 industries');
    fillSelect($('#sampleRoleFilter'),[...new Set(industries.flatMap(x=>x.roles))].sort().map(x=>({value:x,label:x})),'All job roles');
    const templateSelect=$('#samplePreviewTemplate');
    if(templateSelect)templateSelect.innerHTML=templates.map(t=>'<option value="'+t.id+'">'+safe(t.name)+'</option>').join('');
    if(templateSelect)templateSelect.value=selectedSampleTemplate;
  }
  function makeCustomSample() {
    const requested=clean($('#customSampleRole').value);
    const level=$('#customSampleLevel').value||'mid';
    const industryFilter=$('#sampleIndustryFilter').value||'all';
    let industry=industryFilter!=='all'?industryById(industryFilter):industries[0];
    if(requested) {
      const found=industries.find(x=>x.roles.some(r=>r.toLowerCase()===requested.toLowerCase()));
      if(found&&industryFilter==='all')industry=found;
    } else if(industryFilter==='all') {
      industry=pick(industries,Math.random);
    }
    const role=requested||pick(industry.roles,Math.random);
    const id=randomId('generated-sample');
    const profile=makeProfile(industry.id,role,level,'custom-'+id,id);
    generatedSamples.push(profile);saveGenerated(generatedSamples);allSamples=initialSamples.concat(generatedSamples);
    selectSample(id);
    $('#sampleSearch').value='';
    $('#sampleIndustryFilter').value=industry.id;
    $('#sampleLevelFilter').value=level;
    $('#sampleRoleFilter').value='all';
    renderSampleGrid();
  }
  function resetSamplePreview() {
    selectedSample=null;renderSampleGrid();renderSamplePreview();
    $('#sampleSearch').value='';$('#sampleIndustryFilter').value='all';$('#sampleLevelFilter').value='all';$('#sampleRoleFilter').value='all';
  }
  function renderTemplatePreview() {
    const host=$('#templatePreview');if(!host)return;
    const demo=makeProfile('software-it','Software Engineer','mid','template-preview');
    host.innerHTML=resumeHTML(demo);decoratePaper(host,selectedTemplate.id);
    $$('.reze-template-card').forEach(card=>card.classList.toggle('selected',card.dataset.rezeTemplate===selectedTemplate.id));
  }
  function selectTemplate(id) {
    selectedTemplate=templateById(id);
    renderTemplatePreview();
    const title=$('#templateRecommendation');if(title&&title.dataset.recommended)title.textContent='Recommended: '+selectedTemplate.name+'. Preview it or create a new resume with this design.';
  }
  function renderTemplateGallery() {
    const query=clean($('#rezeTemplateSearch')?.value).toLowerCase();
    const filter=$('#rezeTemplateFilter')?.value||'all';
    $$('.reze-template-card').forEach(card=>{
      const t=templateById(card.dataset.rezeTemplate);
      const matches=(!query||(t.name+' '+t.style+' '+t.tags.join(' ')).toLowerCase().includes(query))&&
        (filter==='all'||t.category===filter||t.style.toLowerCase()===filter||t.tags.includes(filter));
      card.hidden=!matches;
    });
  }
  function recommendTemplate() {
    const industry=$('#templateGuideIndustry').value;
    const level=$('#templateGuideLevel').value;
    const style=$('#templateGuideStyle').value;
    const priority=$('#templateGuidePriority').value;
    let id='reze-minimal';
    if(style==='Creative'||priority==='Visual appearance')id='creative-studio';
    else if(industry==='Healthcare & Life Sciences')id='clinical-pro';
    else if(industry==='Science & Research'||industry==='Education & Training'||industry==='Public Sector & Nonprofit')id='academic-pro';
    else if(industry==='Design & Creative'||industry==='Media & Communications')id='creative-studio';
    else if(industry==='Software & IT'||industry==='Cybersecurity'||industry==='Data & Analytics')id='tech-forward';
    else if(level==='Senior')id=priority==='ATS compatibility'?'harvard-classic':'executive-elite';
    else if(level==='Fresher')id='fresher-first';
    else if(style==='Professional')id='harvard-classic';
    else if(style==='Modern')id='tech-forward';
    if(priority==='ATS compatibility'&&['creative-studio','professional-sidebar','executive-elite'].includes(id))id='harvard-classic';
    selectTemplate(id);
    const out=$('#templateRecommendation');
    out.dataset.recommended='true';
    out.textContent='Recommended: '+templateById(id).name+' for a '+level.toLowerCase()+' candidate. This is a design suggestion, not an ATS guarantee.';
    $('#rezeTemplateGrid').scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  /* ----------------------------- Resume storage ----------------------------- */
  function saveResumeRecord(data,name) {
    const list=(()=>{try{const v=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}})();
    const rec={id:randomId('resume'),name:name||data.name||'Untitled resume',data:data,createdAt:stamp(),updatedAt:stamp()};
    list.unshift(rec);
    try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(list));localStorage.setItem(ACTIVE_KEY,rec.id);localStorage.setItem(RESUME_KEY,JSON.stringify(data));}
    catch(e){alert('Could not save this resume in browser storage. Export a copy before continuing.');return false;}
    $('#loadSaved')?.click();
    $('#nav [data-view="editor"]')?.click();
    setTimeout(()=>{decorateCurrentPapers(data.rezeTemplateId);renderSampleEditorBanner();},40);
    return true;
  }
  function createBlankFromTemplate() {
    const t=selectedTemplate;
    const data=blankResume(t);
    saveResumeRecord(data,'Untitled resume');
  }
  function createSampleCopy() {
    if(!selectedSample)return;
    const data=JSON.parse(JSON.stringify(selectedSample));
    data.template=templateById(selectedSampleTemplate).legacy;
    data.rezeTemplateId=selectedSampleTemplate;
    data.sampleMeta={...data.sampleMeta,usedAt:stamp(),isSampleCopy:true};
    const m=data.sampleMeta;
    saveResumeRecord(data,'Sample — '+m.role+' ('+m.level+')');
  }
  function profileFromMeta(meta) {
    return makeProfile(meta.industryId,meta.role,meta.levelId,meta.seed,meta.sampleId);
  }
  function renderSampleEditorBanner() {
    const editor=$('#view-editor');
    if(!editor)return;
    let banner=$('#sampleEditBanner');
    if(!banner) {
      banner=document.createElement('div');
      banner.id='sampleEditBanner';
      banner.className='sample-editor-banner';
      const layout=editor.querySelector('.editor-layout');
      if(layout)editor.insertBefore(banner,layout);
    }
    const meta=currentData().sampleMeta;
    banner.hidden=!meta?.isSampleCopy;
    if(meta?.isSampleCopy)banner.innerHTML='<div><b>Fictional sample copy</b><small>'+safe(meta.role)+' · '+safe(meta.industry)+' · '+safe(meta.level)+'. Your edits are saved as a separate resume.</small></div><div><button class="btn secondary" id="saveSampleAsNew" type="button">Save as new copy</button><button class="btn secondary" id="resetSampleDocument" type="button">Reset sample</button></div>';
  }
  function resetSampleDocument() {
    const meta=currentData().sampleMeta;
    if(!meta?.isSampleCopy)return;
    const fresh=profileFromMeta(meta);
    fresh.sampleMeta={...fresh.sampleMeta,isSampleCopy:true};
    const id=localStorage.getItem(ACTIVE_KEY);
    localStorage.setItem(RESUME_KEY,JSON.stringify(fresh));
    const list=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]');
    const i=list.findIndex(x=>x.id===id);
    if(i>=0){list[i]={...list[i],name:'Sample — '+meta.role+' ('+meta.level+')',data:fresh,updatedAt:stamp()};localStorage.setItem(LIBRARY_KEY,JSON.stringify(list));}
    $('#loadSaved')?.click();setTimeout(renderSampleEditorBanner,20);
  }
  function saveSampleAsNew() {
    const d=JSON.parse(JSON.stringify(currentData()));
    if(!d.sampleMeta)return;
    saveResumeRecord(d,'Copy — '+(d.title||'Sample resume'));
  }

  /* ------------------------------- AI service ------------------------------- */
  function endpoint() { return clean(localStorage.getItem(ENDPOINT_KEY)||$('#rezeAiEndpoint')?.value); }
  function contextEnabled() { return $('#aiContextConsent')?.checked===true; }
  function buildResumeContext() {
    const d=currentData();
    return {
      name:d.name||'',title:d.title||'',summary:d.summary||'',
      experience:(d.experience||[]).map(x=>({role:x.role||'',company:x.company||'',details:x.details||''})),
      education:(d.education||[]).map(x=>({degree:x.role||'',institution:x.company||'',details:x.details||''})),
      skills:(d.skillsGroups||[]).map(x=>({category:x.heading||'',items:x.description||''})),
      projects:(d.extras||[]).map(x=>({type:x.type||'',name:x.name||'',details:x.details||''}))
    };
  }
  async function callAI(payload) {
    const url=endpoint();
    if(!url)throw new Error('Configure your REZE AI endpoint in Settings before using AI tools.');
    let parsed;
    try { const u=new URL(url); if(u.protocol!=='https:'&&!(u.protocol==='http:'&&(u.hostname==='localhost'||u.hostname==='127.0.0.1')))throw new Error('The AI endpoint must use HTTPS.'); }
    catch(e){throw new Error('Enter a valid HTTPS REZE AI endpoint URL in Settings.');}
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    try { parsed=await response.json(); } catch { throw new Error('The AI service returned an unreadable response.'); }
    if(!response.ok)throw new Error(parsed.error||('AI request failed ('+response.status+').'));
    return parsed;
  }
  function updateAITargets() {
    const select=$('#assistantTarget');if(!select)return;
    const d=currentData(),prior=select.value;
    const options=['<option value="summary">Professional summary</option>'];
    (d.experience||[]).forEach((x,i)=>options.push('<option value="experience:'+i+'">Experience: '+safe(x.role||('Entry '+(i+1)))+'</option>'));
    (d.skillsGroups||[]).forEach((x,i)=>options.push('<option value="skills:'+i+'">Skills: '+safe(x.heading||('Group '+(i+1)))+'</option>'));
    options.push('<option value="copy">Keep as copy only</option>');
    select.innerHTML=options.join('');
    if([...select.options].some(x=>x.value===prior))select.value=prior;
  }
  function targetText(target) {
    const d=currentData();
    if(target==='summary')return d.summary||'';
    if(target.startsWith('experience:'))return d.experience?.[Number(target.split(':')[1])]?.details||'';
    if(target.startsWith('skills:'))return d.skillsGroups?.[Number(target.split(':')[1])]?.description||'';
    return '';
  }
  function setAIStatus(text,error) {
    const status=$('#aiToolStatus');if(status){status.textContent=text;status.classList.toggle('error',!!error);}
  }
  let lastAIRequest=null, lastAppliedChange=null;
  async function runWritingTool(tool) {
    const targetSelect=$('#assistantTarget');
    const d=currentData();
    if(tool==='summary')targetSelect.value='summary';
    if(tool==='experience')targetSelect.value=d.experience?.length?'experience:0':'copy';
    if(tool==='skills')targetSelect.value=d.skillsGroups?.length?'skills:0':'copy';
    const target=targetSelect.value;
    const typed=clean($('#assistantInput').value);
    const source=typed||targetText(target);
    const useContext=contextEnabled();
    if(!source&&!useContext){setAIStatus('Add source text or enable resume context.',true);return;}
    const prompts={
      rewrite:'Rewrite the supplied resume text to be clear, specific and professional. Preserve every factual claim.',
      concise:'Make the supplied resume text concise without removing important facts.',
      summary:'Write a concise professional summary using only facts explicitly present in the supplied text and optional resume context. Do not infer years, credentials or achievements.',
      experience:'Improve the supplied work-experience content into strong resume bullets. Do not add metrics, tools or outcomes that are not supported.',
      ats:'Improve wording for relevance and ATS readability. Use only supported skills and terms. Do not add keywords just because they appear in a job description.',
      skills:'Suggest a short list of skills that are directly supported by the supplied facts. Put uncertain items under a clearly labelled "Verify before adding" line.',
      grammar:'Correct spelling, grammar and sentence structure while preserving meaning and factual details.'
    };
    const task=prompts[tool]||prompts.rewrite;
    lastAIRequest={tool:tool,target:target,source:source};
    setAIStatus('Preparing a suggestion…',false);
    try {
      const result=await callAI({
        action:'suggestion',tool:tool,instruction:task,sourceText:source,
        resumeContext:useContext?buildResumeContext():null,
        targetRole:$('#matchJobTitle')?.value||''
      });
      const suggestion=clean(result.suggestion||result.reply||result.text);
      if(!suggestion)throw new Error('The AI service did not return a suggestion.');
      $('#aiOriginalText').textContent=source||'(No original text — generated from approved resume context.)';
      $('#assistantOutput').value=suggestion;
      $('#aiReviewPanel').hidden=false;
      $('#useSuggestion').disabled=target==='copy';
      setAIStatus('Suggestion ready · review before applying',false);
    } catch(error) { setAIStatus(error.message||'AI request failed.',true); }
  }
  function applyAISuggestion() {
    const target=$('#assistantTarget').value;
    const suggestion=clean($('#assistantOutput').value);
    if(!suggestion)return;
    if(target==='copy'){setAIStatus('Copy the suggestion or choose a resume section to apply it.',true);return;}
    const d=currentData();
    let original='';
    if(target==='summary'){original=d.summary||'';d.summary=suggestion;}
    else if(target.startsWith('experience:')){const i=Number(target.split(':')[1]);if(!d.experience?.[i])return;original=d.experience[i].details||'';d.experience[i].details=suggestion;}
    else if(target.startsWith('skills:')){const i=Number(target.split(':')[1]);if(!d.skillsGroups?.[i])return;original=d.skillsGroups[i].description||'';d.skillsGroups[i].description=suggestion;}
    lastAppliedChange={target:target,original:original,applied:suggestion};
    core()?.update?.();
    $('#aiReviewPanel').hidden=true;
    setAIStatus('Applied to your resume. You can undo this change.',false);
    if(!$('#aiUndoLast')) {
      const b=document.createElement('button');b.id='aiUndoLast';b.type='button';b.className='btn secondary';b.textContent='↶ Undo last AI change';
      $('#aiToolStatus').parentElement.appendChild(b);
      b.addEventListener('click',undoAIChange);
    }
    updateAITargets();renderSampleEditorBanner();
  }
  function undoAIChange() {
    if(!lastAppliedChange)return;
    const d=currentData(),t=lastAppliedChange.target;
    const current=t==='summary'?d.summary:t.startsWith('experience:')?d.experience?.[Number(t.split(':')[1])]?.details:t.startsWith('skills:')?d.skillsGroups?.[Number(t.split(':')[1])]?.description:undefined;
    if(current!==lastAppliedChange.applied){setAIStatus('This section has changed since the AI suggestion was applied. Undo was not performed to protect your newer edits.',true);return;}
    if(t==='summary')d.summary=lastAppliedChange.original;
    else if(t.startsWith('experience:')){const i=Number(t.split(':')[1]);if(d.experience?.[i])d.experience[i].details=lastAppliedChange.original;}
    else if(t.startsWith('skills:')){const i=Number(t.split(':')[1]);if(d.skillsGroups?.[i])d.skillsGroups[i].description=lastAppliedChange.original;}
    core()?.update?.();lastAppliedChange=null;$('#aiUndoLast')?.remove();setAIStatus('Last AI change undone.',false);
  }
  const chatMessages=[];
  function appendChat(role,text) {
    chatMessages.push({role:role,content:text});
    const host=$('#aiChatMessages');
    const bubble=document.createElement('div');bubble.className='ai-message '+(role==='user'?'user':'assistant');
    const title=document.createElement('b');title.textContent=role==='user'?'You':'REZE Assistant';
    const p=document.createElement('p');p.textContent=text;
    bubble.append(title,p);host.appendChild(bubble);host.scrollTop=host.scrollHeight;
  }
  async function sendChat() {
    const input=$('#aiChatInput'),message=clean(input.value);if(!message)return;
    input.value='';appendChat('user',message);
    const button=$('#aiSendChat');button.disabled=true;button.textContent='Thinking…';
    try {
      const result=await callAI({
        action:'chat',message:message,history:chatMessages.slice(-13,-1),
        resumeContext:contextEnabled()?buildResumeContext():null
      });
      appendChat('assistant',clean(result.reply||result.suggestion||'I could not produce a response.'));
    } catch(error) { appendChat('assistant','I could not reach the REZE AI service: '+(error.message||'Unknown error')+' Check the endpoint in Settings.'); }
    finally {button.disabled=false;button.textContent='Send ↗';}
  }
  function testAIEndpoint() {
    const url=clean($('#rezeAiEndpoint').value);
    if(!url){$('#aiEndpointStatus').textContent='Enter the deployed Vercel AI endpoint URL first.';return;}
    localStorage.setItem(ENDPOINT_KEY,url);
    callAI({action:'health'}).then(r=>{$('#aiEndpointStatus').textContent=r.configured?'Connected · '+r.provider+' provider is configured.':'Endpoint reached, but the AI provider is not configured on the server.';})
      .catch(e=>{$('#aiEndpointStatus').textContent=e.message||'Could not reach the endpoint.';});
  }

  /* ---------------------------- Job description match ---------------------------- */
  const STOPWORDS=new Set(('about above after again against all also any are because been before being between both but can could did does doing down during each few for from further had has have having here how into its itself just more most must not off once only other our out over own same she should some such than that the their them then there these they this those through too under until very was were what when where which while who why will with would your you our team work role years year').split(' '));
  function tokenize(text) {
    return [...new Set((String(text||'').toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g)||[]).filter(x=>!STOPWORDS.has(x)))];
  }
  function resumeSearchText(d) {
    return [d.name,d.title,d.summary,(d.experience||[]).map(x=>[x.role,x.company,x.details].join(' ')).join(' '),
      (d.skillsGroups||[]).map(x=>[x.heading,x.description].join(' ')).join(' '),
      (d.education||[]).map(x=>[x.role,x.company,x.details].join(' ')).join(' '),
      (d.extras||[]).map(x=>[x.name,x.details].join(' ')).join(' ')].join(' ');
  }
  function assessATS(d) {
    const checks=[
      ['Name and contact details',!!clean(d.name)&&!!clean(d.email)],
      ['Clear target job title',!!clean(d.title)],
      ['Professional summary',clean(d.summary).length>=50],
      ['Work experience or relevant projects',(d.experience||[]).length>0||(d.extras||[]).some(x=>/project/i.test(x.type||''))],
      ['Education details',(d.education||[]).length>0],
      ['Skills section',(d.skillsGroups||[]).some(x=>clean(x.heading)&&clean(x.description))],
      ['Conventional section headings',true],
      ['Readable single-column style',!['professional-sidebar','creative-studio'].includes(d.rezeTemplateId||'')],
      ['Text-based resume content',!d.previewHtmlOverride],
      ['Consistent dates and role details',(d.experience||[]).some(x=>clean(x.role)&&clean(x.start))]
    ];
    return {score:Math.round(checks.filter(x=>x[1]).length/checks.length*100),checks:checks};
  }
  function runMatch() {
    const jd=clean($('#jobDescription').value);
    if(!jd){$('#matchResults').innerHTML='<p class="hint">Paste a job description first.</p>';return;}
    if(!$('#matchContextConsent').checked){$('#matchResults').innerHTML='<div class="match-consent-needed"><b>Resume context is off.</b><p>Tick “Use my active resume for this comparison” to calculate a job match. Your resume will be used for this request only.</p></div>';return;}
    const d=currentData(),resume=resumeSearchText(d),jdTerms=tokenize(jd),resumeTerms=new Set(tokenize(resume));
    const matched=jdTerms.filter(t=>resumeTerms.has(t));
    const missing=jdTerms.filter(t=>!resumeTerms.has(t));
    const partial=missing.filter(t=>[...resumeTerms].some(r=>r.length>4&&t.length>4&&(r.includes(t)||t.includes(r))));
    const trueMissing=missing.filter(t=>!partial.includes(t));
    const score=jdTerms.length?Math.round((matched.length+partial.length*.45)/jdTerms.length*100):0;
    const ats=assessATS(d);
    const role=clean($('#matchJobTitle').value)||d.title||'Target role';
    $('#matchResults').innerHTML=
      '<div class="match-report-head"><div><div class="eyebrow">REZE ANALYSIS</div><h3>'+safe(role)+'</h3><p>Keyword and content alignment based on the text provided.</p></div></div>'+
      '<div class="match-score-grid"><div class="match-score-card"><span>Job Match Score</span><strong>'+score+'%</strong><small>Based on keyword overlap and close wording</small><div class="match-score-track"><i style="width:'+score+'%"></i></div></div><div class="match-score-card ats-score-card"><span>ATS Readiness</span><strong>'+ats.score+'%</strong><small>REZE format and content checklist</small><div class="match-score-track"><i style="width:'+ats.score+'%"></i></div></div></div>'+
      '<div class="match-count-row"><span class="match-positive">'+matched.length+' matched terms</span><span class="match-partial">'+partial.length+' partial matches</span><span class="match-negative">'+trueMissing.length+' terms to verify</span></div>'+
      '<div class="match-details-grid"><section><h4>Matching keywords</h4><div class="match-token-list">'+(matched.map(x=>'<i class="match-token good">'+safe(x)+'</i>').join('')||'<p class="hint">No clear keyword matches found.</p>')+'</div></section><section><h4>Potential gaps to review</h4><div class="match-token-list">'+(trueMissing.slice(0,30).map(x=>'<i class="match-token missing">'+safe(x)+'</i>').join('')||'<p class="hint">No obvious keyword gaps in this heuristic check.</p>')+'</div></section></div>'+
      '<section class="match-improvements"><h4>Recommended next steps</h4><ul><li>Review the missing terms and add only those that accurately describe your skills or experience.</li><li>Make relevant experience more specific by describing the task, method and outcome you can substantiate.</li><li>Check that your most relevant qualifications and projects are easy to find.</li></ul></section>'+
      '<p class="match-disclaimer">These are heuristic estimates, not a prediction of an employer ATS decision. ATS products and employer configurations differ. Keyword overlap does not prove qualification; a missing term does not prove a skill gap.</p>'+
      '<div class="ats-checklist-mini"><h4>ATS readiness checklist</h4>'+ats.checks.map(x=>'<div class="check '+(x[1]?'':'missing')+'"><span>'+safe(x[0])+'</span><em>'+(x[1]?'✓ Ready':'＋ Review')+'</em></div>').join('')+'</div>'+
      '<section class="match-ai-panel"><h4>Want more tailored recommendations?</h4><p>REZE AI can review the job description alongside your resume and suggest specific improvements. This is a separate AI request.</p><button class="btn primary" id="getMatchAiAdvice" type="button" '+($('#matchAiConsent').checked?'':'disabled')+'>Generate AI recommendations</button><div id="matchAiAdvice" class="match-ai-advice" aria-live="polite"></div></section>';
  }
  async function getMatchAiAdvice() {
    if(!$('#matchAiConsent').checked){$('#matchAiAdvice').textContent='Enable the separate AI consent option before sending resume details and the job description to REZE AI.';return;}
    const jd=clean($('#jobDescription').value);
    if(!jd){$('#matchAiAdvice').textContent='Paste a job description first.';return;}
    const d=currentData(),button=$('#getMatchAiAdvice');
    button.disabled=true;button.textContent='Preparing recommendations…';
    try {
      const result=await callAI({
        action:'suggestion',tool:'job-match',
        instruction:'Compare this resume with the job description. Identify relevant evidence already present, point out requirements that appear unsupported or missing, and suggest truthful edits to existing resume content. Do not claim the candidate has a missing skill. Do not invent experience, tools, credentials or metrics. Return clear, actionable recommendations.',
        sourceText:resumeSearchText(d),resumeContext:buildResumeContext(),
        jobDescription:jd,targetRole:clean($('#matchJobTitle').value)||d.title||'Target role'
      });
      const host=$('#matchAiAdvice');
      host.textContent=result.suggestion||'No AI recommendations were returned.';
      host.classList.add('has-content');
    } catch(error) {
      $('#matchAiAdvice').textContent=error.message||'Could not reach the REZE AI service. Check the endpoint in Settings.';
      $('#matchAiAdvice').classList.add('has-error');
    } finally {button.disabled=false;button.textContent='Generate AI recommendations';}
  }

  /* --------------------------------- Bindings --------------------------------- */
  function init() {
    if(!core()) { console.warn('REZE core is not ready; AI/sample features will retry on load.'); return; }
    const endpointInput=$('#rezeAiEndpoint');
    if(endpointInput){endpointInput.value=localStorage.getItem(ENDPOINT_KEY)||'';if(endpointInput.value&&$('#aiEndpointStatus'))$('#aiEndpointStatus').textContent='AI endpoint saved in this browser. Test the connection to verify the provider configuration.';}
    const consent=$('#aiContextConsent');
    // Resume context consent is session-scoped and starts off on every page load.
    if(consent)consent.checked=false;
    const matchConsent=$('#matchContextConsent');
    if(matchConsent)matchConsent.checked=false;

    renderSampleFilters();
    renderSampleGrid();
    renderTemplateGallery();
    selectTemplate('harvard-classic');
    updateAITargets();
    renderSampleEditorBanner();

    $('#sampleGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-sample-id]');if(b)selectSample(b.dataset.sampleId);});
    ['sampleSearch','sampleIndustryFilter','sampleLevelFilter','sampleRoleFilter'].forEach(id=>$('#'+id)?.addEventListener(id==='sampleSearch'?'input':'change',renderSampleGrid));
    $('#sampleIndustryFilter')?.addEventListener('change',renderSampleGrid);
    $('#samplePreviewTemplate')?.addEventListener('change',e=>{selectedSampleTemplate=e.target.value;renderSamplePreview();});
    $('#useSample')?.addEventListener('click',createSampleCopy);
    $('#resetSamplePreview')?.addEventListener('click',resetSamplePreview);
    $('#randomSample')?.addEventListener('click',()=>{
      const list=filteredSamples().length?filteredSamples():allSamples;
      const chosen=pick(list,Math.random);if(chosen)selectSample(chosen.sampleMeta.sampleId);
    });
    $('#generateCustomSample')?.addEventListener('click',makeCustomSample);
    $('#customSampleRole')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();makeCustomSample();}});
    $('#sampleIndustryFilter')?.addEventListener('change',()=>{$('#sampleSearch').value='';renderSampleGrid();});

    $('#rezeTemplateSearch')?.addEventListener('input',renderTemplateGallery);
    $('#rezeTemplateFilter')?.addEventListener('change',renderTemplateGallery);
    $('#rezeTemplateGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-reze-template]');if(b)selectTemplate(b.dataset.rezeTemplate);});
    $('#findMyTemplate')?.addEventListener('click',recommendTemplate);
    $('#useTemplate')?.addEventListener('click',e=>{e.preventDefault();createBlankFromTemplate();});
    $('#applyTemplateCurrent')?.addEventListener('click',()=>{
      const d=currentData();d.template=selectedTemplate.legacy;d.rezeTemplateId=selectedTemplate.id;
      core()?.update?.();decorateCurrentPapers(selectedTemplate.id);
      $('#nav [data-view="editor"]')?.click();
    });
    $('#dashboardSamples')?.addEventListener('click',()=>$('#nav [data-view="samples"]')?.click());
    document.addEventListener('click',e=>{
      const quick=e.target.closest('[data-dashboard-template]');
      if(quick){selectTemplate(quick.dataset.dashboardTemplate);$('#nav [data-view="templates"]')?.click();}
      if(e.target.closest('#resetSampleDocument'))resetSampleDocument();
      if(e.target.closest('#saveSampleAsNew'))saveSampleAsNew();
      const tool=e.target.closest('[data-ai-tool]');
      if(tool){if(tool.id==='rewriteBullet'||tool.id==='makeConcise')return;runWritingTool(tool.dataset.aiTool);}
    });

    $('#rewriteBullet').onclick=()=>runWritingTool('rewrite');
    $('#makeConcise').onclick=()=>runWritingTool('concise');
    $('#useSuggestion').onclick=applyAISuggestion;
    $('#aiReject')?.addEventListener('click',()=>{$('#aiReviewPanel').hidden=true;setAIStatus('Suggestion rejected. Your resume was not changed.',false);});
    $('#aiRegenerate')?.addEventListener('click',()=>{if(lastAIRequest)runWritingTool(lastAIRequest.tool);});
    $('#aiCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#assistantOutput').value);setAIStatus('Suggestion copied.',false);}catch{setAIStatus('Clipboard access is unavailable in this browser.',true);}});
    $('#aiSendChat')?.addEventListener('click',sendChat);
    $('#aiChatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}});
    $('#aiClearChat')?.addEventListener('click',()=>{$('#aiChatMessages').innerHTML='';chatMessages.length=0;appendChat('assistant','Chat cleared. Ask a new question whenever you are ready.');});
    $('#openAssistantMatch')?.addEventListener('click',()=>$('#nav [data-view="match"]')?.click());
    $('#assistantTarget')?.addEventListener('change',()=>{
      const target=$('#assistantTarget').value;
      if(!clean($('#assistantInput').value)&&target!=='copy')$('#assistantInput').value=targetText(target);
      $('#useSuggestion').disabled=target==='copy';
    });
    $('#saveAiEndpoint')?.addEventListener('click',()=>{
      const value=clean($('#rezeAiEndpoint').value);
      if(value)localStorage.setItem(ENDPOINT_KEY,value);else localStorage.removeItem(ENDPOINT_KEY);
      $('#aiEndpointStatus').textContent=value?'AI endpoint saved in this browser. Provider keys remain server-side.':'AI endpoint cleared.';
    });
    $('#testAiEndpoint')?.addEventListener('click',testAIEndpoint);
    $('#runMatch').onclick=runMatch;
    $('#matchAiConsent')?.addEventListener('change',()=>{const button=$('#getMatchAiAdvice');if(button)button.disabled=!$('#matchAiConsent').checked;});
    document.addEventListener('click',e=>{if(e.target.closest('#getMatchAiAdvice'))getMatchAiAdvice();});
    $('#clearMatch')?.addEventListener('click',()=>{$('#jobDescription').value='';$('#matchJobTitle').value='';$('#matchResults').innerHTML='';$('#matchContextConsent').checked=false;$('#matchAiConsent').checked=false;});

    document.addEventListener('click',e=>{if(e.target.closest('#nav [data-view="assistant"]'))updateAITargets();if(e.target.closest('#nav [data-view="editor"]'))renderSampleEditorBanner();});
    document.addEventListener('input',e=>{if(e.target.matches('[data-field],[data-array],[data-skillgroup]')){updateAITargets();renderSampleEditorBanner();}});
    window.addEventListener('storage',e=>{if(e.key===RESUME_KEY){setTimeout(()=>{updateAITargets();renderSampleEditorBanner();},40);}});
    $('#rezeTemplateGrid')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('[data-reze-template]');if(b){e.preventDefault();selectTemplate(b.dataset.rezeTemplate);}}});
    document.addEventListener('reze:resume-loaded',()=>{updateAITargets();renderSampleEditorBanner();});
  }
  function decorateCurrentPapers(id) {
    ['#resumePreview','#resumePreviewLarge','#templatePreview'].forEach(s=>decoratePaper($(s),id));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.REZESamples={
    industries:industries.map(x=>({id:x.id,name:x.name,roles:x.roles.slice()})),
    initialCount:initialSamples.length,
    generate:(industryId,role,levelId)=>makeProfile(industryId,role,levelId||'mid',randomId('api-sample')),
    selectTemplate:selectTemplate,
    getTemplate:id=>templateById(id)
  };
})();
