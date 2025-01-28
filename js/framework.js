import { NotFoundComponent } from '../routes/notfound.js'
import { createEventBinding } from '../utils/eventBinding.js'

export class Framework {
  constructor () {
    this.routes = {}
    this.eventBinding = createEventBinding()
  }

  route (path, component) {
    this.routes[path] = component
  }

  start () {
    const navigateTo = () => {
      let path = window.location.hash.slice(1)
      console.log(path)
      if (path === '') {
        // If no hash is present, set the default route
        path = '/'
        window.location.hash = '#' + path
      }
      const Component = this.routes[path] || NotFoundComponent
      const appContainer = document.querySelector('#app')

      const componentInstance = new Component()
      appContainer.innerHTML = componentInstance.render()

      if (typeof componentInstance.bind === 'function') {
        componentInstance.bind()
      }
    }
    this.eventBinding.bindEvent(window, 'hashchange', navigateTo)
    navigateTo()
  }
}
