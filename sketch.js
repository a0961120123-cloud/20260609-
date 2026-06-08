// ==========================================
// 水果忍者第一步：手部偵測（修正包裹式背景與視訊置中）
// ==========================================

let video;
let handpose;
let predictions = [];
let bladeTrail = []; 

// 🌟 設定視訊視窗的固定尺寸
let videoW = 640;
let videoH = 480;
let videoX, videoY; // 視訊在畫布上的起點座標

function setup() {
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight);
  
  // 針對手機網頁寬度，如果螢幕太小（例如手機直向），動態縮小視訊視窗
  if (windowWidth < videoW) {
    videoW = windowWidth * 0.9;
    videoH = videoW * (480 / 640); // 維持 4:3 比例
  }

  // 計算置中的座標位置
  videoX = (width - videoW) / 2;
  videoY = (height - videoH) / 2;
  
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
  // 🌟 1. 真正的背景純淺紫色（不會有濾鏡感了！）
  background('#e2d4f0'); 
  
  // 🌟 2. 把鏡頭畫面「包裹」在中間，並且是 100% 清晰、不加透明度
  if (video && video.loadedmetadata) {
    push();
    // 先移動到視訊視窗的右上角，再做鏡像翻轉
    translate(videoX + videoW, videoY);
    scale(-1, 1);
    image(video, 0, 0, videoW, videoH);
    pop();
    
    // 給視訊視窗加一個精緻的白色邊框，讓它跟紫色背景融合得更好
    noFill();
    stroke(255);
    strokeWeight(4);
    rect(videoX, videoY, videoW, videoH, 8); // 帶有一點點圓角
  }
  
  // 🌟 3. 顯示學號姓名（在視訊畫面外面，中間正上方）
  push();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  fill('#5e548e'); 
  textSize(26);
  text("414730910陳益宏", width / 2, 25);
  pop();
  
  // 🌟 4. 手部偵測與滑鼠模擬邏輯
  if (predictions.length > 0) {
    let hand = predictions[0]; 
    let indexFinger = hand.landmarks[8]; 
    
    // 根據視訊縮放與置中的位置，重新計算手刀在全螢幕下的精確座標
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

function drawBlade() {
  if (bladeTrail.length > 1) {
    noFill();
    stroke('#ccff00'); 
    strokeCap(ROUND);
    
    for (let i = 0; i < bladeTrail.length - 1; i++) {
      let p1 = bladeTrail[i];
      let p2 = bladeTrail[i + 1];
      let thickness = map(i, 0, bladeTrail.length, 3, 15); 
      strokeWeight(thickness);
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }
  
  if (bladeTrail.length > 0) {
    let currentTip = bladeTrail[bladeTrail.length - 1];
    noStroke();
    fill(255);
    ellipse(currentTip.x, currentTip.y, 15, 15);
    fill(204, 255, 0, 100);
    ellipse(currentTip.x, currentTip.y, 30, 30);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 視窗縮放時重新計算位置
  if (windowWidth < 640) {
    videoW = windowWidth * 0.9;
    videoH = videoW * (480 / 640);
  } else {
    videoW = 640;
    videoH = 480;
  }
  videoX = (width - videoW) / 2;
  videoY = (height - videoH) / 2;
  if (video) video.size(videoW, videoH);
}

function touchMoved() {
  return false; 
}