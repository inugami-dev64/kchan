const API_URL = "http://127.0.0.1:3000";
let REPLY_TO = 0;
let BOARD = new String;
let IMG_BASE64 = "None";


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
        });
}


// For board.html
function ExtractBoardName() {
    let url = window.location.href;
    let i = url.length - 2;
    for(; i >= 0; i--) {
        if(url[i] == '/')     
            break;
    }

    BOARD = url.substring(i, url.length)
}


function CreateChildPosts(id, threadId) {
    const params = new URLSearchParams({'board': BOARD, "replyTo": id});
    let replies = {};

    fetch(API_URL + "/post?" + params)
        .then(response => response.json())
        .then(data => {
            for(let key in data) {
                let post = document.createElement("div");
                post.setAttribute("class", "post");

                // create thread header
                let threadHeader = document.createElement("div");
                threadHeader.setAttribute("class", "threadHeader");
                let name = document.createElement("b");
                let text = document.createTextNode(data[key].poster_name);
                name.appendChild(text);
                threadHeader.appendChild(name);

                let date = new Date();
                date.setTime(data[key].timestamp * 1000);
                let dateElement = document.createElement("p");
                text = document.createTextNode(date.toUTCString() + " No. " + data[key].timestamp);
                dateElement.appendChild(text);
                threadHeader.appendChild(dateElement);

                post.appendChild(threadHeader);

                // create post image if possible
                if(data[key].user_attachment != "None") {
                    let img = document.createElement("img");
                    img.setAttribute("src", data[key].user_attachment);
                    post.appendChild(img);
                }

                // create post content
                let content = document.createElement("p");
                text = document.createTextNode(data[key].post_content);
                content.appendChild(text);
                post.appendChild(content);

                document.getElementById(threadId).appendChild(post);
                document.getElementById(threadId).appendChild(document.createElement("br"));
            }
        });
}


function CreateThread(threadDetails) {

    let thread = document.createElement("div");
    thread.setAttribute("class", "thread")
    let threadHeader = document.createElement("div");
    threadHeader.setAttribute("class", "threadHeader");

    // create thread header 
    let user = document.createElement("b");
    let text = document.createTextNode(threadDetails.poster_name);
    user.appendChild(text);
    threadHeader.appendChild(user);

    let date = new Date();
    date.setTime(threadDetails.timestamp * 1000);
    let dateElement = document.createElement("p");
    text = document.createTextNode(date.toUTCString() + " No. " + threadDetails.timestamp);
    dateElement.appendChild(text);
    threadHeader.appendChild(dateElement);

    let reply = document.createElement("a");
    reply.href = "javascript:window.open('/reply/" + threadDetails.timestamp + "?acr=" + threadDetails.board + "', '', 'width=400, height=290, scrollbars=no')";
    text = document.createTextNode("[Reply]");
    reply.appendChild(text);
    threadHeader.appendChild(reply);
    thread.appendChild(threadHeader);

    // create thread body
    const threadContentId = "threadContent_" + threadDetails.timestamp;
    let threadContent = document.createElement("div");
    threadContent.setAttribute("id", threadContentId);
    threadContent.setAttribute("class", "threadContent");
    
    // create image if present
    if(threadDetails.user_attachment != "None") {
        let img = document.createElement("img");
        img.setAttribute("src", threadDetails.user_attachment);
        threadContent.appendChild(img);
    }

    let opMsg = document.createElement("p");
    text = document.createTextNode(threadDetails.post_content);
    opMsg.appendChild(text);

    threadContent.appendChild(opMsg);
    threadContent.appendChild(document.createElement("br"));
    thread.appendChild(threadContent);

    // append all child posts for the thread
    document.getElementById("mainBoardContent").appendChild(thread);
    CreateChildPosts(threadDetails.timestamp, threadContentId);
}


function LoadThreads() {
    // TODO: Get all threads for current board
    const params = new URLSearchParams({'board': BOARD, 'replyTo': 0});
    fetch(API_URL + "/post?" + params)
        .then(response => response.json())
        .then(data => {
            for(let key in data) {
                CreateThread(data[key]);
            }
        });
}


function LoadBoardContent() {
    ExtractBoardName();
    // make a request to fetch board name and give it appropriate title
    const params = new URLSearchParams({'acr': BOARD});
    fetch(API_URL + "/boards?" + params)
        .then(response => response.json())
        .then(data => {
            // no board was found
            if(!(BOARD in data)) {
                document.getElementById("mainBoardContent").style.display = "none";
                document.getElementById("notFound").style.display = "block";
                document.title = "404 not found";
            }
            else {
                let title = data[BOARD].acronym + " - " + data[BOARD].name;
                document.getElementById("title").innerHTML = title;
                document.title = title;
                LoadThreads();
            }
        });
}


// Separate window reply
function LoadReply() {
    const replyLocation = "/reply/";
    const p1 = window.location.href.search(replyLocation) + replyLocation.length;
    const p2 = window.location.href.search(/\?acr/);
    if(p2 == -1)
        return;

    const replyTo = window.location.href.substr(p1, p2 - p1);
    REPLY_TO = parseInt(replyTo);

    const params = new URLSearchParams(window.location.search);
    BOARD = params.get("acr");
    document.getElementById("title").innerHTML = "Replying to '" + replyTo + "'";
}


// Post Submit event listener
function Post() {
    let name = document.getElementById("name").value;
    let msg = document.getElementById("msg").value;

    let jsonBody = {
        "board": BOARD,
        "replyTo": REPLY_TO,
        "userAttachment": IMG_BASE64,
        "posterName": name,
        "postContent": msg
    };

    // make the post request
    fetch(API_URL + "/post", {
        method: "POST",
        body: JSON.stringify(jsonBody),
        headers: { "Content-Type": "application/json" }
    }).then(() => {
        if(!REPLY_TO)
            window.location.reload();
        else {
            window.opener.location.reload(true);
            window.close()
        }
    }).catch(error => console.error(error))
}


function SubmitPost(event) {
    let files = document.getElementById("file").files;   
    event.preventDefault();
    if(files.length) {
        let file = files[0];
        let reader = new FileReader();
        reader.onloadend = () => {
            IMG_BASE64 = reader.result;
            Post();
            event.preventDefault();
        };
        reader.readAsDataURL(file);
    } else {
        Post();
    }
}

if(window.location.href.search("/boards/") != -1 || window.location.href.search("/reply/") != -1) {
    const form = document.getElementById("postThread");
    form.addEventListener("submit", SubmitPost);
}
