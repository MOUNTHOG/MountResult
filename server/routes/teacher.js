import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from "bcrypt";
import session from "express-session";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const jwtSecret = process.env.JWT_SECRET;
const router = express.Router();

// connecting with postgresql database

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Result",
    password: "postgres@224",
    port: 3000, 
  });
  db.connect();

  const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.email = decoded.userId;  // Assuming userId is the email
      const result = await db.query("SELECT * FROM teacher WHERE email = $1", [req.email]);
      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  };


const validateSubject = (subj) => ['math', 'chem', 'phy'].includes(subj);

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

//to enter marks of all exams of a particular subject 
async function enter(req) {
  const uid = req.body.uid;
  const subj = req.body.subj;
  
  if (!validateSubject(subj)) {
    throw new Error('Invalid subject');
  }
  
  console.log(req.body);
  const ise = parseInt(req.body.ISE, 10);
  const mse = parseInt(req.body.MSE, 10);
  const ese = parseInt(req.body.ESE, 10);
  
  const total = Math.round((ise + (2 / 3) * mse + 0.6 * ese) * 100) / 100;
  const query = `
    INSERT INTO ${subj} (uid, ise, mse, ese, total) 
    VALUES ($1, $2, $3, $4, $5)
  `;

  try {
    await db.query(query, [uid, ise, mse, ese, total]);
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
}

// to edit marks of a particular subject
async function edit(req) {
  const uid = req.body.uid;
  const subj = req.body.subj;
  
  if (!validateSubject(subj)) {
    throw new Error('Invalid subject');
  }
  
  console.log(req.body);
  const ise = parseInt(req.body.ISE, 10);
  const mse = parseInt(req.body.MSE, 10);
  const ese = parseInt(req.body.ESE, 10);
  
  const total = Math.round((ise + (2 / 3) * mse + 0.6 * ese) * 100) / 100;
  const query = `
    UPDATE ${subj} 
    SET ise = $1, mse = $2, ese = $3, total = $4
    WHERE uid = $5
  `;
  try {
    await db.query(query, [ise, mse, ese, total, uid]);
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
}

// to view total marks of all the subjects
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

//to view marks of an individual subject
async function viewSubjectMarks(req, subject) {
  const uid = req.body.uid;
  try {
    const result = await db.query(`SELECT * FROM ${subject} WHERE uid = $1`, [uid]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching ${subject} marks:`, error);
    throw error;
  }
}

// to view marks of particular subject by calling the above function
async function viewpmarks(req) {
  return viewSubjectMarks(req, 'phy');
}

async function viewcmarks(req) {
  return viewSubjectMarks(req, 'chem');
}

async function viewmmarks(req) {
  return viewSubjectMarks(req, 'math');
}

// to generate result 
async function generateResult(req, marks){
    const uid = req.body.uid;
    let p = 0;
    let c = 0;
    let m = 0;
    if (marks.p_total == null) {
        p = 0;
    } else if (marks.p_total >= 80) {
        p = 10;
    } else if (marks.p_total >= 75) {
        p = 9;
    } else if (marks.p_total >= 70) {
        p = 8;
    } else if (marks.p_total >= 65) {
        p = 7;
    } else if (marks.p_total >= 60) {
        p = 6;
    } else if (marks.p_total >= 55) {
        p = 5;
    } else if (marks.p_total >= 49.5) {
        p = 4;
    } else {
        p = 0; // Default case for values less than 50
    }
    
    if (marks.c_total == null) {
        c = 0;
    } else if (marks.c_total >= 80) {
        c = 10;
    } else if (marks.c_total >= 75) {
        c = 9;
    } else if (marks.c_total >= 70) {
        c = 8;
    } else if (marks.c_total >= 65) {
        c = 7;
    } else if (marks.c_total >= 60) {
        c = 6;
    } else if (marks.c_total >= 55) {
        c = 5;
    } else if (marks.c_total >= 49.5) {
        c = 4;
    } else {
        c = 0; 
    }

    if (marks.m_total == null) {
        m = 0;
    } else if (marks.m_total >= 80) {
        m = 10;
    } else if (marks.m_total >= 75) {
        m = 9;
    } else if (marks.m_total >= 70) {
        m = 8;
    } else if (marks.m_total >= 65) {
        m = 7;
    } else if (marks.m_total >= 60) {
        m = 6;
    } else if (marks.m_total >= 55) {
        m = 5;
    } else if (marks.m_total >= 49.5) {
        m = 4;
    } else {
        m = 0; // Default case for values less than 50
    }    

    try {
        const sgpa =  3*p + 3*c + 4*m;
        let cgpa = 0;
        let credits = 0;

        if(p != 0 && c != 0 && m != 0){
            credits = 10;
        }
        else if((c != 0 && m != 0) || (p != 0 && m != 0)){
            credits = 7;
        }else if(p != 0 && c != 0){
            credits = 6;
        }else if(m != 0){
            credits = 4
        }else if(p != 0 || c != 0){
            credits = 3;
        }else{
            credits = 0;
        }

        if(p == 0 || c == 0 || m == 0){
            cgpa = 0;
        }else{
            cgpa = Math.round((sgpa/10)*100)/100;
        }

        const result = await db.query("INSERT INTO marklist (uid, p_pointer, c_pointer, m_pointer, sgpa, cgpa, credits) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            [uid, p, c, m, sgpa, cgpa, credits]
        );
    } catch (error) {
        console.log("Data Entry already done!");
    }

}

// to view result
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

router.get("/", (req,res) => {
    res.render("index");
});

router.get("/teacher-login", (req, res)=>  {
    res.render("teacher",{
      nologout : true
    });
});

router.get("/student-login", (req,res) => {
  res.render("student");
});

router.get("/home", authMiddleware, (req, res) => {
  res.render("home");
});

router.post("/login", async(req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const result = await db.query("SELECT * FROM teacher WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;
      
      bcrypt.compare(password, storedHashedPassword, (err, isMatch) => {
        if (err) {
          console.log(err);
        } 
        if (isMatch) {
          const token = jwt.sign({ userId: user.email }, jwtSecret, { expiresIn: '10m' });
          res.cookie('token', token, { httpOnly: true });
          res.redirect("/home");
        } else {
          res.send("Incorrect password");
        }
      });
    } else {
      console.log("User Not Found");
    }
  } catch (err) {
    console.log(err);

}
});

// GET route for /home - rendering home if authenticated



router.post("/dashboard",authMiddleware, async (req, res) => {
  try {
    const details = await getStudent(req);
    const pmarks = await viewpmarks(req);
    const cmarks = await viewcmarks(req);
    const mmarks = await viewmmarks(req);
    const result = await viewResult(req);

    res.render("dashboard", {
      f_name: details.name,
      l_name: details.surname,
      uid: details.uid,
      branch: details.branch,
      sem: details.semester,
      pmarks: pmarks ? pmarks : "",
      cmarks: cmarks ? cmarks : "",
      mmarks: mmarks ? mmarks : "",
      subj: {
        phy: "phy",
        chem: "chem",
        math: "math"
      },
      sgpa: result ? result.sgpa : null
    });
  } catch (error) {
    console.error("Error in dashboard:", error);
    res.status(500).send("Enter U.I.D first");
  }
});

router.post("/add", async (req, res) => {
  const details = await getStudent(req);
  const uid = req.body.uid;
  const subj = req.body.subj;
  res.render("subj", {
    uid: uid,
    subj: subj,
    f_name: details.name,
    l_name: details.surname,
    branch: details.branch,
    sem: details.semester,
    type: req.body.type
  });
});

router.post("/edit", async (req, res) => {
    const details = await getStudent(req);
    const uid = req.body.uid;
    const subj = req.body.subj;
    let marks;

    if(subj == "phy"){
        marks = await viewpmarks(req);
    }else if(subj == "chem"){
        marks = await viewcmarks(req);
    }else{
        marks = await viewmmarks(req);
    }
    
    res.render("subj", {
      uid: uid,
      subj: subj,
      f_name: details.name,
      l_name: details.surname,
      branch: details.branch,
      sem: details.semester,
      type: req.body.type,
      ise: marks.ise,
      mse: marks.mse,
      ese: marks.ese
    });
});

router.post("/enter", async (req, res) => {
  try {
    if(req.body.type == "add"){
        await enter(req);
    }else{
        await edit(req);
    }
    const details = await getStudent(req);
    const pmarks = await viewpmarks(req);
    const cmarks = await viewcmarks(req);
    const mmarks = await viewmmarks(req);
    const result = await viewResult(req);

    res.render("dashboard", {
      f_name: details.name,
      l_name: details.surname,
      uid: details.uid,
      branch: details.branch,
      sem: details.semester,
      pmarks: pmarks ? pmarks : "",
      cmarks: cmarks ? cmarks : "",
      mmarks: mmarks ? mmarks : "",
      subj: {
        phy: "phy",
        chem: "chem",
        math: "math"
      },
      sgpa: result ? result.sgpa : null
    });
  } catch (error) {
    console.error("Error in entering marks:", error);
    res.status(500).send("An error occurred");
  }
});

router.post("/result1", async (req, res) => {
  try {
    const details = await getStudent(req);
    const marks = await viewmarks(req);
    await generateResult(req,marks);
    const result = await viewResult(req);
    console.log(details);
    console.log(marks);
    console.log(result);
    res.render("result", {
      name: details.name + " " + details.surname,
      uid: details.uid,
      branch: details.branch,
      sem : details.semester,
      marks: marks,
      result: result,
    });
  } catch (error) {
    console.error("Error in generating result:", error);
    res.status(500).send("An error occurred");
  }
});

router.post('/redirect2', (req, res) => {
    res.redirect(307, "/dashboard"); 
});

router.post('/redirect1', (req,res) => {
    res.redirect("/home");
});

router.get('/logout', (req,res)=>{
  res.clearCookie('token');
  
  res.redirect('/');
});

export default router;