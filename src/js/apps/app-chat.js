/* global WebSocket */
/* global HTMLElement */

let template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  background-color: rgb(255,255,255,0.8);
  width: 100%;
  height: 100%;
  display: inline-block;
}

.chat {
  height: 245px;
  width: 435px;
  overflow-y: auto;
  font-family: sans-serif;
  display: inline-block;
}

.username {
  font-weight: bold;
  display: inline-block;
}
.chat .sentMsg p {
  display: inline-block;
}

.chat .receivedMsg p {
  display: inline-block;
}

.message {
  display: inline-block;
}

.message textarea{
  width: 379px;
  height: 48px;
  border-radius: 1px;
  border-style:solid;
  padding-top:0;
  border-color: "#333333";
  margin-right: 5px;
  resize: none;
}

.message button{
  height: 53px;
  border-radius: 5px;
  border: none;
  position: absolute;
}

.message button:hover{
}

.message button:active{
  background-color: #333333;
  color: white;
}

.sentMsg {
  display: inline-block;
}

.receivedMsg {
  display: inline-block;
  text-align: right;
  width: 100%;
  padding-left: 80px;
  box-sizing: border-box;
}

.sentMsg div {
  display: inline;
}

.receivedMsg div {
  display: inline;
}
.setUser {
  display" block;
}

.error {
  display: block;
  color: red;
}

.noConnection {
  display: block;
  text-align: center;
}

.hidden {
  display: none!important;
}

.inline {
  display: inline-block;
}

.chatApp {
  display: block;
}
</style>
<div class="setUser">
<p class="error hidden">Please enter a username!</p>
<p>What would you like to be called?</p>
<input type="text" placeholder="Choose username"></input>
<button>OK</button>
</div>
<div class="chatApp">
<div class="chat"></div>
<div class="message">
<textarea placeholder="Type your message here"></textarea>
<button>Send</button>
</div>
</div>
<div class="noConnection hidden">No internet connection or the server is down. Load old messages (you will not be
  able to send any messages while there is no connection)? <br>
<button class="load">Load messages</button></div>
`
export default class AppChat extends HTMLElement {
  constructor () {
    super()
    // Shadow root
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
    this.socket = null
    // Elements
    this.chatApp = this.shadow.querySelector('.chatApp')
    this.usernameArea = this.shadow.querySelector('.setUser')
    this.chatArea = this.shadow.querySelector('.chat')
    this.messageArea = this.shadow.querySelector('.message')
    this.button = this.shadow.querySelector('.message button')
    this.textArea = this.shadow.querySelector('.message textarea')
    this.noCon = this.shadow.querySelector('.noConnection')
    // Event listeners and other variables
    this.username = ''
    this._checkUsername()
    this._setUp()
  }
  /**
   * Prepares socket and buttons, gets information from local
   * storage (username and past conversations).
   * TODO: handle no internet access/no access to the server
   */
  _setUp () {
    this.socket = new WebSocket('ws://vhost3.lnu.se:20080/socket/')
    // If no internet/can't connect to the server
    this.socket.onclose = (event) => {
      this.noCon.classList.remove('hidden')
      this.chatApp.classList.add('hidden')
    }

    // Connection established, load messages
    this.socket.onopen = (event) => {
      this._loadOldMessages()
    }

    // if no connection, but user would like to see old messages
    this.noCon.querySelector('.load').addEventListener('click', event => {
      this.chatApp.classList.remove('hidden')
      this.noCon.classList.add('hidden')
      this.button.disabled = true
      this.textArea.disabled = true
      this._loadOldMessages()
    })

    // Prepares the socket - on received message, if the message is not a heartbeat, connection
    // or message from this user, it gets displayed
    this.socket.onmessage = function (event) {
      let dataStr = JSON.parse(event.data)
      if (dataStr.type !== 'heartbeat' && dataStr.data !== 'You are connected!' && dataStr.username !== this.username) {
        let cacheData = { 'user': dataStr.username, 'msg': dataStr.data }
        let cachedMsg = JSON.parse(window.localStorage.getItem('PWDChat'))
        // Store message in local storage
        cachedMsg.push(cacheData)
        window.localStorage.setItem('PWDChat', JSON.stringify(cachedMsg))
        // Display received message
        this._displayReceivedMsg(dataStr)
      }
    }.bind(this)

    // Event listener for the button to send the typed in message
    this.button.addEventListener('click', event => {
      // if not text is provided, message is ignored
      if (this.textArea.value.length !== 0) {
        this._sendMessage(this.textArea.value)
        this.textArea.value = ''
      }
    })

    // Event listener for a button to set username (so that if the app is opened
    // again later, same username will be used)
    this.usernameArea.querySelector('button').addEventListener('click', event => {
      // Warns user about an empty field - empty username not allowed
      if (this.usernameArea.querySelector('input').value.length !== 0) {
        // Hide etmpy field error in case it was displayed before
        this.usernameArea.querySelector('.error').classList.add('hidden')
        let name = this.usernameArea.querySelector('input').value
        let info = JSON.parse(window.localStorage.getItem('PWD'))
        info = {
          username: name
        }
        this.username = name
        // Store provided username in local storage
        window.localStorage.setItem('PWD', JSON.stringify(info))
        this._hideUsernamePage()
      } else {
        this.usernameArea.querySelector('.error').classList.remove('hidden')
      }
    })
  }

  /**
   * Loads old messages if possible
   */
  _loadOldMessages () {
    // Gets older messages if any exists
    if (window.localStorage.getItem('PWDChat') == null) {
      window.localStorage.setItem('PWDChat', JSON.stringify([]))
    } else {
      this._getOlderMessages()
    }
  }

  /**
   * Method used to close connection with the server in case the chat window
   * is closed
   */
  closeConnection () {
    this.socket.close()
  }

  /**
   * Send messages to the server
   * @param {string} msg - text to be sent as a message
   */
  _sendMessage (msg) {
    let message = {
      type: 'message',
      data: msg,
      username: this.username,
      channel: 'my, not so secret, channel',
      key: 'eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd'
    }
    // Sends message
    this.socket.send(JSON.stringify(message))
    // Stoes it in the local storage.
    // TODO: doesn't care if sending is not successful. Needs fixing
    let cacheData = { 'user': this.username, 'msg': msg }
    let cachedMsg = JSON.parse(window.localStorage.getItem('PWDChat'))
    cachedMsg.push(cacheData)
    window.localStorage.setItem('PWDChat', JSON.stringify(cachedMsg))
    // Displays message as this user's message (on the left side)
    this._displaySentMsg(msg)
  }

  /**
   * Displays sent message.
   * @param {string} message - message to display in chat window
   */
  _displaySentMsg (message) {
    // Sets up a div that holds the name of the user (this user)
    // and the message itself.
    let div = document.createElement('div')
    div.classList.add('sentMsg')
    let divUsername = document.createElement('div')
    divUsername.textContent = this.username + ': '
    divUsername.classList.add('username')
    let divText = document.createElement('div')
    divText.textContent = message
    let breakLine = document.createElement('br')
    // Adds it chat div
    div.appendChild(divUsername)
    div.appendChild(divText)
    this.chatArea.appendChild(div)
    this.chatArea.appendChild(breakLine)
    // Focuses on the new message
    div.scrollIntoView(false)
  }

  /**
   * Displays a message received from another user.
   * @param {JSON} data - received packet
   */
  _displayReceivedMsg (data) {
    // The only way to determine if a message was sent
    // by this client with my implementation
    if (data.username === this.username) {
      return
    }
    // Create div to store the name of the user
    // that the message was received from and the
    // message itself
    let div = document.createElement('div')
    div.classList.add('receivedMsg')
    let divUsername = document.createElement('div')
    divUsername.classList.add('username')
    divUsername.textContent = data.username + ':'
    let divText = document.createElement('div')
    divText.textContent = data.data
    let breakLine = document.createElement('br')
    // Append it to the chat window
    div.appendChild(divUsername)
    div.appendChild(divText)
    this.chatArea.appendChild(div)
    this.chatArea.appendChild(breakLine)
    // Focus on the new message
    div.scrollIntoView(false)
  }

  /**
   * Checks if username is in local storage (has been set)
   */
  _checkUsername () {
    let info = []
    if (window.localStorage.getItem('PWD') === null) { // key not found in LS, username not set
      window.localStorage.setItem('PWD', JSON.stringify(info))
      this._showUsernamePage()
    } else {
      info = JSON.parse(window.localStorage.getItem('PWD'))
      if (info.username == null || info.username.length === 0) { // key found, but no username found
        this._showUsernamePage()
      } else { // username found, no need to set it
        this.username = info.username
        this._hideUsernamePage()
      }
    }
  }

  /**
   * Hides a page where the user can choose their username
   * and displays the chat.
   */
  _hideUsernamePage () {
    this.usernameArea.classList.add('hidden')
    this.chatApp.classList.remove('hidden')
  }

  /**
   * Shows the page where the user can choose their username
   */
  _showUsernamePage () {
    this.usernameArea.classList.remove('hidden')
    this.chatApp.classList.add('hidden')
  }

  /**
   * Retrieves older messages from local storage.
   */
  _getOlderMessages () {
    let storageInfo = JSON.parse(window.localStorage.getItem('PWDChat'))
    this._renderOldMessages(storageInfo)
  }

  /**
   * Renders old messages in the chat window.
   * @param {array} messages - array of objects containing old messages and senders
   */
  _renderOldMessages (messages) {
    messages.forEach(msg => {
      if (msg.user === this.username) { // User is this user (render message on the left)
        this._displaySentMsg(msg.msg)
      } else { // Message is some other user, render message on the right
        let data = { 'username': msg.user, 'data': msg.msg }
        this._displayReceivedMsg(data)
      }
    })
  }
}

window.customElements.define('app-chat', AppChat)
