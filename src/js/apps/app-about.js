/* global HTMLElement */
const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  background-color: rgb(255,255,255);
  width: 100%;
  height: 100%;
  display: inline-block;
  text-align: center;
}
</style>

<div class="about"><h2>Personal Web Desktop</h2>
The Personal Web Desktop was made from scratch by Indre, yay. <br><br>
The wallpaper of the desktop is by <a href="https://www.pexels.com/@hiraeth">Michael L.</a><br>
All the icons were made by:
<li><a href="https://www.flaticon.com/authors/darius-dan" title="Darius Dan">Darius Dan</a></li>
<li><a href="https://www.freepik.com/" title="Freepik">Freepik</a></li>
<li><a href="https://www.flaticon.com/authors/eleonor-wang" title="Eleonor Wang">Eleonor Wang</a> </li>
<li><a href="https://www.flaticon.com/authors/yannick" title="Yannick">Yannick</a></li>
</div>
`

export default class AppAbout extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.appendChild(document.importNode(template.content, true))
  }
}

window.customElements.define('app-about', AppAbout)
