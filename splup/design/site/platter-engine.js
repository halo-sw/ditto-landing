/* Web preview port of Model/GridEngine.swift. Grid units, never device pixels. */
(function(root){
  const COLS=8,ROWS=16,GAP=8,MARGIN=16;
  const rect=w=>({x:w.col,y:w.row,w:w.w,h:w.h});
  const overlap=(a,b)=>a.w>0&&a.h>0&&b.w>0&&b.h>0&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const inBounds=r=>[r.x,r.y,r.w,r.h].every(Number.isSafeInteger)&&r.w>0&&r.h>0&&r.w<=COLS&&r.h<=ROWS&&r.x>=0&&r.y>=0&&r.x<=COLS-r.w&&r.y<=ROWS-r.h;
  function valid(list){return list.length<=128&&new Set(list.map(w=>w.id)).size===list.length&&list.every((w,i)=>typeof w.id==='string'&&w.id.length&&inBounds(rect(w))&&!list.slice(0,i).some(o=>overlap(rect(w),rect(o))));}
  function geometry(width){width=Math.max(320,Math.min(620,width));const cell=(width-2*MARGIN-7*GAP)/8,unit=cell+GAP;return {width:width-32,cell,unit,height:16*unit-GAP,px:n=>n*unit,pw:n=>n*unit-GAP};}
  const radius=(w,h)=>Math.min(20,12+(Math.min(w,h)-2)*2);
  function firstFit(list,w,h,start=0){
    if(!inBounds({x:0,y:0,w,h})||!valid(list))return null;
    const count=ROWS-h+1,first=Math.min(Math.max(0,Math.trunc(start)),count);
    for(let n=0;n<count;n++){const y=(first+n)%count;for(let x=0;x<=COLS-w;x++)if(!list.some(o=>overlap({x,y,w,h},rect(o))))return {col:x,row:y};}
    return null;
  }
  function placed(list,id,target,positions){return list.map(w=>w.id===id?{...w,col:target.x,row:target.y,w:target.w,h:target.h}:{...w,...(positions?.[w.id]||{})});}
  function resolve(list,id,target,dirs){
    if(!valid(list)||!inBounds(target)||!list.some(w=>w.id===id))return null;
    let positions=Object.fromEntries(list.map(w=>[w.id,{col:w.col,row:w.row}]));
    const others=list.filter(w=>w.id!==id).sort((a,b)=>a.row-b.row||a.col-b.col||a.id.localeCompare(b.id));
    const directions=[...new Set(dirs)].filter(d=>['down','up','right','left'].includes(d));let budget=1024;
    const at=w=>rect({...w,...positions[w.id]});
    function push(w,block,depth,ancestors){
      if(depth>3||ancestors.has(w.id))return false;
      for(const d of directions){
        if(--budget<0)return false;
        const p={...positions[w.id]};
        if(d==='down')p.row=block.y+block.h;if(d==='up')p.row=block.y-w.h;if(d==='right')p.col=block.x+block.w;if(d==='left')p.col=block.x-w.w;
        const r=rect({...w,...p});
        if(!inBounds(r)||overlap(r,target)||others.some(o=>ancestors.has(o.id)&&overlap(r,at(o))))continue;
        const snapshot=structuredClone(positions);positions[w.id]=p;let ok=true;const protect=new Set([...ancestors,w.id]);
        for(const o of others)if(o.id!==w.id&&overlap(r,at(o))&&!push(o,r,depth+1,protect)){ok=false;break;}
        if(ok&&!others.some(o=>o.id!==w.id&&overlap(r,at(o))))return true;
        positions=snapshot;
      }
      return false;
    }
    for(const o of others)if(overlap(target,at(o))&&!push(o,target,1,new Set()))return null;
    return valid(placed(list,id,target,positions))?positions:null;
  }
  function preview(list,id,target,dirs=['down','right','left','up'],origin){
    const mover=list.find(w=>w.id===id);if(!mover||!valid(list)||!inBounds(target))return {valid:false,layout:list,kind:'blocked'};
    const others=list.filter(w=>w.id!==id),hits=others.filter(w=>overlap(target,rect(w)));
    if(!hits.length){const result=placed(list,id,target);return {valid:valid(result),layout:result,kind:'move'};}
    const pushes=resolve(list,id,target,dirs);
    if(pushes)return {valid:true,layout:placed(list,id,target,pushes),kind:'push'};
    const c=hits[0],o=origin||{col:mover.col,row:mover.row};
    if(hits.length===1&&c.w===mover.w&&c.h===mover.h&&target.w===mover.w&&target.h===mover.h){
      const swapped=placed(list,id,target,{[c.id]:o});if(valid(swapped))return {valid:true,layout:swapped,kind:'swap'};
    }
    return {valid:false,layout:list,kind:'blocked'};
  }
  function compact(list){
    if(!valid(list))return list;const positioned=[];
    for(const w of [...list].sort((a,b)=>a.row-b.row||a.col-b.col)){
      let best=w.row;for(let row=w.row-1;row>=0;row--){if(positioned.some(o=>overlap(rect({...w,row}),rect(o))))break;best=row;}
      positioned.push({...w,row:best});
    }
    const result=list.map(w=>positioned.find(o=>o.id===w.id));return valid(result)?result:list;
  }
  const api={COLS,ROWS,GAP,MARGIN,rect,overlap,inBounds,valid,geometry,radius,firstFit,preview,compact};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DittoGrid=api;
})(typeof window!=='undefined'?window:globalThis);
