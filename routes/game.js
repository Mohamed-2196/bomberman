import { createEffect, createSignal } from '../utils/signal.js'
import { createEventBinding } from '../utils/eventBinding.js'
import { Player } from '../components/player.js'

export class Game {
  constructor () {
    this.player = new Player()
    this.eventBinding = createEventBinding()
    this.keys = ['w', 'a', 's', 'd']
    this.playerY = 65
    this.playerX = 1000
    this.dx = 0
    this.dy = 0
  }

  bind() {
    createEffect(() => {
      const gameContainer = document.getElementById('gameContainer');
  
      for (let i = 0; i < 20 * 20; i++) {
        const square = document.createElement('div');
        square.className = 'box';
        gameContainer.appendChild(square);
      }
  
      const boxes = document.querySelectorAll('.box');
  
      for (let i = 0; i < 400; i++) {
        const x = i % 20; 
        const y = Math.floor(i / 20); 
  
        if (x === 0 || x === 19 || y === 0 || y === 19) {
          // Border walls
          boxes[i].style.backgroundColor = 'blue';
          boxes[i].dataset.wall = true;
        } else if (x % 2 === 0 && y % 2 === 0) {
          boxes[i].style.backgroundColor = 'green';
          boxes[i].dataset.wall = true;
        } else if (
          !(x <= 2 && y <= 2) && // Top-left starting area
          !(x >= 17 && y >= 17) && // Bottom-right starting area
          Math.random() < 0.5 
        ) {
          boxes[i].style.backgroundColor = 'brown';
          boxes[i].dataset.wall = true;
          boxes[i].dataset.breakable = true;
        }
      }
  
      const player = document.getElementById('player');
      const walls = document.querySelectorAll('[data-wall]');
  
      const DetectCollision = (user, walls, dx, dy) => {
        let rect1 = user.getBoundingClientRect();
        let collide = false;
  
        let nextRect1 = {
          top: rect1.top + dy,
          right: rect1.right + dx,
          bottom: rect1.bottom + dy,
          left: rect1.left + dx
        };
  
        walls.forEach(wall => {
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
  
      this.eventBinding.bindEvent(document, 'keydown', event => {
        if (this.keys.includes(event.key)) {
          const speed = 2;
  
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
  
      this.eventBinding.bindEvent(document, 'keyup', event => {
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
  

  render () {
    return `
    <div id="container">
      <div id="gameContainer">
      ${this.player.render()}
      </div>
      </div>
      `
  }
}