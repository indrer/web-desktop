/* global HTMLElement */
/* global Event */

const template = document.createElement('template')
template.innerHTML = `
<style> 
:host {
  all: initial;
  height: 60px;
  width: 60px;
  background-color:rgba(255,255,255,0.4);
  border-radius: 10px;
  box-shadow: 3px 3px 2px rgb(0, 0, 0);
  color: black;
  display: block;
  margin-right: 20px;
  margin-top: 20px;
  padding: 10px;
}

img {
  position: relative;
  float: left;
  max-width: 100%;
  height: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

span {
  display:none;
}

:host(:hover) span {
  display: inline-block;
  position: relative;
  font-size: 13px;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
  line-height: 13px;
  width: auto;
  padding: 5px;
  left: 55px;
  top: -20px;
  background-color:rgba(19, 19, 19, 0.75);
  border-radius: 3px;
  color: rgb(211, 211, 211);
  text-align: left;
}
</style>
`

/**
 * Perhaps a weird way, but icon will store an array of all open
 * instances of a certain program. Each instance will be in a new window
 */
export default class Icon extends HTMLElement {
  constructor (application, doc) {
    super()
    this.application = application // Application this icon belongs to
    // Shadow root
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    this.doc = doc
    // Setting up the iamge element as well as the text
    this._setUpIcon(application)
  }

  /**
   * Handles clicking of the icon.
   */
  connectedCallback () {
    this.addEventListener('click', this._onClick)
  }

  /**
   * Returns the name of the app the icon belongs to.
   */
  getName () {
    return this.application
  }

  /**
   * Sets up the icon and its text.
   * @param {String} application - name of the application the icon belongs to
   */
  _setUpIcon (application) {
    // Get icon image for the application
    const image = document.createElement('img')
    image.setAttribute('src', 'image/' + this.application + '.png')
    // Get pop up text for the application
    const text = document.createElement('span')
    text.textContent = (this.application.charAt(0).toUpperCase() + this.application.substr(1)).replace('-', ' ')
    // Attach them to shadow root
    this.shadow.appendChild(image)
    this.shadow.appendChild(text)
  }

  /**
   * Fires a custom event on icon click.
   */
  _onClick () {
    let event = new Event('icon-clicked')
    this.dispatchEvent(event)
  }
}

window.customElements.define('web-icon', Icon)
