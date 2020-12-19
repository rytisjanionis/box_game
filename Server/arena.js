import { default as User } from "./user";
import * as ArenaData from "./arena.json";
import { default as Box } from "./box";

export const arena = (io, firstLevel) => {
  const BOX_PICKUP_RANGE = 20;
  const PLAYER_VELOCITY = 13;
  const ALLOWED_DELTA = 10;
  const PLAYER_SIZE = 50;   
  const BOX_SIZE = 30;   
  const WINNING_SCORE = 6; 

  let gameReady = false;  
  let gameId = 0;
  let usersConnected = []; // Sukuriamas prisijungusių žaidėjų sąrašas
  let boxes = []; // Sukuriamas žaidimo dėžių sąrašas
  let arenaStateChanged = false;
  let level = firstLevel && 1;
  let isWon = false;

  const initialBoxPositions = ArenaData.boxes; // apsirašomos dėžių pozicijos
  const initialPlayerPositions = ArenaData.players; // apsirašomos žaidėjų pozicijos
  const initialEndZonePositions = ArenaData.endZones; // apsirašomos EndZone pozicijos

  const start = () => {
    createServerState();

    io.on("connection", (socket) => {
      console.log("a user connected " + socket.client.id.toString());
      addUser(createUser(socket.client.id), () => {
        gameId++; // Prisijungus žaidėjui jam priskiriamas id
        gameReady = true; // Žaidimas paruoštas
        io.emit("game ready", getArenaInfo()); 
        arenaStateChanged = true;
      });

      socket.on("disconnect", () => {
        removeUserById(socket.client.id, () => {
          gameReady = false;
          io.emit("game stop", gameId);
        });
        console.log("user disconnected " + socket.client.id.toString());  // Konsolėje atspausdinamas klientas, kuris atsijungė
      });

      // socket.on('chat message', (msg) => {
      //     var d = new Date();
      //     msgDb.addMessage({
      //         message: msg,
      //         author: socket.client.id.toString(),
      //         date: d.toLocaleDateString()
      //     }).then(id => {
      //       console.log('message: ' + msg + " id:" + id);
      //       io.emit('chat message', msg + " id:" + id);
      //     })
      //   });

      socket.on("mouse", (destination) => {
        let user = getUser(socket.client.id);
        if (user != null) {
          setDestination(user, destination);  // žaidėjui pajudėjus serveris įrašo atliktą pokytį ir vykdo pakeitimus
        }
      });

      socket.on("key", (key) => {
        console.log("key pressed by " + socket.client.id); // konsolė atspausdina žaidėją, kuris paspaudė mygtuką
        let user = getUser(socket.client.id);
        if (user != null) {
          if (user.carryingBox) {
            dropBox(user);  // žaidėjui atnešus dėžę į EndZone ir ten ją padėjus jam pridedami taškai
          } else {
            const box = findBoxNearby(user);
            if (box !== null) {
              user.carryingBox = box; // jei žaidėjas nėra paėmęs dėžės paspaudus mygtuką esant arti dėžės jis ją paims
            }
          }
        }
      });

      socket.on("control", (e) => {});

      calculate((user) => {
        io.to(user.id).emit('winner');
        const losers = usersConnected.filter(x => x.id != user.id);
        losers.forEach(x => {
            io.to(x.id).emit('loser');
        })
      });

      deliverServerState(() => {
        io.emit("state", getServerState());
      });
    });
  };

  const dropBox = (user) => {
    let endZone = getEndZoneForBox(user.carryingBox); // žaidėjui atnešus dėžę į endZone

    if (endZone !== null) {
        console.log("user " + user.id + " score: " + user.score + 1); 
      user.score++; // konsolė prideda taškus žaidėjui, nunešusiam ir padėjusiam dėžę į endZone
      user.carryingBox.inEndZone = true;
    }

    user.carryingBox = null;
  };

  const getEndZoneForBox = (box) => {
    for (let i = 0; i < initialEndZonePositions.length; i++) {
      const zone = initialEndZonePositions[i];
      if (
        box.position.x >= zone.position.x - zone.size.x/2 &&
        box.position.x <= zone.position.x + zone.size.x/2 &&
        box.position.y >= zone.position.y - zone.size.y/2 &&
        box.position.y <= zone.position.y + zone.size.y/2
      ) {
        return zone;
      }
    }
    return null;
  };

  const getArenaInfo = () => {  // kreipiamasi į arena.json failą ir gaunami arenos lygio žaidėjų ir dėžių išdėstymas
    return {
      gameId: gameId,
      playerSize: PLAYER_SIZE,
      boxSize: BOX_SIZE,
      endZone1: initialEndZonePositions[0],
      endZone2: initialEndZonePositions[1],
    };
  };

  const deliverServerState = (senderFunction) => {  // funkcija vykdo žaidimo atnaujinimus, nustatytas 100ms intervalu
    setInterval(() => {
      if (arenaStateChanged) {
        senderFunction();
        arenaStateChanged = false;
      }
    }, 100);
  };

  const addUser = (user, callback) => { // funkcija prideda prisijungusius žaidėjus 
    if (usersConnected.indexOf(user) > -1) { 
      return false;
    } else {
      usersConnected.push(user);
      if (usersConnected.length === 2) { 
        callback(); // prisijungus 2 žaidėjam funkcija callbackina į createUser funkcija
      }
      return true;
    }
  };

  const removeUserById = (id, callback) => {
    for (let i = 0; i < usersConnected.length; i++) {
      if (usersConnected[i].id === id) {
        if (usersConnected.length === 2) {
          callback();
        }
        usersConnected.splice(i, 1);
        return true;
      }
    }
    return false;
  };

  const getUser = (id) => { // žaidėjam prisikiriami jų id
    for (let i = 0; i < usersConnected.length; i++) {
      if (usersConnected[i].id === id) {
        return usersConnected[i];
      }
    }
    return null;
  };

  const createUser = (id) => {  // pagal žaidėjo id jiem priskiriama pozicija, spalva, pusė
    const { position, color, side } = getInitialUserData();
    const user = new User(id, position, 0, id.toString(), color, side);
    return user;
  };

  const getInitialUserData = (id) => {  // Funkcija fiksuoja prisijungiančius žaidėjus, kreipiasi į arena.json failą ir prideda žaidėjus į arena
    if (initialPlayerPositions[0].id === null) {
      initialPlayerPositions[0].id = id;
      return {
        position: initialPlayerPositions[0].position,
        color: initialPlayerPositions[0].color,
        side: initialPlayerPositions[0].side,
      };
    }
    if (initialPlayerPositions[1].id === null) {
      initialPlayerPositions[1].id = id;
      return {
        position: initialPlayerPositions[1].position,
        color: initialPlayerPositions[1].color,
        side: initialPlayerPositions[1].side,
      };
    }
    return {
      position: {
        x: -1,
        y: -1,
      },
      color: "black",  
      side: "bottom",
    };
  };

  const setDestination = (user, destination) => { // funkcija fiksuoja žaidėjo kelio koordinates kai žaidėjas įvykdo pokytį
    user.destination = destination;
    console.log(  //  konsolėje atspausdinamos žaidėjo, įvykdžiusio pokytį žaidime koordinatės
      "destination set: x=" +
        destination.x.toString() +
        " | y=" +
        destination.y.toString()
    );
  };

  const getServerState = () => { // funkcija vykdo žaidimo atnaujinimus, dėžių, žaidėjų koordinačių pokyčius
    let state = [];
    for (let i = 0; i < usersConnected.length; i++) {
      state.push({
        type: "user",
        position: {
          x: usersConnected[i].position.x,
          y: usersConnected[i].position.y,
        },
        color: usersConnected[i].color,
        score: usersConnected[i].score,
        id: usersConnected[i].id,
      });
    }

    for (let i = 0; i < boxes.length; i++) {
      state.push({
        type: "box",
        position: {
          x: boxes[i].position.x,
          y: boxes[i].position.y,
        },
        color: boxes[i].color,
        id: boxes[i].id,
      });
    }

    return state;
  };

  const createServerState = () => { // pagal id iš arena.json failo dėžėm priskiriama id, spalva, pozicija
    for (let i = 0; i < initialBoxPositions.length; i++) {
      const box = initialBoxPositions[i];
      boxes.push(new Box(box.id, box.color, box.position));
    }
  };

  const findBoxNearby = (user) => { //
    let available = [];
    for (let i = 0; i < boxes.length; i++) {
      if (!boxes[i].inEndZone) { // jeigu dėžė nėra EndZone
        const boxDist = getDistance(boxes[i].position, user.position); 
        if (boxDist <= BOX_PICKUP_RANGE) { // žaidėjui pakankamai priartėjus prie dėžės galima paimti dėžę
          available.push({
            distance: boxDist,
            box: boxes[i],
          });
        }
      }
    }
    if (available.length > 0) {
      return available.sort((a, b) => a.distance - b.distance)[0].box;
    }
    return null;
  };

  
  const getDistance = (position1, position2) => { // šia funkcija vykdomas žaidėjo judėjimas pelyte
    return Math.sqrt(
      Math.pow(position1.x - position2.x, 2) +
      Math.pow(position1.y - position2.y, 2)
    );
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const calculate = async (announceWinner) => {
    while (true) {
      await sleep(100);
      for (let i = 0; i < usersConnected.length; i++) {
        const user = usersConnected[i];
        if (
          user.destination &&
          getDistance(user.position, user.destination) > ALLOWED_DELTA
        ) {
          arenaStateChanged = true;
          let rotation = Math.atan2(
            user.destination.y - user.position.y,
            user.destination.x - user.position.x
          );
          user.position.x += Math.cos(rotation) * PLAYER_VELOCITY;
          user.position.y += Math.sin(rotation) * PLAYER_VELOCITY;
          if (usersConnected[i].carryingBox !== null) {
            usersConnected[i].carryingBox.position.x = user.position.x;
            usersConnected[i].carryingBox.position.y = user.position.y;
          }
        }
        if (!isWon && user.score === WINNING_SCORE) {
            isWon = true;
            announceWinner(user);
        }
      }
    }
  };

  return {
    start,
  };
};
