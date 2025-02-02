// game.js
import { createEffect, createSignal } from '../utils/signal.js'
import { createEventBinding } from '../utils/eventBinding.js'
import { ChatBox } from './chatBox.js'
import { Player } from '../components/player.js'
import socket from '../utils/socket.js'
import { PlayerManager } from '../components/playermanager.js'

export class Game {
  constructor () {
    this.socket = socket
    this.name = null
    this.clientId = null
    this.eventBinding = createEventBinding()
    this.playerManager = new PlayerManager()
    this.chat = new ChatBox(this.socket)
    this.keys = {}
    this.players = createSignal([])
    this.lastDirection = 'down'
    this.currentPlayerImage = ''
    this.mapCompleted = false
    this.playernumber = null
    this.wallImage = './images/walls/iron.png'
    this.greenWallImage = './images/walls/iron.png'
    this.breakableWallImage = './images/walls/wall1.png'
    this.groundImage = './images/walls/ground.png'
    this.bombImage = './images/items/bombplaced.gif'
    this.flamesImage = './images/items/flames.png'
    this.bombsImage = './images/items/multibombs.png'
    this.speedImage = './images/items/speed.png'
    this.explosionImage = './images/explosion/left1.gif'
    this.activeBombs = new Map()
    this.availablePowerUps = []
    this.playerOnBomb = null
    this.indexStates = []
    this.gameStarted = false
  }

  bind () {
    createEffect(() => {
      this.socket.emit('isRegistered')

      this.socket.on('notRegistered', () => {
        window.location.href = '#/'
        window.location.reload()
      })
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(stream => {
          var madiaRecorder = new MediaRecorder(stream)
          var audioChunks = []

          madiaRecorder.addEventListener('dataavailable', function (event) {
            audioChunks.push(event.data)
          })

          madiaRecorder.addEventListener('stop', () => {
            var audioBlob = new Blob(audioChunks)
            audioChunks = []
            var fileReader = new FileReader()
            fileReader.readAsDataURL(audioBlob)
            fileReader.onloadend = () => {
              var base64String = fileReader.result
              this.socket.emit('audioStream', base64String)
            }

            madiaRecorder.start()
            setTimeout(function () {
              madiaRecorder.stop()
            }, 1000)
          })

          madiaRecorder.start()
          setTimeout(function () {
            madiaRecorder.stop()
          }, 1000)
        })
        .catch(error => {
          console.error('Error capturing audio.', error)
        })

      this.socket.on('audioStream', audioData => {
        var newData = audioData.split(';')
        newData[0] = 'data:audio/ogg;'
        newData = newData[0] + newData[1]

        var audio = new Audio(newData)
        if (!audio || document.hidden) {
          return
        }
        audio.play()
      })
      this.socket.on('GameState', (gameState, playernumber) => {
        this.handleGameState(gameState, playernumber)
      })

      this.socket.on('playerMoved', player => {
        this.playerManager.updatePlayer(player.movedPlayer)
      })

      this.socket.on('stoppedMoving', player => {
        this.playerManager.updatePlayer(player)
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server')
      })
      this.socket.on('countdown', countdown => {
        const countdownElement = document.getElementById('countdown')
        if (countdownElement) {
          if (countdown > 0) {
            countdownElement.textContent = `Game starts in ${countdown} seconds...`
          } else {
            countdownElement.textContent = 'Game started!'
          }
        }
      })

      this.socket.on('gameStarted', () => {
        this.gameStarted = true
        const countdownElement = document.getElementById('countdown')
        countdownElement.textContent = ''
      })

      this.socket.on('gameOver', winnerName => {
        const gameOverMessage = winnerName
          ? `Game Over! ${winnerName} wins! Redirecting to home page in 5 seconds...`
          : 'Game Over! No winner. Redirecting to home page in 5 seconds...'

          console.log(winnerName, "XX");
          
        alert(gameOverMessage)

        setTimeout(() => {
          window.location.href = '#/'
          window.location.reload()
        }, 5000)
      })
      const gameContainer = document.getElementById('gameContainer')
      for (let i = 0; i < 17 * 17; i++) {
        const square = document.createElement('div')
        square.className = 'box'
        square.id = `box-${i}`
        gameContainer.appendChild(square)
      }

      this.eventBinding.bindEvent(document, 'keydown', event => {
        if (!this.gameStarted) return

        if (['w', 'a', 's', 'd'].includes(event.key)) {
          this.socket.emit('playerMoved', event.key)
        }
        if (event.code === 'Space' || event.key === 'x') {
          this.socket.emit('placeBomb')
        }
      })

      this.eventBinding.bindEvent(document, 'keyup', event => {
        if (['w', 'a', 's', 'd'].includes(event.key)) {
          this.socket.emit('playerStop', event.key)
        }
      })
    })

    this.chat.bind()
    this.chat.listenForMessages()
  }

  handleGameState (gameState, playernumber) {
    if (!this.mapCompleted) {
      this.renderMap(gameState)
      this.mapCompleted = true
    } else {
      this.renderMap(gameState)
    }

    this.renderBombs(gameState) // Ensure bombs are rendered
    this.handleExplosions(gameState)

    if (this.playernumber === null) {
      this.playernumber = playernumber
      console.log('why?', this.playernumber)
    }

    this.playerManager.players.forEach(player => {
      if (
        !gameState.gameState.players.some(
          serverPlayer => serverPlayer.number === player.number
        )
      ) {
        const playerElement = document.getElementById(`player-${player.number}`)
        if (playerElement) {
          playerElement.remove()
        }
        this.playerManager.removePlayer(player.number)
      }
    })

    gameState.gameState.players.forEach(serverPlayer => {
      const player = this.playerManager.getPlayer(serverPlayer.number)
      if (player) {
        player.copyPropertiesFrom(serverPlayer)

        const playerElement = document.getElementById(
          `player-${serverPlayer.number}`
        )
        if (playerElement) {
          if (!serverPlayer.isAlive) {
            playerElement.style.backgroundImage = `url(../images/whiteplayermovements/death.gif)`
          } else {
            player.updateImage()
          }
        }
      } else {
        const newPlayer = new Player(
          serverPlayer.number,
          serverPlayer.xPos,
          serverPlayer.yPos
        )
        this.playerManager.addPlayer(newPlayer) //
      }
    })
    const playerLivesElement = document.getElementById('player-lives')
    playerLivesElement.innerHTML = ''

    gameState.gameState.players.forEach(player => {
      const playerDiv = document.createElement('div')
      playerDiv.textContent = `${player.name}: ${player.lives} lives left`
      playerLivesElement.appendChild(playerDiv)
    })

    // Render players
    const gameContainer = document.getElementById('gameContainer')
    gameContainer.appendChild(this.playerManager.renderPlayers())
  }

  renderMap (gameState) {
    const boxes = document.querySelectorAll('.box')
    gameState.gameState.walls.forEach((wall, i) => {
      const box = boxes[i]
      switch (wall.type) {
        case 'wall':
          box.style.backgroundImage = `url(${this.wallImage})`
          box.dataset.wall = 'true'
          break
        case 'block':
          box.style.backgroundImage = `url(${this.breakableWallImage})`
          box.dataset.wall = 'true'
          box.dataset.breakable = 'true'
          break
        case 'empty':
          if (wall.isBurned) {
            box.style.backgroundImage = `url(../images/explosion/destruction.gif)`
            setTimeout(() => {
              box.style.backgroundImage = `url(${this.groundImage})`
              box.dataset.wall = 'false'
              box.dataset.breakable = 'false'
              wall.isBurned = false
            }, 1000)
          } else if (
            wall.powerup == 'bombs' ||
            wall.powerup == 'speed' ||
            wall.powerup == 'flames'
          ) {
            box.style.backgroundImage = `url(${this.getPowerupImage(
              wall.powerup
            )})`
          } else {
            box.style.backgroundImage = `url(${this.groundImage})`
            box.dataset.wall = 'false'
            box.dataset.breakable = 'false'
            break
          }
          break
        default:
          box.style.backgroundImage = `url(${this.groundImage})`
          box.dataset.wall = 'false'
          box.dataset.breakable = 'false'
          break
      }
    })
  }

  getPowerupImage (powerupType) {
    switch (powerupType) {
      case 'bombs':
        return './images/items/multibombs.png'
      case 'speed':
        return './images/items/speed.png'
      case 'flames':
        return './images/items/flames.png'
    }
  }
  renderBombs (gameState) {
    const gameContainer = document.getElementById('gameContainer')
    document.querySelectorAll('.bomb').forEach(bomb => bomb.remove())
    gameState.gameState.bombs.forEach(bomb => {
      const bombElement = document.createElement('div')
      bombElement.className = 'bomb'
      bombElement.style.position = 'absolute'
      bombElement.style.left = `${bomb.x}px`
      bombElement.style.top = `${bomb.y}px`
      bombElement.style.width = '60px'
      bombElement.style.height = '60px'
      bombElement.style.backgroundImage = `url(${this.bombImage})`
      bombElement.style.backgroundSize = 'cover'
      bombElement.style.zIndex = '1'
      gameContainer.appendChild(bombElement)
    })
  }

  handleExplosions (gameState) {
    const gameContainer = document.getElementById('gameContainer')
    document
      .querySelectorAll('.explosion')
      .forEach(explosion => explosion.remove())
    gameState.gameState.explosions.forEach(explosion => {
      const explosionElement = document.createElement('div')
      explosionElement.className = 'explosion'
      explosionElement.style.position = 'absolute'
      explosionElement.style.left = `${explosion.x}px`
      explosionElement.style.top = `${explosion.y}px`
      explosionElement.style.width = '60px'
      explosionElement.style.height = '60px'
      explosionElement.style.backgroundImage = `url(${explosion.type})`
      explosionElement.style.backgroundSize = 'cover'
      explosionElement.style.zIndex = '1'
      gameContainer.appendChild(explosionElement)
      setTimeout(() => {
        explosionElement.remove()
      }, 1000)
    })
  }

  render () {
    return `
         <div id="game-wrapper">
            <div id="gameContainer">
            </div>
            <div id="chat-container">
               ${this.chat.render()} <!-- Render the chat box here -->
            </div>
<div id="footer">
    <div id="countdown"></div>
    <div id="player-lives"></div>
</div>
         </div>
      `
  }
}
