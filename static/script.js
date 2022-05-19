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
            for(let elem in data["boards"]) {
                $('<a>' + elem.acronym + " - " + elem.name + "</a>", {
                    href: API_URL + "/boards" + elem.acronym
                }).appendTo('#links');
                $("<br>").appendTo('#links');
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
            for(let elem in data["posts"]) {
                const postId = "post_" + data[key].timestamp.toString();
                const postHeaderId = "postHeader_" + data[key].timestamp.toString();
                const postContentId = "postContent_" + data[key].timestamp.toString();

                $('<div>', { id: postId, class: "post" }).appendTo(threadId);

                // header and its contents
                $('<div>', { id: postHeaderId, class: "threadHeader" }).appendTo(postId)
                $('<b>' + data[key].poster_name + '</b>').appendTo(postHeaderId);
                let date = new Date();
                date.setTime(data[key].timestamp * 1000);
                $('<p>' + date.toUTCString() + " No. " + data[key].timestamp + "</p>").appendTo(postHeaderId);

                // post content
                $('<div>', { id: postContentId, class: "threadContent" }).appendTo(postId);

                // create post image if possible
                if(data[key].user_attachment != "None")
                    $('<img>', { src: data[key].user_attachment }).appendTo(postContentId);

                $('<p>' + data[key].post_content + '</p>').appendTo(postContentId);
                $('<br>').appendTo(postContentId);
            }
        });
}


function CreateThread(threadDetails) {
    const threadId = "thread_" + threadDetails.timestamp.toString();
    const threadHeaderId = "threadHeader_" + threadDetails.timestamp.toString();
    const threadContentId = "threadContent_" + threadDetails.timestamp;

    // thread with its header
    $('<div>', { id: threadId, class: "thread" }).appendTo("#mainBoardContent"); 

    // header stuff
    let date = new Date();
    date.setTime(threadDetails.timestamp * 1000);
    $('<div>', { id: threadHeaderId, class: "threadHeader" }).appendTo('#' + threadId);
    $('<b>' + threadDetails.poster_name + "</b>").appendTo('#' + threadHeaderId);
    $('<p>' + date.toUTCString() + " No. " + threadDetails.timestamp + '</p>').appendTo('#' + threadHeaderId);
    $('<a href="javascript:DisplayReplyWindow(' + threadDetails.timestamp + ')">[Reply]</a>').appendTo('#' + threadHeaderId);

    // thread body
    $('<div>', { id: threadContentId, class: "threadContent" }).appendTo('#' + threadId);
    
    // create image if present
    if(threadDetails.user_attachment != "None") {
        const imgId = "image_" + threadDetails.timestamp;
        const onclickCallback = "MaximizeImage(\"" + imgId + "\")";
        $('<img>', { 
            id: imgId,
            src: threadDetails.user_attachment,
            onclick: onclickCallback
        }).appendTo('#' + threadContentId)
    }

    $('<p>' + threadDetails.post_content + '</p>').appendTo('#' + threadContentId);
    $('<br>').appendTo('#' + threadContentId);

    // append all child posts for the thread
    CreateChildPosts(threadDetails.timestamp, threadContentId);
}


function LoadThreads() {
    // TODO: Get all threads for current board
    const params = new URLSearchParams({'board': BOARD, 'replyTo': 0});
    fetch(API_URL + "/post?" + params)
        .then(response => response.json())
        .then(data => {
            for(let id in data["threads"]) {
                console.log(data["threads"][id]);
                CreateThread(data["threads"][id]);
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
            let index = -1;
            for(let i in data["boards"]) {
                if(data["boards"][i].acronym == BOARD) {
                    index = i;
                    break;
                }
            }

            if(index == -1) {
                $('#mainBoardContent').css("display", "none");
                $('#notFound').css('display', 'block');
                $('head').title = "404 not found";
            }
            else {
                let title = data["boards"][index].acronym + " - " + data["boards"][index].name;
                $('#title').html(title);
                $('title').html(title);
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


function LoadReply() {
    DisplayReplyWindow();
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


/*** Image manipulation ***/
function MaximizeImage(imgId) {
    $('#' + imgId).css("max-width", "100%");
    $('#' + imgId).css("max-height", "100%");
    $('#' + imgId).css("width", "auto");
    $('#' + imgId).css("height", "auto");
    $('#' + imgId).attr("onClick", 'MinimizeImage("' + imgId + '")');
}


function MinimizeImage(imgId) {
    $('#' + imgId).css("max-width", "128px");
    $('#' + imgId).css("max-height", "128px");
    $('#' + imgId).attr('onClick', 'MaximizeImage("' + imgId + '")');
}
