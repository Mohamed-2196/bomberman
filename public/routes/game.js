// import { io } from "/socket.io/socket.io.esm.min.js";
import { createEffect, createSignal } from '../utils/signal.js'
import { createEventBinding } from '../utils/eventBinding.js'
import { ChatBox } from "./chatBox.js";
import { Player } from '../components/player.js'
import socket  from "../utils/socket.js";
import {PlayerManager}  from "../components/playermanagaer.js";
export class Game {
  static count = 0
  constructor () {
    
    
    this.socket = socket;
    this.name = null;
    this.clientId = null;
    this.eventBinding = createEventBinding()
    this.playermanager = new PlayerManager();
    this.chat = new ChatBox(this.socket);
    this.keys = {}
    this.players = createSignal([])
    this.lastDirection = 'down'
    this.currentPlayerImage = ''
    this.mapcompelted = false;
  this.playernumber = null;

    this.wallImage = './images/walls/iron.png'
    this.greenWallImage = './images/walls/iron.png'
    this.breakableWallImage = './images/walls/wall1.png'
    this.groundImage = './images/walls/ground.png'
    this.bombImage = './images/items/bombplaced.gif'
    this.flamesImage = './images/items/flames.png'
    this.bombsImage = './images/items/multibombs.png'
    this.speedImage = './images/items/speed.png'
    this.activeBombs = new Map()
    this.availablePowerUps = []
    this.playerOnBomb = null
  }

  bind () {
    createEffect(() => {
      // this.socket.on("connect", () => {
      //   console.log("Connected to server");
    //     navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    // .then((stream) => {
    //     var madiaRecorder = new MediaRecorder(stream);
    //     var audioChunks = [];

    //     madiaRecorder.addEventListener("dataavailable", function (event) {
    //         audioChunks.push(event.data);
    //     });

    //     madiaRecorder.addEventListener("stop",  ()=> {
    //         var audioBlob = new Blob(audioChunks);
    //         audioChunks = [];
    //         var fileReader = new FileReader();
    //         fileReader.readAsDataURL(audioBlob);
    //         fileReader.onloadend = () => {
    //           var base64String = fileReader.result;
    //           this.socket.emit("audioStream", base64String);
    //       };

    //         madiaRecorder.start();
    //         setTimeout(function () {
    //             madiaRecorder.stop();
    //         }, 1000);
    //     });

    //     madiaRecorder.start();
    //     setTimeout(function () {
    //         madiaRecorder.stop();
    //     }, 1000);
    // })
    // .catch((error) => {
    //     console.error('Error capturing audio.', error);
    // });
      // });

    //   this.socket.on('audioStream', (audioData) => {

    //     var newData = audioData.split(";");
    //     newData[0] = "data:audio/ogg;";
    //     newData = newData[0] + newData[1];
    
    //     var audio = new Audio(newData);
    //     if (!audio || document.hidden) {
    //         return;
    //     }
    //     console.log(audio)
    //     audio.play();
    // });

    this.socket.on("playerMoved", (player) => {
      
      this.playermanager.updatePlayer(player.movedPlayer);
    });

    this.socket.on("stoppedMoving", (player) => {
      this.playermanager.updatePlayer(player);
    })
   

      this.socket.emit("isRegistered")
      this.socket.on("GameState", (gameState, playernumber) => {
        this.playermanager.players.forEach(player =>{

          if(!(gameState.gameState.players.includes(player))) {
            document.getElementById(`player-${player.number}`).remove();
            this.playermanager.players = this.playermanager.players.filter(p => p.number !== player.number);
            console.log("wowoowowowo");
          }

        })
        if(!this.mapcompelted){
          this.renderMap(gameState)
          this.mapcompelted = true;
        }
        if(this.playernumber === null){
          this.playernumber = gameState.playernumber;
        }
        
        gameState.gameState.players.forEach((theplayer) => {
          
          let player = new Player(theplayer.number, theplayer.xPos, theplayer.yPos);
          console.log("i am new");
          
          this.playermanager.addPlayer(player);

        });
        const gameContainer = document.getElementById("gameContainer");
        gameContainer.appendChild(this.playermanager.renderPlayers());
        
      });
      this.socket.on("notRegistered", () => {
        window.location.href = '#/'
        window.location.reload();
      })
      this.socket.on("disconnect", () => {
        console.log("Disconnected from server");
        
      });
      const gameContainer = document.getElementById('gameContainer')

      for (let i = 0; i < 17 * 17; i++) {
        const square = document.createElement('div')
        square.className = 'box'
        square.id = `box-${i}`
        gameContainer.appendChild(square)
      }


    
// Initialize chat
this.chat.bind();
this.chat.listenForMessages();

      // const player = document.getElementById('player')
      // const playerImage = document.getElementById('player-image')
      // const topleftcorner = document.getElementById('box-256')
      // const gameContainerRect = gameContainer.getBoundingClientRect()
      // const cornerRect = topleftcorner.getBoundingClientRect()

      // Initialize player position
      // this.playerX = cornerRect.left - gameContainerRect.left + 9
      // this.playerY = cornerRect.top - gameContainerRect.top + 9
      // this.initx = cornerRect.left - gameContainerRect.left + 9
      // this.inity = cornerRect.top - gameContainerRect.top + 9
      // console.log(this.playerX, this.playerY)
      // player.style.left = `${this.playerX}px`
      // player.style.top = `${this.playerY}px`

      // const DetectCollision = (user, dx, dy) => {
      //   const rect1 = user.getBoundingClientRect()
      //   const nextRect1 = {
      //     top: rect1.top + dy,
      //     right: rect1.right + dx,
      //     bottom: rect1.bottom + dy,
      //     left: rect1.left + dx
      //   }

      //   let walls = document.querySelectorAll('[data-wall="true"]')
      //   for (const wall of walls) {
      //     const rect2 = wall.getBoundingClientRect()

      //     if (
      //       nextRect1.top < rect2.bottom &&
      //       nextRect1.right > rect2.left &&
      //       nextRect1.bottom > rect2.top &&
      //       nextRect1.left < rect2.right
      //     ) {
      //       return true
      //     }
      //   }

      //   // Check collision with active bombs
      //   for (const [bombId, bombData] of this.activeBombs) {
      //     if (!bombData.walkable || bombId !== this.playerOnBomb) {
      //       const bombRect = bombData.element.getBoundingClientRect()
      //       if (
      //         nextRect1.top < bombRect.bottom &&
      //         nextRect1.right > bombRect.left &&
      //         nextRect1.bottom > bombRect.top &&
      //         nextRect1.left < bombRect.right
      //       ) {
      //         return true
      //       }
      //     }
      //   }

      //   // Check collision with powerups
      //   for (const powerup of this.availablePowerUps) {
      //     const powerupRect = powerup.getBoundingClientRect()
      //     if (
      //       nextRect1.top < powerupRect.bottom &&
      //       nextRect1.right > powerupRect.left &&
      //       nextRect1.bottom > powerupRect.top &&
      //       nextRect1.left < powerupRect.right
      //     ) {
      //       const powerupName = powerup.getAttribute('data-power-name')
      //       if (powerupName === 'bombs') {
      //         this.player.bombs++
      //         this.availablePowerUps = this.availablePowerUps.filter(
      //           pwr => pwr !== powerup
      //         )
      //       } else if (powerupName === 'speed') {
      //         this.player.speed += 0.2
      //         this.availablePowerUps = this.availablePowerUps.filter(
      //           pwr => pwr !== powerup
      //         )
      //       } else if (powerupName === 'flames') {
      //         this.player.range++
      //         this.availablePowerUps = this.availablePowerUps.filter(
      //           pwr => pwr !== powerup
      //         )
      //       }

      //       gameContainer.removeChild(powerup)

      //       return true
      //     }
      //   }

      //   return false
      // }

      // const updatePlayerImage = moving => {
      //   const playerImagePath = moving
          // ? this.playerImages[this.lastDirection]
      //     : this.playerImages[
      //         `idle${
      //           this.lastDirection.charAt(0).toUpperCase() +
      //           this.lastDirection.slice(1)
      //         }`
      //       ]

      //   if (this.currentPlayerImage !== playerImagePath) {
      //     this.currentPlayerImage = playerImagePath
      //     playerImage.src = playerImagePath
      //   }
      // }

      // const updatePosition = () => {
      //   const moving =
      //     this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d']

      //   if (moving && this.player.isalive) {
      //     let dx = 0
      //     let dy = 0

      //     if (this.keys['w']) {
      //       dy = -this.player.speed
      //       this.lastDirection = 'up'
      //     }
      //     if (this.keys['s']) {
      //       dy = this.player.speed
      //       this.lastDirection = 'down'
      //     }
      //     if (this.keys['a']) {
      //       dx = -this.player.speed
      //       this.lastDirection = 'left'
      //     }
      //     if (this.keys['d']) {
      //       dx = this.player.speed
      //       this.lastDirection = 'right'
      //     }

      //     if (!DetectCollision(player, dx, dy)) {
      //       this.playerX += dx
      //       this.playerY += dy
      //       player.style.left = `${this.playerX}px`
      //       player.style.top = `${this.playerY}px`
      //       if (this.playerOnBomb) {
      //         const bombData = this.activeBombs.get(this.playerOnBomb)
      //         if (bombData) {
      //           const bombRect = bombData.element.getBoundingClientRect()
      //           const playerRect = player.getBoundingClientRect()
      //           if (
      //             playerRect.left >= bombRect.right ||
      //             playerRect.right <= bombRect.left ||
      //             playerRect.top >= bombRect.bottom ||
      //             playerRect.bottom <= bombRect.top
      //           ) {
      //             this.playerOnBomb = null
      //           }
      //         }
      //       }
      //     }

      //     updatePlayerImage(true)
      //   } else {
      //     updatePlayerImage(false)
      //   }

      //   requestAnimationFrame(updatePosition)
      // }

      // this.eventBinding.bindEvent(document, 'keydown', event => {
      //   if (['w', 'a', 's', 'd'].includes(event.key)) {
      //     this.keys[event.key] = true
      //   }
      //   if (event.code === 'Space'&& this.player.bombs > 0 ) {
      //     if (this.player.isalive) {
      //       this.placeBomb();
      //     }}
      //   // }
      //   if (event.key === 'x') {
      //     if (this.player.isalive && this.player.bombs > 0) {
      //       this.placeBomb()
      //     }
      //   }
      // })

      // this.eventBinding.bindEvent(document, 'keyup', event => {
      //   if (['w', 'a', 's', 'd'].includes(event.key)) {
      //     this.keys[event.key] = false
      //   }
      // })

      // updatePosition()


      
      this.eventBinding.bindEvent(document, 'keydown', event => {
        this.playerX = parseFloat(document.getElementById(`player-${this.playernumber}`).style.left) ;
        this.playerY = parseFloat(document.getElementById(`player-${this.playernumber}`).style.top) ;
        if (['w', 'a', 's', 'd'].includes(event.key)) {
          socket.emit('playerMoved', event.key, this.playerX, this.playerY )
          }
      })

      this.eventBinding.bindEvent(document, 'keyup', event => {
        this.playerX = parseFloat(document.getElementById(`player-${this.playernumber}`).style.left) ;
        this.playerY = parseFloat(document.getElementById(`player-${this.playernumber}`).style.top) ;
        if (['w', 'a', 's', 'd'].includes(event.key)) {
          socket.emit('playerStop', event.key,this.playerX, this.playerY )
          }
      })
    })
  }
  respawnplayer () {
    if (this.player.lives <= 0) {
      setTimeout(() => {
        alert('Game Over')
        const player = document.getElementById('player')
        player.remove()
      }, 500)
    } else {
      setTimeout(() => {
        this.playerX = this.initx
        this.playerY = this.inity
        const player = document.getElementById('player')
        player.style.left = `${this.playerX}px`
        player.style.top = `${this.playerY}px`
        const playerImage = document.getElementById('player-image')
        playerImage.src = '../images/whiteplayermovements/standingdown.png'
        this.player.isalive = true
      }, 1700)
    }
  }
  placeBomb () {
    const bombX = Math.round(this.playerX / 60) * 60
    const bombY = Math.round(this.playerY / 60) * 60
    const bombId = `bomb-${bombX}-${bombY}`

    if (this.activeBombs.has(bombId)) return

    const bomb = document.createElement('div')
    bomb.id = bombId
    bomb.style.position = 'absolute'
    bomb.style.left = `${bombX}px`
    bomb.style.top = `${bombY}px`
    bomb.style.width = '60px'
    bomb.style.height = '60px'
    bomb.style.backgroundImage = `url(${this.bombImage})`
    bomb.style.backgroundSize = 'cover'
    bomb.style.zIndex = '1'
    this.player.bombs--

    document.getElementById('gameContainer').appendChild(bomb)
    this.activeBombs.set(bombId, { element: bomb, walkable: true })
    this.playerOnBomb = bombId

    setTimeout(() => {
      if (this.activeBombs.has(bombId)) {
        this.activeBombs.get(bombId).walkable = false
      }
    }, 1600) // Short delay before the bomb becomes unwalkable

    setTimeout(() => {
      if (this.activeBombs.has(bombId)) {
        document.getElementById('gameContainer').removeChild(bomb)
        this.activeBombs.delete(bombId)
        if (this.playerOnBomb === bombId) {
          this.playerOnBomb = null
        }

        // Define explosion configuration
        const explosionConfig = {
          up: {
            range: this.player.range,
            nearExplosion: '../images/explosion/up1.gif',
            farExplosion: '../images/explosion/up2.gif'
          },
          down: {
            range: this.player.range,
            nearExplosion: '../images/explosion/down1.gif',
            farExplosion: '../images/explosion/down2.gif'
          },
          left: {
            range: this.player.range,
            nearExplosion: '../images/explosion/left1.gif',
            farExplosion: '../images/explosion/left2.gif'
          },
          right: {
            range: this.player.range,
            nearExplosion: '../images/explosion/right1.gif',
            farExplosion: '../images/explosion/right2.gif'
          }
        }

        this.explodeBomb(bombX, bombY, explosionConfig)
        this.player.bombs++
      }
    }, 1600)
  }

  explodeBomb (bombX, bombY, explosionConfig) {
    const explosionDuration = 1000
    const tileSize = 60
    const gameContainer = document.getElementById('gameContainer')

    // Helper function to create explosion element
    const createExplosion = (x, y, explosionType) => {
      const tileIndex = (y / tileSize) * 17 + x / tileSize
      const tile = document.getElementById(`box-${tileIndex}`)

      if (tile) {
        let explosionGif
        if (explosionType === 'center') {
          explosionGif = '../images/explosion/ceterexp.gif'
        } else if (
          tile.dataset.wall === 'true' &&
          tile.dataset.breakable === 'true'
        ) {
          explosionGif = '../images/explosion/destruction.gif'
        } else if (tile.dataset.wall !== 'true') {
          explosionGif = explosionType
        }
        const tileRect = tile.getBoundingClientRect()
        const playerRect = player.getBoundingClientRect()
        if (
          playerRect.x < tileRect.x + 60 &&
          playerRect.x + 32 > tileRect.x &&
          playerRect.y < tileRect.y + 60 &&
          playerRect.y + 32 > tileRect.y
        ) {
          console.log(this.player.isalive)

          if (this.player.isalive == true) {
            this.player.lives--
            this.player.isalive = false
            const playerImage = document.getElementById('player-image')
            setTimeout(() => {
              playerImage.src = '../images/whiteplayermovements/death.gif'
            }, 100)
            this.respawnplayer()
          }
        }
        if (explosionGif) {
          tile.style.backgroundImage = `url(${explosionGif})`
          setTimeout(() => {
            if (
              tile.dataset.wall === 'true' &&
              tile.dataset.breakable === 'true'
            ) {
              tile.style.backgroundImage = `url(${this.groundImage})`
              tile.dataset.wall = 'false'
              tile.dataset.breakable = 'false'
              const id = tile.id.split('-')[1]
              console.log(id)

              const powerup = document.querySelector(`#powerup-box-${id}`)
              if (powerup) {
                powerup.style.zIndex = '1'
                this.availablePowerUps.push(powerup)
              }
            } else if (tile.dataset.wall !== 'true') {
              tile.style.backgroundImage = `url(${this.groundImage})`
            }
          }, explosionDuration)
        }
      }
    }

    const isWall = (x, y) => {
      const tileIndex = (y / tileSize) * 17 + x / tileSize
      const tile = document.getElementById(`box-${tileIndex}`)
      return (
        tile &&
        tile.dataset.wall === 'true' &&
        tile.dataset.breakable !== 'true'
      )
    }
    const isbreakableWall = (x, y) => {
      const tileIndex = (y / tileSize) * 17 + x / tileSize
      const tile = document.getElementById(`box-${tileIndex}`)
      return (
        tile && tile.dataset.wall === 'true' && tile.dataset.breakable == 'true'
      )
    }
    // Create center explosion
    createExplosion(bombX, bombY, 'center')

    const directions = ['up', 'down', 'left', 'right']

    // Create explosions in each direction
    directions.forEach(direction => {
      const { dx, dy } = this.getDirectionOffsets(direction)
      const config = explosionConfig[direction]

      for (let i = 1; i <= config.range; i++) {
        const newX = bombX + dx * tileSize * i
        const newY = bombY + dy * tileSize * i

        if (isWall(newX, newY)) {
          break // Stop the explosion in this direction if it hits an unbreakable wall
        }

        const explosionType =
          i === config.range ? config.farExplosion : config.nearExplosion

        createExplosion(newX, newY, explosionType)
        if (isbreakableWall(newX, newY)) {
          // Stop the explosion in this direction after it destroy a wall
          break
        }
      }
    })
  }

  getDirectionOffsets (direction) {
    const offsets = {
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 },
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 }
    }
    return offsets[direction]
  }
    renderMap  (gameState){
      console.log(gameState)
    const boxes = document.querySelectorAll('.box');
    const gameContainer = document.getElementById('gameContainer');

    gameState.gameState.walls.forEach((wall, i) => {
        const x = i % 17;
        const y = Math.floor(i / 17);
        const box = boxes[i];
        switch(wall.type) {
            case 'wall':
                box.style.backgroundImage = `url(${this.wallImage})`;
                box.dataset.wall = 'true';
                if (x % 2 === 0 && y % 2 === 0) {
                    box.style.backgroundImage = `url(${this.greenWallImage})`;
                }
                break;
            case 'block':
                box.style.backgroundImage = `url(${this.breakableWallImage})`;
                box.dataset.wall = 'true';
                box.dataset.breakable = 'true';
                if (wall.powerup) {
                    const powerup = document.createElement('div');
                    powerup.id = `powerup-${box.id}`;
                    powerup.style.left = `${x * 60}px`;
                    powerup.style.top = `${y * 60}px`;
                    powerup.style.width = '60px';
                    powerup.style.height = '60px';
                    powerup.style.position = 'absolute';
                    powerup.style.zIndex = '-1';
                    powerup.dataset.powerName = wall.powerup.type;
                    
                    switch(wall.powerup.type) {
                        case 'bombs':
                            powerup.style.backgroundImage = `url(${this.bombsImage})`;
                            break;
                        case 'speed':
                            powerup.style.backgroundImage = `url(${this.speedImage})`;
                            break;
                        case 'flames':
                            powerup.style.backgroundImage = `url(${this.flamesImage})`;
                            break;
                    }
                    powerup.style.backgroundSize = 'cover';
                    gameContainer.appendChild(powerup);
                }
                break;
            default:
                box.style.backgroundImage = `url(${this.groundImage})`;
                break;
        }
    });
}


  render() {
    return `
       <div id="game-wrapper">
          <div id="gameContainer">
          </div>
          <div id="chat-container">
             ${this.chat.render()} <!-- Render the chat box here -->
          </div>
       </div>
    `;
 }
}
