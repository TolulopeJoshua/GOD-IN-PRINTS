
for (id in idLength) {
    // console.log(idLength[id])
    route = id + `/story?q=${idLength[id]}`;
    xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        id = this.responseURL.split('/');
        // console.log(id)
        document.getElementById(id[4]).innerHTML = this.responseText;
    }
    xhttp.open("GET", route, true);
    xhttp.send();
}