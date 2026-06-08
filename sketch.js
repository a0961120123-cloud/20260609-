// ==========================================
// 水果忍者第一步：手部偵測（接近全螢幕包裹版）
// ==========================================

let video;
let handpose;
let predictions = [];
let bladeTrail = []; 

let videoW, videoH; // 動態計算的大視訊尺寸
let videoX, videoY; // 視訊在畫布上的起點座標

function setup() {
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight);
  
  // 🌟 1. 重新計算尺寸：讓視訊寬高都佔滿螢幕的 92%，留下 8% 空間
  calculateVideoSize();
  
  let constraints = {
    video: {
      facingMode: "user" 
    },
    audio: false
  };
  
  video = createCapture(constraints);
  video.size(videoW, videoH);
  
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
  // 🌟 2. 真正的純淺紫色背景
  background('#e2d4f0'); 
  
  // 🌟 3. 大畫面視訊置中包裹（無透明度，超清晰）
  if (video && video.loadedmetadata) {
    push();
    // 移動到視訊視窗的右上角，再做鏡像翻轉
    translate(videoX + videoW, videoY);
    scale(-1, 1);
    image(video, 0, 0, videoW, videoH);
    pop();
    
    // 給大視訊加一個白色細邊框，更有精緻感
    noFill();
    stroke(255);
    strokeWeight(3);
    rect(videoX, videoY, videoW, videoH, 12); // 圓角邊框
  }
  
  // 🌟 4. 顯示學號姓名（完美待在上方紫色留白處）
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill('#5e548e'); 
  textSize(26);
  // 將文字垂直置中放在上方留白的區塊內
  text("414730910陳益宏", width / 2, videoY / 2);
  pop();
  
  // 🌟 5. 手部偵測與滑鼠模擬邏輯
  if (predictions.length > 0) {
    let hand = predictions[0]; 
    let indexFinger = hand.landmarks[8]; 
    
    // 對應到全螢幕大畫面的精確座標
    let mappedX = map(indexFinger[0], 0, video.width, videoW, 0) + videoX;
    let mappedY = map(indexFinger[1], 0, video.height, 0, videoH) + videoY;
    
    bladeTrail.push({ x: mappedX, y: mappedY });
  } else {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
      bladeTrail.push({ x: mouseX, y: mouseY });
    }
  }
  
  if (bladeTrail.length > 10) {
    bladeTrail.shift();
  }
  
  if (predictions.length === 0 && mouseX === pmouseX && mouseY === pmouseY && bladeTrail.length > 0) {
    bladeTrail.shift();
  }
  
  // ⚔️ 繪製手刀
  drawBlade();
}

// 🌟 專門用來計算「接近全螢幕」且不跑版比例的輔助函式
function calculateVideoSize() {
  // 讓視訊的最大高度佔螢幕的 82%（留空間給上方名字和下方邊距）
  let targetH = height * 0.82;
  let targetW = targetH * (640 / 480); // 照 4:3 比例放大
  
  // 如果寬度太寬超出螢幕（例如手機直向），就改用寬度當基準
  if (targetW > width * 0.92) {
    targetW = width * 0.92;
    targetH = targetW * (480 / 640);
  }
  
  videoW = targetW;
  videoH = targetH;
  
  // X 置中，Y 稍微往下挪一點點，留出完美的上方名字空間
  videoX = (width - videoW) / 2;
  videoY = (height - videoH) * 0.65; 
}

function drawBlade() {
  if (bladeTrail.length > 1) {
    noFill();
    stroke('#ccff00'); 
    strokeCap(ROUND);
    
    for (let i = 0; i < bladeTrail.length - 1; i++) {
      let p1 = bladeTrail[i];
      let p2 = bladeTrail[i + 1];
      let thickness = map(i, 0, bladeTrail.length, 4, 18); // 大畫面下手刀稍微加粗，更有氣勢
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
  calculateVideoSize();
  if (video) video.size(videoW, videoH);
}

function touchMoved() {
  return false; 
}