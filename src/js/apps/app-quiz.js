/* global XMLHttpRequest */

const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  margin: 0 auto;
  width: 600px;
  background: #f3f5f8;
  font-family: sans-serif;
  line-height: 1.5;

}

::selection {
  background: #ab74ef;
  color: white;
}

h1 {
  border-bottom: 3px solid #ab74ef;
}

#error {
  display: none;
  color: white;
  padding: 10px;
  background-color: #e89f32;
  border-radius: 5px;
  border-bottom: 2px solid hsla(36, 80%, 35%, 1);
}

#quiz {
  display: none;
}

#clock {
  font-size: 14px;
  text-align: right;
}

#question {
  font-weight: bold;
}

#reason {
  background-color: #ab74ef;
  color: white;
  padding: 10px;
  border-radius: 5px;
  border-bottom: 2px solid #754fa5;
}

#score {
  padding: 20px 5px 0 5px;
  font-size: 18px;
  font-weight: bold;
}

#gameEnd {
  display:none;
}

input[type="text"] {
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #cccccc;
}

ol {
  background-color: white;
  border-radius: 5px;
  padding-top: 10px;
  padding-bottom: 10px;
  overflow-y: auto;
  max-height: 350px;
}
</style>

<h1>Javascript quiz</h1>
<div id="gameStart">
    Welcome to a Javascript Quiz! You will have 20 seconds to answer each question. If your answer is incorrect, you'll have to start again. If you run out of time, you will have to start again as well. Please provide your name and then click "Start game". Good luck!<br /><br />
    <div id="nameInput">
        <div id="error">Please provide a name!</div><br />
        <label>Your name:</label> <input id="name" type="text"><br />
        <button type="submit">Submit</button>
    </div>
</div>

<div id="gameEnd">
    <div id="reason"></div>
    <div id="score"></div>
    <div id="highscore"><h2>High scores</h2></div>
    <button type="button">Restart</button>
</div>

<div id="quiz">
    <div id="clock">Time remaining: <span id="timer"></span></div>
    <div id="question"></div>
    <div id="answerArea"></div>
    <button type="submit" id="postAnswer">Submit answer</button>
</div>

<template id="radioQuestion">
</template>
<template id="textQuestion">
    <form>
        <input id="answer" type="text"><br />
    </form>
</template>
`

export default class Quiz extends HTMLElement {
  constructor () {
    super()
    // Shadow root
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    this.xhttpGet = new XMLHttpRequest()
    this.xhttpPost = new XMLHttpRequest()
    this.storage = window.localStorage
    this.playerName = ''
    this.receivedQuest = ''
    this.url = 'http://vhost3.lnu.se:20080/question/1'
    this.alt = null
    this.nextURL = ''
    this.altsAvailable = false
    this.type = ''
    this.totalTime = 0
    this.timeCount = 0
    this.interval = 0
  }

  /**
   * Initializes onLoad methods for GET and POST request objects,
   * also initializes all the buttons
   */
  init () {
    this.btnEventListn()
    this.initGet(this.handleGetRequest)
    this.initPost(this.handlePostRequest)
  }

  /**
   * Performs first get request (to receive a question)
   */
  startGame () {
    this.getRequest(this.url)
  }

  /**
   * Function, used to initialize method used when an operation of sending GET request/receiving
   * response is complete
   * @param {method} callback a callback method to run after the response has been received
   */
  initGet (callback) {
    this.xhttpGet.onload = () => {
      // Store response in an array
      let response = JSON.parse(this.xhttpGet.responseText)
      // Run callback method and store string it returned.
      // Will always have something as result, because
      // post request object handles whether there are
      // more addresses to send GET request to
      let result = callback(response)
      // Store url, quests, whether alts exists and type
      // of question
      this.nextURL = result.nextURL
      this.receivedQuest = result.receivedQuest
      this.alt = result.alternatives
      this.type = result.type
      // Finally update HTML with the new received information
      this.updateHTML(this.type, this.alt)
    }
  }

  /**
   * Function, used to initialize method used when an operation of sending POST request/receiving
   * response is complete
   * @param {method} callback a callback method to run after the response has been received
   */
  initPost (callback) {
    this.xhttpPost.onload = () => {
      // Store response in an array
      let response = JSON.parse(this.xhttpPost.responseText)
      // A function that will be ran when POST request
      // is finished and response is received.
      let result = callback(response, this.xhttpPost)
      // If result was not a null
      if (result !== undefined) {
        // 'wrong' means that the answer was
        // wrong, so stop the game
        if (result === 'wrong') {
          this.stopCounter()
          this.lostGame()
        } else if (result !== '') { // Correct answer. call GET on another URL
          this.stopCounter()
          this.nextURL = result
          this.getRequest(this.nextURL)
        } else { // Happens when user is done with questions
          this.stopCounter()
          this.getHighScore()
        }
      }
    }
  }

  /**
   * Callback method used after POST request
   * @param {Array} responseText - response made into an array
   * @param {Object} response - response object
   * @returns 'wrong' if user answered wrong answer, '' if quiz is over and url
   * to next question is user answered correctly
   */
  handlePostRequest (responseText, response) {
    let result = ''
    // 400 returns when answer is wrong
    if (response.status === 400) {
      return 'wrong'
    }
    // nextURL is null when there are no more questions
    if (responseText.nextURL == null) {
      return result
    } else { // All is good, return next GET url
      return responseText.nextURL
    }
  }

  /**
   * Callback method used after GET request
   * @param {Array} responseText - response made into an array
   * @returns and object containing information about question and format of answer
   */
  handleGetRequest (responseText) {
    // Construct an object containing a URL for upcoming POST request,
    // question, type of question and alternatives (possible answers), if any exist
    let result = {
      nextURL: responseText.nextURL,
      receivedQuest: responseText.question,
      type: '',
      alternatives: null
    }
    // No alternatives exist, so just update type
    if (responseText.alternatives == null) {
      result.type = 'textQuestion'
      return result
    } else { // Alternatives exist, so update alternatives exist, store them as well
      result.type = 'radioQuestion'
      result.alternatives = responseText.alternatives
      return result
    }
  }

  /**
   * Sends get request to a specified url
   * @param {String} url - url to send request to
   */
  getRequest (url) {
    this.xhttpGet.open('GET', url, true)
    this.xhttpGet.send()
  }

  /**
   * Sends POST request with specified string
   * @param {String} answer string to send POST request with (asnwer to the question)
   */
  postRequest (answer) {
    this.xhttpPost.open('POST', this.nextURL, true)
    this.xhttpPost.setRequestHeader('Content-Type', 'application/json')
    this.xhttpPost.send(JSON.stringify({ 'answer': answer }))
  }

  /**
   * Initiliazes 3 buttons used in the application
   */
  btnEventListn () {
    // Button, which is responsible to sending out the answer provided
    // by the user
    this.shadow.getElementById('postAnswer').addEventListener('click', (event) => {
      let answer = ''
      // Prevents refreshing the page
      event.preventDefault()
      // Alternatives (multiple answers) are not possible in this case
      if (!this.altsAvailable) {
        // Do nothing if no answer provided
        if (this.shadow.querySelector('#answerArea #answer').value == null) {
          console.log('no answer provided')
        } else { // Answer was selected, so save it
          answer = this.shadow.querySelector('#answerArea #answer').value
        }
      } else { // Alternative answers are possible
        if (this.shadow.querySelector('input[name="alts"]:checked').value == null) { // No answer was selected
          console.log('no answer proided')
        } else { // Answer selected, get its value
          answer = this.shadow.querySelector('input[name="alts"]:checked').value
        }
      }
      // Finally, send out the POST request with provided value
      this.postRequest(answer)
    })

    // Button used when player is on the end screen. Restarts the game
    this.shadow.querySelector('#gameEnd button').addEventListener('click', (event) => {
      this.restartGame()
    })

    // Button used to start the game, saves user's chosen name
    this.shadow.querySelector('#gameStart button').addEventListener('click', (event) => {
      // Name was provided
      if (this.shadow.querySelector('#gameStart input').value.length !== 0) {
        // In case error was displayed before, hide it
        this.shadow.getElementById('error').style = 'display: none;'
        // Store player name
        this.playerName = this.shadow.querySelector('#gameStart input').value
        // Hide starting state div and show quiz div
        this.shadow.getElementById('gameStart').style = 'display:none;'
        this.shadow.getElementById('quiz').style = 'display: block;'
        // Start the game
        this.startGame()
      } else { // No name provided, warn user
        this.shadow.getElementById('error').style = 'display: block;'
      }
    })
  }

  /**
   * Method used to update html for a new question
   * @param {String} question - type of response to the question (text or multiple choice)
   * @param {Array} alts  - array of answer object containing key and value of each
   */
  updateHTML (question, alts) {
    // Sets current question
    this.shadow.getElementById('question').textContent = this.receivedQuest
    // Takes either template for radio buttons or template for text input
    let template = this.shadow.getElementById(question)
    // A div ID in which the possible answers or text input will be stored
    let answerArea = this.shadow.getElementById('answerArea')
    answerArea.innerHTML = ''
    // Alternative answers exist, therefore radio buttons are created
    // according to the number of possible answers
    if (alts != null) {
      // This helps later determine what type of element answer is being taken
      // from
      this.altsAvailable = true
      // For loop to generate radio buttons
      let fragment = this.shadow.createDocumentFragment()
      for (let i in alts) {
        let radioBtn = document.createElement('input')
        radioBtn.setAttribute('type', 'radio')
        radioBtn.setAttribute('value', i)
        radioBtn.setAttribute('name', 'alts')
        let label = document.createElement('label')
        let text = this.shadow.createTextNode(alts[i])
        label.appendChild(radioBtn)
        label.appendChild(text)
        fragment.appendChild(label)
        fragment.appendChild(document.createElement('br'))
      }
      // Append radio buttons to answer field
      answerArea.appendChild(fragment)
    } else { // Nothing needs to be done as template already has text input given
      this.altsAvailable = false
    }
    // Append either text input or radio buttons to the div
    answerArea.appendChild(this.shadow.importNode(template.content, true))
    // Start the counter
    this.startCounter()
  }

  /**
   * Starts counter for each question. Uses interval of 1 second
   * to decrease counter from 20 to 0.
   */
  startCounter () {
    // Counter start
    this.timeCount = 20
    // Element where seconds are displayed
    let timerEl = this.shadow.getElementById('timer')
    timerEl.textContent = this.timeCount
    // Save interval ID, so we can cancel it later
    this.interval = setInterval(() => {
      // Each second, decrease second count
      timerEl.textContent = --this.timeCount
      // If reached 0, stop counter and declare loss of the game
      if (this.timeCount < 0) {
        this.stopCounter()
        this.lostGame()
      }
    }, 1000)
  }

  /**
   * Stops time counter
   */
  stopCounter () {
    // Stop interval
    clearInterval(this.interval)
    // Clear field where seconds where displayed
    this.shadow.getElementById('timer').textContent = ''
    // Calculate final time
    this.totalTime = this.totalTime + (20 - this.timeCount)
  }

  /**
   * Used to display final state of the game (user score and high scores).
   * Saves user score in web storage.
   */
  getHighScore () {
    let scores = []
    // Retrieve scores
    if (this.storage.getItem('scores') == null) { // No scoares exist yet
      this.storage.setItem('scores', JSON.stringify(scores))
    } else { // Some exist, so just save them into an array
      scores = JSON.parse(this.storage.getItem('scores'))
    }
    // Save current user's score in an array
    scores.push({ name: this.playerName, score: this.totalTime })

    // Sort the array, so smallest time gets top
    scores.sort(this.sortCompare)

    // Prepares high scores to be displayed
    this.prepareScores(scores)
    // Save new high score list, with user's time
    this.storage.setItem('scores', JSON.stringify(scores))

    // Hide quiz, show gameEnd div with player's score and highscores
    this.shadow.getElementById('quiz').style = 'display: none'
    this.shadow.getElementById('gameEnd').style = 'display: block'
    this.shadow.getElementById('reason').appendChild(
      document.createElement('h2').appendChild(
        this.shadow.createTextNode('You won!')
      ))
      this.shadow.getElementById('score').textContent = 'It took you ' + this.totalTime + ' seconds!'
  }

  /**
   * Method used to display message, saying that the user lost
   * and display high score
   */
  lostGame () {
    let scores = []
    // Retrieve scores
    if (this.storage.getItem('scores') == null) { // No scoares exist yet
      this.storage.setItem('scores', JSON.stringify(scores))
    } else { // Some exist, so just save them into an array
      scores = JSON.parse(this.storage.getItem('scores'))
    }
    // Prepares highscores to be displayed
    this.prepareScores(scores)

    // Let's user know they lost
    this.shadow.getElementById('reason').appendChild(
      document.createElement('h2').appendChild(
        this.shadow.createTextNode('You lost!')
      ))

    // Hides questions
    this.shadow.getElementById('quiz').style = 'display: none'
    // Displays game end state
    this.shadow.getElementById('gameEnd').style = 'display: block'
  }

  /**
   * Fills div with highscores ID with a list of high scores (names and score)
   * @param {Array} scores - array of player scores
   */
  prepareScores (scores) {
    // Scores are stores in an ordered list to create numbered list
    let orderedList = document.createElement('ol')
    // If number of scores is less than 5, print all possible scores.
    // Otherwise, print first 5
    let length = scores.length < 5 ? scores.length : 5
    // Loop creating list items and appending them to the list
    for (let i = 0; i < length; i++) {
      let el = document.createElement('li')
      let text = this.shadow.createTextNode('Name: ' + scores[i].name + ', score: ' + scores[i].score)
      el.appendChild(text)
      orderedList.appendChild(el)
    }
    // Finally, appends list to the div
    this.shadow.getElementById('highscore').appendChild(orderedList)
  }

  /**
   * Restarts the game by resetting the values and presenting the user with
   * a start screen (instructions, name entering)
   */
  restartGame () {
    // Reset values
    this.playerName = ''
    this.receivedQuest = ''
    this.url = 'http://vhost3.lnu.se:20080/question/1'
    this.alt = null
    this.nextURL = ''
    this.altsAvailable = false
    this.type = ''
    this.totalTime = 0
    this.timeCount = 0
    this.interval = 0

    // Hide result screen
    this.shadow.getElementById('highscore').removeChild(this.shadow.getElementById('highscore').lastChild)
    this.shadow.getElementById('reason').removeChild(this.shadow.getElementById('reason').firstChild)
    this.shadow.getElementById('score').textContent = ''
    this.shadow.getElementById('gameEnd').style = 'display: none'
    // Show start screen, clear previously used name
    this.shadow.getElementById('gameStart').style = 'display: block'
    this.shadow.querySelector('#gameStart input').value = ''
  }

  /**
   * Helper method to compare two values. Used to sort array.
   * @param {int} a - first integer value to be compared
   * @param {int} b - second integer value to be compared
   */
  sortCompare (a, b) {
    if (a.score < b.score) {
      return -1
    }
    if (a.score > b.score) {
      return 1
    }
    return 0
  }
}
