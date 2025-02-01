// game.js
import { createEffect, createSignal } from '../utils/signal.js';
import { createEventBinding } from '../utils/eventBinding.js';
import { ChatBox } from "./chatBox.js";
import { Player } from '../components/player.js';
import socket from "../utils/socket.js";
import { PlayerManager } from "../components/playermanager.js";

export class Game {
    constructor() {
        this.socket = socket;
        this.name = null;
        this.clientId = null;
        this.eventBinding = createEventBinding();
        this.playerManager = new PlayerManager();
        this.chat = new ChatBox(this.socket);
        this.keys = {};
        this.players = createSignal([]);
        this.lastDirection = 'down';
        this.currentPlayerImage = '';
        this.mapCompleted = false;
        this.playernumber = null;
        this.wallImage = './images/walls/iron.png';
        this.greenWallImage = './images/walls/iron.png';
        this.breakableWallImage = './images/walls/wall1.png';
        this.groundImage = './images/walls/ground.png';
        this.bombImage = './images/items/bombplaced.gif';
        this.flamesImage = './images/items/flames.png';
        this.bombsImage = './images/items/multibombs.png';
        this.speedImage = './images/items/speed.png';
        this.activeBombs = new Map();
        this.availablePowerUps = [];
        this.playerOnBomb = null;
    }

    bind() {
        createEffect(() => {
            this.socket.emit("isRegistered");

            this.socket.on("notRegistered", () => {
                window.location.href = '#/';
                window.location.reload();
            });

            this.socket.on("GameState", (gameState, playernumber) => {
                this.handleGameState(gameState, playernumber);
            });

            this.socket.on("playerMoved", (player) => {
                this.playerManager.updatePlayer(player.movedPlayer);
            });

            this.socket.on("stoppedMoving", (player) => {
                this.playerManager.updatePlayer(player);
            });

            this.socket.on("disconnect", () => {
                console.log("Disconnected from server");
            });

            const gameContainer = document.getElementById('gameContainer');
            for (let i = 0; i < 17 * 17; i++) {
                const square = document.createElement('div');
                square.className = 'box';
                square.id = `box-${i}`;
                gameContainer.appendChild(square);
            }

            this.eventBinding.bindEvent(document, 'keydown', event => {
                if (['w', 'a', 's', 'd'].includes(event.key)) {
                    this.socket.emit('playerMoved', event.key);
                }
            });

            this.eventBinding.bindEvent(document, 'keyup', event => {
                if (['w', 'a', 's', 'd'].includes(event.key)) {
                    this.socket.emit('playerStop', event.key);
                }
            });
        });

        this.chat.bind();
        this.chat.listenForMessages();
    }

    handleGameState(gameState, playernumber) {
      if (!this.mapCompleted) {
          this.renderMap(gameState);
          this.mapCompleted = true;
      }
  
      if (this.playernumber === null) {
          this.playernumber = playernumber;
      }
  
      // Remove players who are no longer in the game state
      this.playerManager.players.forEach(player => {
          if (!gameState.gameState.players.some(serverPlayer => serverPlayer.number === player.number)) {
              const playerElement = document.getElementById(`player-${player.number}`);
              if (playerElement) {
                  playerElement.remove(); // Remove the player element from the DOM
              }
              this.playerManager.removePlayer(player.number); // Remove the player from the manager
          }
      });
  
      // Add or update players based on the server's game state
      gameState.gameState.players.forEach(serverPlayer => {
          const player = this.playerManager.getPlayer(serverPlayer.number);
          if (player) {
              player.copyPropertiesFrom(serverPlayer); // Update existing player
          } else {
              const newPlayer = new Player(serverPlayer.number, serverPlayer.xPos, serverPlayer.yPos);
              this.playerManager.addPlayer(newPlayer); // Add new player
          }
      });
  
      // Append or update player elements in the game container
      const gameContainer = document.getElementById("gameContainer");
      gameContainer.appendChild(this.playerManager.renderPlayers());
  }

    renderMap(gameState) {
        const boxes = document.querySelectorAll('.box');
        const gameContainer = document.getElementById('gameContainer');

        gameState.gameState.walls.forEach((wall, i) => {
            const x = i % 17;
            const y = Math.floor(i / 17);
            const box = boxes[i];

            switch (wall.type) {
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

                        switch (wall.powerup.type) {
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

    renderBombs(gameState) {
      const gameContainer = document.getElementById('gameContainer');
  
      // Clear existing bombs
      document.querySelectorAll('.bomb').forEach(bomb => bomb.remove());
  
      // Render active bombs
      gameState.bombs.forEach(bomb => {
          const bombElement = document.createElement('div');
          bombElement.className = 'bomb';
          bombElement.style.position = 'absolute';
          bombElement.style.left = `${bomb.x}px`;
          bombElement.style.top = `${bomb.y}px`;
          bombElement.style.width = '60px';
          bombElement.style.height = '60px';
          bombElement.style.backgroundImage = `url(${this.bombImage})`;
          bombElement.style.backgroundSize = 'cover';
          bombElement.style.zIndex = '1';
  
          gameContainer.appendChild(bombElement);
      });
  }

  handleExplosions(gameState) {
    const gameContainer = document.getElementById('gameContainer');

    // Clear existing explosions
    document.querySelectorAll('.explosion').forEach(explosion => explosion.remove());

    // Render explosions
    gameState.explosions.forEach(explosion => {
        const explosionElement = document.createElement('div');
        explosionElement.className = 'explosion';
        explosionElement.style.position = 'absolute';
        explosionElement.style.left = `${explosion.x}px`;
        explosionElement.style.top = `${explosion.y}px`;
        explosionElement.style.width = '60px';
        explosionElement.style.height = '60px';
        explosionElement.style.backgroundImage = `url(${this.explosionImage})`;
        explosionElement.style.backgroundSize = 'cover';
        explosionElement.style.zIndex = '2';

        gameContainer.appendChild(explosionElement);

        // Remove explosion after a short delay
        setTimeout(() => {
            explosionElement.remove();
        }, 1000);
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
  