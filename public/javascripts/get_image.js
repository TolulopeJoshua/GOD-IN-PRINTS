imgIds.forEach(img => {
    route = img.split('-')[0] + `/image`;
    console.log(route)
    xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        console.log(this.responseURL)
        imgId = this.responseURL.split('/');
        document.getElementById(imgId[4]+'-img').src = this.responseText;
    }
    xhttp.open("GET", route, true);
    xhttp.send();
})