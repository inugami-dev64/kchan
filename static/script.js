const API_URL = "http://127.0.0.1:3000";
const BOARD = new String;


// For index.html
function ListBoards() {
    // make the request
    const params = new URLSearchParams({'acr': ""});
    fetch(API_URL + "/boards?" + params)
        .then(response => response.json())
        .then(data => {
            for(let key in data) {
                let link = document.createElement("a");
                let text = document.createTextNode(data[key].acronym + " - " + data[key].name);
                link.appendChild(text);
                link.href = API_URL + "/boards" + data[key].acronym;
                let br = document.createElement("br");
                document.getElementById("links").appendChild(link);
                document.getElementById("links").appendChild(br);
            }
        })
}


// For board.html
function LoadBoardContent() {
    console.log(window.location.href);
}
