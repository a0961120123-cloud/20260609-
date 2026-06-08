// ==========================================
// 水果忍者第一步：手部偵測（含電腦滑鼠模擬與指定背景/文字）
// ==========================================

let video;
let handpose;
let predictions = [];
let bladeTrail = []; 

function setup() {
  // 固定像素密度，防止 iOS Retina 螢幕卡頓
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight);
  
  // 針對 iOS 的鏡頭特殊設定
  let constraints = {
    video: {
      facingMode: "user" // 使用前置鏡頭
    },
    audio: false
  };
  
  // 建立鏡頭捕捉（如果電腦沒鏡頭，這裡會安靜地略過）
  video = createCapture(constraints);
  video.size(width, height);
  
  // 強制 iOS 不跳出全螢幕播放
  video.elt.setAttribute('playsinline', '');
  video.elt.setAttribute('muted', '');
  video.hide(); 

  // 初始化手部偵測
  handpose = ml5.handpose(video, modelReady);
  
  // 當偵測到手時，更新資料
  handpose.on('predict', results => {
    predictions = results;
  });

  angleMode(DEGREES);
}

function modelReady() {
  console.log("AI 手部辨識模型載入成功！");
}

function draw() {
  // 🌟 1. 背景換成舒服的馬卡龍淺紫色
  background('#e2d4f0'); 
  
  // 如果有鏡頭畫面，就把鏡頭影像淡淡地疊在背景上（透明度 50），這樣看得到自己又維持淺紫色
  if (video && video.loadedmetadata) {
    push();
    translate(width, 0);
    scale(-1, 1);
    tint(255, 50); // 讓視訊變得非常透明，凸顯淺紫色背景
    image(video, 0, 0, width, height);
    pop();
  }
  
  // 🌟 2. 顯示你的學號與姓名（中間正上方）
  push();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  fill('#5e548e'); // 深紫色的字體，在淺紫背景上很清晰
  textSize(24);
  text("414730910陳益宏", width / 2, 20);
  pop();
  
  // 🌟 3. 手部偵測與滑鼠模擬邏輯
  if (predictions.length > 0) {
    // 【手機/有鏡頭測試】偵測食指尖端
    let hand = predictions[0]; 
    let indexFinger = hand.landmarks[8]; 
    
    let bladeX = width - indexFinger[0];
    let bladeY = indexFinger[1];
    
    bladeTrail.push({ x: bladeX, y: bladeY });
  } else {
    // 【電腦無鏡頭測試】如果沒有偵測到手，就用滑鼠位置當作手刀！
    // 只有當滑鼠在畫布內移動時才紀錄軌跡
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
      bladeTrail.push({ x: mouseX, y: mouseY });
    }
  }
  
  // 限制手刀軌跡長度（留下短暫的流線尾巴）
  if (bladeTrail.length > 10) {
    bladeTrail.shift();
  }
  
  // 當滑鼠或手停下來沒動時，軌跡會自然縮減消失
  if (predictions.length === 0 && mouseX === pmouseX && mouseY === pmouseY && bladeTrail.length > 0) {
    bladeTrail.shift();
  }
  
  // ⚔️ 繪製手刀
  drawBlade();
}

function drawBlade() {
  if (bladeTrail.length > 1) {
    noFill();
    stroke('#ccff00'); // 螢光黃手刀
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
  if (video) video.size(width, height);
}

function touchMoved() {
  return false; 
}