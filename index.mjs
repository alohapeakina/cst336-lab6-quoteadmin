import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//setting up database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_ID,
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', (req, res) => {
   res.render('index');
});

// Display form for inputting Author information
app.get("/author/new", (req, res) => {
    res.render("newAuthor");
});

// Inserts new author into the database
app.post("/author/new", async function(req, res){
  let fName = req.body.fName;
  let lName = req.body.lName;
  let birthDate = req.body.birthDate;
  let deathDate = req.body.deathDate;
  let birthPlace = req.body.birthPlace;
  let sex = req.body.sexSelect;
  let profession = req.body.profession;
  let portraitUrl = req.body.portraitUrl;
  let biography = req.body.biography;

  let sql = `INSERT INTO q_authors
             (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  let params = [fName, lName, birthDate, deathDate, sex, profession, birthPlace, portraitUrl, biography];
  const [rows] = await pool.query(sql, params);
  res.render("newAuthor", 
             {"message": "Author added!"});
});

app.get("/authors", async function(req, res){
 let sql = `SELECT *
            FROM q_authors
            ORDER BY lastName`;
 const [rows] = await pool.query(sql);
 res.render("authorList", {"authors":rows});
});

// Retrieve existing author information
app.get("/author/edit", async function(req, res){

 let authorId = req.query.authorId;

 let sql = `SELECT *, 
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
        DATE_FORMAT(dod, '%Y-%m-%d') dodISO
        FROM q_authors
        WHERE authorId =  ${authorId}`;
 const [rows] = await pool.query(sql);
 res.render("editAuthor", {"authorInfo":rows});
});

// Change existing author information
app.post("/author/edit", async function(req, res){
  let sql = `UPDATE q_authors
            SET firstName = ?,
                lastName = ?,
                dob = ?,
                dod = ?,
                sex = ?,
                profession = ?,
                country = ?,
                portrait = ?,
                biography = ?
            WHERE authorId =  ?`;

  let params = [req.body.fName,  
              req.body.lName, req.body.dob,
              req.body.dod, req.body.sex,
              req.body.profession, req.body.birthPlace,
              req.body.portraitUrl, req.body.bio,
              req.body.authorId];  

  const [rows] = await pool.query(sql,params);
  res.redirect("/authors");
});


app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

app.listen(3000, ()=>{
    console.log("Express server running")
})