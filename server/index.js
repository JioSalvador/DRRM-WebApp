const express = require('express');
const app = express();
const pool = require('./db.js');

const PORT = process.env.PORT || 3000;

//initialize routes
const newsRoutes = require('./routes/newsRoutes.js');
const aboutRoutes = require('./routes/aboutRoutes.js');
const faqRoutes = require('./routes/faqRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const contactsRoutes = require('./routes/contactsRoutes.js');

app.use(express.json());

// test database connection
async function testDBConnection(){
    try{
        const result = await pool.query('SELECT NOW()');
        console.log("Database connected successfully at:", result.rows[0].now);
    }catch(err){
        console.log(err.message)
    }
}
testDBConnection()

app.get('/', (req, res) =>{
    res.send('Hello World');
});

// Routes
app.use('/news', newsRoutes);
app.use('/authentication', authRoutes);
app.use('/about', aboutRoutes);
app.use('/faq', faqRoutes);
app.use('/contacts', contactsRoutes);

app.listen(PORT, ()=>{
    console.log(`Server is running on port: ${PORT}`);
})

