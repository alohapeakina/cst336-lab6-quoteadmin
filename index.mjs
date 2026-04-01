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
              req.body.portraitUrl, req.body.bio,
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
app.get("/quote/new", (req, res) => {
    res.render("newQuote");
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
      const [rows] = await pool.query(sql, params);
      res.render("newQuote", 
                 {"message": "Quote added!"});
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
        
app.listen(3000, ()=>{
    console.log("Express server running")
})

// Retrieve existing quote information
app.get("/quote/edit", async function(req, res){

 let quoteId = req.query.quoteId;

 let sql = `SELECT * 
        FROM q_quotes
        WHERE quoteId = ${quoteId}`;

    try {
        const [rows] = await pool.query(sql);
        res.render("editQuote", {"quote":rows});
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Change existing author information
app.post("/quote/edit", async function(req, res){
  let sql = `UPDATE q_quotes
            SET quote = ?,
                authorId = ?,
                category = ?,
                likes = ?
            WHERE quoteId =  ?`;

  let params = [req.body.quote,  
              req.body.authorId, req.body.category,
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

// app.get("/dbTest", async(req, res) => {
//    try {
//         const [rows] = await pool.query("SELECT CURDATE()");
//         res.send(rows);
//     } catch (err) {
//         console.error("Database error:", err);
//         res.status(500).send("Database error");
//     }
// });

app.get("/dbTest", async (req, res) => {
    try {
        // Check if the pool is connected
        const connection = await pool.getConnection();
        console.log("Database connection successful!");
        connection.release(); 

        // Now perform the query
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(`Database connection is working fine. Today's date: ${rows[0]["CURDATE()"]}`);
    } catch (err) {
        console.error("Database connection error:", err);
        res.status(500).send("Database error");
    }
});