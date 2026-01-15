import { GameState, Ball, Obstacle, Orb, Particle, PlayerInput } from '../types';
import { GAME_CONFIG, COLORS } from '../constants';

export const INITIAL_STATE: GameState = {
  balls: [], // Initialized in initGame
  obstacles: [],
  particles: [],
  orbs: [],
  score: 0,
  speed: GAME_CONFIG.SCROLL_SPEED_BASE,
  distance: 0,
  nextSpawnDistance: 800,
  isGameOver: false,
  frameCount: 0
};

export function initPhysics(): GameState {
  const laneWidth = GAME_CONFIG.LANE_WIDTH;
  
  // Calculate logical height to ensure balls appear at 75% of screen height regardless of resolution
  const scale = window.innerWidth / laneWidth;
  const logicalHeight = window.innerHeight / scale;
  const startY = logicalHeight * 0.75;

  return {
    ...INITIAL_STATE,
    balls: [
      { id: 1, x: laneWidth * 0.25, y: startY, vx: 0, radius: 16, color: COLORS.DARK_BG, active: true },
      { id: 2, x: laneWidth * 0.75, y: startY, vx: 0, radius: 16, color: COLORS.LIGHT_BG, active: true }
    ]
  };
}

export function updateGameState(
  state: GameState, 
  input: PlayerInput, 
  prevInput: PlayerInput
) {
  state.frameCount++;
  state.distance += state.speed;
  
  const activeCount = state.balls.filter(b => b.active).length;
  
  // Score Multiplier: 2x if both balls are active
  const multiplier = activeCount === 2 ? 2 : 1;
  state.score += Math.floor((state.speed / 10) * multiplier);
  
  // Speed Scaling
  state.speed = Math.min(GAME_CONFIG.MAX_SPEED, GAME_CONFIG.SCROLL_SPEED_BASE + (state.score / 2500));

  const laneWidth = GAME_CONFIG.LANE_WIDTH;
  const centerX = laneWidth / 2;
  const wallHalf = GAME_CONFIG.CENTER_WALL_WIDTH / 2;

  // --- BALLS PHYSICS ---
  state.balls.forEach(ball => {
    if (!ball.active) return;

    const isLeft = ball.x < centerX;
    
    // 1. Controls (Jump on Rising Edge)
    const triggerJump = isLeft 
      ? (input.leftPressed && !prevInput.leftPressed)
      : (input.rightPressed && !prevInput.rightPressed);

    // Check if grounded (touching center wall)
    const distToCenter = Math.abs(ball.x - centerX);
    const touchingWall = distToCenter <= wallHalf + ball.radius + 2; 

    // Jump Logic
    if (triggerJump && touchingWall) {
      const dir = isLeft ? -1 : 1;
      ball.vx = dir * 18; // Jump Force
      
      // Jump Particles
      for(let i=0; i<5; i++) {
        state.particles.push({
          id: Math.random(),
          x: ball.x + (isLeft ? ball.radius : -ball.radius),
          y: ball.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 0.5,
          maxLife: 0.5,
          color: ball.color,
          size: 3
        });
      }
    }

    // Gravity (Pulls to center)
    const gravityDir = ball.x < centerX ? 1 : -1;
    ball.vx += gravityDir * GAME_CONFIG.GRAVITY;

    // Apply Velocity
    ball.vx *= GAME_CONFIG.FRICTION;
    ball.x += ball.vx;

    // 2. Collisions
    // Check Gap
    const inGap = state.obstacles.some(obs => 
      obs.type === 'gap' && 
      obs.y < ball.y + ball.radius && 
      obs.y + obs.height > ball.y - ball.radius
    );

    if (!inGap) {
      // Wall Collision
      if (ball.x + ball.radius > centerX - wallHalf && ball.x - ball.radius < centerX + wallHalf) {
        if (ball.x < centerX) {
          ball.x = centerX - wallHalf - ball.radius;
        } else {
          ball.x = centerX + wallHalf + ball.radius;
        }
        ball.vx = 0;
      }
    }

    // Outer Walls (Bounce)
    if (ball.x < ball.radius) {
      ball.x = ball.radius;
      ball.vx *= -0.5;
    }
    if (ball.x > laneWidth - ball.radius) {
      ball.x = laneWidth - ball.radius;
      ball.vx *= -0.5;
    }

    // 3. Visuals (Color Switch)
    const targetColor = ball.x < centerX ? COLORS.DARK_BG : COLORS.LIGHT_BG;
    if (ball.color !== targetColor) {
      ball.color = targetColor;
      // Switch Particles
      for (let i = 0; i < 12; i++) {
        state.particles.push({
          id: Math.random(),
          x: ball.x,
          y: ball.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 0.8,
          maxLife: 0.8,
          color: targetColor === COLORS.DARK_BG ? COLORS.LIGHT_BG : COLORS.DARK_BG,
          size: Math.random() * 4 + 2
        });
      }
    }

    // Trail - Particles move "the other way" (down relative to ball if ball moves up, or just down with gravity)
    // Assuming "other way" means trailing behind. Since world moves down (+y), particles should move down.
    if (state.frameCount % 2 === 0) {
      state.particles.push({
        id: Math.random(),
        x: ball.x,
        y: ball.y,
        vx: ball.vx * 0.1, 
        vy: state.speed * 0.5, // Positive to move down (trail behind)
        life: 0.6,
        maxLife: 0.6,
        color: ball.color, 
        size: ball.radius * 0.6
      });
    }
  });

  // --- SPAWNER ---
  spawnObstacles(state);

  // --- OBSTACLES & COLLISION ---
  state.obstacles.forEach(obs => {
    obs.y += state.speed;

    if (obs.type === 'spike') {
      state.balls.forEach(ball => {
        if (!ball.active) return;

        const yDist = Math.abs(ball.y - obs.y);
        if (yDist < obs.height/2 + ball.radius * 0.8) {
          let hit = false;
          const ballLeft = ball.x - ball.radius * 0.8;
          const ballRight = ball.x + ball.radius * 0.8;

          if (obs.side === 'left') {
            const spikeRightEdge = centerX - wallHalf;
            const spikeLeftEdge = spikeRightEdge - obs.width;
            if (ballRight > spikeLeftEdge && ballLeft < spikeRightEdge) hit = true;
          } else if (obs.side === 'right') {
            const spikeLeftEdge = centerX + wallHalf;
            const spikeRightEdge = spikeLeftEdge + obs.width;
            if (ballLeft < spikeRightEdge && ballRight > spikeLeftEdge) hit = true;
          }
          
          if (hit) {
            // Explode ball
            ball.active = false;
            for (let k = 0; k < 20; k++) {
              state.particles.push({
                id: Math.random(),
                x: ball.x, y: ball.y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 1.0, maxLife: 1.0,
                color: ball.color,
                size: 6
              });
            }
          }
        }
      });
    }
  });
  state.obstacles = state.obstacles.filter(o => o.y < 2000);

  // Check Game Over
  if (state.balls.every(b => !b.active)) {
    state.isGameOver = true;
  }

  // --- ORBS ---
  state.orbs.forEach(orb => {
    orb.y += state.speed;
    if (orb.active) {
      state.balls.forEach(ball => {
        if (!ball.active) return;

        const dx = ball.x - orb.x;
        const dy = ball.y - orb.y;
        if (dx*dx + dy*dy < (ball.radius + orb.radius)**2) {
          orb.active = false;
          
          if (orb.type === 'score') {
            state.score += orb.value * multiplier; // Apply multiplier to orb value
            state.particles.push({
               id: Math.random(), x: orb.x, y: orb.y, vx: 0, vy: -2, life: 1.0, maxLife: 1.0, 
               color: COLORS.ORB, size: 0, text: `+${orb.value * multiplier}`
            });
            for(let k=0; k<8; k++) {
              state.particles.push({
                id: Math.random(), x: orb.x, y: orb.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                life: 0.7, maxLife: 0.7, color: COLORS.ORB, size: 5
              });
            }
          } else if (orb.type === 'split') {
            // Revive the inactive ball
            const inactiveBall = state.balls.find(b => !b.active);
            if (inactiveBall) {
              inactiveBall.active = true;
              inactiveBall.y = ball.y;
              // Place on opposite side of current ball
              if (ball.x < centerX) {
                inactiveBall.x = laneWidth * 0.75;
                inactiveBall.color = COLORS.LIGHT_BG;
              } else {
                inactiveBall.x = laneWidth * 0.25;
                inactiveBall.color = COLORS.DARK_BG;
              }
              inactiveBall.vx = 0;
              
              // Revive visual
              for(let k=0; k<20; k++) {
                state.particles.push({
                  id: Math.random(), x: inactiveBall.x, y: inactiveBall.y, 
                  vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                  life: 1.0, maxLife: 1.0, color: COLORS.SPLIT_ORB, size: 8
                });
              }
            }
          }
        }
      });
    }
  });
  state.orbs = state.orbs.filter(o => o.y < 2000 && (o.active || o.y < 2000));

  // --- PARTICLES ---
  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    // Note: Size scaling handled in renderer or here? 
    // Let's rely on renderer scaling by life for smoothness.
  });
  state.particles = state.particles.filter(p => p.life > 0);
}

function spawnObstacles(state: GameState) {
  if (state.distance < state.nextSpawnDistance) return;

  const spawnY = -200;
  const laneWidth = GAME_CONFIG.LANE_WIDTH;
  const centerX = laneWidth / 2;
  const activeBallsCount = state.balls.filter(b => b.active).length;
  
  // Tighter Spawning
  let nextGap = 250 + (state.speed * 12); 

  if (activeBallsCount === 2) {
    // TWO BALLS: Hard Mode, No Ground Breaks, More Orbs
    // Spikes only
    const roll = Math.random();
    const difficulty = Math.min(1.0, state.score / 15000); 

    if (roll < 0.5) {
      // Symmetrical Spikes
      const spikeWidth = 40 + (difficulty * 25);
      state.obstacles.push({ id: Math.random(), y: spawnY, type: 'spike', side: 'left', width: spikeWidth, height: 40 });
      state.obstacles.push({ id: Math.random(), y: spawnY, type: 'spike', side: 'right', width: spikeWidth, height: 40 });
    } else {
       // Asymmetrical
       const side = Math.random() > 0.5 ? 'left' : 'right';
       state.obstacles.push({ id: Math.random(), y: spawnY, type: 'spike', side: side, width: 60 + (difficulty * 30), height: 40 });
    }
    
    // Extra Score Orbs
    if (Math.random() < 0.6) {
       state.orbs.push({ id: Math.random(), x: laneWidth * 0.25, y: spawnY - 100, radius: 10, active: true, value: 20, type: 'score' });
       state.orbs.push({ id: Math.random(), x: laneWidth * 0.75, y: spawnY - 100, radius: 10, active: true, value: 20, type: 'score' });
    }

  } else {
    // ONE BALL: Recovery Mode, Ground Breaks, Split Orbs
    const roll = Math.random();
    
    if (roll < 0.4) {
      // GAP + SPLIT ORB
      state.obstacles.push({ id: Math.random(), y: spawnY, type: 'gap', side: 'center', width: 60, height: 200 });
      // Chance for Split Orb
      if (Math.random() < 0.6) {
        state.orbs.push({ id: Math.random(), x: centerX, y: spawnY + 100, radius: 14, active: true, value: 0, type: 'split' });
      } else {
        state.orbs.push({ id: Math.random(), x: centerX, y: spawnY + 100, radius: 12, active: true, value: 50, type: 'score' });
      }
      nextGap += 200;
    } else {
      // Regular Spikes to keep dodging
       const side = Math.random() > 0.5 ? 'left' : 'right';
       state.obstacles.push({ id: Math.random(), y: spawnY, type: 'spike', side: side, width: 50, height: 40 });
       
       if (Math.random() < 0.5) {
          const orbX = side === 'left' ? laneWidth * 0.75 : laneWidth * 0.25; // Spawn on safe side
          state.orbs.push({ id: Math.random(), x: orbX, y: spawnY - 100, radius: 10, active: true, value: 20, type: 'score' });
       }
    }
  }

  state.nextSpawnDistance = state.distance + nextGap;
}
