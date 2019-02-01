/* global HTMLElement */
import saveAs from 'file-saver'

const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  background-color: rgb(255,255,255,0.8);
  width: 100%;
  height: 100%;
  display: inline-block;
}

.colorSelector {
  background-color: rgba(206, 206, 206, 0.5);
  height: 20px;
  text-align: center;
  font-family: Sans-serif;
  color: rgb(92, 92, 92);
}

.board {
}

.circle {
  border-radius: 50%;
  height: 18px;
  width: 18px;
  display: inline-block;
}

.black {
  background-color: black;
}

.red {
  background-color: red;
}

.yellow {
  background-color: yellow;
}

.green {
  background-color: green;
}

.purple {
  background-color: purple;
}
.options{
  text-align: center;
}
</style>

<div class="colorSelector"> Choose a color: 
<div class="circle black"></div>
<div class="circle green"></div>
<div class="circle red"></div>
<div class="circle purple"></div>
<div class="circle yellow"></div>
</div>
<canvas class="board" height="260" width="440"></canvas>
<div class="options"><button class="newBtn">New</button><button class="saveBtn">Save</button></div>
`

export default class AppDraw extends HTMLElement {
  constructor () {
    super()
    // Shadow root
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    // Elements
    this.colorSelector = this.shadow.querySelector('.colorSelector')
    this.canvas = this.shadow.querySelector('.board')
    this.context = this.canvas.getContext('2d')
    this.options = this.shadow.querySelector('.options')
    // Other variables and event listeners
    this.isDrawing = false
    this.currentColor = ''
    this.x = 0
    this.y = 0
    this._setUp()
  }

  /**
   * Sets up canvas, brush, adds event listener on mouse moves and presses
   */
  _setUp () {
    // Brush settings
    this.context.lineWidth = 2
    this.context.lineCap = 'round'
    this.context.strokeStyle = '#000000'

    // When mouse button is clicked, it's ready to draw
    this.canvas.addEventListener('mousedown', event => {
      this.x = event.offsetX
      this.y = event.offsetY
      this.isDrawing = true
    })

    // When mouse is moving and is clicked, it draws
    this.canvas.addEventListener('mousemove', event => {
      if (this.isDrawing) { // Mouse is clicked
        // Draws a line depending on previous and current mouse
        // positions
        this.context.beginPath()
        this.context.moveTo(this.x, this.y)
        this.x = event.offsetX
        this.y = event.offsetY
        this.context.lineTo(this.x, this.y)
        this.context.stroke()
      }
    })

    // When mouse button is released, stop drawing
    this.canvas.addEventListener('mouseup', () => {
      this.isDrawing = false
    })

    // When mouse is not on canvas, stop drawing
    this.canvas.addEventListener('mouseleave', () => {
      this.isDrawing = false
    })

    this._setUpColors()

    // Clears canvas
    this.options.querySelector('.newBtn').addEventListener('click', () => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    })

    // Allows user to save the image from the canvas
    this.options.querySelector('.saveBtn').addEventListener('click', () => {
      this.canvas.toBlob(function (blob) {
        saveAs(blob, 'draw-picture.png')
      }, 'image/png')
    })
  }

  /**
   * Sets up colors pickers at the top of the drawing app.
   */
  _setUpColors () {
    this.colorSelector.querySelector('.black').addEventListener('click', () => {
      this.context.strokeStyle = '#000000'
    })

    this.colorSelector.querySelector('.green').addEventListener('click', () => {
      this.context.strokeStyle = '#008000'
    })

    this.colorSelector.querySelector('.yellow').addEventListener('click', () => {
      this.context.strokeStyle = '#ff0'
    })

    this.colorSelector.querySelector('.red').addEventListener('click', () => {
      this.context.strokeStyle = '#f00'
    })

    this.colorSelector.querySelector('.purple').addEventListener('click', () => {
      this.context.strokeStyle = '#800080'
    })
  }
}

window.customElements.define('app-draw', AppDraw)
