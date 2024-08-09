import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import expressLayout from 'express-ejs-layouts';


const router = express.Router();

router.use(expressLayout);


const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// connecting with postgresql database
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Result",
    password: "postgres@224",
    port: 3000, 
});
db.connect();

// to retrive student details by their uid
async function getStudent(req) {
    const uid = req.body.uid;
    try {
      const result = await db.query("SELECT * FROM students WHERE uid = $1", [uid]);
      return result.rows[0];
     }catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

async function viewmarks(req) {
    const uid = req.body.uid;
    try {
      const result = await db.query(`
        SELECT
          math.ese AS m_ese,
          chem.ese AS c_ese,
          phy.ese AS p_ese, 
          math.total AS m_total, 
          chem.total AS c_total, 
          phy.total AS p_total 
        FROM students 
        LEFT JOIN math ON students.uid = math.uid 
        LEFT JOIN chem ON students.uid = chem.uid 
        LEFT JOIN phy ON students.uid = phy.uid 
        WHERE students.uid = $1;
      `, [uid]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching student marks:', error);
      throw error;
    }
}

async function viewResult(req) {
    const uid = req.body.uid;
    try {
      const result = await db.query("SELECT * FROM marklist WHERE uid = $1", [uid]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching result:', error);
      throw error;
    }
}


router.get("/student-login", (req,res) => {
    res.render("student");
});

router.post("/result2", async(req, res) => {
    const uid = req.body.uid;
    const loginPassword = req.body.password;
    const details = await getStudent(req);
    const marks = await viewmarks(req);
    const result = await viewResult(req);
    if(uid >= 2024001 && uid <= 2024020){
        if(details.password === loginPassword){
            res.render("result", {
                name: details.name + " " + details.surname,
                uid: details.uid,
                branch: details.branch,
                sem: details.semester,
                marks: marks,
                result: result,
                isStudent : true
            });
        }else{
            res.send("Wrong Password! Retry Again");
        }
    }else{
        res.send("Invalid UID ! Please try again");
    }

});

export default router;
