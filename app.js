/* ================== 데이터 (필요에 맞게 수정) ================== */
/* tag: sci / ai / math / etc */
const BOOTHS = [
  { id:"booth-17", num:17, name:"세미콜론",    desc:"웹·AI 프로젝트 소개 및 체험", tag:"ai"   },
  { id:"booth-18", num:18, name:"실험의숲",    desc:"화학·물리 실험 전시",        tag:"sci"  },
  { id:"booth-1",  num:1,  name:"수학에복종",  desc:"퍼즐 & 확률 게임",           tag:"math" },
  { id:"booth-2",  num:2,  name:"헥사곤",      desc:"게임개발/리버싱 체험",        tag:"ai"   },
  { id:"booth-7",  num:7,  name:"데이터무제한",desc:"데이터 시각화 체험",          tag:"sci"  },
];

/* ================== DOM ================== */
const mapObj = document.getElementById("mapSvg");
const panel = document.getElementById("panel");
const panelToggle = document.getElementById("panelToggle");
const listEl = document.getElementById("list");
const tpl = document.getElementById("itemTpl");
const chips = Array.from(document.querySelectorAll(".chip[data-tag]"));
const chipAll = document.getElementById("chipAll");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetViewBtn = document.getElementById("resetViewBtn");

/* ================== 패널 토글 ================== */
panelToggle.addEventListener("click", () => panel.classList.toggle("expanded"));

/* ================== 칩 필터 ================== */
let activeTags = new Set(chips.map(c=>c.dataset.tag)); // 기본 전체 on
function applyChipsUI(){
  chips.forEach(c => c.classList.toggle("is-active", activeTags.has(c.dataset.tag)));
}
chips.forEach(c=>{
  c.addEventListener("click", ()=>{
    const tag = c.dataset.tag;
    if(activeTags.has(tag)) activeTags.delete(tag);
    else activeTags.add(tag);
    applyChipsUI(); renderList();
  });
});
chipAll.addEventListener("click", ()=>{
  activeTags = new Set(chips.map(c=>c.dataset.tag));
  applyChipsUI(); renderList();
});

/* ================== 리스트 렌더 ================== */
function renderList(){
  listEl.innerHTML = "";
  BOOTHS
    .filter(b => activeTags.has(b.tag))
    .sort((a,b)=>a.num-b.num)
    .forEach(b=>{
      const node = tpl.content.cloneNode(true);
      const root = node.querySelector(".item");
      root.dataset.booth = b.id;
      node.querySelector(".badge").textContent = b.num;
      node.querySelector(".title").textContent = b.name;
      node.querySelector(".desc").textContent = b.desc;

      // “지도에서 보기”
      node.querySelector(".view-btn").addEventListener("click", (e)=>{
        e.stopPropagation();
        focusBooth(b.id, {highlight:true});
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      // 카드 전체 터치도 이동
      root.addEventListener("click", ()=>{
        focusBooth(b.id, {highlight:true});
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      listEl.appendChild(node);
    });
}
renderList();

/* ================== SVG Pan/Zoom ================== */
let svgRoot=null, vb=null, vb0=null, isPanning=false, panStart, vbStart;

mapObj.addEventListener("load", ()=>{
  const doc = mapObj.contentDocument;
  if(!doc) return;
  svgRoot = doc.documentElement;

  // viewBox 보정
  if(!svgRoot.viewBox || !svgRoot.viewBox.baseVal){
    const w = parseFloat(svgRoot.getAttribute("width")) || 1000;
    const h = parseFloat(svgRoot.getAttribute("height")) || 600;
    svgRoot.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  const bv = svgRoot.viewBox.baseVal;
  vb = {x:bv.x, y:bv.y, width:bv.width, height:bv.height};
  vb0 = {...vb};

  // 부스 클릭 → 리스트 강조
  bindBoothClicks();

  // 팬/휠 줌
  svgRoot.addEventListener("pointerdown", onPanStart);
  svgRoot.addEventListener("pointermove", onPanMove);
  window.addEventListener("pointerup", onPanEnd);
  svgRoot.addEventListener("wheel", onWheel, {passive:false});
});

function setViewBox(x,y,w,h){
  vb = {x,y,width:w,height:h};
  svgRoot.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
}
function onPanStart(e){ isPanning=true; panStart={x:e.clientX,y:e.clientY}; vbStart={...vb}; svgRoot.setPointerCapture(e.pointerId); }
function onPanMove(e){
  if(!isPanning) return;
  const dx=e.clientX-panStart.x, dy=e.clientY-panStart.y;
  const sx = vbStart.width / mapObj.clientWidth;
  const sy = vbStart.height/ mapObj.clientHeight;
  setViewBox(vbStart.x - dx*sx, vbStart.y - dy*sy, vb.width, vb.height);
}
function onPanEnd(e){ if(!isPanning) return; isPanning=false; svgRoot.releasePointerCapture(e.pointerId); }
function onWheel(e){
  e.preventDefault();
  const k = e.deltaY>0 ? 1.1 : 1/1.1;
  const pt = clientToSvg({x:e.clientX,y:e.clientY});
  const nx = pt.x - (pt.x - vb.x)*k;
  const ny = pt.y - (pt.y - vb.y)*k;
  setViewBox(nx, ny, vb.width*k, vb.height*k);
}
function clientToSvg({x,y}){
  const inv = svgRoot.getScreenCTM().inverse();
  return { x: x*inv.a + y*inv.c + inv.e, y: x*inv.b + y*inv.d + inv.f };
}
zoomInBtn.addEventListener("click", ()=> quickZoom(1/1.25));
zoomOutBtn.addEventListener("click", ()=> quickZoom(1.25));
resetViewBtn.addEventListener("click", ()=> setViewBox(vb0.x,vb0.y,vb0.width,vb0.height));
function quickZoom(f){
  const r = mapObj.getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;
  const pt=clientToSvg({x:cx,y:cy});
  const nx = pt.x - (pt.x - vb.x)*f;
  const ny = pt.y - (pt.y - vb.y)*f;
  setViewBox(nx, ny, vb.width*f, vb.height*f);
}

/* ================== 포커스/하이라이트 ================== */
function focusBooth(boothId, {highlight=false}={}){
  if(!svgRoot) return;
  const t = svgRoot.getElementById(boothId);
  if(!t) return console.warn("부스 없음:", boothId);

  const b = t.getBBox();
  const pad = Math.max(b.width, b.height)*0.7;
  const w = Math.max(b.width+pad, vb0.width*0.1);
  const h = w * (vb.height/vb.width);
  const x = b.x + b.width/2 - w/2;
  const y = b.y + b.height/2 - h/2;

  animateViewBox({x,y,width:w,height:h}, 260);
  if(highlight){ t.classList.add("svg-highlight"); setTimeout(()=>t.classList.remove("svg-highlight"), 1500); }
}
function animateViewBox(goal, ms=260){
  const s={...vb}; const t0=performance.now();
  const ease=t=>t<.5?2*t*t:1-(-2*t+2)**2/2;
  function frame(now){
    const p=Math.min(1,(now-t0)/ms), k=ease(p);
    setViewBox(s.x+(goal.x-s.x)*k, s.y+(goal.y-s.y)*k, s.width+(goal.width-s.width)*k, s.height+(goal.height-s.height)*k);
    if(p<1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ================== SVG 내부 클릭 → 리스트 강조 ================== */
function bindBoothClicks(){
  svgRoot.querySelectorAll("[id^='booth-']").forEach(el=>{
    el.style.cursor = "pointer";
    el.addEventListener("click", ()=>{
      const id = el.id;
      const card = listEl.querySelector(`.item[data-booth='${id}']`);
      if(card){
        panel.scrollIntoView({behavior:"smooth"});
        card.style.outline = "2px solid var(--hi)";
        setTimeout(()=> card.style.outline = "none", 1000);
      }
    });
  });
}
