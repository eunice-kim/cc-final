function collaborativeDrawingMode() {
  document.getElementById('infoContainer').style.display = "none";
  document.getElementById('canvasContainer').style.display = "block";
  socket.emit('newCollaborator', document.getElementById('name').value);
}

// declaring variables
var socket;
var video;
var colorPicker;
var tSlider;
var sSlider;
let canvas;
let collaborators = [];
let finished = false;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvasContainer');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  background(0);
  noStroke();

  // creating color picker and opacity/size sliders that will give user more control over drawing, adding CSS classes in order to style them
  colorPicker = createColorPicker('#000');
  colorPicker.position(75,10);
  colorPicker.addClass("colorPicker");
  colorPicker.parent('canvasContainer');
  tSlider = createSlider(0, 255, 255);
  tSlider.position(220, 20);
  tSlider.addClass("slider");
  tSlider.parent("canvasContainer");
  sSlider = createSlider(1, 10, 5);
  sSlider.position(375, 20);
  sSlider.addClass("slider");
  sSlider.parent("canvasContainer");

  // creating button for when drawing is unfinished
  button = createButton('DONE DRAWING');
  button.position(25, height - 60);
  button.id('done-button');
  button.parent("canvasContainer");
  button.mousePressed(end);

  // creating webcam video and hiding it
  video = createCapture(VIDEO);
  video.hide();

  // connection to server, defining what function shouold be executed on other connections whenever 'draw' is made
  socket = io.connect('http://localhost:3000');
  socket.on('draw', updateDrawing);
  socket.on('end', finishDrawing);
  socket.on('newCollaborator', updateCollaborators);
}

// executes same drawing on all connections based on data taken from single connection where 'draw' was made
function updateDrawing(data) {
  let newColor = color(data.r,data.g,data.b,data.a);
  fill(newColor);
  ellipse(data.x,data.y,data.s,data.s);
}

function updateCollaborators(name) {
  collaborators.push(name);
}

function end() {
  finished = true;
  socket.emit('end');
}

function finishDrawing() {
  finished = true;
}

// user can 'draw' whenver they drag their mouse on canvas
function mouseDragged() {

  if (!finished) {

  // color & opacity of drawing can be determined by user
  let newColor = colorPicker.color();
  let newT = tSlider.value();
  let newS = map(sSlider.value(),1,10,10,100);
  newColor.setAlpha(newT);
  fill(newColor);
  ellipse(mouseX,mouseY,newS,newS);

  // Referenced following answer on Stack Overflow on use of regex to transform color string to array.
  // https://stackoverflow.com/questions/10970958/get-a-color-component-from-an-rgb-string-in-javascript
  // (I initially tried sending a color object as part of the data variable, but it could not be recognized as a color in the updateDrawing() function. Thus I decided to convert color object -> string -> array in order to access the individual rgba values).
  newColor = newColor.toString();
  newColor = newColor.replace(/[^\d,]/g, '').split(',');

  var data = {
    x: mouseX,
    y: mouseY,
    s: newS,
    r: newColor[0],
    g: newColor[1],
    b: newColor[2],
    a: newT
  };

  socket.emit('draw', data);
  console.log('Sending: ' + mouseX + ', ' + mouseY);

  }

}

function draw() {

  if (finished) {
    background(255);
    fill(255);
    colorPicker.hide();
    tSlider.hide();
    sSlider.hide();
    button.hide();
    rect(0,0,width,50);
    push();
    textFont('Helvetica');
    textSize(25);
    fill(0);
    let collaboratorsString = collaborators.toString().replaceAll(","," and ");
    collaboratorsString = collaboratorsString.toUpperCase();
    text('COLLABORATION BY ' + collaboratorsString,20,30);
    pop();
  }

  else {
    // creation of header and footer so controls / buttons are visible
    fill(255);
    rect(0,0,width,50);
    rect(0,height - 75,width,75);

    // creation of labels for color picker and opacity slider
    push();
    textFont('Helvetica');
    fill(0);
    text('COLOR',20,28);
    text('OPACITY',160,28);
    text('SIZE',340,28);
    pop();
    // image(video, 0, 0, width / 2, width / 2 * 3 / 4);
  }
}
