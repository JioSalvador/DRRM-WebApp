const express = require('express');
const app = express();
const pool = require('./db.js');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;

//initialize routes
const newsRoutes = require('./routes/editor/newsRoutes.js');
const aboutRoutes = require('./routes/editor/aboutRoutes.js');
const faqRoutes = require('./routes/editor/faqRoutes.js');
const authRoutes = require('./routes/general/authRoutes.js');
const contactsRoutes = require('./routes/editor/contactsRoutes.js');
const clientRoutes = require('./routes/client/clientRequestRoutes.js');
const adminRoutes = require('./routes/admin/adminRoutes.js');
const userRoutes = require('./routes/superadmin/userRoutes.js');
const itemRoutes = require('./routes/superadmin/itemRoutes.js');
const logsRoutes = require('./routes/superadmin/logsRoutes.js');
const calendarRoutes = require('./routes/editor/calendarRoutes.js');

app.use(express.json());
app.use(cookieParser());

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

// Editor routes
app.use('/news', newsRoutes);
app.use('/about', aboutRoutes);
app.use('/faq', faqRoutes);
app.use('/contacts', contactsRoutes);
app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);

// admin
app.use('/admin', adminRoutes);

//client
app.use('/client', clientRoutes);

//superadmin
app.use('/userRoutes', userRoutes);
app.use('/logsRoutes', logsRoutes);
app.use('/itemRoutes', itemRoutes);

app.listen(PORT, ()=>{
    console.log(`Server is running on port: ${PORT}`);
})