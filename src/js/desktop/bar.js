/* global HTMLElement */

const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  background-color: rgba(0, 0, 0, 0.75);
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 60px;
}

#icon-bar {
  height: 40px;
  width: 40px;
  padding: 5px;
  border-radius: 5px;
  background-color: rgba(218, 218, 218, 0.25);
  border: 1px solid black;
  margin: 5px;
  top: 0px;
  display: block;
  position: absolute;
}

#icon-bar img {
  position: relative;
  float: left;
  max-width: 100%;
  height: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.active {
  border-bottom: 2px solid aqua !important;
}

</style>`

export default class Bar extends HTMLElement {
  constructor () {
    super()
    // Shadow root
    this.setAttribute('id', 'bar')
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    // Arrays to track open apps
    this.openApps = []
    this.barIcons = []
  }

  /**
   * Handles icon of the app appearing on the bar.
   * @param {Element} app - app that was opened
   */
  addApp (app) {
    // Update active app (active app icon has colorful border on the bottom)
    this._removeActive()
    // Add newly opened app to the list
    this.openApps.push(app)
    // Display icon of that app on the bar
    this.createIcon(app)
    // That this icon to be active app
    this.setActiveWindow(app)
    // In case window is clicked instead of bar icon
    app.addEventListener('click', (event) => {
      // Updates active app (where colorful border should go)
      this._removeActive()
      let index = this._getAppIndex(event.currentTarget)
      if (this.barIcons[index] !== undefined) {
        // On window removal, ignore this
        this.barIcons[index].classList.add('active')
      }
      // Puts the app window above all
      app.updateZIndex()
    })
  }

  /**
   * Adds the colorful border on app's icon on the bar
   */
  setActiveWindow () {
    this.barIcons[this.barIcons.length - 1].classList.add('active')
  }

  /**
   * Creates an image on the bar, adds event listener to clicking
   * on that image.
   */
  createIcon (app) {
    const icon = document.createElement('div')
    icon.setAttribute('id', 'icon-bar')
    // Create image depending on app name. Icons have to be named same as
    // the apps they belong to.
    icon.innerHTML = '<img src="image/' + app.getAppName() + '.png">'
    icon.classList.add('active') // Active - colored bottom border
    icon.style.left = (60 * this.barIcons.length) + 'px'
    icon.addEventListener('click', (event) => {
      let indx = this._getIconIndex(event.currentTarget)
      if (!event.currentTarget.classList.contains('active')) { // If icon gets clicked, make it active (if it wasn't active before)
        this._removeActive()
        event.currentTarget.classList.add('active')
        this.openApps[indx].updateZIndex()
      } else {
        this.openApps[indx].style.display = 'block'
        this.openApps[indx].updateZIndex()
      }
    })
    this.shadow.appendChild(icon)
    this.barIcons.push(icon)
  }

  /**
   * Removes colored bottom border from all the current icons
   */
  _removeActive () {
    for (let i = 0; i < this.barIcons.length; i++) {
      this.barIcons[i].classList.remove('active')
    }
  }

  /**
   * Gets index of an icon in the array that stores created icons.
   * @param {Element} icon - icon element.
   */
  _getIconIndex (icon) {
    for (let i = 0; i < this.barIcons.length; i++) {
      if (this.barIcons[i] === icon) {
        return i
      }
    }
  }

  /**
   * Finds an index of an app in open apps array
   * @param {Element} app - app that is currently open
   */
  _getAppIndex (app) {
    for (let i = 0; i < this.openApps.length; i++) {
      if (this.openApps[i] === app) {
        return i
      }
    }
  }

  /**
   * Handles what happens to the bar if open app gets closed (remove app's
   * icon from the bar, remove it being active app too).
   * @param {Element} app - app that was closed
   */
  onAppClose (app) {
    // Find app's index in the open app array
    let index = this._getAppIndex(app)
    let parent = this.barIcons[index].parentNode
    // Remove the app's icon from the bar
    parent.removeChild(this.barIcons[index])
    // Move elements to the left
    this._repositionElements(index)
    // Remove app from open apps and open app icons
    this.barIcons.splice(index, 1)
    this.openApps.splice(index, 1)
  }

  /**
   * Deals with what the icon should do of a minimized app.
   * @param {Element} app - minimized app
   */
  onAppMini (app) {
    let index = this._getAppIndex(app)
    this.barIcons[index].classList.remove('active')
  }

  // Only for on close
  _repositionElements (index) {
    for (let i = index + 1; i < this.shadow.children.length; i++) {
      this.shadow.children[i].style.left = (this.shadow.children[i].style.left.replace('px', '') - 60) + 'px'
    }
  }

  // TODO this doesn't work probably (when closed, bar icon doesn't get new active)
  // _updateActive () {
  //   let counter = 0
  //   let position = 0
  //   for (let i = 0; i < this.openApps.length; i++) {
  //     if (counter < this.openApps[i].getZIndex()) {
  //       counter = this.openApps[i].getZIndex()
  //       position = i
  //     }
  //   }
  //   this.barIcons[position].classList.toggle('active')
  // }
}

window.customElements.define('web-bar', Bar)
