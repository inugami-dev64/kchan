import mariadb
import datetime
from dataclasses import dataclass
import sys
import time


class DatabaseConnector:
    @staticmethod
    def ConnectToDatabase():
        # Attempt to connect to MariaDB platform
        try:
            conn = mariadb.connect(
                user="kchan_backend",
                password="password",
                host='127.0.0.1',
                database='kchan'
            )

        except mariadb.Error as e:
            print(f"Error connecting to MariaDB: { e }")
            sys.exit(1)

        return conn

    @staticmethod
    def CloseConnection(conn):
        conn.close()


# Class definitions
@dataclass
class Board:
    acronym: str
    name: str

    @staticmethod
    def Create(acronym, name):
        conn = DatabaseConnector.ConnectToDatabase()
        cur = conn.cursor(buffered=True)
        board = Board(acronym, name)

        try:
            cur.execute(
                "INSERT INTO boards "
                "(Acronym,Name) "
                "VALUES(?, ?)",
                (board.acronym, board.name)
            )
        except mariadb.Error as e:
            print(f"Could not create new board: {e}")
            return {"errorMessage": e}

        conn.close();
        return board.__dict__

    @staticmethod
    def Read(acronym):
        conn = DatabaseConnector.ConnectToDatabase()
        cur = conn.cursor(buffered=True)
        boards = {}

        if acronym != "":
            cur.execute(
                "SELECT Acronym,Name FROM boards "
                "WHERE Acronym=?",
                (acronym,)
            )

            for Acronym, Name in cur:
                board = Board(Acronym, Name)
                boards[board.acronym] = board.__dict__

        else:
            cur.execute(
                "SELECT Acronym,Name FROM boards "
                "ORDER BY Acronym"
            )

            for Acronym, Name in cur:
                board = Board(Acronym, Name)
                boards[board.acronym] = board.__dict__

        conn.close()
        return boards

    @staticmethod
    def Update(acronym, name):
        conn = DatabaseConnector.ConnectToDatabase()
        cur = conn.cursor(buffered=True)
        board = Board(acronym, name)

        try:
            cur.execute(
                "UPDATE boards "
                "SET Name=? "
                "WHERE Acronym=?",
                (acronym, name)
            )
            conn.commit()
        except mariadb.Error as e:
            print(f"Could not update board: {e}")
            return {"errorMessage": e}

        conn.close();
        return board.__dict__

    @staticmethod
    def Delete(acronym):
        conn = DatabaseConnector.ConnectToDatabvase()
        cur = conn.cursor(buffered=True)
        try:
            cur.execute(
                "DELETE FROM boards "
                "WHERE Acronym=?",
                (acronym,)
            )
            conn.commit()
        except mariadb.Error as e:
            print(f"Could not delete board: {e}")
            return {"errorMessage": e}

        conn.close()
        return {"errorMessage": "Success"}


@dataclass
class Post:
    timestamp: int
    board: str
    reply_to: int
    poster_ip: str
    user_attachment: str
    poster_name: str
    post_content: str

    @staticmethod
    def Create(board, reply_to, poster_ip, user_attachment, poster_name, post_content):
        conn = DatabaseConnector.ConnectToDatabase()
        cur = conn.cursor(buffered=True)
        post = Post(
            0,
            board,
            reply_to,
            poster_ip,
            user_attachment,
            poster_name,
            post_content
        )

        # Check data validity
        cur.execute(
            "SELECT Acronym,Name FROM boards WHERE Acronym=?", 
            (board,)
        )

        is_found = False
        for Acronym, Name in cur:
            is_found = True
            break

        if not is_found:
            return {"errorMessage": f"Invalid board name '{board}'"}

        reply_to_str = datetime.datetime.fromtimestamp(reply_to).strftime('%Y-%m-%d %H:%M:%S')

        # Attempt to insert post
        if reply_to != 0:
            try:
                cur.execute(
                    "INSERT INTO posts "
                    "(Board,ReplyTo,PosterIp,UserAttachment,PosterName,PostContent)"
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (board, reply_to_str, poster_ip, user_attachment, poster_name, post_content)
                )
                conn.commit()
            except mariadb.Error as e:
                print(f"Error inserting post to database { e }")
                return {"errorMessage": "Unexpected error occured when posting"}
        else:
            try:
                cur.execute(
                    "INSERT INTO posts "
                    "(Board,PosterIp,UserAttachment,PosterName,PostContent)"
                    "VALUES (?, ?, ?, ?, ?)",
                    (board, poster_ip, user_attachment, poster_name, post_content)
                )
                conn.commit()
            except mariadb.Error as e:
                print(f"Error inserting post to database { e }")
                return {"errorMessage": "Unexpected error occured when posting"}


        conn.close()
        return post.__dict__

    @staticmethod
    def Read(board, reply_to):
        conn = DatabaseConnector.ConnectToDatabase()
        cur = conn.cursor(buffered=True)
        # There two types of queries:
        #   1. Query all threads belonging to the board (reply_to == 0)
        #   2. Query replies to a certain thread (reply_to != 0)
        cur.execute(
            "SELECT Timestamp,Board,ReplyTo,UserAttachment,PosterName,PostContent "
            "FROM posts "
            "WHERE UNIX_TIMESTAMP(ReplyTo)=? "
            "AND Board=? "
            "ORDER BY Timestamp",
            (reply_to, board)
        )

        posts = {}
        for Timestamp, Board, ReplyTo, UserAttachment, PosterName, PostContent in cur:
            ts = int(time.mktime(Timestamp.timetuple()))
            post = Post(ts, Board, int(reply_to), "N/A", str(UserAttachment), str(PosterName), str(PostContent))
            posts[str(post.timestamp)] = post.__dict__

        conn.close()
        return posts

    @staticmethod
    def Delete(poster_ip, timestamp):
        conn = DatabaseConnector.ConnectToDatabase()
        cur = conn.cursor(buffered=True)

        # Attempt to delete the post
        try:
            cur.execute(
                "DELETE FROM posts "
                "WHERE UNIX_TIMESTAMP(Timestamp)=? "
                "AND PosterIp=?",
                (timestamp, poster_ip)
            )
            conn.commit()

        except mariadb.Error as e:
            print(f"Error deleting post from database {e}")
            return {"errorMessage": "Unexpected error occured when posting"}

        conn.close()
        return {"errorMessage": "Success"}
