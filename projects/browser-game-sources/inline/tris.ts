const HU='X',AI='O';
type Player = typeof HU | typeof AI;
type Outcome = { p: Player | 'draw'; line: number[] };
const LINES: number[][]=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let board: Array<Player | null>=[];
let over=false;
const tally={hu:0,ai:0,dr:0};

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required game element: #${id}`);
  return element as T;
}

function init(aiFirst: boolean): void{
  board=Array(9).fill(null);over=false;
  render();
  msg('Your turn — you are X');
  if(aiFirst)aiMove();
}

function winner(b: Array<Player | null>): Outcome | null{
  for(const l of LINES)if(b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[1]]===b[l[2]])return{p:b[l[0]]!,line:l};
  if(b.every(Boolean))return{p:'draw',line:[]};
  return null;
}

// Minimax with depth preference: win fast, lose slow. Unbeatable.
function minimax(b: Array<Player | null>,player: Player,depth: number):{score:number;move?:number}{
  const w=winner(b);
  if(w){
    if(w.p===AI)return{score:10-depth};
    if(w.p===HU)return{score:depth-10};
    return{score:0};
  }
  let best={score:player===AI?-Infinity:Infinity,move:-1};
  for(let i=0;i<9;i++){
    if(b[i])continue;
    b[i]=player;
    const r=minimax(b,player===AI?HU:AI,depth+1);
    b[i]=null;
    if(player===AI?r.score>best.score:r.score<best.score)best={score:r.score,move:i};
  }
  return best;
}

function aiMove(): void{
  if(over)return;
  const empty=board.filter(c=>!c).length;
  // first move on empty board: center or corner, no need to search 9!
  const move=empty===9?[0,2,4,6,8][Math.floor(Math.random()*5)]:(minimax(board,AI,0).move ?? board.findIndex(cell=>!cell));
  board[move]=AI;
  finishTurn(AI);
}

function finishTurn(mover: Player): void{
  const w=winner(board);
  render(w);
  if(w){
    over=true;
    if(w.p===HU){tally.hu++;msg('🎉 You win!');}
    else if(w.p===AI){tally.ai++;msg('🤖 AI wins.');}
    else{tally.dr++;msg('Draw.');}
    updateTally();
  }else{
    msg(mover===HU?'AI is thinking...':'Your turn');
  }
}

function render(w: Outcome | null=null): void{
  const el=byId('board');el.innerHTML='';
  board.forEach((v,i)=>{
    const c=document.createElement('div');
    c.className='cell'+(v==='X'?' x':v==='O'?' o':'')+(w&&w.line.includes(i)?' win':'');
    c.textContent=v||'';
    c.onclick=()=>{
      if(over||board[i])return;
      board[i]=HU;
      finishTurn(HU);
      if(!over)setTimeout(aiMove,300);
    };
    el.appendChild(c);
  });
}

function msg(m: string): void{byId('msg').textContent=m;}
function updateTally(): void{byId('score').textContent='You '+tally.hu+' · AI '+tally.ai+' · Draws '+tally.dr;}
byId<HTMLButtonElement>('btn-new').onclick=()=>init(false);
byId<HTMLButtonElement>('btn-first').onclick=()=>init(true);
init(false);
