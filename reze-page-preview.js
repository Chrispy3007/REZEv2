/* REZE pagination engine: measure connected A4/Letter sheets before displaying them. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);
 const state={zoom:1,size:'A4',pages:[],fitScale:1};
 const dims=()=>state.size==='Letter'?{w:816,h:1056}:{w:794,h:1123};
 let measureRoot=null;
 function ensureMeasureRoot(){
  if(measureRoot?.isConnected)return measureRoot;
  measureRoot=document.createElement('div');
  measureRoot.id='reze-page-measure-root';
  Object.assign(measureRoot.style,{position:'fixed',left:'-12000px',top:'0',width:dims().w+'px',visibility:'hidden',pointerEvents:'none',zIndex:'-1',display:'block'});
  document.body.appendChild(measureRoot);return measureRoot;
 }
 function makePage(){
  const {w,h}=dims(),page=document.createElement('article');
  page.className='resume-paper preview-page';
  page.style.width=w+'px';page.style.height=h+'px';page.style.minHeight=h+'px';
  const content=document.createElement('div');content.className='preview-page-content';
  page.appendChild(content);ensureMeasureRoot().appendChild(page);
  return {page,content};
 }
 const isHeading=n=>n.nodeType===1&&/^H[1-4]$/.test(n.tagName);
 const hasContent=p=>!!p.content.childNodes.length;
 const overflows=c=>c.scrollHeight>c.clientHeight+1;
 function copyAttrs(from,to){[...from.attributes].forEach(a=>to.setAttribute(a.name,a.value));}
 function collectNodes(source){return [...source.childNodes].filter(n=>n.nodeType===1||(n.nodeType===3&&n.textContent.trim()));}
 function cleanClone(node){
  const copy=node.cloneNode(true);
  const all=[copy,...copy.querySelectorAll('*')];
  all.forEach(el=>{
   el.style.removeProperty('width');el.style.removeProperty('min-width');el.style.removeProperty('max-width');
   el.style.removeProperty('white-space');el.style.removeProperty('position');el.style.removeProperty('left');
   el.style.removeProperty('right');el.style.removeProperty('transform');el.style.removeProperty('float');
   el.removeAttribute('contenteditable');
  });
  return copy;
 }
 function appendList(original,current,pages,heading){
  let list=document.createElement(original.tagName.toLowerCase());copyAttrs(original,list);current.content.appendChild(list);
  for(const li of [...original.children]){
   const item=li.cloneNode(true);list.appendChild(item);
   if(overflows(current.content)){
    list.removeChild(item);if(!list.children.length)list.remove();
    current=makePage();pages.push(current);
    if(heading)current.content.appendChild(heading.cloneNode(true));
    list=document.createElement(original.tagName.toLowerCase());copyAttrs(original,list);current.content.appendChild(list);list.appendChild(item);
   }
  }
  return current;
 }
 function paginate(){
  const source=$('#resumePreviewLarge'),host=$('#previewPages');if(!source||!host||!document.body)return;
  const root=ensureMeasureRoot();root.style.width=dims().w+'px';root.replaceChildren();
  const pages=[];let current=makePage(),pendingHeading=null;
  pages.push(current);
  const nextPage=()=>{current=makePage();pages.push(current);};
  const addBlock=(node)=>{
   const clone=cleanClone(node);
   const heading=pendingHeading?cleanClone(pendingHeading):null;
   if(heading)current.content.appendChild(heading);
   current.content.appendChild(clone);
   if(overflows(current.content)){
    clone.remove();if(heading)heading.remove();
    if(hasContent(current))nextPage();
    if(heading)current.content.appendChild(heading);
    current.content.appendChild(clone);
    // Oversized single blocks are allowed to continue visually rather than being clipped.
    if(overflows(current.content)){
     clone.style.maxWidth='100%';clone.style.whiteSpace='normal';clone.style.overflowWrap='anywhere';
    }
   }
   pendingHeading=null;
  };
  for(const original of collectNodes(source)){
   if(isHeading(original)){pendingHeading=original;continue;}
   if(original.nodeType===1&&(original.tagName==='UL'||original.tagName==='OL')){
    const heading=pendingHeading?cleanClone(pendingHeading):null;
    if(heading)current.content.appendChild(heading);
    let list=document.createElement(original.tagName.toLowerCase());copyAttrs(original,list);current.content.appendChild(list);
    for(const originalItem of [...original.children]){
     const item=cleanClone(originalItem);list.appendChild(item);
     if(overflows(current.content)){
      item.remove();
      if(!list.children.length)list.remove();
      nextPage();
      if(heading)current.content.appendChild(heading.cloneNode(true));
      list=document.createElement(original.tagName.toLowerCase());copyAttrs(original,list);current.content.appendChild(list);list.appendChild(item);
     }
    }
    pendingHeading=null;continue;
   }
   addBlock(original);
  }
  if(pendingHeading){
   const heading=cleanClone(pendingHeading);current.content.appendChild(heading);
   if(overflows(current.content)){heading.remove();nextPage();current.content.appendChild(heading);}
  }
  while(pages.length>1&&!hasContent(pages[pages.length-1]))pages.pop();
  pages.forEach((p,i)=>{const footer=document.createElement('div');footer.className='preview-page-number';footer.textContent=`${i+1} / ${pages.length}`;p.page.appendChild(footer);});
  host.replaceChildren(...pages.map(p=>{const frame=document.createElement('div');frame.className='preview-page-frame';frame.appendChild(p.page);return frame;}));
  const miniHost=$('#editorPreviewPages');
  if(miniHost){const fragment=document.createDocumentFragment();pages.forEach(p=>{const shell=document.createElement('div');shell.className='editor-mini-page-shell';const frame=document.createElement('div');frame.className='editor-mini-page-frame';const mini=p.page.cloneNode(true);mini.classList.add('editor-mini-page');frame.appendChild(mini);shell.appendChild(frame);fragment.appendChild(shell);});const label=document.createElement('div');label.className='editor-mini-page-count';label.textContent=`${pages.length} ${pages.length===1?'page':'pages'}`;fragment.appendChild(label);miniHost.replaceChildren(fragment);}
  state.pages=pages;const count=$('#pageCountLabel');if(count)count.textContent=`${pages.length} ${pages.length===1?'page':'pages'} · ${state.size}`;applyZoom();
 }
 function applyZoom(){
  const host=$('#previewPages'),stage=$('.page-preview-stage');if(!host||!stage)return;
  const {w,h}=dims(),available=Math.max(220,stage.clientWidth-36);
  state.fitScale=Math.min(1,available/w);const scale=state.fitScale*state.zoom;
  host.querySelectorAll('.preview-page-frame').forEach(frame=>{
   frame.style.width=(w*scale)+'px';frame.style.height=(h*scale)+'px';
   const page=frame.firstElementChild;if(page){page.style.transform=`scale(${scale})`;page.style.transformOrigin='top left';}
  });
  const zoom=$('#largeZoomValue');if(zoom)zoom.textContent=Math.round(state.zoom*100)+'%';
  document.querySelectorAll('.editor-mini-page-frame').forEach(frame=>{
   const page=frame.firstElementChild,s=270/w;frame.style.width='270px';frame.style.height=(h*s)+'px';
   if(page){page.style.transform=`scale(${s})`;page.style.transformOrigin='top left';}
  });
 }
 const refresh=()=>requestAnimationFrame(()=>requestAnimationFrame(paginate));
 function bind(){
  $('#largeZoomOut')?.addEventListener('click',()=>{state.zoom=Math.max(.5,state.zoom-.1);applyZoom();});
  $('#largeZoomIn')?.addEventListener('click',()=>{state.zoom=Math.min(1.5,state.zoom+.1);applyZoom();});
  $('#previewPaperSize')?.addEventListener('change',e=>{state.size=e.target.value;const x=$('#paperSize');if(x)x.value=state.size;refresh();});
  $('#paperSize')?.addEventListener('change',e=>{state.size=e.target.value;const x=$('#previewPaperSize');if(x)x.value=state.size;refresh();});
  const source=$('#resumePreviewLarge');if(source)new MutationObserver(refresh).observe(source,{childList:true,subtree:true,characterData:true});
  if(window.ResizeObserver){const ro=new ResizeObserver(applyZoom);const stage=$('.page-preview-stage');if(stage)ro.observe(stage);}
  window.addEventListener('resize',applyZoom);window.addEventListener('beforeprint',()=>{state.zoom=1;applyZoom();});refresh();
 }
 window.REZEPagePreview={refresh,paginate};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
