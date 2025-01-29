export class Player {
  constructor () {
    this.lives=3;
    this.isalive=true;
  }

  render() {
    return `
    <div id="player"></div>
    `
  }

}
