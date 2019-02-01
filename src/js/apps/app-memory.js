/* global HTMLElement */

const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  background-color: rgb(255,255,255,0.8);
  width: 100%;
  height: 100%;
  display: inline-block;
}

.startingScreen {
  background: white;
  display: block;
  height: 265px;
  width: auto;
  padding: 20px;
  text-align: center;
}

button{
  width: 100px;
  border: none;
  background-color: #cfbc9f;
}

.game {
  background: white;
  display: none;
  text-align: center;
}

.game img {
  padding: 0px;
  margin: 1px;
  height: 64px;
  width: 64px;
  border: 1px solid transparent;
}

.highScore {
  display: none;
  background: white;
  height: 265px;
  width: auto;
  padding: 20px;
  text-align: center;
}

.hidden {
  visibility: hidden;
}

.timer {
  height: 20px;
}

</style>

<div class="startingScreen">Welcome to a memory game! Your highscore depends on clicks you made and 
time it took you to finish the game.<br>You may use a mouse or a keyboard to play this game. To use a keyboard,
make sure you are focused on the window, then press TAB and navigate with it forwards. TAB+SHIFT lets you navigate backwards.
Pressing enter will open the tile.<br>
As soon as you press "Start", the game will start. Good luck!<br>
<button>Start</button></div>
<div class="game">
<div class="timer">Time passed: <span>0</span></div>
<div class="gameBoard"></div>
</div>
<div class="highScore"><h2>You won!</h2><br>Your score: <span></span><br><p></p><button>Play again</button></div>
`
export default class AppMemory extends HTMLElement {
  constructor () {
    super()
    // Number of tiles in the board
    this.boardSize = 16
    // Shadow root
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    // Elements
    this.gameDiv = this.shadow.querySelector('.game')
    this.gameBoard = this.gameDiv.querySelector('.gameBoard')
    this.timer = this.gameDiv.querySelector('.timer span')
    this.startScreen = this.shadow.querySelector('.startingScreen')
    this.startButton = this.startScreen.querySelector('button')
    this.highScore = this.shadow.querySelector('.highScore')
    this.playAgainButton = this.highScore.querySelector('button')
    // Variables and event listeners
    this.tiles = []
    this.tilesRemaining = this.boardSize / 2
    this.intervalID = 0
    this.time = 0
    this.currentlyOpenIndex = -1
    this.currentlyOpenEl = null
    this.clicks_made = 0
    this.score = 0
    this._setUp()
  }

  /**
   * Sets up event listeners on buttons (start and play again).
   */
  _setUp () {
    // Start button
    this.startButton.addEventListener('click', event => {
      // Hide instruction screen, generate new board
      this.startScreen.style = 'display:none'
      this.tiles = this._getRandomIDArray()
      this._generateBoard()
      this.gameDiv.style = 'display: block'
      // Start timer
      this.intervalID = setInterval(() => {
      // Each second, decrease second count
        this.timer.textContent = ++this.time
      }, 1000)
    })

    // Play again button
    this.playAgainButton.addEventListener('click', event => {
      // Hide results screen, generate new board, clear previously
      // generated board
      this.highScore.style = 'display: none;'
      this._clearDiv(this.gameBoard)
      this.tiles = this._getRandomIDArray()
      this._generateBoard()
      this.gameDiv.style = 'display: block'
      // start timer
      this.intervalID = setInterval(() => {
      // Each second, decrease second count
        this.timer.textContent = ++this.time
      }, 1000)
    })
  }

  /**
   * Helper function to clear a div
   */
  _clearDiv (div) {
    while (div.firstChild) {
      div.removeChild(div.firstChild)
    }
  }

  /**
   * Generates a board by adding images with links. Links are used to
   * make it possible to play the game with the keyboard (tab or tab+shit for navigation
   * and enter to open the tile).
   */
  _generateBoard () {
    let img = null
    let a = null
    this.tiles.forEach((tile, i) => {
      a = document.createElement('a')
      a.href = '#' // No link needed
      img = document.createElement('img')
      img.setAttribute('src', '/../../image/memory/0.png') // All tiles are initially closed
      // Focus on a certain tile. If focus ends up on the link, change it to
      // the image. Draw a border to be able to tell easier which tile is focused on.
      a.addEventListener('focus', event => {
        let el = event.target.nodeName === 'IMG' ? event.target : event.target.firstElementChild
        el.style = 'border: 1px solid red;'
      })
      // Remove the border when the tile is no longer in focus
      a.addEventListener('blur', event => {
        let el = event.target.nodeName === 'IMG' ? event.target : event.target.firstElementChild
        el.style = 'border: 1px solid transparent;'
      })
      a.appendChild(img) // Add image element to the link
      a.addEventListener('click', event => {
        // Handle click on the link
        this._tileClicked(tile, event.target)
      })
      this.gameBoard.appendChild(a)
      // Four tiles per row. After for tiles, break line.
      if ((i + 1) % 4 === 0) {
        this.gameBoard.appendChild(document.createElement('br'))
      }
    })
  }

  /**
   * Generates and array of the size of the board (number of tiles)
   * with random numbers from 0 to boardSize/2.
   */
  _getRandomIDArray () {
    let randArr = []
    // Create array with nunbers representing images
    // (hence each number is added twice)
    for (let i = 0; i < this.boardSize / 2; i++) {
      randArr.push(i + 1)
      randArr.push(i + 1)
    }
    // Shuffle array
    for (let i = randArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randArr[i], randArr[j]] = [randArr[j], randArr[i]]
    }
    return randArr
  }

  /**
   * Deals with a tile click.
   * @param {Integer} index - index of a tile in regards to all the tiles
   * @param {Element} el - either image or a link clicked on
   */
  _tileClicked (index, el) {
    el = el.nodeName === 'IMG' ? el : el.firstElementChild // If element clicked is link, change to its image
    this.clicks_made++ // CLicks made affects the final score later on
    if (el.src.includes('0.png')) { // If source tile is closed already
      el.src = '/../../image/memory/' + index + '.png'
      if (this.currentlyOpenIndex === -1) { // Opening first tile (it's not a pair, keep it open)
        this.currentlyOpenIndex = index
        this.currentlyOpenEl = el
      } else { // Opening a second tile, check if pain matches
        if (this.currentlyOpenIndex === index) { // Pair matched, hide both tiles
          window.setTimeout(() => { // Display the pair for a bit, then hide it.
            this.currentlyOpenEl.classList.add('hidden')
            el.classList.add('hidden')
            this.currentlyOpenIndex = -1
            this.currentlyOpenEl = null
          }, 100)
          this.tilesRemaining-- // Track the number of tiles left on the board that are still visible
          if (this.tilesRemaining === 0) { // No tiles left, game over
            this._gameOver()
          }
        } else { // Pair didn't match, close both tiles (set image to question mark)
          this.currentlyOpenIndex = -1
          window.setTimeout(() => { // Let the user see the pain that didn't match, then turn tile over.
            el.src = '/../../image/memory/0.png'
            this.currentlyOpenEl.src = '/../../image/memory/0.png'
            this.currentlyOpenIndex = -1
            this.currentlyOpenEl = null
          }, 500)
        }
      }
    } else { // If source tile was open before, then just close it.
      el.src = '/../../image/memory/0.png'
      this.currentlyOpenIndex = -1
      this.currentlyOpenEl = null
    }
  }

  /**
   * Handles the end of the game such as counting score, checking if the high score was reached
   * and giving the user choice to play again.
   */
  _gameOver () {
    // Stop timer
    clearInterval(this.intervalID)
    // Hide game board and show results
    this.gameDiv.style = 'display: none;'
    this.highScore.style = 'display: block;'
    let finalScore = (this.time * 100) + this.clicks_made
    // Get high score from local storage if it exists
    let hs = finalScore
    if (window.localStorage.getItem('PWDMemory') === null) {
      window.localStorage.setItem('PWDMemory', JSON.stringify(hs))
    } else {
      hs = JSON.parse(window.localStorage.getItem('PWDMemory'))
    }
    // Check if new high score was reached
    if (hs > finalScore) {
      this.highScore.querySelector('p').textContent = finalScore + ' is the new highscore. Congratulations!'
      window.localStorage.setItem('PWDMemory', JSON.stringify(finalScore))
    } else {
      this.highScore.querySelector('p').textContent = 'The high score is: ' + hs + '.'
    }
    // Show user their score
    this.highScore.querySelector('span').textContent = finalScore
  }
}

window.customElements.define('app-memory', AppMemory)
