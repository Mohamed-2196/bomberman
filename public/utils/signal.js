class Signal {
  constructor (value) {
    this.value = value
    this.subscribers = []
  }

  getValue () {
    return this.value
  }

  setValue (newValue) {
    this.value = newValue
    this.emit()
  }

  emit () {
    this.subscribers.forEach(subscriber => subscriber(this.value))
  }

  subscribe (callback) {
    this.subscribers.push(callback)
  }
}

//effectCallback holds callback that an effect receives and subscribe it to the signal
// function used to create a signal in all class

let effectCallback = null

export const createSignal = val => {
  const signal = new Signal(val)
  return [
    function value () {
      if (effectCallback) {
        signal.subscribe(effectCallback)
      }
      return signal.getValue()
    },
    function setValue (newVal) {
      signal.setValue(newVal)
    }
    // // Subscribe function
    // function subscribe(callback) {
    //     signal.subscribe(callback);
    //   },
  ]
}

export const createEffect = callback => {
  effectCallback = callback
  callback()
  effectCallback = null
}

// Create a signal
//const [value 'getter', setNumber, subscribe] = createSignal(0);
