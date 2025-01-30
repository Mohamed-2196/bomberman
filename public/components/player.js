export class Player {
  constructor () {
    this.speed = 2
    this.lives = 3
    this.bombs = 1
    this.range  = 2
    this.isalive = true
  }

  render () {
    return `
    <div id="player"></div>
    `
  }
}
