var express = require('express');
var router = express.Router();
let mysql = require('mysql2')
const argon2 = require('argon2');
let pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
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
    && req.body.username
    && req.body.password) {
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;
    pool.getConnection(function (err, con) {
      con.query('SELECT * FROM user WHERE email = ? OR username = ?', [email, username], async (error, rows) => {
        console.log(rows.length)
        if (rows.length < 1) {
          

          try {
            const hash = await argon2.hash(password);
            let quer = 'INSERT INTO user (email, username, password) VALUES(?,?,?)'
            con.query(quer,[email,username,hash])
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
    let quer = 'SELECT * FROM user WHERE email = ?'
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
