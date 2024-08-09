import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import expressLayout from 'express-ejs-layouts';
import teacher from './server/routes/teacher.js';
import student from './server/routes/student.js';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 5000;

//using middleware to recieve user's data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());


//to make use of static public folder which contains frontend js and css
app.use(express.static("public"));

app.use(expressLayout);
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

app.set('view engine', 'ejs');
app.set('views', './views');
app.set('layout', './layouts/main');

app.use('/', teacher);
app.use('/', student);

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
