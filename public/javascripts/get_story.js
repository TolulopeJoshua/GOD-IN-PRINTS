if (typeof idLength !== 'undefined') {
    for (id in idLength) {
        // console.log(idLength[id])
        route = id + `/story?q=${idLength[id]}`;
        xhttp = new XMLHttpRequest();
        xhttp.onload = function() {
            id = this.responseURL.split('/');
            // console.log(this)
           this.status !== 404 && (document.getElementById(id[4]).innerHTML = this.responseText);
        }
        idLength[id] !== 1000 && xhttp.open("GET", route, true);
        idLength[id] !== 1000 && xhttp.send();
    }
}