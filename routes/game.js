import { createEffect, createSignal } from '../utils/signal.js';
import { createEventBinding } from '../utils/eventBinding.js';
import { Player } from '../components/player.js';

export class Game {
  constructor() {
    this.player = new Player();
    this.eventBinding = createEventBinding();
    this.keys = {};
    this.playerY = 0;
    this.playerX = 0;
    this.speed = 2;
    this.lastDirection = 'down'; // Default direction
    this.currentPlayerImage = ''; // Track the current player image path

    // Define image paths for player states
    this.playerImages = {
      up: '../images/whiteplayermovements/movingup.gif',
      down: '../images/whiteplayermovements/movingdown.gif',
      left: '../images/whiteplayermovements/movingleft.gif',
      right: '../images/whiteplayermovements/movingright.gif',
      idleUp: '../images/whiteplayermovements/standingup.png',
      idleDown: '../images/whiteplayermovements/standingdown.png',
      idleLeft: '../images/whiteplayermovements/standingleft.png',
      idleRight: '../images/whiteplayermovements/standingright.png',
    };

    this.wallImage = '../images/walls/iron.png';
    this.greenWallImage = '../images/walls/iron.png';
    this.breakableWallImage = '../images/walls/wall1.png';
    this.groundImage = '../images/walls/ground.png';
  }

  bind() {
    createEffect(() => {
      const gameContainer = document.getElementById('gameContainer');

      // Create 17x17 grid
      for (let i = 0; i < 17 * 17; i++) {
        const square = document.createElement('div');
        square.className = 'box';
        square.id = `box-${i}`;
        gameContainer.appendChild(square);
      }

      const boxes = document.querySelectorAll('.box');

      // Set up walls, ground, and other elements
      for (let i = 0; i < 289; i++) {
        const x = i % 17;
        const y = Math.floor(i / 17);

        if (x === 0 || x === 16 || y === 0 || y === 16) {
          boxes[i].style.backgroundImage = `url(${this.wallImage})`;
          boxes[i].dataset.wall = 'true';
        } else if (x % 2 === 0 && y % 2 === 0) {
          boxes[i].style.backgroundImage = `url(${this.greenWallImage})`;
          boxes[i].dataset.wall = 'true';
        } else if (
          !(x <= 1 && y <= 1) && i !== 19 && i !== 35 &&
          !(x >= 15 && y >= 15) &&
          Math.random() < 0.40
        ) {
          boxes[i].style.backgroundImage = `url(${this.breakableWallImage})`;
          boxes[i].dataset.wall = 'true';
          boxes[i].dataset.breakable = 'true';
        } else {
          boxes[i].style.backgroundImage = `url(${this.groundImage})`;
        }
      }

      const player = document.getElementById('player');
      const playerImage = document.getElementById('player-image'); // Get the image element
      const topleftcorner = document.getElementById('box-18');
      const gameContainerRect = gameContainer.getBoundingClientRect();
      const cornerRect = topleftcorner.getBoundingClientRect();

      // Initialize player position
      this.playerX = cornerRect.left - gameContainerRect.left + 9;
      this.playerY = cornerRect.top - gameContainerRect.top + 9;
      player.style.left = `${this.playerX}px`;
      player.style.top = `${this.playerY}px`;

      const walls = document.querySelectorAll('[data-wall="true"]');

      const DetectCollision = (user, walls, dx, dy) => {
        const rect1 = user.getBoundingClientRect();
        const nextRect1 = {
          top: rect1.top + dy,
          right: rect1.right + dx,
          bottom: rect1.bottom + dy,
          left: rect1.left + dx,
        };

        for (const wall of walls) {
          const rect2 = wall.getBoundingClientRect();

          if (
            nextRect1.top < rect2.bottom &&
            nextRect1.right > rect2.left &&
            nextRect1.bottom > rect2.top &&
            nextRect1.left < rect2.right
          ) {
            return true;
          }
        }
        return false;
      };

      const updatePlayerImage = (moving) => {
        const playerImagePath = moving
          ? this.playerImages[this.lastDirection]
          : this.playerImages[`idle${this.lastDirection.charAt(0).toUpperCase() + this.lastDirection.slice(1)}`];

        // Only update the image if it's different from the current image
        if (this.currentPlayerImage !== playerImagePath) {
          this.currentPlayerImage = playerImagePath; // Update the dummy variable
          playerImage.src = playerImagePath; // Update the image src
        }
      };

      const updatePosition = () => {
        const moving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'];

        if (moving) {
          let dx = 0;
          let dy = 0;

          if (this.keys['w']) {
            dy = -this.speed;
            this.lastDirection = 'up';
          }
          if (this.keys['s']) {
            dy = this.speed;
            this.lastDirection = 'down';
          }
          if (this.keys['a']) {
            dx = -this.speed;
            this.lastDirection = 'left';
          }
          if (this.keys['d']) {
            dx = this.speed;
            this.lastDirection = 'right';
          }

          if (!DetectCollision(player, walls, dx, dy)) {
            this.playerX += dx;
            this.playerY += dy;
            player.style.left = `${this.playerX}px`;
            player.style.top = `${this.playerY}px`;
          }

          updatePlayerImage(true);
        } else {
          updatePlayerImage(false);
        }

        requestAnimationFrame(updatePosition);
      };

      this.eventBinding.bindEvent(document, 'keydown', (event) => {
        if (['w', 'a', 's', 'd'].includes(event.key)) {
          this.keys[event.key] = true;
        }
      });

      this.eventBinding.bindEvent(document, 'keyup', (event) => {
        if (['w', 'a', 's', 'd'].includes(event.key)) {
          this.keys[event.key] = false;
        }
      });

      updatePosition();
    });
  }

  render() {
    return `
      <div id="container">
        <div id="gameContainer">
          <div id="player">
            <img id="player-image" src="../images/whiteplayermovements/standingdown.png" />
          </div>
        </div>
      </div>
    `;
  }
}