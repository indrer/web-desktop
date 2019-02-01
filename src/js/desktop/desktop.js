import Bar from './bar.js'
import Icon from './icon.js'
import Window from './window.js'

/* global HTMLElement */
const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  background-image: url('/image/background.jpg');
  background-size: cover;
  display: block;
  min-height: 100vh;
  padding: 30px;
}
</style>`

/**
 * Handles window opening (creating new windows), displaying them,
 * dragging windows around.
 */
export default class Desktop extends HTMLElement {
  constructor (doc) {
    super()
    // Shadow root
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    // Bottom bar ("start bar")
    this.bar = new Bar()
    // Main document element
    this.doc = doc
    // Apps that are opened
    this.openApps = {}
    doc.appendChild(this.bar)
    // Set up icons on the desktop
    this._createIcons()
  }

  /**
   * Creates icons that would open apps. Apps can be added to desktop
   * through this method
   */
  _createIcons () {
    // Creates actual icons on the desktop
    let chat = new Icon('chat', this)
    let memory = new Icon('memory-game', this)
    let draw = new Icon('draw', this)
    let about = new Icon('about', this)
    let quiz = new Icon('quiz', this)
    // Adds event listeners to open apps if the icons on desktop are clicked
    chat.addEventListener('icon-clicked', (event) => { this._launchApp(event.currentTarget.getName()) })
    memory.addEventListener('icon-clicked', (event) => { this._launchApp(event.currentTarget.getName()) })
    draw.addEventListener('icon-clicked', (event) => { this._launchApp(event.currentTarget.getName()) })
    about.addEventListener('icon-clicked', (event) => { this._launchApp(event.currentTarget.getName()) })
    quiz.addEventListener('icon-clicked', (event) => { this._launchApp(event.currentTarget.getName()) })

    // Add game icons to desktop element
    this.shadow.appendChild(chat)
    this.shadow.appendChild(memory)
    this.shadow.appendChild(draw)
    this.shadow.appendChild(about)
    this.shadow.appendChild(quiz)
  }

  /**
   * Handles the opening of new window with a specified app.
   * @param {String} name - name of the app
   */
  _launchApp (name) {
    let win = new Window(name)
    // Handles closing of the window
    win.addEventListener('close-window', (event) => {
      if (name === 'chat') { // Close socket if chat
        delete event.currentTarget.getApp().closeConnection()
      }
      // Remove icon from the bar
      this.bar.onAppClose(event.target)
      // Remove window from the desktop
      let parent = event.currentTarget.parentNode
      parent.removeChild(event.currentTarget)
    })

    // Handles minized window (simply hides visibility)
    win.addEventListener('min-window', (event) => {
      event.currentTarget.style.display = 'none'
    })
    this.shadow.appendChild(win)
    this.bar.addApp(win)
  }
}

window.customElements.define('web-desktop', Desktop)
