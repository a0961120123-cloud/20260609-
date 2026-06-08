// ==========================================
// 水果忍者 V1.5：手部偵測 + 經典水果拋物線噴射
// ==========================================

let video;
let handpose;
let predictions = [];
let bladeTrail = []; 

// 🌟 遊戲控制變數
const GAME_VERSION = "V1.4"; // 更新版本號
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
  
  // 2. 🌟 定時自動生產水果：每 1.4 秒隨機噴出一款經典水果
  if (millis() - lastSpawnTime > 1400) {
    fruits.push(new Fruit());
    lastSpawnTime = millis();
  }
  
  // 3. 更新並畫出所有的水果
  for (let i = fruits.length - 1; i >= 0; i--) {
    fruits[i].update();
    fruits[i].display();
    
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
  
  // 7. 手部偵測與滑鼠模擬邏輯
  handleBladeTracking();
  drawBlade();
}

// ==========================================
// 🚀 正宗水果類別 (Fruit)
// ==========================================
class Fruit {
  constructor() {
    // 隨機決定一款水果類型
    this.type = random(FRUIT_TYPES);
    
    // 物理出生設定（螢幕底部）
    this.x = random(width * 0.15, width * 0.85);
    this.y = height + 50; 
    this.vx = (this.x < width / 2) ? random(2.5, 5.5) : random(-5.5, -2.5);
    this.vy = random(-14, -19); // 往上噴射的速度
    this.gravity = 0.35; // 地心引力
    
    // 水果大小與旋轉設定
    this.size = random(70, 90);
    this.angle = 0;
    this.rotSpeed = random(-3, 3);
  }

  update() {
    this.vy += this.gravity; 
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.rotSpeed; 
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    // 依據水果種類進行精細繪製
    switch(this.type) {
      case 'WATERMELON': // 🍉 西瓜
        // 外皮
        fill('#2a9d8f'); noStroke();
        ellipse(0, 0, this.size, this.size);
        // 內肉
        fill('#e76f51');
        ellipse(0, 0, this.size * 0.85, this.size * 0.85);
        // 西瓜籽
        fill(0);
        ellipse(-10, -5, 4, 6); ellipse(10, 5, 4, 6);
        ellipse(5, -12, 4, 6); ellipse(-5, 12, 4, 6);
        break;
        
      case 'APPLE': // 🍎 蘋果
        // 蘋果身
        fill('#e63946'); noStroke();
        ellipse(-this.size*0.1, 0, this.size * 0.85, this.size * 0.85);
        ellipse(this.size*0.1, 0, this.size * 0.85, this.size * 0.85);
        // 梗與綠葉
        stroke('#4a3728'); strokeWeight(4);
        line(0, -this.size * 0.3, 0, -this.size * 0.5);
        fill('#52b788'); noStroke();
        ellipse(this.size * 0.15, -this.size * 0.45, this.size * 0.3, this.size * 0.18);
        break;
        
      case 'BANANA': // 🍌 香蕉
        noFill(); stroke('#f9c74f'); strokeWeight(this.size * 0.35);
        strokeCap(ROUND);
        arc(0, 0, this.size * 0.7, this.size * 0.7, 30, 150);
        // 香蕉頭黑蒂
        push();
        let tipX = cos(30) * this.size * 0.35;
        let tipY = sin(30) * this.size * 0.35;
        fill('#4a3728'); noStroke();
        ellipse(tipX, tipY, 8, 8);
        pop();
        break;
        
      case 'ORANGE': // 🍊 柳丁
        // 亮橘色外皮
        fill('#f9844a'); noStroke();
        ellipse(0, 0, this.size, this.size);
        // 淺橘色內圈
        fill('#f9c74f');
        ellipse(0, 0, this.size * 0.88, this.size * 0.88);
        // 果肉瓣線條
        stroke('#f9844a'); strokeWeight(2);
        for(let a = 0; a < 360; a += 45) {
          line(0, 0, cos(a) * this.size * 0.44, sin(a) * this.size * 0.44);
        }
        break;
        
      case 'STRAWBERRY': // 🍓 草莓
        fill('#f77f00'); // 蒂頭綠色
        fill('#d62828'); noStroke();
        // 繪製倒三角倒卵形的草莓身
        beginShape();
        vertex(0, this.size * 0.5);
        bezierVertex(-this.size*0.5, this.size*0.2, -this.size*0.4, -this.size*0.4, 0, -this.size*0.4);
        bezierVertex(this.size*0.4, -this.size*0.4, this.size*0.5, this.size*0.2, 0, this.size * 0.5);
        endShape(CLOSE);
        // 葉子
        fill('#2a9d8f');
        triangle(-15, -this.size*0.4, 0, -this.size*0.4, -8, -this.size * 0.55);
        triangle(0, -this.size*0.4, 15, -this.size*0.4, 8, -this.size * 0.55);
        // 草莓小黑籽
        fill('#f9c74f');
        ellipse(-8, -5, 3, 4); ellipse(8, -5, 3, 4);
        ellipse(0, 10, 3, 4); ellipse(-5, 20, 3, 4); ellipse(5, 20, 3, 4);
        break;
    }
    pop();
  }

  isOffScreen() {
    return (this.vy > 0 && this.y > height + 100);
  }
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