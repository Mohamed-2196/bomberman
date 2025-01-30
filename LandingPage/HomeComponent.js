import { createEventBinding } from "./mini-framework/utils/eventBinding.js";
import { EventEmitter } from "./mini-framework/utils/eventEmitter.js";

export class HomeComponent {
  constructor() {
    this.eventBinding = createEventBinding();
    this.playerName = '';
    this.eventEmitter = new EventEmitter();
    this.cloudPositionXLeft = 0;
    this.cloudPositionXRight = window.innerWidth;
  }

  render() {
    return `
      <div class="container">
      <img src="pngwing.com.png" alt="Bomberman Logo" class="logo" />
        <div class="input-group">
          <input type="text" id="playerName" placeholder="ENTER YOUR NAME" />
        </div>
        <button id="startGameButton">START GAME</button>
      </div>
      <div class="footer">
        © 2023 BOMBERMAN
      </div>
      <!-- Two Cloud GIFs added to the homepage -->
      <img id="cloudLeft" src="cloud.gif" alt="Moving Cloud Left" class="cloud" />
      <img id="cloudRight" src="cloud.gif" alt="Moving Cloud Right" class="cloud" />
    `;
  }

  bind() {
    const startGameButton = document.getElementById('startGameButton');
    const playerNameInput = document.getElementById('playerName');
    const cloudLeft = document.getElementById('cloudLeft');
    const cloudRight = document.getElementById('cloudRight');
    const cloudMiddle = document.getElementById('cloud'); // Select the third cloud
  
    if (startGameButton && playerNameInput) {
      this.eventBinding.bindEvent(startGameButton, 'click', () => {
        this.playerName = playerNameInput.value;
        if (this.playerName) {
          this.eventEmitter.emit('startGame', this.playerName);
        } else {
          alert('Please enter your name!');
        }
      });
    }
  
    if (cloudLeft && cloudRight && cloudMiddle) {
      this.animateClouds(cloudLeft, cloudRight, cloudMiddle);
    } else {
      console.error('Cloud elements not found!');
    }
  }
  
  animateClouds(cloudLeftElement, cloudRightElement, cloudMiddleElement) {
    let cloudMiddlePositionX = window.innerWidth / 2; // Start in the middle
    let cloudMiddleSpeed = 0.5; // Adjust the speed
  
    setInterval(() => {
      this.cloudPositionXLeft += 1;
      this.cloudPositionXRight -= 1;
      cloudMiddlePositionX += cloudMiddleSpeed;
  
      if (this.cloudPositionXLeft > window.innerWidth) {
        this.cloudPositionXLeft = -cloudLeftElement.width;
      }
      if (this.cloudPositionXRight < -cloudRightElement.width) {
        this.cloudPositionXRight = window.innerWidth;
      }
      if (cloudMiddlePositionX > window.innerWidth) {
        cloudMiddlePositionX = -cloudMiddleElement.width;
      }
  
      cloudLeftElement.style.transform = `translateX(${this.cloudPositionXLeft}px)`;
      cloudRightElement.style.transform = `translateX(${this.cloudPositionXRight}px)`;
      cloudMiddleElement.style.transform = `translateX(${cloudMiddlePositionX}px)`;
    }, 10);
  }
}  