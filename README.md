# Kchan
Kchan is a simple imageboard like website written in python

# Getting started
In order to get started you will need MariaDB, Python and Flask

## Installing and configuring MariaDB
On Debian based systems install following packages from repositories:  
```
sudo apt install mariadb-server mariadb-plugin-connect mariadb-client
```

After the installation you will need to create a new MariaDB user and database with appropriate tables.
Creating the user can be done with following SQL command:  
```
CREATE USER 'kchan_backend'@localhost IDENTIFIED BY 'password';
```

As a root user create a new database named `kchan` and create appropriate tables:
```
CREATE DATABASE kchan;
USE kchan;
CREATE TABLE boards(Acronym TINYTEXT,Name TEXT);
CREATE TABLE posts(
    Timestamp TIMESTAMP DEFAULT(CURRENT_TIMESTAMP), 
    Board TINYTEXT, 
    ReplyTo TIMESTAMP, 
    PosterIp TINYTEXT, 
    UserAttachment LONGTEXT, 
    PosterName TINYTEXT, 
    PostContent MEDIUMTEXT,
    PRIMARY KEY(Timestamp)
);
```

Grant all priviledges on kchan database to `kchan_backend`:  
```
GRANT ALL PRIVILEDGES ON kchan TO 'kchan_backend'@localhost
```

## Creating Python venv
It is recommended to create an application specific virtual environment for kchan with all required
python packages.
Start by creating a new venv using following command:  
```
python3 -m venv kchan
```

Activate the venv by using:  
```
source ./kchan/bin/activate
```

Install all required python packages:  
```
pip3 install flask flask_cors mariadb
```

## Running the backend
Once MariaDB and python venv are configured you should be able to run the backend using:  
```
python3 server.py
```
