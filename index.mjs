import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

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
  let sex = req.body.sex;
  let profession = req.body.profession;
  let portraitUrl = req.body.portraitUrl;
  let biography = req.body.biography;

  let sql = `INSERT INTO q_authors
             (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  let params = [fName, lName, birthDate, deathDate, sex, profession, birthPlace, portraitUrl, biography];

  try {
      const [rows] = await pool.query(sql, params);
      res.render("newAuthor", 
                 {"message": "Author added!"});
  } catch (err) {
        console.error("Database error:", err.message);
        console.error("SQL:", sql);
        console.error("Params:",params);
        res.status(500).send("Database error");
    }
});

// Retrieve list of authors
app.get("/authors", async function(req, res){
    let sql = `SELECT *
            FROM q_authors
            ORDER BY lastName`;

    try {
        const [rows] = await pool.query(sql);
        res.render("authorList", {"authors":rows});
    } catch (err) {
        console.error("Database error:", err);
        console.error("SQL:", sql);
        res.status(500).send("Database error");
    }
});

// Retrieve existing author information
app.get("/author/edit", async function(req, res){

 let authorId = req.query.authorId;

 let sql = `SELECT *, 
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
        DATE_FORMAT(dod, '%Y-%m-%d') dodISO
        FROM q_authors
        WHERE authorId =  ${authorId}`;

    try {
        const [rows] = await pool.query(sql);
        res.render("editAuthor", {"authorInfo":rows});
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
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
              req.body.portraitUrl, req.body.biography,
              req.body.authorId];  

    try {
        const [rows] = await pool.query(sql,params);
        res.redirect("/authors");
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Deletes author
app.get("/author/delete", async function(req, res) {
    let authorId = req.query.authorId;

    let sql = `DELETE
               FROM q_authors
               WHERE authorId = ?`;

    try {
        const [rows] = await pool.query(sql, [authorId]);
        res.redirect("/authors");
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Display form for inputting quote
app.get("/quote/new", async (req, res) => {
    let sql = `SELECT authorId, firstName, lastName
                FROM q_authors
                ORDER BY lastName`;
    try {
        const [rows] = await pool.query(sql);
        res.render("newQuote", {"authors":rows});
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Inserts new quote into the database
app.post("/quote/new", async function(req, res){
  let quote = req.body.quote;
  let authorId = req.body.author;
  let category = req.body.category;
  let likes = req.body.likes;

  let sql = `INSERT INTO q_quotes
             (quote, authorId, category, likes)
              VALUES (?, ?, ?, ?)`;
  let params = [quote, authorId, category, likes];

  try {
        // Inserts, then gathers list of authors since the add quote
        // route now populates a dropdown of authors from the database
        await pool.query(sql, params);
        let sqlAuthors = `SELECT authorId, firstName, lastName
                          FROM q_authors
                          ORDER BY lastName`;

      const [rows] = await pool.query(sqlAuthors);
      res.render("newQuote", 
                 {"message": "Quote added!",
                  "authors": rows});
  } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Retrieve list of quotes
app.get("/quotes", async function(req, res){
    let sql = `SELECT *
            FROM q_quotes
            ORDER BY quoteId`;
    try {
        const [rows] = await pool.query(sql);
        res.render("quoteList", {"quotes":rows});
    } catch (err) {
        console.error("Database error:", err);
        console.error("SQL:", sql);
        res.status(500).send("Database error");
    }
});
        
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
})

// Retrieve existing quote information
app.get("/quote/edit", async function(req, res){

 let quoteId = req.query.quoteId;

 let sqlQuote = `SELECT * 
        FROM q_quotes
        WHERE quoteId = ?`;
 let quoteParams = [quoteId];

let sqlAuthor = `SELECT authorId, firstName, lastName
                FROM q_authors
                ORDER BY lastName`;

    try {
        const [quoteRows] = await pool.query(sqlQuote, quoteParams);
        const [authorRows] = await pool.query(sqlAuthor);

        res.render("editQuote", {
                   "quote":quoteRows,
                   "authors":authorRows});

    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Change existing quote information
app.post("/quote/edit", async function(req, res){
    console.log("Form data received:", req.body);
  let sql = `UPDATE q_quotes
            SET quote = ?,
                authorId = ?,
                category = ?,
                likes = ?
            WHERE quoteId =  ?`;

  let params = [req.body.quote,  
              req.body.author, req.body.category,
              req.body.likes, req.body.quoteId];  
    try {
        const [rows] = await pool.query(sql,params);
        res.redirect("/quotes");
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }

});

// Deletes quote
app.get("/quote/delete", async function(req, res) {
    let quoteId = req.query.quoteId;

    let sql = `DELETE
               FROM q_quotes
               WHERE quoteId = ?`;

    try {
        const [rows] = await pool.query(sql, [quoteId]);
        res.redirect("/quotes");
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(`Database connection is working. Today's date: ${rows[0]["CURDATE()"]}`);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});