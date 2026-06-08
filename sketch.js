// ==========================================
// 水果忍者 V1.3：手部偵測（修正對齊與加入版本號）
// ==========================================

let video;
let handpose;
let predictions = [];
let bladeTrail = []; 

// 🌟 版本號設定
const GAME_VERSION = "V1.3";

function setup() {
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight);
  
  // 使用最穩定、不縮放的自適應鏡頭設定
  let constraints = {
    video: {
      facingMode: "user" 
    },
    audio: false
  };
  
  video = createCapture(constraints);
  video.size(width, height); // 讓視訊直接等同畫布大小
  
  video.elt.setAttribute('playsinline', '');
  video.elt.setAttribute('muted', '');
  video.hide(); 

  handpose = ml5.handpose(video, () => console.log("AI 模型載入成功！"));
  handpose.on('predict', results => {
    predictions = results;
  });

  angleMode(DEGREES);
}

function draw() {
  // 1. 先畫出清晰、不模糊的 100% 鏡頭畫面（做為全螢幕背景）
  if (video && video.loadedmetadata) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
  } else {
    // 如果沒鏡頭（電腦測試），就用原本的淺紫色當背景
    background('#e2d4f0');
  }
  
  // 🌟 2. 畫出上方包裹名字與版本號的「淺紫色獨立橫條」
  let topBarHeight = 60; // 上方留白條的高度
  noStroke();
  fill('#e2d4f0'); 
  rect(0, 0, width, topBarHeight); // 在最上方蓋一條純淺紫色塊
  
  // 🌟 3. 在淺紫色橫條內顯示學號姓名（中間）
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill('#5e548e'); 
  textSize(24);
  text("414730910陳益宏", width / 2, topBarHeight / 2);
  pop();

  // 🌟 4. 在右上方顯示版本號（用來確認網頁有沒有刷新成功）
  push();
  textAlign(RIGHT, CENTER);
  textStyle(BOLD);
  fill('#5e548e');
  textSize(20);
  text(GAME_VERSION, width - 30, topBarHeight / 2);
  pop();
  
  // 🌟 5. 精準手部偵測（直接 1:1 對齊手指，絕對不會再移位）
  if (predictions.length > 0) {
    let hand = predictions[0]; 
    let indexFinger = hand.landmarks[8]; // 抓取食指尖
    
    // 因為鏡頭畫面左右翻轉，X 座標做鏡像轉換即可，不進行任何地圖縮放
    let bladeX = width - indexFinger[0];
    let bladeY = indexFinger[1];
    
    bladeTrail.push({ x: bladeX, y: bladeY });
  } else {
    // 電腦滑鼠模擬
    if (mouseX > 0 && mouseX < width && mouseY > topBarHeight && mouseY < height) {
      bladeTrail.push({ x: mouseX, y: mouseY });
    }
  }
  
  // 限制手刀軌跡長度
  if (bladeTrail.length > 10) {
    bladeTrail.shift();
  }
  
  if (predictions.length === 0 && mouseX === pmouseX && mouseY === pmouseY && bladeTrail.length > 0) {
    bladeTrail.shift();
  }
  
  // ⚔️ 繪製手刀
  drawBlade();
}

function drawBlade() {
  if (bladeTrail.length > 1) {
    noFill();
    stroke('#ccff00'); 
    strokeCap(ROUND);
    
    for (let i = 0; i < bladeTrail.length - 1; i++) {
      let p1 = bladeTrail[i];
      let p2 = bladeTrail[i + 1];
      let thickness = map(i, 0, bladeTrail.length, 4, 18); 
      strokeWeight(thickness);
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }
  
  if (bladeTrail.length > 0) {
    let currentTip = bladeTrail[bladeTrail.length - 1];
    noStroke();
    fill(255);
    ellipse(currentTip.x, currentTip.y, 16, 16);
    fill(204, 255, 0, 100);
    ellipse(currentTip.x, currentTip.y, 32, 32);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (video) video.size(width, height);
}

function touchMoved() {
  return false; 
}