const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine' , 'ejs');

mongoose.connect('mongodb://localhost:27017/exam_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

const examiner_Schema = new mongoose.Schema({
  username: String,
  password: String,
  paperno:Number
});

const examiner = mongoose.model('examiner', examiner_Schema);

const studentDataSchema = new mongoose.Schema({
    name: String,
    seatNo: String,
    marks: Number, // Add marks field to the schema
    secret : String
  });
  
  const StudentData = mongoose.model('student_data', studentDataSchema);
  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve static files from the public directory
app.use(express.static('views/'));

app.get("/" , (req,res) => {
    res.render("index")
}
)

var un;

// app.get("/marks" , (req,res) => {
//     res.render(__dirname+"/public/marks.html")
// }
// )

app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    try {
      const found_examiner = await examiner.findOne({ username, password });
      if (found_examiner) {
        un = found_examiner.username;
        const papernum = found_examiner.paperno;
        res.render("marks", {papernumber:papernum});
      } else {
        res.status(401).send('Invalid credentials');
      }
    } catch (error) {
      res.status(500).send('Error signing in');
    }
  });

app.get('/bill' , async (req,res) => {
    try {
        const username = un;
        const examiner2 = await examiner.findOne({username})
        const p = examiner2.paperno;
        const bill = 40 * p;
        res.send(`Number of papers checked by you: ${p}.  Bill amount: ${bill} rs`)
    } catch (error) {
        res.send('some error in billing')
        
    }
    res.send()
}
)

app.get('/data' , async (req,res) => {
  try {
    // Use the find() method to retrieve all documents in the collection
    
    if(un == "prof.sanjay"){
      const allData = await StudentData.find({}).select('name seatNo marks');
    res.render('data.ejs' , {allData}) // Log the retrieved data
    } else{
      res.send('You are not allowed to access this data');
    }
  } catch (error) {
    res.send(error); // Log any errors that occur
  }

}
)

app.post('/add-marks', async (req, res) => {
    const { secret, marks } = req.body;
    try {
        // Find the document with the given seat number
        const student = await StudentData.findOne({ secret });

        if (!student) {
            return res.status(404).send('Student not found');
        }

        // Update the document with the marks
        student.marks = marks;
        await student.save();

        // Find the examiner by username and update the paperno
        const username = un; // Replace with the actual username you're searching for
        const updatedExaminer = await examiner.findOneAndUpdate(
            { username },
            { $inc: { paperno: 1 } }, // Increment the paperno field by 1
            { new: true } // Return the updated document
        );

        if (updatedExaminer) {
            console.log('Examiner updated:', updatedExaminer);
            res.send('Marks added successfully');
        } else {
            res.status(404).send('Examiner not found');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error adding marks');
    }
});


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  