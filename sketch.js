// ==========================================
// 水果忍者 V2.0：全螢幕等比例縮放 + 鏡像完全修復版
// ==========================================

let video;
let handpose;
let predictions = [];
let bladeTrail = []; 

// 遊戲控制與計分變數（維持你最新的 V2.0）
const GAME_VERSION = "V2.1"; 
let fruits = []; 
let lastSpawnTime = 0;
const topBarHeight = 60; 

let score = 0;           
let flashFrames = 0;     

// 遊戲狀態與計時控制
let gameState = "START"; 
let gameTimer = 60;      
let lastTimerCheck = 0;

// 核彈結束特效控制
let showMushroomCloud = false;
let mushroomX = 0;
let mushroomY = 0;
let mushroomSize = 10;

// 遊戲生成物件種類
const SPAWN_TYPES = [
  'WATERMELON', 'WATERMELON', 
  'APPLE', 'APPLE', 
  'BANANA', 'BANANA', 
  'ORANGE', 'ORANGE', 
  'STRAWBERRY', 'STRAWBERRY', 
  'BOMB', 'BOMB', 
  'NUKE'          
];

function setup() {
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight);
  
  let constraints = {
    video: { facingMode: "user" },
    audio: false
  };
  
  video = createCapture(constraints);
  video.size(640, 480); // AI 內部偵測解析度
  video.elt.setAttribute('playsinline', '');
  video.elt.setAttribute('muted', '');
  video.hide(); 

  handpose = ml5.handpose(video, () => console.log("AI 模型載入成功！"));
  handpose.on('predict', results => { predictions = results; });

  angleMode(DEGREES);
}

function draw() {
  // 🌟 修正點：重新計算 Object-fit: cover 滿版比例
  let videoRatio = 640 / 480;
  let canvasRatio = width / height;
  let renderW, renderH, offsetX, offsetY;

  if (canvasRatio > videoRatio) {
    renderW = width;
    renderH = width / videoRatio;
    offsetX = 0;
    offsetY = (height - renderH) / 2;
  } else {
    renderH = height;
    renderW = height * videoRatio;
    offsetX = (width - renderW) / 2;
    offsetY = 0;
  }

  // 🌟 核心修正：修正鏡像後的 image 座標，解決「畫面切一半、位置偏移」的問題
  push();
  translate(width, 0);
  scale(-1, 1); 
  // 翻轉後，將 renderW 減去乘上縮放後的相對位置，確保實景置中填滿
  image(video, offsetX + renderW - width, offsetY, renderW, renderH); 
  pop();
  
  // 淡淡的紫色背景濾鏡，讓視覺風格更柔和統一
  background(226, 212, 240, 120); 
  
  // 根據遊戲狀態繪製畫面
  if (gameState === "START") {
    drawStartScreen();
  } 
  else if (gameState === "PLAYING") {
    drawPlayingScreen();
  } 
  else if (gameState === "GAMEOVER") {
    drawGameOverScreen();
  }
  
  // 頂部學號姓名橫條
  drawTopBar();
  
  // 遊戲中計分板
  if (gameState === "PLAYING") {
    drawInGameHUD();
  }
  
  // 傳入縮放參數，手刀軌跡與手指百分之百精準重合
  handleBladeTracking(renderW, renderH, offsetX, offsetY);
  drawBlade();
}

// ==========================================
// 🎨 各遊戲狀態畫面繪製
// ==========================================

function drawStartScreen() {
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill('#5e548e');
  textSize(min(width * 0.08, 42)); 
  text("水果忍者 FRUIT NINJA", width / 2, height * 0.35);
  
  textSize(16);
  fill('#5e548e');
  text("伸出食指或使用滑鼠揮砍水果！\n小心炸彈與核彈！", width / 2, height * 0.46);
  pop();
  
  drawCustomButton("開始遊戲", width / 2, height * 0.62, 200, 60, '#5e548e', '#ffffff');
}

function drawPlayingScreen() {
  if (flashFrames > 0) {
    background(255, 100, 100, 150); 
    flashFrames--;
  }
  
  if (millis() - lastTimerCheck >= 1000) {
    gameTimer--;
    lastTimerCheck = millis();
    if (gameTimer <= 0) endGame(false); 
  }
  
  if (millis() - lastSpawnTime > 1300) {
    fruits.push(new FruitOrBomb());
    lastSpawnTime = millis();
  }
  
  for (let i = fruits.length - 1; i >= 0; i--) {
    fruits[i].update();
    fruits[i].display();
    
    if (!fruits[i].isSliced && bladeTrail.length > 1) {
      let currentTip = bladeTrail[bladeTrail.length - 1];
      let prevTip = bladeTrail[bladeTrail.length - 2];
      
      let hit = checkLineCircleCollision(
        prevTip.x, prevTip.y, currentTip.x, currentTip.y, 
        fruits[i].x, fruits[i].y, fruits[i].radius + 25
      );
      
      if (hit) {
        fruits[i].sliceMe(); 
        if (fruits[i].type === 'NUKE') {
          mushroomX = fruits[i].x; mushroomY = fruits[i].y;
          endGame(true); 
        } else if (fruits[i].type === 'BOMB') {
          score -= 3; flashFrames = 8;   
        } else {
          score += 1;        
        }
      }
    }
    if (fruits[i].isOffScreen()) fruits.splice(i, 1);
  }
}

function drawGameOverScreen() {
  if (showMushroomCloud) drawMushroomCloudEffect();

  push();
  textAlign(CENTER, CENTER); textStyle(BOLD);
  if (showMushroomCloud) {
    fill(40); textSize(min(width * 0.07, 46)); text("核彈引爆！GAME OVER", width / 2, height * 0.3);
  } else {
    fill('#d62828'); textSize(min(width * 0.08, 46)); text("時間到！GAME OVER", width / 2, height * 0.3);
  }
  fill('#5e548e'); textSize(28); text("最終得分: " + score, width / 2, height * 0.46);
  pop();
  
  if (!showMushroomCloud || mushroomSize > 200) {
    drawCustomButton("重新開始", width / 2, height * 0.65, 200, 60, '#5e548e', '#ffffff');
  }
}

// ==========================================
// 🛠️ UI 與 HUD 面板設定
// ==========================================

function drawTopBar() {
  noStroke();
  fill(208, 188, 227, 220); 
  rect(0, 0, width, topBarHeight); 
  
  push();
  textAlign(CENTER, CENTER); textStyle(BOLD); fill('#5e548e'); 
  let nameSize = min(width * 0.05, 20);
  textSize(nameSize);
  text("414730910陳益宏", width / 2, topBarHeight / 2);
  pop();

  push();
  textAlign(RIGHT, CENTER); textStyle(BOLD); fill('#5e548e'); textSize(16);
  text(GAME_VERSION, width - 20, topBarHeight / 2);
  pop();
}

function drawInGameHUD() {
  let hudX = 25; let hudY = topBarHeight + 25;
  let boxWidth = 150; let boxHeight = 85;
  push(); noStroke(); fill(255, 255, 255, 220); rect(hudX, hudY, boxWidth, boxHeight, 12); 
  textAlign(LEFT, CENTER); textStyle(BOLD); fill('#5e548e'); textSize(20); text("SCORE: " + score, hudX + 15, hudY + 25);
  fill('#d62828'); textSize(19); text("TIME: " + gameTimer + "s", hudX + 15, hudY + 58);
  pop();
}

function startGame() {
  score = 0; gameTimer = 60; fruits = []; showMushroomCloud = false; mushroomSize = 10;
  gameState = "PLAYING"; lastTimerCheck = millis(); lastSpawnTime = millis();
}

function endGame(byNuke) {
  gameState = "GAMEOVER";
  if (byNuke) showMushroomCloud = true;
}

function checkButtonClick(bx, by, bw, bh) {
  let currentTip = (bladeTrail.length > 0) ? bladeTrail[bladeTrail.length - 1] : {x: mouseX, y: mouseY};
  let isMouseIn = (mouseX > bx - bw/2 && mouseX < bx + bw/2 && mouseY > by - bh/2 && mouseY < by + bh/2);
  let isBladeIn = (currentTip.x > bx - bw/2 && currentTip.x < bx + bw/2 && currentTip.y > by - bh/2 && currentTip.y < by + bh/2);
  return (isMouseIn && mouseIsPressed) || isBladeIn;
}

function drawCustomButton(txt, x, y, w, h, btnColor, txtColor) {
  let hovered = (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2);
  push(); rectMode(CENTER); noStroke(); fill(hovered ? '#9f86c0' : btnColor); rect(x, y, w, h, 15);
  textAlign(CENTER, CENTER); textStyle(BOLD); fill(txtColor); textSize(22); text(txt, x, y); pop();
  
  if (checkButtonClick(x, y, w, h)) {
    if (gameState === "START") startGame();
    else if (gameState === "GAMEOVER" && (!showMushroomCloud || mushroomSize > 120)) startGame();
  }
}

function drawMushroomCloudEffect() {
  if (mushroomSize < width * 0.8) mushroomSize += 8;
  push(); noStroke();
  fill(80, 180); triangle(mushroomX - mushroomSize*0.15, height, mushroomX + mushroomSize*0.15, height, mushroomX, mushroomY);
  fill(40, 220); ellipse(mushroomX, mushroomY, mushroomSize, mushroomSize * 0.6);
  fill(90, 220); ellipse(mushroomX - mushroomSize*0.2, mushroomY - mushroomSize*0.1, mushroomSize*0.6, mushroomSize * 0.4);
  ellipse(mushroomX + mushroomSize*0.2, mushroomY - mushroomSize*0.1, mushroomSize*0.6, mushroomSize * 0.4);
  fill(160, 200); ellipse(mushroomX, mushroomY - mushroomSize*0.2, mushroomSize*0.5, mushroomSize * 0.3);
  noFill(); stroke(255, 150); strokeWeight(8); ellipse(mushroomX, mushroomY, mushroomSize * 1.3, mushroomSize * 0.2);
  pop();
}

// ==========================================
// 🚀 物件類別 (FruitOrBomb)
// ==========================================
class FruitOrBomb {
  constructor() {
    this.type = random(SPAWN_TYPES);
    this.x = random(width * 0.15, width * 0.85);
    this.y = height + 50; 
    this.vx = (this.x < width / 2) ? random(2.5, 5.5) : random(-5.5, -2.5);
    this.vy = random(-16, -22); 
    this.gravity = 0.38; 
    this.size = random(75, 95);
    this.radius = this.size * 0.45; 
    this.angle = 0;
    this.rotSpeed = random(-3, 3);
    this.isSliced = false;
    this.leftPart = { offsetX: 0, offsetY: 0, vx: 0, vy: 0, rot: 0, rotS: 0 };
    this.rightPart = { offsetX: 0, offsetY: 0, vx: 0, vy: 0, rot: 0, rotS: 0 };
  }

  update() {
    this.vy += this.gravity; this.x += this.vx; this.y += this.vy; this.angle += this.rotSpeed; 
    if (this.isSliced) {
      this.leftPart.vy += this.gravity; this.leftPart.offsetX += this.leftPart.vx; this.leftPart.offsetY += this.leftPart.vy; this.leftPart.rot += this.leftPart.rotS;
      this.rightPart.vy += this.gravity; this.rightPart.offsetX += this.rightPart.vx; this.rightPart.offsetY += this.rightPart.vy; this.rightPart.rot += this.rightPart.rotS;
    }
  }

  sliceMe() {
    if (this.isSliced) return; this.isSliced = true;
    this.leftPart.vx = random(-5, -2); this.leftPart.vy = random(-4, -1); this.leftPart.rotS = random(-10, -5);
    this.rightPart.vx = random(2, 5); this.rightPart.vy = random(-4, -1); this.rightPart.rotS = random(5, 10);
  }

  display() {
    if (!this.isSliced) {
      push(); translate(this.x, this.y); rotate(this.angle); this.drawGraphics(); pop();
    } else {
      if (this.type === 'NUKE') return;
      push(); translate(this.x + this.leftPart.offsetX, this.y + this.leftPart.offsetY); rotate(this.angle + this.leftPart.rot); drawingContext.save();
      beginShape(); vertex(-this.size, -this.size); vertex(0, -this.size); vertex(0, this.size); vertex(-this.size, this.size); endShape(CLOSE);
      drawingContext.clip(); this.drawGraphics(); drawingContext.restore(); pop();
      push(); translate(this.x + this.rightPart.offsetX, this.y + this.rightPart.offsetY); rotate(this.angle + this.rightPart.rot); drawingContext.save();
      beginShape(); vertex(0, -this.size); vertex(this.size, -this.size); vertex(this.size, this.size); vertex(0, this.size); endShape(CLOSE);
      drawingContext.clip(); this.drawGraphics(); drawingContext.restore(); pop();
    }
  }

  drawGraphics() {
    noStroke();
    switch(this.type) {
      case 'NUKE':
        fill('#e65c00'); ellipse(0, 0, this.size, this.size); fill('#ffcc00'); ellipse(0, 0, this.size * 0.85, this.size * 0.85); fill(0); ellipse(0, 0, this.size*0.18);
        arc(0, 0, this.size*0.6, this.size*0.6, -60, 0, PIE); arc(0, 0, this.size*0.6, this.size*0.6, 60, 120, PIE); arc(0, 0, this.size*0.6, this.size*0.6, 180, 240, PIE);
        break;
      case 'BOMB':
        fill(40); ellipse(0, 0, this.size * 0.9, this.size * 0.9); stroke(100); strokeWeight(4); noFill(); arc(0, -this.size * 0.4, 20, 20, 180, 270);
        stroke('#ffbc42'); strokeWeight(6); point(10, -this.size * 0.55); stroke('#d62828'); strokeWeight(4); point(14, -this.size * 0.58);
        break;
      case 'WATERMELON':
        fill('#2a9d8f'); ellipse(0, 0, this.size, this.size); fill('#e76f51'); ellipse(0, 0, this.size * 0.85, this.size * 0.85);
        fill(0); ellipse(-10, -5, 4, 6); ellipse(10, 5, 4, 6); ellipse(5, -12, 4, 6); ellipse(-5, 12, 4, 6);
        break;
      case 'APPLE':
        fill('#e63946'); ellipse(-this.size*0.1, 0, this.size * 0.85, this.size * 0.85); ellipse(this.size*0.1, 0, this.size * 0.85, this.size * 0.85);
        stroke('#4a3728'); strokeWeight(4); line(0, -this.size * 0.3, 0, -this.size * 0.5); fill('#52b788'); noStroke(); ellipse(this.size * 0.15, -this.size * 0.45, this.size * 0.3, this.size * 0.18);
        break;
      case 'BANANA':
        noFill(); stroke('#f9c74f'); strokeWeight(this.size * 0.35); strokeCap(ROUND); arc(0, 0, this.size * 0.7, this.size * 0.7, 30, 150);
        push(); let tipX = cos(30) * this.size * 0.35; let tipY = sin(30) * this.size * 0.35; fill('#4a3728'); noStroke(); ellipse(tipX, tipY, 8, 8); pop();
        break;
      case 'ORANGE':
        fill('#f9844a'); ellipse(0, 0, this.size, this.size); fill('#f9c74f'); ellipse(0, 0, this.size * 0.88, this.size * 0.88);
        stroke('#f9844a'); strokeWeight(2); for(let a = 0; a < 360; a += 45) { line(0, 0, cos(a) * this.size * 0.44, sin(a) * this.size * 0.44); }
        break;
      case 'STRAWBERRY':
        fill('#d62828'); beginShape(); vertex(0, this.size * 0.5); bezierVertex(-this.size*0.5, this.size*0.2, -this.size*0.4, -this.size*0.4, 0, -this.size*0.4); bezierVertex(this.size*0.4, -this.size*0.4, this.size*0.5, this.size*0.2, 0, this.size * 0.5); endShape(CLOSE);
        fill('#2a9d8f'); triangle(-15, -this.size*0.4, 0, -this.size*0.4, -8, -this.size * 0.55); triangle(0, -this.size*0.4, 15, -this.size*0.4, 8, -this.size * 0.55);
        fill('#f9c74f'); ellipse(-8, -5, 3, 4); ellipse(8, -5, 3, 4); ellipse(0, 10, 3, 4);
        break;
    }
  }

  isOffScreen() {
    if (this.isSliced) return (this.y + this.leftPart.offsetY > height + 100 && this.y + this.rightPart.offsetY > height + 100);
    return (this.vy > 0 && this.y > height + 100);
  }
}

function checkLineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
  let lLen = dist(x1, y1, x2, y2); if (lLen === 0) return dist(x1, y1, cx, cy) < r;
  let u = constrain(((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / (lLen * lLen), 0, 1);
  return dist(cx, cy, x1 + u * (x2 - x1), y1 + u * (y2 - y1)) < r;
}

function handleBladeTracking(renderW, renderH, offsetX, offsetY) {
  if (predictions.length > 0) {
    let hand = predictions[0]; 
    let indexFinger = hand.landmarks[8]; 
    
    let normX = indexFinger[0] / 640;
    let normY = indexFinger[1] / 480;
    
    // 鏡像轉換
    normX = 1.0 - normX;
    
    // 配合新的滿版對齊算法，轉換成絕對畫布坐標
    let finalX = normX * renderW + offsetX;
    let finalY = normY * renderH + offsetY;
    
    bladeTrail.push({ x: finalX, y: finalY });
  } else if (mouseX > 0 && mouseX < width && mouseY > topBarHeight && mouseY < height) {
    bladeTrail.push({ x: mouseX, y: mouseY });
  }
  
  if (bladeTrail.length > 8) bladeTrail.shift();
  if (predictions.length === 0 && mouseX === pmouseX && mouseY === pmouseY && bladeTrail.length > 0) bladeTrail.shift();
}

function drawBlade() {
  if (bladeTrail.length > 1) {
    noFill(); stroke('#ccff00'); strokeCap(ROUND);
    for (let i = 0; i < bladeTrail.length - 1; i++) { strokeWeight(map(i, 0, bladeTrail.length, 5, 22)); line(bladeTrail[i].x, bladeTrail[i].y, bladeTrail[i + 1].x, bladeTrail[i + 1].y); }
  }
  if (bladeTrail.length > 0) {
    let currentTip = bladeTrail[bladeTrail.length - 1];
    noStroke(); fill(255); ellipse(currentTip.x, currentTip.y, 16, 16);
    fill(204, 255, 0, 100); ellipse(currentTip.x, currentTip.y, 32, 32);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function touchMoved() { return false; }