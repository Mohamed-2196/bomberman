import { createEffect, createSignal } from '../utils/signal.js'
import { createEventBinding } from '../utils/eventBinding.js'
import { Player } from '../components/player.js'

export class Game {
  constructor() {
    this.player = new Player();
    this.eventBinding = createEventBinding();
    this.keys = ['w', 'a', 's', 'd'];
    this.playerY = 0;
    this.playerX = 0;
    this.dx = 0;
    this.dy = 0;
  }

  bind() {
    createEffect(() => {
      const gameContainer = document.getElementById('gameContainer');

      // Create 17x17 grid
      for (let i = 0; i < 17 * 17; i++) {
        const square = document.createElement('div');
        square.className = 'box';
        square.id = `box-${i}`; // Assign a unique ID to each box
        gameContainer.appendChild(square);
      }

      const boxes = document.querySelectorAll('.box');

      // Set up walls and other elements
      for (let i = 0; i < 289; i++) {
        const x = i % 17;
        const y = Math.floor(i / 17);

        if (x === 0 || x === 16 || y === 0 || y === 16) {
          boxes[i].style.backgroundColor = 'blue';
          boxes[i].dataset.wall = true;
        } else if (x % 2 === 0 && y % 2 === 0) {
          boxes[i].style.backgroundColor = 'green';
          boxes[i].dataset.wall = true;
        } else if (
          !(x <= 1 && y <= 1) && i!=19 && i!=35 &&
          !(x >= 15 && y >= 15) &&
          Math.random() < 0.40
        ) {
          boxes[i].style.backgroundColor = 'brown';
          boxes[i].dataset.wall = true;
          boxes[i].dataset.breakable = true;
        }
      }

      const player = document.getElementById('player');
      const topleftcorner = document.getElementById('box-18'); // box-18 as respawn position
      const gameContainerRect = gameContainer.getBoundingClientRect();
      const cornerRect = topleftcorner.getBoundingClientRect();

      // Set player position relative to the game container
      this.playerX = cornerRect.left - gameContainerRect.left + 10; // Offset for centering
      this.playerY = cornerRect.top - gameContainerRect.top + 10;
      player.style.left = `${this.playerX}px`;
      player.style.top = `${this.playerY}px`;

      const walls = document.querySelectorAll('[data-wall]');

      const DetectCollision = (user, walls, dx, dy) => {
        let rect1 = user.getBoundingClientRect();
        let collide = false;

        let nextRect1 = {
          top: rect1.top + dy,
          right: rect1.right + dx,
          bottom: rect1.bottom + dy,
          left: rect1.left + dx,
        };

        walls.forEach((wall) => {
          let rect2 = wall.getBoundingClientRect();

          if (
            nextRect1.top <= rect2.bottom &&
            nextRect1.right >= rect2.left &&
            nextRect1.bottom >= rect2.top &&
            nextRect1.left <= rect2.right
          ) {
            collide = true;
          }
        });

        return collide;
      };

      const update = () => {
        if (!DetectCollision(player, walls, this.dx, this.dy)) {
          this.playerX += this.dx;
          this.playerY += this.dy;
          player.style.left = `${this.playerX}px`;
          player.style.top = `${this.playerY}px`;
        }
        requestAnimationFrame(update);
      };

      this.eventBinding.bindEvent(document, 'keydown', (event) => {
        if (this.keys.includes(event.key)) {
          const speed = 3;

          if (event.key === 's') {
            this.dy = speed;
          } else if (event.key === 'w') {
            this.dy = -speed;
          } else if (event.key === 'd') {
            this.dx = speed;
          } else if (event.key === 'a') {
            this.dx = -speed;
          }
        }
      });

      this.eventBinding.bindEvent(document, 'keyup', (event) => {
        if (this.keys.includes(event.key)) {
          if (event.key === 's' || event.key === 'w') {
            this.dy = 0;
          } else if (event.key === 'd' || event.key === 'a') {
            this.dx = 0;
          }
        }
      });

      update();
    });
  }

  render() {
    return `
      <div id="container">
        <div id="gameContainer">
          ${this.player.render()}
        </div>
      </div>
    `;
  }
}
