var express = require('express');
var router = express.Router();
let mysql = require('mysql2')
let argon2 = require('argon2')
let pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Bakugan%10',
  database: 'glrate'
})

/* GET users listing. */
router.get('/register', function (req, res, next) {
  res.render('auth/register')
});

/* GET users listing. */
router.get('/logout', function (req, res, next) {
  req.session.destroy()
  res.redirect('/auth/login')
});

router.post('/register', async (req, res, next) => {
  if (req.body.email
    && req.body.student_id
    && req.body.password) {
    let email = req.body.email;
    let username = req.body.student_id;
    let password = req.body.password;
    pool.getConnection(function (err, con) {
      if (err) {
        console.log(err)
      }
      con.query('SELECT * FROM users WHERE email = ? OR student_id = ?', [email, username], async (error, rows) => {
        console.log(rows.length)
        if (rows.length < 1) {
          const argon2 = require('argon2');

          try {
            const hash = await argon2.hash(password);
            let quer = 'INSERT INTO users (email, student_id, password) VALUES(?,?,?)'
            try {
              con.query(quer,[email,username,hash])
            } catch (error) {
              console.log(error)
            }
            console.log('done')
            res.redirect('/chat')
          } catch (err) {
            console.log(err)
          }
        } else {
          res.send('email/username already taken')
        }
      })
      con.release()
    })
  }
})

router.get('/login', function (req,res,next) {
  res.render('auth/login')
})

router.post('/login', async (req,res,next) => {
  if (req.body.email && req.body.password) {
    let email = req.body.email;
    let password = req.body.password;
    let quer = 'SELECT * FROM users WHERE email = ?'
    pool.getConnection(function (err, con) {
      con.query(quer, [email], async (error, rows) => {
        if (rows.length < 1) {
          res.send('invalid email address/password')
        } else {
          try {
            if (await argon2.verify(rows[0].password, password)) {
              // password match
              req.session.userid = rows[0].id;
              req.session.save();
              res.redirect('/chat')
            } else {
              res.send('invalid email address/password')
              // password did not match
            }
          } catch (err) {
            // internal failure
            console.log(err)
          }        }
      })
      con.release();
    })
  }
})


module.exports = router;
