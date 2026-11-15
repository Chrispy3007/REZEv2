/* REZE Editor Studio interactions: zoom, completion meter, keyboard shortcuts. */
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const updateProgress = () => {
    const checks = [
      !!$('[data-field="name"]')?.value.trim(), !!$('[data-field="title"]')?.value.trim(),
      !!$('[data-field="email"]')?.value.trim(), !!$('[data-field="phone"]')?.value.trim(),
      !!$('[data-field="location"]')?.value.trim() || !!$('[data-field="links"]')?.value.trim(),
      !!$('[data-field="summary"]')?.value.trim(),
      $$('#experienceList .entry').some(x => [...x.querySelectorAll('input')].some(i=>i.value.trim())),
      $$('#educationList .entry').some(x => [...x.querySelectorAll('input')].some(i=>i.value.trim())),
      !!$('[data-field="skills"]')?.value.trim(),
      $$('#extraList .entry').some(x => [...x.querySelectorAll('input')].some(i=>i.value.trim()))
    ];
    const pct = Math.round(checks.filter(Boolean).length/checks.length*100);
    const value=$('#editorProgressValue'), bar=$('#editorProgressBar');
    if(value)value.textContent=`${pct}%`;
    if(bar)bar.style.width=`${pct}%`;
  };
  document.addEventListener('input',updateProgress);
  document.addEventListener('click',e=>{if(e.target.closest('#addExperience,#addEducation,#addExtra,[data-remove]'))setTimeout(updateProgress,0);});
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('#saveBtn')?.click();}
    if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='p'){e.preventDefault();document.querySelector('[data-view="preview"]')?.click();}
  });
  const originalSwitch = window.switchView;
  // Keep section navigation and completion meter fresh after first render and dynamic additions.
  window.addEventListener('load',updateProgress);
  const observer = new MutationObserver(updateProgress);
  ['#experienceList','#educationList','#extraList'].forEach(s=>{const el=$(s);if(el)observer.observe(el,{childList:true,subtree:true});});
})();
