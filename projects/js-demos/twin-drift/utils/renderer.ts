import { GameState } from '../types';
import { COLORS, GAME_CONFIG } from '../constants';

export function renderGame(
  ctx: CanvasRenderingContext2D, 
  state: GameState, 
  width: number, 
  height: number,
  isPaused: boolean
) {
  const scale = width / GAME_CONFIG.LANE_WIDTH;
  const laneWidth = GAME_CONFIG.LANE_WIDTH;
  const logicalCenterX = laneWidth / 2;

  // 1. Background
  ctx.fillStyle = COLORS.LIGHT_BG;
  ctx.fillRect(0, 0, width/2, height);
  ctx.fillStyle = COLORS.DARK_BG;
  ctx.fillRect(width/2, 0, width/2, height);

  // 2. Subtle BG Animation
  ctx.save();
  const bgOffset = state.distance % 200;
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 4;
  // Left Pattern
  for (let i = -200; i < height + 200; i+= 100) {
      ctx.beginPath();
      ctx.moveTo(0, i + bgOffset * scale); // Scale offset visually
      ctx.lineTo(width/2, i + bgOffset * scale - 50);
      ctx.stroke();
  }
  // Right Pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = -200; i < height + 200; i+= 100) {
      ctx.beginPath();
      ctx.moveTo(width/2, i + bgOffset * scale - 50);
      ctx.lineTo(width, i + bgOffset * scale);
      ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.scale(scale, scale);

  // 3. Center Wall
  const wallHalf = GAME_CONFIG.CENTER_WALL_WIDTH / 2;
  const renderHeight = height / scale;
  
  ctx.fillStyle = '#555';
  ctx.fillRect(logicalCenterX - wallHalf, -200, wallHalf * 2, renderHeight + 400);

  // Redraw Gaps (masking the wall)
  state.obstacles.filter(o => o.type === 'gap').forEach(gap => {
      ctx.fillStyle = COLORS.LIGHT_BG;
      ctx.fillRect(logicalCenterX - 50, gap.y, 50, gap.height);
      ctx.fillStyle = COLORS.DARK_BG;
      ctx.fillRect(logicalCenterX, gap.y, 50, gap.height);
  });

  // 4. Spikes
  state.obstacles.filter(o => o.type === 'spike').forEach(spike => {
      ctx.beginPath();
      if (spike.side === 'left') {
        ctx.fillStyle = COLORS.DARK_BG;
        ctx.moveTo(logicalCenterX - wallHalf, spike.y - spike.height/2);
        ctx.lineTo(logicalCenterX - wallHalf - spike.width, spike.y);
        ctx.lineTo(logicalCenterX - wallHalf, spike.y + spike.height/2);
      } else {
        ctx.fillStyle = COLORS.LIGHT_BG;
        ctx.moveTo(logicalCenterX + wallHalf, spike.y - spike.height/2);
        ctx.lineTo(logicalCenterX + wallHalf + spike.width, spike.y);
        ctx.lineTo(logicalCenterX + wallHalf, spike.y + spike.height/2);
      }
      ctx.fill();
  });

  // 5. Orbs
  state.orbs.filter(o => o.active).forEach(orb => {
      if (orb.type === 'split') {
        ctx.fillStyle = COLORS.SPLIT_ORB;
        ctx.shadowColor = COLORS.SPLIT_ORB;
      } else {
        ctx.fillStyle = COLORS.ORB;
        ctx.shadowColor = COLORS.ORB;
      }
      
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Inner detail
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      if (orb.type === 'split') {
        ctx.rect(orb.x - orb.radius/2, orb.y - orb.radius/2, orb.radius, orb.radius);
      } else {
        ctx.arc(orb.x, orb.y, orb.radius/2, 0, Math.PI*2);
      }
      ctx.fill();
  });

  // 6. Particles
  state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 20px Space Mono';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Particles get smaller as they fade
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
  });
  ctx.globalAlpha = 1.0;

  // 7. Balls
  state.balls.forEach(ball => {
      if (!ball.active) return;
      
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Outline to ensure visibility on matching background
      ctx.strokeStyle = ball.color === COLORS.DARK_BG ? '#FFF' : '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
  });

  ctx.restore();

  // 8. HUD & Overlay
  if (isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#F3EAC2';
    ctx.font = 'bold 40px Space Mono';
    ctx.textAlign = 'center';
    ctx.fillText("PAUSED", width / 2, height / 2);
  } else {
    // Score
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Check if multiplier is active (2 balls)
    const activeBalls = state.balls.filter(b => b.active).length;
    const showMultiplier = activeBalls === 2;
    
    // Left HUD (Dark on Light BG)
    ctx.fillStyle = COLORS.DARK_BG;
    ctx.font = 'bold 24px Space Mono';
    ctx.fillText("SCORE", width * 0.25, 80);
    ctx.font = 'bold 72px Space Mono';
    ctx.fillText(state.score.toString(), width * 0.25, 140);
    if (showMultiplier) {
      ctx.font = 'bold 20px Space Mono';
      ctx.fillText("x2 MULTIPLIER", width * 0.25, 190);
    }
    
    // Right HUD (Light on Dark BG)
    ctx.fillStyle = COLORS.LIGHT_BG;
    ctx.font = 'bold 24px Space Mono';
    ctx.fillText("SCORE", width * 0.75, 80);
    ctx.font = 'bold 72px Space Mono';
    ctx.fillText(state.score.toString(), width * 0.75, 140);
    if (showMultiplier) {
      ctx.font = 'bold 20px Space Mono';
      ctx.fillText("x2 MULTIPLIER", width * 0.75, 190);
    }
  }
}
