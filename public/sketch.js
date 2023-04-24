var socket;
var video;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvasContainer');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  background(0);
  noStroke();
  video = createCapture(VIDEO);
  video.hide();

  socket = io.connect('http://localhost:3000');
  socket.on('draw', updateDrawing);
}

function updateDrawing(data) {
  fill(255,0,100);
  ellipse(data.x,data.y,30,30);
}

function mouseDragged() {
  fill(255);
  ellipse(mouseX,mouseY,30,30);

  console.log('Sending: ' + mouseX + ', ' + mouseY);

  var data = {
    x: mouseX,
    y: mouseY
  }

  socket.emit('draw', data);
}

function draw() {
  image(video, 0, 0, width / 2, width / 2 * 3 / 4);
}
