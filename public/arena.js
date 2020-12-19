let playerSize = 0;
let boxSize = 0;
const INTERACTION_KEYCODE = 'z'; // paspaudus z mygtuka paimama/padedama dėžė
let endZone1=null;
let endZone2=null;
let gameObjects = [];
let gameId = -1;
var socket = io();

socket.on("game ready", (arenaInfo) => {
  console.log({arenaInfo});
  gameId = arenaInfo.gameId;
  playerSize = arenaInfo.playerSize;
  boxSize = arenaInfo.boxSize;
  endZone1 = arenaInfo.endZone1;
  endZone2 = arenaInfo.endZone2;

});

socket.on("state", (data) => {
  updateGameObjects(data);
});

socket.on("winner", () => {
  alert('You won!!!');
});

socket.on("loser", () => {
  alert('You lost!!!');
});

function setup() {
  createCanvas(800, 800, WebGLProgram);
  rectMode(CENTER);
}

function draw(data) {
  background(204);

  if(endZone1) drawEndZone(endZone1);  // nupiešiamos žaidėjų zonos
  if(endZone2) drawEndZone(endZone2);
  gameObjects.forEach((gameObject) => {
    if (gameObject.type == "user")
      drawPlayer( // nupiešiami žaidėjai kreipiamasi į arena.json
        gameObject.position.x,
        gameObject.position.y, 
        gameObject.color
      );
    if (gameObject.type == "box") 
      drawBox(// nupiešiamos dėžės, kreipiamasi į arena.json
        gameObject.position.x,
        gameObject.position.y,
        gameObject.color
      ); 
  });

  fill("Salmon");  // pelytės kursorius rodantis arenos koordinates
  textSize(16);
  textAlign(CENTER);
  text("(" + floor(mouseX) + ", " + floor(mouseY) + ")", mouseX, mouseY);
}

/// ši funkcija nupiešia žaidėjus

function drawPlayer(x, y, color) {
  if (color == "blue") fill(30, 144, 255);
  if (color == "yellow") fill(255, 255, 0);
  ellipse(x, y, playerSize, playerSize);
}

// ši funkcija nupiešia dėžes

function drawBox(x, y, color) {
  if (color == "red") fill(255, 0, 0);
  if (color == "green") fill(0, 255, 0);
  rect(x, y, boxSize, boxSize);
}
/// jei pelytė paspausta ant žaidimo 
function mousePressed() {
  /// fiksuojamas žaidėjo pokytis į serverį
  socket.emit("mouse", { x: mouseX, y: mouseY });
}

/// jei mygtukas, leidžiantis paimti/padėti dėžę paspaustas
function keyTyped() {
  if (key === INTERACTION_KEYCODE) {
    ///fiksuojamas žaidėjo atliktas veiksmas į serverį (paspaustas mygtukas)
    socket.emit("key", keyCode);
  } 
}
function updateGameObjects(editedObjects){  // vykdo žaidimo objektu atnaujinimus
  editedObjects.forEach(gameObject => {

    let foundIndex = gameObjects.findIndex(x => x.id == gameObject.id);
    if(foundIndex==-1)
    {
      gameObjects.push(gameObject);  // jei objekto koordinatės nesutampa su pradinėmis vykdomas atnaujinimas
    }
    else
    {
      gameObjects[foundIndex] = gameObject;

    }
 
  })
}

// ši funkcija nupiešia zonas, kur turi būti nešamos dėžės

function drawEndZone(endZone)
{
  if (endZone.color == "blue") fill(30, 144, 255, 100);
  if (endZone.color == "yellow") fill(255, 255, 0, 100);
  rect(endZone.position.x, endZone.position.y, endZone.size.x, endZone.size.y);
}
