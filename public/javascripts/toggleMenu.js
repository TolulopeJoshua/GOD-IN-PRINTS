const upButton = document.getElementById('fastUpButton');
const downButton = document.getElementById('fastDownButton');

upButton.onclick = function() {
    const menuBar = document.getElementById('menu');
    menuBar.classList.add('d-none');
    downButton.classList.remove('d-none');
    this.classList.add('d-none');
}

downButton.onclick = function() {
    const menuBar = document.getElementById('menu');
    menuBar.classList.remove('d-none');
    upButton.classList.remove('d-none');
    this.classList.add('d-none');
}   