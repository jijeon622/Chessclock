function setRealHeight(){
    document.documentElement.style.setProperty('--vh', window.innerHeight*0.01+'px')
}
setRealHeight()
window.addEventListener('resize',setRealHeight)

/* ===== 시계 로직 ===== */
let w=600,b=600,increment=0
let turn=null,last=0,running=false,paused=true,over=false
const controlBtn = document.getElementById("controlBtn")
const W = document.getElementById("white")
const B = document.getElementById("black")
const body=document.body,barEl=document.getElementById("bar")

function now(){return performance.now()/1000}

function fmt(t){
    t=Math.max(0,t)
    let m=Math.floor(t/60)
    let s=Math.floor(t%60)
    let ms=Math.floor((t%1)*1000)
    return m+":"+String(s).padStart(2,'0')+"."+String(ms).padStart(3,'0')
}

function loop(){
    if(running&&!paused&&!over&&turn){
        let dt=now()-last
        if(turn==='w')w-=dt;
        else b-=dt
        last=now()
        if(w<=0||b<=0){over=true;running=false;body.classList.add("flash")}
    }
    render()
    requestAnimationFrame(loop)
}
loop()

function render(){
    const wStr = fmt(w);
    const bStr = fmt(b);
    const [wMain, wMs] = wStr.split(".");
    const [bMain, bMs] = bStr.split(".");
    W.innerHTML = `${wMain}<span class="ms">.${wMs}</span>`;
    B.innerHTML = `${bMain}<span class="ms">.${bMs}</span>`;
    W.classList.remove("active","paused-active")
    B.classList.remove("active","paused-active")
    if(running && turn==='w'){
        if(paused){
            W.classList.add("active","paused-active")
        }else{
            W.classList.add("active")
        }
    }
    if(running && turn==='b'){
        if(paused){
            B.classList.add("active","paused-active")
        }else{
            B.classList.add("active")
        }
    }
    W.classList.toggle("danger",w<=10)
    B.classList.toggle("danger",b<=10)
}

async function startClock(){
    await requestWakeLock();
    w=parseFloat(wsec.value)||0
    b=parseFloat(bsec.value)||0
    increment=parseFloat(inc.value)||0
    running=true;paused=false;over=false
    body.classList.remove("flash")
    turn='w'; last=now()
    setup.style.display="none"
    barEl.style.display="flex"
    controlBtn.textContent = "Pause"
}

function press(s){
    if(!running||paused||over||turn!==s) return
    if(s==='w'){w+=increment;turn='b'}
    else{b+=increment;turn='w'}
    last=now()
}

controlBtn.onclick = () => {
    if (!running || over) return
    if (!paused) {
        paused = true
        controlBtn.textContent = "Resume"
    }
    else {
        paused = false
        last = now()
        controlBtn.textContent = "Pause"
    }
}

function pauseClock(){
    paused = true
}

function resumeClock(){
    paused = false
    last = now()
}

function resetClock(){
    running=false;paused=true;over=false
    body.classList.remove("flash")
    setup.style.display="block"
    barEl.style.display="none"
    controlBtn.textContent = "Pause"
}

W.onpointerdown = ()=>press('w')
B.onpointerdown = ()=>press('b')
document.onkeydown=e=>{
    if(e.code==='Space')press(turn)
}
let wakeLock = null;

async function requestWakeLock() {
    if (wakeLock !== null) return;
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock 활성화');

        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock 해제됨');
            wakeLock = null; // 해제되면 다시 null로 초기화해주는 것이 안전합니다.
        });
    } catch (err) {
        console.error(`Wake Lock 실패: ${err.name}, ${err.message}`);
    }
}

// 화면 다시 켜졌을 때 다시 요청
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        // 화면이 다시 보일 때만 재요청
        await requestWakeLock();
    }
});