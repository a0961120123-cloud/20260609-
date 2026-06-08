// ==========================================
// 水果忍者 V1.5：手部偵測 + 水果拋物線 + 完美切片
// ==========================================

let video;
let handpose;
let predictions = [];
let bladeTrail = []; 

// 🌟 遊戲控制變數
const GAME_VERSION = "V1.5"; // 版本號更新
let fruits = []; 
let lastSpawnTime = 0;
const topBarHeight = 60; // 上方留白橫條高度

// 水果種類清單
const FRUIT_TYPES = ['WATERMELON', 'APPLE', 'BANANA', 'ORANGE', 'STRAWBERRY'];

function setup() {
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight);
  
  let constraints = {
    video: { facingMode: "user" },
    audio: false
  };
  
  video = createCapture(constraints);
  video.size(width, height);
  
  video.elt.setAttribute('playsinline', '');
  video.elt.setAttribute('muted', '');
  video.hide(); 

  handpose = ml5.handpose(video, () => console.log("AI 模型載入成功！"));
  handpose.on('predict', results => {
    predictions = results;
  });

  angleMode(DEGREES);
  lastSpawnTime = millis();
}

function draw() {
  // 1. 畫出鏡頭畫面背景
  if (video && video.loadedmetadata) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
  } else {
    background('#e2d4f0');
  }
  
  // 2. 定時自動生產水果：每 1.4 秒隨機噴出一款經典水果
  if (millis() - lastSpawnTime > 1400) {
    fruits.push(new Fruit());
    lastSpawnTime = millis();
  }
  
  // 3. 🌟 更新、繪製、並檢查水果是否有被切到
  for (let i = fruits.length - 1; i >= 0; i--) {
    fruits[i].update();
    fruits[i].display();
    
    // ⚔️ 核心碰撞檢查：如果水果還沒被切開，且手刀軌跡有在移動
    if (!fruits[i].isSliced && bladeTrail.length > 1) {
      let currentTip = bladeTrail[bladeTrail.length - 1];
      let prevTip = bladeTrail[bladeTrail.length - 2];
      
      // 檢查手刀線段是否劃過水果的圓形範圍（加入 15 像素的安全緩衝半徑，防延遲錯過）
      let hit = checkLineCircleCollision(
        prevTip.x, prevTip.y, 
        currentTip.x, currentTip.y, 
        fruits[i].x, fruits[i].y, 
        fruits[i].radius + 15
      );
      
      if (hit) {
        fruits[i].sliceMe(); // 💥 啪嚓！切開它！
      }
    }
    
    // 超出螢幕底部自動刪除
    if (fruits[i].isOffScreen()) {
      fruits.splice(i, 1);
    }
  }
  
  // 4. 頂部 UI 橫條（淺紫色）
  noStroke();
  fill('#e2d4f0'); 
  rect(0, 0, width, topBarHeight); 
  
  // 5. 顯示學號姓名
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill('#5e548e'); 
  textSize(24);
  text("414730910陳益宏", width / 2, topBarHeight / 2);
  pop();

  // 6. 顯示版本號
  push();
  textAlign(RIGHT, CENTER);
  textStyle(BOLD);
  fill('#5e548e');
  textSize(20);
  text(GAME_VERSION, width - 30, topBarHeight / 2);
  pop();
  
  // 7. 手刀軌跡與滑鼠模擬邏輯
  handleBladeTracking();
  drawBlade();
}

// ==========================================
// 🚀 正宗水果類別 (Fruit) 與切片物理
// ==========================================
class Fruit {
  constructor() {
    this.type = random(FRUIT_TYPES);
    
    // 物理出生設定
    this.x = random(width * 0.15, width * 0.85);
    this.y = height + 50; 
    this.vx = (this.x < width / 2) ? random(2.5, 5.5) : random(-5.5, -2.5);
    this.vy = random(-14, -19); 
    this.gravity = 0.35; 
    
    this.size = random(75, 95);
    this.radius = this.size * 0.45; // 用於碰撞判定的半徑
    this.angle = 0;
    this.rotSpeed = random(-3, 3);
    
    // 🌟 切片狀態控制
    this.isSliced = false;
    
    // 碎片物理資料（左半邊與右半邊）
    this.leftPart = { offsetX: 0, offsetY: 0, vx: 0, vy: 0, rot: 0, rotS: 0 };
    this.rightPart = { offsetX: 0, offsetY: 0, vx: 0, vy: 0, rot: 0, rotS: 0 };
  }

  update() {
    // 基礎拋物線移動
    this.vy += this.gravity; 
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.rotSpeed; 

    // 🌟 如果水果被切開了，兩半碎片要各自往外噴飛
    if (this.isSliced) {
      this.leftPart.vy += this.gravity;
      this.leftPart.offsetX += this.leftPart.vx;
      this.leftPart.offsetY += this.leftPart.vy;
      this.leftPart.rot += this.leftPart.rotS;

      this.rightPart.vy += this.gravity;
      this.rightPart.offsetX += this.rightPart.vx;
      this.rightPart.offsetY += this.rightPart.vy;
      this.rightPart.rot += this.rightPart.rotS;
    }
  }

  sliceMe() {
    if (this.isSliced) return;
    this.isSliced = true;
    
    // 💥 給左半邊碎片一個向左爆開的隨機速度與劇烈旋轉
    this.leftPart.vx = random(-4, -2);
    this.leftPart.vy = random(-3, -1);
    this.leftPart.rotS = random(-8, -4);
    
    // 💥 給右半邊碎片一個向右爆開的隨機速度與劇烈旋轉
    this.rightPart.vx = random(2, 4);
    this.rightPart.vy = random(-3, -1);
    this.rightPart.rotS = random(4, 8);
  }

  display() {
    if (!this.isSliced) {
      // 1. 繪製完整水果
      push();
      translate(this.x, this.y);
      rotate(this.angle);
      this.drawFruitGraphics();
      pop();
    } else {
      // 2. 🌟 繪製切片水果：利用 HTML5 Canvas 遮罩（clip）完美對半分裂
      
      // 【繪製左半邊碎片】
      push();
      translate(this.x + this.leftPart.offsetX, this.y + this.leftPart.offsetY);
      rotate(this.angle + this.leftPart.rot);
      drawingContext.save();
      beginShape(); // 建立左半邊的裁剪區域
      vertex(-this.size, -this.size); vertex(0, -this.size);
      vertex(0, this.size); vertex(-this.size, this.size);
      endShape(CLOSE);
      drawingContext.clip(); // 啟動遮罩
      this.drawFruitGraphics();
      drawingContext.restore(); // 解除遮罩
      pop();

      // 【繪製右半邊碎片】
      push();
      translate(this.x + this.rightPart.offsetX, this.y + this.rightPart.offsetY);
      rotate(this.angle + this.rightPart.rot);
      drawingContext.save();
      beginShape(); // 建立右半邊的裁剪區域
      vertex(0, -this.size); vertex(this.size, -this.size);
      vertex(this.size, this.size); vertex(0, this.size);
      endShape(CLOSE);
      drawingContext.clip(); // 啟動遮罩
      this.drawFruitGraphics();
      drawingContext.restore(); // 解除遮罩
      pop();
    }
  }

  // 各種水果的造型圖形
  drawFruitGraphics() {
    noStroke();
    switch(this.type) {
      case 'WATERMELON': // 🍉 西瓜
        fill('#2a9d8f'); ellipse(0, 0, this.size, this.size);
        fill('#e76f51'); ellipse(0, 0, this.size * 0.85, this.size * 0.85);
        fill(0);
        ellipse(-10, -5, 4, 6); ellipse(10, 5, 4, 6);
        ellipse(5, -12, 4, 6); ellipse(-5, 12, 4, 6);
        break;
        
      case 'APPLE': // 🍎 蘋果
        fill('#e63946');
        ellipse(-this.size*0.1, 0, this.size * 0.85, this.size * 0.85);
        ellipse(this.size*0.1, 0, this.size * 0.85, this.size * 0.85);
        stroke('#4a3728'); strokeWeight(4); line(0, -this.size * 0.3, 0, -this.size * 0.5);
        fill('#52b788'); noStroke(); ellipse(this.size * 0.15, -this.size * 0.45, this.size * 0.3, this.size * 0.18);
        break;
        
      case 'BANANA': // 🍌 香蕉
        noFill(); stroke('#f9c74f'); strokeWeight(this.size * 0.35); strokeCap(ROUND);
        arc(0, 0, this.size * 0.7, this.size * 0.7, 30, 150);
        push();
        let tipX = cos(30) * this.size * 0.35; let tipY = sin(30) * this.size * 0.35;
        fill('#4a3728'); noStroke(); ellipse(tipX, tipY, 8, 8);
        pop();
        break;
        
      case 'ORANGE': // 🍊 柳丁
        fill('#f9844a'); ellipse(0, 0, this.size, this.size);
        fill('#f9c74f'); ellipse(0, 0, this.size * 0.88, this.size * 0.88);
        stroke('#f9844a'); strokeWeight(2);
        for(let a = 0; a < 360; a += 45) {
          line(0, 0, cos(a) * this.size * 0.44, sin(a) * this.size * 0.44);
        }
        break;
        
      case 'STRAWBERRY': // 🍓 草莓
        fill('#d62828');
        beginShape();
        vertex(0, this.size * 0.5);
        bezierVertex(-this.size*0.5, this.size*0.2, -this.size*0.4, -this.size*0.4, 0, -this.size*0.4);
        bezierVertex(this.size*0.4, -this.size*0.4, this.size*0.5, this.size*0.2, 0, this.size * 0.5);
        endShape(CLOSE);
        fill('#2a9d8f');
        triangle(-15, -this.size*0.4, 0, -this.size*0.4, -8, -this.size * 0.55);
        triangle(0, -this.size*0.4, 15, -this.size*0.4, 8, -this.size * 0.55);
        fill('#f9c74f');
        ellipse(-8, -5, 3, 4); ellipse(8, -5, 3, 4); ellipse(0, 10, 3, 4);
        break;
    }
  }

  isOffScreen() {
    // 如果切開了，以碎片是否掉下去為準
    if (this.isSliced) {
      return (this.y + this.leftPart.offsetY > height + 100 && this.y + this.rightPart.offsetY > height + 100);
    }
    return (this.vy > 0 && this.y > height + 100);
  }
}

// ==========================================
// 📐 數學演算法：檢查手刀線段與水果圓形是否相交
// ==========================================
function checkLineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
  let lLen = dist(x1, y1, x2, y2);
  if (lLen === 0) return dist(x1, y1, cx, cy) < r;
  
  let u = ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / (lLen * lLen);
  u = constrain(u, 0, 1);
  
  let closestX = x1 + u * (x2 - x1);
  let closestY = y1 + u * (y2 - y1);
  
  return dist(cx, cy, closestX, closestY) < r;
}

// ==========================================
// 手刀追蹤控制
// ==========================================
function handleBladeTracking() {
  if (predictions.length > 0) {
    let hand = predictions[0]; 
    let indexFinger = hand.landmarks[8]; 
    bladeTrail.push({ x: width - indexFinger[0], y: indexFinger[1] });
  } else {
    if (mouseX > 0 && mouseX < width && mouseY > topBarHeight && mouseY < height) {
      bladeTrail.push({ x: mouseX, y: mouseY });
    }
  }
  if (bladeTrail.length > 10) bladeTrail.shift();
  if (predictions.length === 0 && mouseX === pmouseX && mouseY === pmouseY && bladeTrail.length > 0) {
    bladeTrail.shift();
  }
}

function drawBlade() {
  if (bladeTrail.length > 1) {
    noFill(); stroke('#ccff00'); strokeCap(ROUND);
    for (let i = 0; i < bladeTrail.length - 1; i++) {
      strokeWeight(map(i, 0, bladeTrail.length, 4, 18));
      line(bladeTrail[i].x, bladeTrail[i].y, bladeTrail[i + 1].x, bladeTrail[i + 1].y);
    }
  }
  if (bladeTrail.length > 0) {
    let currentTip = bladeTrail[bladeTrail.length - 1];
    noStroke(); fill(255); ellipse(currentTip.x, currentTip.y, 16, 16);
    fill(204, 255, 0, 100); ellipse(currentTip.x, currentTip.y, 32, 32);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); if (video) video.size(width, height); }
function touchMoved() { return false; }