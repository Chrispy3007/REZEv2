/* REZE paginated preview — measured A4/Letter sheets, fitted to the available viewport. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);
 const state={zoom:1,size:'A4',pages:[],fitScale:1};
 const dims=()=>state.size==='Letter'?{w:816,h:1056}:{w:794,h:1123};
 function makePage(){
  const {w,h}=dims(),page=document.createElement('article');
  page.className='resume-paper preview-page';
  page.style.width=w+'px';page.style.height=h+'px';page.style.minHeight=h+'px';
  const content=document.createElement('div');content.className='preview-page-content';
  page.appendChild(content);return {page,content};
 }
 const isHeading=n=>n.nodeType===1&&/^H[1-4]$/.test(n.tagName);
 function collectGroups(source){
  const nodes=[...source.childNodes].filter(n=>n.nodeType===1||n.textContent.trim());
  const groups=[];let group=null;
  nodes.forEach(n=>{if(isHeading(n)){group={nodes:[]};groups.push(group);}if(!group){group={nodes:[]};groups.push(group);}group.nodes.push(n.cloneNode(true));});
  return groups;
 }
 const overflows=c=>c.scrollHeight>c.clientHeight+1;
 function copyAttrs(from,to){[...from.attributes].forEach(a=>to.setAttribute(a.name,a.value));}
 function nextPage(pages){const p=makePage();pages.push(p);return p;}
 function addGroup(group,current,pages){
  let pendingHeading=null;
  for(const original of group.nodes){
   if(isHeading(original))pendingHeading=original.cloneNode(true);
   if((original.tagName==='UL'||original.tagName==='OL')&&original.children.length){
    let list=document.createElement(original.tagName.toLowerCase());copyAttrs(original,list);current.content.appendChild(list);
    for(const li of [...original.children]){
     const item=li.cloneNode(true);list.appendChild(item);
     if(overflows(current.content)){
      list.removeChild(item);
      if(!list.children.length)list.remove();
      current=nextPage(pages);
      if(pendingHeading){current.content.appendChild(pendingHeading.cloneNode(true));pendingHeading=null;}
      list=document.createElement(original.tagName.toLowerCase());copyAttrs(original,list);current.content.appendChild(list);list.appendChild(item);
      // A single unusually long list item is retained intact rather than clipped.
     }
    }
    continue;
   }
   const node=original.cloneNode(true);current.content.appendChild(node);
   if(isHeading(node))pendingHeading=node;
   if(overflows(current.content)){
    current.content.removeChild(node);
    // Keep section heading with its first content block; never leave it at page bottom.
    if(isHeading(node)){
      current=nextPage(pages);current.content.appendChild(node);pendingHeading=null;continue;
    }
    if(current.content.childNodes.length){
      if(pendingHeading&&current.content.lastElementChild===pendingHeading)current.content.removeChild(current.content.lastElementChild);
      current=nextPage(pages);
      if(pendingHeading){current.content.appendChild(pendingHeading.cloneNode(true));pendingHeading=null;}
    }
    current.content.appendChild(node);
   }
  }
  return current;
 }
 function paginate(){
  const source=$('#resumePreviewLarge'),host=$('#previewPages');if(!source||!host)return;
  const pages=[];let current=makePage();pages.push(current);
  collectGroups(source).forEach(g=>{current=addGroup(g,current,pages);});
  // Remove an empty trailing sheet if a boundary created one.
  while(pages.length>1&&!pages[pages.length-1].content.childNodes.length)pages.pop();
  pages.forEach((p,i)=>{const f=document.createElement('div');f.className='preview-page-number';f.textContent=`${i+1} / ${pages.length}`;p.page.appendChild(f);});
  host.replaceChildren(...pages.map(p=>{const frame=document.createElement('div');frame.className='preview-page-frame';frame.appendChild(p.page);return frame;}));
  const miniHost=$('#editorPreviewPages');
  if(miniHost){
   const fragment=document.createDocumentFragment();
   pages.forEach(p=>{const shell=document.createElement('div');shell.className='editor-mini-page-shell';const frame=document.createElement('div');frame.className='editor-mini-page-frame';const mini=p.page.cloneNode(true);mini.classList.add('editor-mini-page');frame.appendChild(mini);shell.appendChild(frame);fragment.appendChild(shell);});
   const label=document.createElement('div');label.className='editor-mini-page-count';label.textContent=`${pages.length} ${pages.length===1?'page':'pages'}`;fragment.appendChild(label);miniHost.replaceChildren(fragment);
  }
  state.pages=pages;const count=$('#pageCountLabel');if(count)count.textContent=`${pages.length} ${pages.length===1?'page':'pages'} · ${state.size}`;
  applyZoom();
 }
 function applyZoom(){
  const host=$('#previewPages'),stage=$('.page-preview-stage');if(!host||!stage)return;
  const width=dims().w,available=Math.max(220,stage.clientWidth-32);
  state.fitScale=Math.min(1,available/width);
  const scale=state.fitScale*state.zoom;
  host.querySelectorAll('.preview-page-frame').forEach(frame=>{frame.style.width=(width*scale)+'px';frame.style.height=(dims().h*scale)+'px';const page=frame.firstElementChild;page.style.transform=`scale(${scale})`;page.style.transformOrigin='top left';});
  host.style.transform='none';
  const zoom=$('#largeZoomValue');if(zoom)zoom.textContent=Math.round(state.zoom*100)+'%';
  document.querySelectorAll('.editor-mini-page-frame').forEach(frame=>{const page=frame.firstElementChild;const s=270/dims().w;frame.style.width='270px';frame.style.height=(dims().h*s)+'px';page.style.transform=`scale(${s})`;page.style.transformOrigin='top left';});
 }
 function refresh(){requestAnimationFrame(()=>requestAnimationFrame(paginate));}
 function bind(){
  $('#largeZoomOut')?.addEventListener('click',()=>{state.zoom=Math.max(.5,state.zoom-.1);applyZoom();});
  $('#largeZoomIn')?.addEventListener('click',()=>{state.zoom=Math.min(1.5,state.zoom+.1);applyZoom();});
  $('#previewPaperSize')?.addEventListener('change',e=>{state.size=e.target.value;const s=$('#paperSize');if(s)s.value=state.size;refresh();});
  $('#paperSize')?.addEventListener('change',e=>{state.size=e.target.value;const s=$('#previewPaperSize');if(s)s.value=state.size;refresh();});
  const source=$('#resumePreviewLarge');if(source)new MutationObserver(refresh).observe(source,{childList:true,subtree:true,characterData:true});
  if(window.ResizeObserver){const ro=new ResizeObserver(applyZoom);const stage=$('.page-preview-stage');if(stage)ro.observe(stage);const mini=$('#editorPreviewPages');if(mini)ro.observe(mini);}
  window.addEventListener('resize',applyZoom);window.addEventListener('beforeprint',()=>{state.zoom=1;applyZoom();});refresh();
 }
 window.REZEPagePreview={refresh,paginate};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
