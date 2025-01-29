export class eventBinding {
  constructor () {
    this.eventListeners = {}
  }

  bindEvent (element, eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = []
    }

    this.eventListeners[eventName].push({ element, callback })
    element[`on${eventName}`] = callback
  }

  Off (element, eventName) {
    const eventlisteners = this.eventListeners[eventName]
    if (!eventlisteners) return
    const index = eventlisteners.findIndex(event => event.element === element)
    if (index !== -1) {
      eventlisteners.splice(index, 1)
      // To remove the event listener from the element, set it to null
      element[`on${eventName}`] = null
    }
  }
}

export function createEventBinding () {
  return new eventBinding()
}
