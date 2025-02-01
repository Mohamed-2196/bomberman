import { NotFoundComponent } from '../routes/notfound.js'
import { createEventBinding } from '../utils/eventBinding.js'
// import { Game } from '../routes/game.js'

export class Framework {
  constructor () {
    this.routes = {}
    this.eventBinding = createEventBinding()
    this.counter = 0
  }

  route (path, component) {
    this.routes[path] = component
  }

  start () {
    
    const navigateTo = () => {
      let path = window.location.hash.slice(1)
      if (path === '') {
        // If no hash is present, set the default route
        path = '/'
        if (this.isInitialLoad) {
          this.isInitialLoad = false
          window.location.hash = '#' + path //this will already trigger navigate 
          return // so we exit here to prevent calling it twice
        }
      }
      const Component = this.routes[path] || NotFoundComponent

      const appContainer = document.querySelector('#app')

      const componentInstance = new Component()
      appContainer.innerHTML = componentInstance.render()

      if (typeof componentInstance.bind === 'function') {
        componentInstance.bind()
      }
    }
     //the logic for assigning the / path to #/ triggers this twice causing two renders
    this.eventBinding.bindEvent(window, 'hashchange', navigateTo)
    navigateTo()
  }
}
