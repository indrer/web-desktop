import AppChat from '../apps/app-chat'
import AppMemory from '../apps/app-memory'
import AppDraw from '../apps/app-draw'
import AppAbout from '../apps/app-about'

/* global HTMLElement */
/* global Event */

const template = document.createElement('template')
template.innerHTML = `
<style> 
:host {
  all: initial;
  height: 350px;
  width: 450px;
  background-color: rgb(255, 255, 255, 0.4);
  position: absolute;
  top: 5px;
  left: 5px;
  border-radius: 5px;
}

.top {
  height: 35px;
  background-color: rgb(89, 89, 89, 0.9);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.buttons {
  width: 15px;
  height: 15px;
  top: 2%;
  position: absolute;
  display: block;
}

.mini {
  left: 90%;
}

.close {
  left: 95%;
}

.app {
  background-color: rgb(255, 255, 255, 0.4);
  padding: 5px;
  height: 305px;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.title {
  text-align: center;
  line-height: 30px;
  font-weight: bold;
  color: #cfcfcf;
}

.top img {
  left: 2%;
  height: 20px;
  width: 20px;
}
</style>
<div class="top">
<div class="title"></div>
<div class="buttons mini"><img src="image/min.png"></div>
<div class="buttons close"><img src="image/close.png"></div>
</div>
<div class="app"></div>
`

export default class Window extends HTMLElement {
  constructor (appName) {
    super()
    // Shadow root
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    this.appName = appName
    this.top = this.shadow.querySelector('.top')
    this.top.querySelector('.title').innerHTML = this.appName.charAt(0).toUpperCase() + this.appName.slice(1)
    this.app = null
    this.appPlace = this.shadow.querySelector('.app')
    this.window = this.shadow.querySelector('.window')
    this.closeBtn = this.shadow.querySelector('.buttons.close')
    this.minBtn = this.shadow.querySelector('.buttons.mini')
    this.mouseDown = false
    // Random zIndex
    this.style.zIndex = Math.floor(new Date().getTime() / 1000)
    this.posX = 0
    this.posY = 0
    this._setUpApp()
  }

  /**
   * Decides which app is opened and adds its element
   * to window element
   */
  _setUpApp () {
    switch (this.appName) {
      case 'chat':
        this.app = new AppChat(this)
        this.appPlace.appendChild(this.app)
        break
      case 'memory-game':
        this.app = new AppMemory()
        this.appPlace.appendChild(this.app)
        break
      case 'draw':
        this.app = new AppDraw()
        this.appPlace.appendChild(this.app)
        break
      case 'about':
        this.app = new AppAbout()
        this.appPlace.appendChild(this.app)
        break
      default:
        break
    }

    // Append app icon to the title bar
    let img = document.createElement('img')
    img.setAttribute('src', 'image/' + this.appName + '.png')
    img.classList.add('buttons')
    this.top.insertBefore(img, this.top.querySelector('.title'))
  }

  /**
   * Returns the app that belongs to this window.
   */
  getApp () {
    return this.app
  }

  /**
   * Increases z index (moves the window to the top).
   */
  updateZIndex () {
    this.style.zIndex = Math.floor(new Date().getTime() / 1000)
  }

  /**
   * Returns z index of this window.
   */
  getZIndex () {
    return this.style.zIndex
  }

  /**
   * Returns the name of the app.
   */
  getAppName () {
    return this.appName
  }

  /**
   * Event listeners for buttons at the top of the window and
   * clicking on the window itself
   */
  connectedCallback () {
    // The top of the window was clicked, so move the window up (get highest z index)
    this.top.addEventListener('mousedown', (event) => {
      this.style.zIndex = Math.floor(new Date().getTime() / 1000)
      this.active = true
      if (!event.currentTarget !== this.closeBtn || !event.currentTarget !== this.minBtn) {
        event.preventDefault()
        this.mouseDown = true
        this._onMouseDown(event)
      }
    })

    // Window itself was clicked, move it up
    this.addEventListener('mousedown', (event) => {
      this.style.zIndex = Math.floor(new Date().getTime() / 1000)
      this.active = true
    })

    // X button (close) was clicked, close the window
    this.closeBtn.addEventListener('click', (event) => {
      this._onClose()
    })
    // - button (minimize) was clicked, minimize the window
    this.minBtn.addEventListener('click', (event) => {
      this._onMinimize()
    })
  }

  /**
   * Handles dragging the window when it's clicked on the top bar.
   * @param {Event} event - stores the event information of clicking on the element
   */
  _onMouseDown (event) {
    // Current positions of mouse
    this.posX = event.clientX
    this.posY = event.clientY

    // Handle mouse movement
    window.addEventListener('mousemove', (event) => {
      if (this.mouseDown) { // Make sure the mouse button is pressed down
        event.preventDefault()
        let newPosX = this.posX - event.clientX
        let newPosY = this.posY - event.clientY
        this.posX = event.clientX
        this.posY = event.clientY
        this.style.top = (this.offsetTop - newPosY) + 'px'
        this.style.left = (this.offsetLeft - newPosX) + 'px'
      }
    })

    // Mouse button was released, prevent movement
    window.addEventListener('mouseup', () => {
      this.mouseDown = false
    })
  }

  /**
   * Creates and dispatches custom event on closing the window.
   */
  _onClose () {
    let event = new Event('close-window')
    this.dispatchEvent(event)
  }

  /**
   * Creates and dispachest custom even on minimizing the window.
   */
  _onMinimize () {
    let event = new Event('min-window')
    this.dispatchEvent(event)
  }
}

window.customElements.define('web-window', Window)
