// Declare variables.
var socket;
var video;
var colorPicker;
var tSlider;
var sSlider;
let canvas;
let videoCanv;
let collaborators = [];
let name;
let finished = false;
let videoMode = false;

// Reveal mode descriptions when hovering over respective buttons.
let canvasDescription = document.getElementById('canvas-drawing-description');
let videoDescription = document.getElementById('video-drawing-description');

function showCanvasDescription() {
  console.log("test");
  canvasDescription.style.display = "block";
}

function hideCanvasDescription() {
  canvasDescription.style.display = "none";
}

function showVideoDescription() {
  console.log("test");
  videoDescription.style.display = "block";
}

function hideVideoDescription() {
  videoDescription.style.display = "none";
}

/* Once user selects a mode:
    1) Hide homepage and reveal canvas (and video if applicable).
    2) Store which "mode" they selected.
    3) Add entered name to list of collaborators.
*/
function drawingMode() {
  document.getElementById('infoContainer').style.display = "none";
  document.getElementById('canvasContainer').style.display = "block";
  name = document.getElementById('name').value;
  collaborators.length = 0;
  collaborators.push(name);
  var data = {
    name: name,
    mode: videoMode
  };
  socket.emit('newCollaborator', data);
}

function videoDrawingMode() {
  videoMode = true;
  document.getElementById('infoContainer').style.display = "none";
  document.getElementById('canvasContainer').style.display = "block";
  name = document.getElementById('name').value;
  collaborators.length = 0;
  collaborators.push(name);
  var data = {
    name: name,
    mode: videoMode
  };
  socket.emit('newCollaborator', data);
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvasContainer');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  background(0);
  noStroke();

  // In the case that user selects video drawing mode, create separate off-screen graphics buffers for drawing canvas and webcam video.
  videoCanv = createGraphics(width,height);
  drawCanv = createGraphics(width, height);
  drawCanv.noStroke();

  // Create color picker and opacity/size sliders that will give user more control over drawing. CSS classes added for styling.
  colorPicker = createColorPicker('#000');
  colorPicker.position(75,10);
  colorPicker.addClass("colorPicker");
  colorPicker.parent('canvasContainer');
  tSlider = createSlider(0, 255, 255);
  tSlider.position(220, 20);
  tSlider.addClass("slider");
  tSlider.parent("canvasContainer");
  sSlider = createSlider(1, 10, 3);
  sSlider.position(375, 20);
  sSlider.addClass("slider");
  sSlider.parent("canvasContainer");

  // Create button for when drawing is finished which will trigger end event.
  button = createButton('DONE DRAWING');
  button.position(25, height - 60);
  button.id('done-button');
  button.parent("canvasContainer");
  button.mousePressed(end);

  // Create webcam video and hiding it.
  video = createCapture(VIDEO);
  video.hide();

  // Connect to server. Define what function should be executed on other connections when specified message is received.
  socket = io.connect('http://localhost:3000');
  socket.on('draw', updateDrawing);
  socket.on('drawVideo', updateVideoDrawing);
  socket.on('end', finishDrawing);
  socket.on('newCollaborator', updateCollaborators);
  socket.on('oldCollaborator', updatePastCollaborators);
}

// Execute drawing on connection based on data taken from connection where 'draw' was made.
function updateDrawing(data) {
  let newColor = color(data.r,data.g,data.b,data.a);
  fill(newColor);
  ellipse(data.x,data.y,data.s,data.s);
}

// Same as updateDrawing() function except it updates off-screen drawing buffer.
function updateVideoDrawing(data) {
  let newColor = color(data.r,data.g,data.b,data.a);
  drawCanv.fill(newColor);
  drawCanv.ellipse(data.x,data.y,data.s,data.s);
}

// When new user joins the server in the same mode, add their name to list of collaborators. Then return message with current user's name.
function updateCollaborators(data) {

  if (data.mode == videoMode) {
    var returnData = {
      id:data.id,
      name:name
    }
    socket.emit('oldCollaborator',returnData);
    collaborators.push(data.name);
  }
}

// Update list of collaborators with names of everyone in same mode who is already on server.
function updatePastCollaborators(name) {
  if (name != null) {
    collaborators.push(name);
  }
}

// When user clicks "Done Drawing" button, send message to other connections.
function end() {
  finished = true;
  socket.emit('end', videoMode);
}

// Boolean set to declare drawing as finished when relevant message is received from other connection.
function finishDrawing(mode) {
  if (mode == videoMode) {
    finished = true;
  }
}

// Allow user to 'draw' whenver they drag their mouse on canvas.
function mouseDragged() {

  if (!finished) {

  // Color & opacity of drawing can be determined by user via color picker and sliders.
  let newColor = colorPicker.color();
  let newT = tSlider.value();
  let newS = map(sSlider.value(),1,10,10,100);
  newColor.setAlpha(newT);

  if (videoMode) {
    drawCanv.fill(newColor);
    drawCanv.ellipse(mouseX,mouseY,newS,newS);
  }
  else {
    fill(newColor);
    ellipse(mouseX,mouseY,newS,newS);
  }

  // Referenced following answer on Stack Overflow on use of regex to transform color string to array.
  // https://stackoverflow.com/questions/10970958/get-a-color-component-from-an-rgb-string-in-javascript
  // (I initially tried sending a color object as part of the data variable, but it could not be recognized as a color in the updateDrawing() function. Thus I decided to convert color object -> string -> array in order to access the individual rgba values).
  newColor = newColor.toString();
  newColor = newColor.replace(/[^\d,]/g, '').split(',');

  // Store values of mouse position and brush details to be sent to other connections.
  var data = {
    x: mouseX,
    y: mouseY,
    s: newS,
    r: newColor[0],
    g: newColor[1],
    b: newColor[2],
    a: newT
  };

  if (videoMode) {
    socket.emit('drawVideo', data);
  }
  else { socket.emit('draw', data); }
  console.log('Sending: ' + mouseX + ', ' + mouseY);

  }

}

function draw() {

  // Display draw and video buffers if user has selected video mode.
  if (videoMode) {
    videoCanv.imageMode(CENTER);
    videoCanv.image(video, width / 2, height / 2, height * 4 / 3, height);
    image(videoCanv,0,0);
    image(drawCanv,0,0);
  }

  // When drawing is finished, prevent user from manipulating drawing further and display names of all collaborators.
  if (finished) {
    background(255);
    fill(255);
    colorPicker.hide();
    tSlider.hide();
    sSlider.hide();
    button.hide();
    rect(0,0,width,50);
    push();
    textFont('Gaegu');
    textSize(25);
    fill(0);
    let collaboratorsString = collaborators.toString().replaceAll(","," and ");
    collaboratorsString = collaboratorsString.toUpperCase();
    text('BY ' + collaboratorsString,20,30);
    pop();
  }

  else {
    // Create header and footer so controls / buttons are visible.
    fill(255);
    rect(0,0,width,50);
    rect(0,height - 75,width,75);

    // Create text labels for color picker and brush sliders.
    push();
    textFont('Helvetica');
    fill(0);
    text('COLOR',20,28);
    text('OPACITY',160,28);
    text('SIZE',340,28);
    pop();
  }
}
