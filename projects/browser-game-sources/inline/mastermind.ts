const NUM_COLORS=6, CODE_LENGTH=4, MAX_GUESSES=10;
const COLORS=['#dc3232','#32b432','#3278dc','#f0c832','#dc5adc','#f08c1e'];
const COLOR_NAMES=['Red','Green','Blue','Yellow','Pink','Orange'];

type GuessRow = { pegs: Array<number | null>; black: number; white: number; submitted: boolean };
let secret: number[]=[];
let rows: GuessRow[]=[];
let currentRow=0;
let selectedSlot: number | null=null;
let gameOver=false;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required game element: #${id}`);
  return element as T;
}

function isCompleteGuess(pegs: Array<number | null>): pegs is number[] {
  return pegs.every((peg): peg is number => peg !== null);
}

function initGame(){
  secret=Array.from({length:CODE_LENGTH},()=>Math.floor(Math.random()*NUM_COLORS));
  rows=Array.from({length:MAX_GUESSES},(): GuessRow=>({pegs:Array(CODE_LENGTH).fill(null),black:0,white:0,submitted:false}));
  currentRow=0;selectedSlot=null;gameOver=false;
  renderBoard();renderSelector();updateUI();
  byId('secret-reveal').style.display='none';
  byId('message').textContent='Click a peg slot, then pick a color';
  byId('message').className='';
}

function scoreGuess(guess: number[]): [number, number]{
  let black=0,white=0;
  const sCopy=[...secret],gCopy=[...guess];
  for(let i=0;i<CODE_LENGTH;i++)if(gCopy[i]===sCopy[i]){black++;sCopy[i]=-1;gCopy[i]=-2;}
  for(let i=0;i<CODE_LENGTH;i++)if(gCopy[i]>=0){
    const idx=sCopy.indexOf(gCopy[i]);
    if(idx>=0){white++;sCopy[idx]=-1;}
  }
  return[black,white];
}

function renderBoard(){
  const board=byId('board');
  board.innerHTML='';
  for(let r=0;r<MAX_GUESSES;r++){
    const row=rows[r];
    const div=document.createElement('div');
    div.className='row'+(r===currentRow&&!gameOver?' active':'');
    div.innerHTML=`<span class="row-label">${r+1}</span><div class="pegs" id="pegs-${r}"></div><div class="hints" id="hints-${r}"></div>`;
    const pegsDiv=div.querySelector<HTMLElement>(`#pegs-${r}`)!;
    for(let p=0;p<CODE_LENGTH;p++){
      const peg=document.createElement('div');
      peg.className='peg'+(row.pegs[p]!==null?' filled':'');
      peg.dataset.row=String(r);peg.dataset.slot=String(p);
      const color=row.pegs[p];
      if(color!==null)peg.style.background=COLORS[color];
      if(r===currentRow&&!gameOver){
        peg.onclick=()=>selectSlot(p);
      }
      pegsDiv.appendChild(peg);
    }
    const hintsDiv=div.querySelector<HTMLElement>(`#hints-${r}`)!;
    if(row.submitted){
      for(let h=0;h<row.black;h++){const d=document.createElement('div');d.className='hint black';hintsDiv.appendChild(d);}
      for(let h=0;h<row.white;h++){const d=document.createElement('div');d.className='hint white';hintsDiv.appendChild(d);}
      const empty=CODE_LENGTH-row.black-row.white;
      for(let h=0;h<empty;h++){const d=document.createElement('div');d.className='hint';hintsDiv.appendChild(d);}
    } else {
      for(let h=0;h<CODE_LENGTH;h++){const d=document.createElement('div');d.className='hint';hintsDiv.appendChild(d);}
    }
    board.appendChild(div);
  }
}

function renderSelector(){
  const sel=byId('selector');
  sel.innerHTML='';
  for(let c=0;c<NUM_COLORS;c++){
    const sw=document.createElement('div');
    sw.className='swatch';
    sw.style.background=COLORS[c];
    sw.title=COLOR_NAMES[c];
    sw.onclick=()=>selectColor(c);
    sel.appendChild(sw);
  }
}

function selectSlot(slot: number): void{
  if(gameOver)return;
  selectedSlot=slot;
  // Highlight the slot
  const pegs=document.querySelectorAll<HTMLElement>(`#pegs-${currentRow} .peg`);
  pegs.forEach((p,i)=>{
    if(i===slot)p.style.borderColor='#60a5fa';
    else p.style.borderColor=rows[currentRow].pegs[i]!==null?'#475569':'#334155';
  });
  byId('message').textContent=`Slot ${slot+1} selected - pick a color`;
}

function selectColor(color: number): void{
  if(gameOver||selectedSlot===null)return;
  rows[currentRow].pegs[selectedSlot]=color;
  selectedSlot=null;
  renderBoard();
  updateUI();
  // Auto-advance to next empty slot
  const nextEmpty=rows[currentRow].pegs.indexOf(null);
  if(nextEmpty>=0&&rows[currentRow].pegs.filter(p=>p!==null).length<CODE_LENGTH){
    // Don't auto-select, let user click
  }
}

function updateUI(){
  const canSubmit=rows[currentRow].pegs.every(p=>p!==null)&&!gameOver;
  byId<HTMLButtonElement>('btn-submit').disabled=!canSubmit;
  if(gameOver)return;
  const filled=rows[currentRow].pegs.filter(p=>p!==null).length;
  if(filled===CODE_LENGTH) byId('message').textContent='Ready to submit!';
  else if(selectedSlot===null) byId('message').textContent=`Slot ${filled+1} of ${CODE_LENGTH} - click a peg slot`;
}

byId<HTMLButtonElement>('btn-submit').onclick=()=>{
  if(gameOver)return;
  const row=rows[currentRow];
  if(!isCompleteGuess(row.pegs))return;
  const[b,w]=scoreGuess(row.pegs);
  row.black=b;row.white=w;row.submitted=true;
  if(b===CODE_LENGTH){
    gameOver=true;
    byId('message').textContent='🎉 You cracked the code!';
    byId('message').className='win';
    revealSecret();
  } else if(currentRow===MAX_GUESSES-1){
    gameOver=true;
    byId('message').textContent='Out of guesses!';
    byId('message').className='lose';
    revealSecret();
  } else {
    currentRow++;
    selectedSlot=null;
    byId('message').textContent=`${b} exact, ${b+w} correct color`;
  }
  renderBoard();updateUI();
};

byId<HTMLButtonElement>('btn-reset').onclick=initGame;

function revealSecret(){
  const div=byId('secret-reveal');
  div.style.display='flex';
  div.innerHTML='<span style="font-size:0.75rem;color:#64748b">Secret:</span>';
  for(let i=0;i<CODE_LENGTH;i++){
    const p=document.createElement('div');
    p.className='peg';
    p.style.background=COLORS[secret[i]];
    div.appendChild(p);
  }
}

initGame();
