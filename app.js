/* ================== 데이터 ================== */
const BOOTHS = [
  { id:"booth-1", num:1, name:"피지카스트로", desc:"망원경 체험, 회절격자 분광기 제작", tag:"sci" },
  { id:"booth-2", num:2, name:"뉴턴", desc:"텐세그리티 만들기", tag:"sci" },
  { id:"booth-3", num:3, name:"늘품", desc:"탱탱볼 만들기", tag:"sci" },
  { id:"booth-4", num:4, name:"도담", desc:"오호 만들기", tag:"sci" },
  { id:"booth-5", num:5, name:"리사", desc:"혈액샘플만들기", tag:"sci" },
  { id:"booth-6", num:6, name:"실험의 숲", desc:"업사이클링 씨글라스 공예", tag:"sci" },
  { id:"booth-7", num:7, name:"심쿵", desc:"염기서열 팔찌와 DNA 젤리 모형 만들기", tag:"sci" },
  { id:"booth-8", num:8, name:"아스클레오피스", desc:"간이현미경 만들기, 폴드스코프 만들기", tag:"sci" },
  { id:"booth-9", num:9, name:"에어로테크", desc:"글라이더 제작 및 비행 원리 체험", tag:"sci" },
  { id:"booth-10", num:10, name:"티아", desc:"친환경 천연 입욕제 만들기", tag:"sci" },
  { id:"booth-11", num:11, name:"폴리머", desc:"라바램프만들기", tag:"sci" },
  { id:"booth-12", num:12, name:"그레이스", desc:"호박 화석 비누 만들기", tag:"sci" },
  { id:"booth-13", num:13, name:"하람", desc:"마리모 키우기, 장기 키링 만들기", tag:"sci" },
  { id:"booth-14", num:14, name:"아리솔", desc:"지문, 혈액 체취 및 추리 활동", tag:"sci" },
  { id:"booth-15", num:15, name:"데이터무제한", desc:"피지컬 컴퓨팅을 통한 프로그램의 시각화 체험", tag:"ai" },
  { id:"booth-16", num:16, name:"세미콜론", desc:"게임으로 배우는 인공지능", tag:"ai" },
  { id:"booth-17", num:17, name:"매드매쓰", desc:"위상 수학과 베이글, 게임이론", tag:"math" },
  { id:"booth-18", num:18, name:"수학에복종", desc:"이항분포기와 프렉탈 체험", tag:"math" },
  { id:"booth-19", num:19, name:"앱실론", desc:"쭈온쭈온, 정다면체 만들기", tag:"math" },
  { id:"booth-20", num:20, name:"에어로테크", desc:"패러글라이딩 체험", tag:"guitar" },
  { id:"booth-21", num:21, name:"아페토", desc:"학교투어", tag:"guitar" },
  { id:"booth-22", num:22, name:"온에어(방송부)", desc:"보이는 라디오 진행 체험", tag:"guitar" },
  { id:"booth-23", num:23, name:"학생회", desc:"운영본부", tag:"guitar" }
];

/* ================== 태그 → 라벨 매핑 ================== */
const TAG_LABEL = {
  sci: "과학탐구",
  ai: "인공지능",
  math: "수학 탐구",
  guitar: "기타계열"
};

/* ================== DOM 요소 ================== */
const mapObj = document.getElementById("mapSvg");
const panel = document.getElementById("panel");
const panelToggle = document.getElementById("panelToggle");
const listEl = document.getElementById("list");
const tpl = document.getElementById("itemTpl");
const chipsWrap = document.querySelector(".chips");
let chips = [];                 // 동적 생성 후 채움
let chipAll = null;

const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetViewBtn = document.getElementById("resetViewBtn");

/* ================== 칩 보장/생성 ================== */
function ensureChips() {
  // 데이터에서 실제 존재하는 태그 수집
  const tags = Array.from(new Set(BOOTHS.map(b => b.tag)));

  // "전체" 버튼이 없으면 생성
  chipAll = document.getElementById("chipAll");
  if (!chipAll) {
    chipAll = document.createElement("button");
    chipAll.id = "chipAll";
    chipAll.className = "chip chip-outline";
    chipAll.textContent = "전체";
    chipAll.setAttribute("aria-pressed", "false");
    chipsWrap.appendChild(chipAll);
  }

  // 각 태그 칩이 없으면 생성
  tags.forEach(tag => {
    let btn = chipsWrap.querySelector(`.chip[data-tag="${tag}"]`);
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "chip";
      btn.dataset.tag = tag;
      btn.textContent = TAG_LABEL[tag] || tag;
      btn.setAttribute("aria-pressed", "true"); // 초기 on
      btn.classList.add("is-active");
      chipsWrap.insertBefore(btn, chipAll); // "전체" 앞에 배치
    }
  });

  // chips 리스트 갱신
  chips = Array.from(chipsWrap.querySelectorAll('.chip[data-tag]'));
}

/* ================== 패널 토글 ================== */
panelToggle.addEventListener("click", () => {
  panel.classList.toggle("expanded");
});

/* ================== 칩 필터 (+ 접근성) ================== */
let activeTags = new Set(); // ensureChips 이후 세팅

function applyChipsUI() {
  chips.forEach(c => {
    const on = activeTags.has(c.dataset.tag);
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function bindChipEvents() {
  chips.forEach(c => {
    c.onclick = () => {
      const tag = c.dataset.tag;
      if (activeTags.has(tag)) activeTags.delete(tag);
      else activeTags.add(tag);
      applyChipsUI();
      renderList();
    };
  });

  chipAll.onclick = () => {
    // 전체 활성화
    activeTags = new Set(chips.map(c => c.dataset.tag));
    applyChipsUI();
    chipAll.setAttribute("aria-pressed", "false");
    renderList();
  };
}

/* ================== 리스트 렌더 ================== */
function renderList() {
  listEl.innerHTML = "";
  BOOTHS
    .filter(b => activeTags.has(b.tag))
    .sort((a,b)=>a.num-b.num)
    .forEach(b => {
      const node = tpl.content.cloneNode(true);
      const root = node.querySelector(".item");
      root.dataset.booth = b.id;

      const badgeEl = node.querySelector(".badge");
      badgeEl.textContent = b.num;
      badgeEl.dataset.tag = b.tag; // 태그별 배지 색상 자동

      node.querySelector(".title").textContent = b.name;
      node.querySelector(".desc").textContent = b.desc;

      const goFocus = ()=>{
        focusBooth(b.id, {highlight:true});
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      node.querySelector(".view-btn").addEventListener("click", (e)=>{ e.stopPropagation(); goFocus(); });
      root.addEventListener("click", goFocus);

      listEl.appendChild(node);
    });
}

/* ================== 초기 칩 준비 & 렌더 ================== */
ensureChips();
activeTags = new Set(chips.map(c => c.dataset.tag)); // 초기: 모두 ON
applyChipsUI();
bindChipEvents();
renderList();

/* ================== SVG Pan/Zoom ================== */
let svgRoot=null, vb=null, vb0=null;
let isPanning=false, panStart=null, vbStart=null;
let panDX=0, panDY=0;
let pinchStartDist=null, pinchStartVB=null, pinchCenterSvg=null;

/* 유틸 */
function setViewBox(x,y,w,h){ vb={x,y,width:w,height:h}; svgRoot.setAttribute("viewBox",`${x} ${y} ${w} ${h}`); }
function clientToSvg({x,y}){ const inv=svgRoot.getScreenCTM().inverse(); return {x:x*inv.a+y*inv.c+inv.e, y:x*inv.b+y*inv.d+inv.f}; }
function distance(t1,t2){ return Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY); }
function midpoint(t1,t2){ return {x:(t1.clientX+t2.clientX)/2, y:(t1.clientY+t2.clientY)/2}; }

/* 부드러운 팬 루프 */
function drawLoop(){
  if(isPanning && vbStart){
    const sx = vbStart.width / mapObj.clientWidth;
    const sy = vbStart.height/ mapObj.clientHeight;
    setViewBox(vbStart.x - panDX*sx, vbStart.y - panDY*sy, vb.width, vb.height);
  }
  requestAnimationFrame(drawLoop);
}

/* SVG 로드 */
mapObj.addEventListener("load", ()=>{
  const doc = mapObj.contentDocument;
  if(!doc) return;
  svgRoot = doc.documentElement;
  svgRoot.style.touchAction = "none";

  if(!svgRoot.viewBox || !svgRoot.viewBox.baseVal){
    const w=parseFloat(svgRoot.getAttribute("width"))||1000;
    const h=parseFloat(svgRoot.getAttribute("height"))||600;
    svgRoot.setAttribute("viewBox",`0 0 ${w} ${h}`);
  }
  const bv=svgRoot.viewBox.baseVal;
  vb={x:bv.x,y:bv.y,width:bv.width,height:bv.height};
  vb0={...vb};

  bindBoothClicks();

  svgRoot.addEventListener("pointerdown", onPointerDown,{passive:false});
  svgRoot.addEventListener("pointermove", onPointerMove,{passive:false});
  window.addEventListener("pointerup", onPointerUp,{passive:false});
  svgRoot.addEventListener("wheel", onWheel,{passive:false});
  svgRoot.addEventListener("touchstart", onTouchStart,{passive:false});
  svgRoot.addEventListener("touchmove", onTouchMove,{passive:false});
  svgRoot.addEventListener("touchend", onTouchEnd,{passive:false});

  requestAnimationFrame(drawLoop);
});

/* 팬 */
function onPointerDown(e){
  if(e.isPrimary){
    e.preventDefault();
    isPanning=true; panStart={x:e.clientX,y:e.clientY}; vbStart={...vb}; panDX=0; panDY=0;
    try{svgRoot.setPointerCapture(e.pointerId);}catch(_){}
  }
}
function onPointerMove(e){
  if(!isPanning) return;
  e.preventDefault();
  panDX=e.clientX-panStart.x; panDY=e.clientY-panStart.y;
}
function onPointerUp(e){
  if(!isPanning) return;
  e.preventDefault();
  isPanning=false;
  try{svgRoot.releasePointerCapture(e.pointerId);}catch(_){}
}

/* 휠 줌 */
function onWheel(e){
  e.preventDefault();
  const k=e.deltaY>0?1.1:1/1.1;
  const pt=clientToSvg({x:e.clientX,y:e.clientY});
  const nx=pt.x-(pt.x-vb.x)*k, ny=pt.y-(pt.y-vb.y)*k;
  setViewBox(nx,ny,vb.width*k,vb.height*k);
}

/* 핀치 줌 */
function onTouchStart(e){
  if(e.touches.length===2){
    e.preventDefault();
    const [t1,t2]=e.touches;
    pinchStartDist=distance(t1,t2);
    pinchStartVB={...vb};
    const mid=midpoint(t1,t2);
    pinchCenterSvg=clientToSvg(mid);
  }
}
function onTouchMove(e){
  if(e.touches.length===2 && pinchStartDist){
    e.preventDefault();
    const [t1,t2]=e.touches;
    const dist=distance(t1,t2);
    const scale=pinchStartDist?(pinchStartDist/dist):1;
    const k=scale;
    const nx=pinchCenterSvg.x-(pinchCenterSvg.x-pinchStartVB.x)*k;
    const ny=pinchCenterSvg.y-(pinchCenterSvg.y-pinchStartVB.y)*k;
    const nw=pinchStartVB.width*k;
    const nh=pinchStartVB.height*k;
    setViewBox(nx,ny,nw,nh);
  }
}
function onTouchEnd(e){
  if(e.touches.length<2){
    pinchStartDist=null; pinchStartVB=null; pinchCenterSvg=null;
  }
}

/* 버튼 줌 */
zoomInBtn.addEventListener("click",()=>quickZoom(1/1.25));
zoomOutBtn.addEventListener("click",()=>quickZoom(1.25));
resetViewBtn.addEventListener("click",()=>setViewBox(vb0.x,vb0.y,vb0.width,vb0.height));
function quickZoom(f){
  const r=mapObj.getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;
  const pt=clientToSvg({x:cx,y:cy});
  const nx=pt.x-(pt.x-vb.x)*f, ny=pt.y-(pt.y-vb.y)*f;
  setViewBox(nx,ny,vb.width*f,vb.height*f);
}

/* 부스 포커스 */
function focusBooth(boothId,{highlight=false}={}){
  if(!svgRoot)return;
  const t=svgRoot.getElementById(boothId);
  if(!t)return console.warn("부스 없음:",boothId);
  const b=t.getBBox();
  const pad=Math.max(b.width,b.height)*0.7;
  const w=Math.max(b.width+pad,vb0.width*0.1);
  const h=w*(vb.height/vb.width);
  const x=b.x+b.width/2-w/2;
  const y=b.y+b.height/2-h/2;
  animateViewBox({x,y,width:w,height:h},260);
  if(highlight){
    t.classList.add("svg-highlight");
    setTimeout(()=>t.classList.remove("svg-highlight"),1500);
  }
}
function animateViewBox(goal,ms=260){
  const s={...vb}; const t0=performance.now();
  const ease=t=>t<.5?2*t*t:1-(-2*t+2)**2/2;
  function frame(now){
    const p=Math.min(1,(now-t0)/ms),k=ease(p);
    setViewBox(s.x+(goal.x-s.x)*k,s.y+(goal.y-s.y)*k,s.width+(goal.width-s.width)*k,s.height+(goal.height-s.height)*k);
    if(p<1)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* 부스 클릭 → 리스트 강조 */
function bindBoothClicks(){
  svgRoot.querySelectorAll("[id^='booth-']").forEach(el=>{
    el.style.cursor="pointer";
    el.addEventListener("click",()=>{
      const id=el.id;
      const card=listEl.querySelector(`.item[data-booth='${id}']`);
      if(card){
        panel.classList.add("expanded");
        card.scrollIntoView({behavior:"smooth",block:"center"});
        card.style.outline="2px solid var(--hi)";
        setTimeout(()=>card.style.outline="none",1000);
      }
    });
  });
}
