from flask import Flask, request, render_template
from flask_cors import CORS
from models import DatabaseConnector, Board, Post

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

CORS(app)

@app.route('/')
def Index():
    return render_template('index.html')


@app.route('/boards/<board_name>/')
def ServeBoard(board_name: str):
    return render_template('board.html')

@app.route('/reply/<post_id>')
def ReplyTo(post_id: str):
    return render_template('reply.html')


# Optional 'acr' parameter can be specified
@app.route('/boards', methods=["GET"])
def GetBoards():
    return Board.Read(request.args['acr'])


# Valid json body template for this request is following:
# {
#    "board": "<board>",
#    "replyTo": <unix-timestamp>,
#    "userAttachment": "<base64>",
#    "posterName": "<name>",
#    "postContent": "<content>"
# }
@app.route('/post', methods=["POST"])
def MakePost():
    return Post.Create(
        request.json['board'],
        request.json['replyTo'],
        str(request.remote_addr),
        request.json['userAttachment'],
        request.json['posterName'],
        request.json['postContent']
    )


# There are two required url parameters to supply
#   1. board
#   2. replyTo
@app.route('/post', methods=["GET"])
def GetPosts():
    return Post.Read(
        request.args['board'],
        request.args['replyTo']
    )


# Valid json body template for this request is following:
# {
#    "timestamp": <unix-timestamp>
# }
@app.route('/post', methods=['DELETE'])
def DeletePost():
    return Post.Delete(
        str(request.remote_addr),
        request.json['timestamp']
    )


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=3000)
