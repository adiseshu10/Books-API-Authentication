const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

app.post('/users/', async (req, res) => {
  try {
    const {username, name, password, gender, location} = req.body
    const hashPassword = await bcrypt.hash(password, 10)
    const sqlQuery = `Select * from user where username = '${username}';`
    const dbUser = await db.get(sqlQuery)
    if (dbUser === undefined) {
      const createSqlQuery = `insert into user(username,name,password,gender,location) values (
        '${username}',
        '${name}',
        '${hashPassword}',
        '${gender}',
        '${location}'     
        );`
      await db.run(createSqlQuery)
      res.send('User Created Succesfully')
    } else {
      res.send(400)
      console.log('User Already Exists')
    }
  } catch (error) {
    console.log(error)
  }
})

app.post('/login/', async (req, res) => {
  try {
    const {username, password} = req.body
    const getSqlQuery = `
    SELECT * FROM USER
    WHERE username = '${username}';
    `
    const dbUser = await db.get(getSqlQuery)
    if (dbUser === undefined) {
      res.send(400)
      console.log("User doesn't exsits")
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
      if (isPasswordMatched === true) {
        console.log('Login Success')
      } else {
        res.send(400)
        console.log('Invalid Password')
      }
    }
  } catch (error) {
    res.send(400)
    console.log('Error while logging in')
  }
})
