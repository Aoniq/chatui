const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
let pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
})

// Require socket.io module and initialize the server
const socketIo = require('socket.io');

module.exports = (io) => {
  // Move the chat rendering logic to a separate function
  function renderChatPage(req, res) {
    if (req.session.userid) {
      pool.getConnection(function (err, con) {
        if (err) {
          console.log(err);
          res.redirect('/auth/login');
        } else {
          const quer = 'SELECT * FROM user WHERE id = ?';
          con.query(quer, [req.session.userid], (error, row) => {
            if (error) {
              console.log(error);
              res.redirect('/auth/login');
            } else {
              const receiverName = req.params.user;
              if (receiverName) {
                let quer = 'SELECT * FROM user WHERE id = ?';
                con.query(quer, [receiverName], (error, rows) => {
                  if (error) {
                    console.log(error);
                    res.send('Error fetching receiver details');
                  } else if (rows.length < 1) {
                    res.send('No user found');
                  } else {
                    quer = `
                    SELECT m.*, r.username as receiver_username
                    FROM messages m
                    JOIN user r ON m.receiver_id = r.id
                    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
                    ORDER BY m.sent_at ASC
                  `;
                    con.query(
                      quer,
                      [row[0].id, rows[0].id, rows[0].id, row[0].id],
                      (error, results) => {
                        if (error) {
                          console.log(error);
                          res.send('Error fetching messages');
                        } else {
                          res.render('chat', {
                            receiver: rows[0],
                            user: row[0],
                            messages: results,
                          });
                        }
                      }
                    );
                  }
                });
              } else {
                res.redirect('/chat');
              }
            }
          });
        }
        con.release();
      });
    } else {
      res.redirect('/auth/login');
    }
  }

  // Route to render the chat page
  router.get('/:user', renderChatPage);

  router.get('/', (req, res) => {
    if (req.session.userid) {
      pool.getConnection(function (err, con) {
        if (err) {
          console.log(err);
          res.redirect('/auth/login');
        } else {
          const quer = 'SELECT * FROM user WHERE id = ?';
          con.query(quer, [req.session.userid], (error, row) => {
            if (error) {
              console.log(error);
              res.redirect('/auth/login');
            } else {
              res.render('chat', {user: req.session.userid,receiver: 0});
            }
            // Release the connection after handling the query
            con.release();
          });
        }
      });
    } else {
      res.redirect('/auth/login');
    }
  });

  // Socket.IO events
  io.on('connection', (socket) => {
    console.log('A user connected to chat');
    pool.getConnection(function (err, con) {
      if (err) {
        console.log(err);
      } else {
        console.log(socket.request.session.userid)
        const quer = 'SELECT * FROM user WHERE id = ?';
        con.query(quer, [socket.request.session.userid], (error, row) => {
          if (error) {
            console.log(error);
          } else {
            // add the socket id to the database
            const quer = 'UPDATE user SET socket_id = ? WHERE id = ?';
            con.query(quer, [socket.id, row[0].id], (error) => {
              if (error) {
                console.log(error);
              } else {
                // Send the socket id to the client
                socket.emit('socketID', socket.id);
              }
            }
            );
          }
          // Release the connection after handling the query
          con.release();
        });
      }
    });

    socket.on('create_private_room', (senderId, receiverId) => {
      const privateRoom = getPrivateRoomName(senderId, receiverId);
      socket.join(privateRoom);
  });

    // Handle the chat message event
    socket.on('chat message', (message) => {
      // Save the chat message to the database
      const quer = `
      INSERT INTO messages (sender_id, receiver_id, message)
      VALUES (?, ?, ?)
      `;
      pool.query(quer, [message.sender, message.receiver, message.message], (error) => {
          if (error) {
              console.log(error);
              // Handle the error appropriately, such as sending an error response to the client
              return;
          } else {
              // Emit the message to the private room for this sender-receiver pair
              const privateRoom = getPrivateRoomName(message.sender, message.receiver);
              io.to(privateRoom).emit('chat message', message);
          }
      });
  });
  function getPrivateRoomName(senderId, receiverId) {
    return `private_${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`;
}

    // Handle any other socket events as needed

    socket.on('disconnect', () => {
      console.log('A user disconnected from chat');
    });
  });

  return router;
};
