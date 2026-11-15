/* REZE paginated preview — A4 page stack generated from the same resume renderer. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);
 const state={zoom:1,size:'A4',pages:[]};
 const px=96;
 const dims=()=>state.size==='Letter'?{w:816,h:1056}:{w:794,h:1123};
 function makePage(){
  const {w,h}=dims(),page=document.createElement('article');
  page.className='resume-paper preview-page';
  page.style.width=w+'px';page.style.height=h+'px';
  const content=document.createElement('div');content.className='preview-page-content';
  page.appendChild(content);
  return {page,content};
 }
 function isHeading(node){return node.nodeType===1&&node.tagName==='H3';}
 function collectGroups(source){
  const nodes=[...source.childNodes].filter(n=>n.nodeType===1||n.textContent.trim());
  const groups=[];let current=null;
  nodes.forEach(node=>{
   if(isHeading(node)){current={nodes:[node.cloneNode(true)]};groups.push(current);}
   else{if(!current){current={nodes:[]};groups.push(current);}current.nodes.push(node.cloneNode(true));}
  });
  return groups;
 }
 function overflow(content){return content.scrollHeight>content.clientHeight+1;}
 function appendGroupAcrossPages(group,current,pages){
  const nodes=group.nodes;
  let firstChunk=true,headingNode=isHeading(nodes[0])?nodes[0]:null;
  const nextPage=()=>{
   // If a section heading is stranded at the bottom, move it with its content.
   if(headingNode&&current.content.lastElementChild?.tagName==='H3'&&current.content.lastElementChild.textContent===headingNode.textContent)current.content.removeChild(current.content.lastElementChild);
   current=makePage();pages.push(current);
   if(headingNode&&firstChunk)current.content.appendChild(headingNode.cloneNode(true));
   firstChunk=false;
  };
  for(const original of nodes){
   if((original.tagName==='UL'||original.tagName==='OL')&&original.children.length){
    const list=document.createElement(original.tagName.toLowerCase());
    [...original.attributes].forEach(a=>list.setAttribute(a.name,a.value));
    for(const li of [...original.children]){
     const item=li.cloneNode(true);list.appendChild(item);current.content.appendChild(list);
     if(overflow(current.content)){
      list.removeChild(item);
      if(!list.children.length)list.remove();
      nextPage();
      const newList=document.createElement(original.tagName.toLowerCase());
      [...original.attributes].forEach(a=>newList.setAttribute(a.name,a.value));
      newList.appendChild(item);current.content.appendChild(newList);
     }
    }
    continue;
   }
   const node=original.cloneNode(true);current.content.appendChild(node);
   if(overflow(current.content)){
    current.content.removeChild(node);
    if(current.content.childNodes.length)nextPage();
    current.content.appendChild(node);
    firstChunk=false;
   }
  }
  return current;
 }
 function paginate(){
  const source=$('#resumePreviewLarge'),host=$('#previewPages');
  if(!source||!host)return;
  const groups=collectGroups(source),pages=[];
  let current=makePage();pages.push(current);
  groups.forEach(g=>{current=appendGroupAcrossPages(g,current,pages);});
  pages.forEach((p,i)=>{
   const footer=document.createElement('div');footer.className='preview-page-number';footer.textContent=`${i+1} / ${pages.length}`;p.page.appendChild(footer);
   p.page.style.setProperty('--page-width',dims().w+'px');
  });
  host.replaceChildren(...pages.map(x=>x.page));
  const miniHost=$('#editorPreviewPages');
  if(miniHost){
    const miniPages=pages.map((p,i)=>{
      const shell=document.createElement('div');shell.className='editor-mini-page-shell';
      const mini=p.page.cloneNode(true);mini.classList.add('editor-mini-page');
      mini.style.transform='scale(.34)';mini.style.transformOrigin='top center';
      shell.appendChild(mini);return shell;
    });
    miniHost.replaceChildren(...miniPages);
    const label=document.createElement('div');label.className='editor-mini-page-count';label.textContent=`${pages.length} ${pages.length===1?'page':'pages'}`;
    miniHost.appendChild(label);
  }
  state.pages=pages;
  $('#pageCountLabel').textContent=`${pages.length} ${pages.length===1?'page':'pages'} · ${state.size}`;
  applyZoom();
 }
 function applyZoom(){
  const host=$('#previewPages');if(!host)return;
  host.style.setProperty('--preview-zoom',state.zoom);
  $('#largeZoomValue').textContent=Math.round(state.zoom*100)+'%';
 }
 function refresh(){requestAnimationFrame(()=>requestAnimationFrame(paginate));}
 function bind(){
  $('#largeZoomOut')?.addEventListener('click',()=>{state.zoom=Math.max(.5,state.zoom-.1);applyZoom();});
  $('#largeZoomIn')?.addEventListener('click',()=>{state.zoom=Math.min(1.5,state.zoom+.1);applyZoom();});
  $('#previewPaperSize')?.addEventListener('change',e=>{state.size=e.target.value;const select=$('#paperSize');if(select)select.value=state.size;refresh();});
  $('#paperSize')?.addEventListener('change',e=>{state.size=e.target.value;const select=$('#previewPaperSize');if(select)select.value=state.size;refresh();});
  const source=$('#resumePreviewLarge');
  if(source)new MutationObserver(refresh).observe(source,{childList:true,subtree:true,characterData:true});
  window.addEventListener('resize',applyZoom);
  window.addEventListener('beforeprint',()=>{state.zoom=1;applyZoom();});
  refresh();
 }
 window.REZEPagePreview={refresh,paginate};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();