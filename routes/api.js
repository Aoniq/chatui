const express = require('express');
const router = express.Router();
let mysql = require('mysql2')
let pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Bakugan%10',
  database: 'glrate'
})

  router.post('/users', (req, res) => {
    if (req.session.userid) {
        if (req.body.username.length !== 0) {
            pool.getConnection(function (err, con) {
                con.query('SELECT * FROM users WHERE student_id = ?', [req.body.student_id], async (error, rows) => {
                    let user = rows[0];
                    if (rows.length < 1) {
                        res.send('invalid student id')
                    } else {
                    res.redirect(`/chat/${user.id}`)    
                    }
                    
                })
            })
        }
        
    } else {
        res.redirect('/auth/login')
    }
  });
  router.get('/contacts', (req, res) => {
    if (req.session.userid) {
      pool.getConnection((err, con) => {
        if (err) {
          console.log(err);
          res.status(500).json({ error: 'Error connecting to the database' });
        } else {
          const userId = req.session.userid; // Store the user ID in a variable
  
          const quer = `
            SELECT u.id as user_id, u.student_id, m.last_interaction
            FROM users u
            JOIN (
              SELECT user_id, MAX(last_interaction) as last_interaction
              FROM (
                SELECT DISTINCT sender_id as user_id, MAX(sent_at) as last_interaction
                FROM messages
                WHERE receiver_id = ? OR sender_id = ?
                GROUP BY sender_id
                UNION ALL
                SELECT DISTINCT receiver_id as user_id, MAX(sent_at) as last_interaction
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY receiver_id
              ) m
              WHERE user_id != ?
              GROUP BY user_id
            ) m ON u.id = m.user_id
            ORDER BY m.last_interaction DESC
          `;
  
          con.query(quer, [userId, userId, userId, userId, userId], (error, results) => {
            con.release();
            if (error) {
              console.log(error);
              res.status(500).json({ error: 'Error fetching contacts' });
            } else {
              res.json(results);
            }
          });
        }
      });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });
  
  module.exports = router;