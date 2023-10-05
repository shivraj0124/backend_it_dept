const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const facultyModel = require("../Models/FacultyModel");
const semesterModel = require("../Models/Semester");
const subjectModel = require("../Models/Subject");
const shiftModel = require("../Models/Shift");
const timeTableModel = require("../Models/TimeTable");
const notesModel = require("../Models/Notes");
const qPModel = require("../Models/QuestionPaper");
const noticeModel = require("../Models/Notice");
const api_secret_key = process.env.Cld_Api_key;
cloudinary.config({
  cloud_name: "dc28atbon",
  api_key: "382378611656777",
  api_secret: api_secret_key,
  secure: true,
});

// Add new faculty
router.post("/add-faculty", async (req, res, next) => {
  try {
    const { name, email, password, qualification, post, experience } = req.body;

    console.log(name);
    const facultyExist = await facultyModel.findOne({ email: email });
    if (facultyExist) {
      return res.status(200).json({
        data: { success: false, message: "User Already Exist" },
      });
    }
    const file = req.files.photo;
    console.log(file);
    cloudinary.uploader.upload(file.tempFilePath, async (err, result) => {
      console.log(result.url);
      const hashedPass = await bcrypt.hash(password, 10);
      const newFaculty = new facultyModel({
        name,
        email,
        password: hashedPass,
        qualification,
        post,
        experience,
        photo: result.url,
      });
      console.log(newFaculty);
      await newFaculty.save();
    });
    return res.status(200).send({
      success: true,
      message: "done",
    });
  } catch (err) {
    return res.status(400).send({
      success: false,
      message: "Invalid email",
    });
  }
});

// Get Faculty Details
router.get("/manage-faculty", async (req, res) => {
  try {
    const faculties = await facultyModel.find();
    res.send({ success: true, faculties });
  } catch (error) {
    console.error("Error fetching faculty details:", error);
    res
      .status(500)
      .send({ success: false, error: "Failed to fetch faculty details" });
  }
});

// update faculties
router.put("/update-faculty/:id", async (req, res) => {
  try {
    const facultyId = req.params.id;
    const faculty = await facultyModel.findById(facultyId);

    const { name, email, qualification, post, experience } = req.body;
    const facultyExist = await facultyModel.findOne({ email: email });
    // console.log(facultyExist._id ,facultyId);
    if (facultyExist && faculty.email !== email) {
      return res.status(200).send({
        data: { success: false, message: "Email Already Exist" },
      });
    } else {
      // Check if the faculty with the given ID exists
      const faculty = await facultyModel.findById(facultyId);
      if (!faculty) {
        return res
          .status(404)
          .send({ success: false, message: "Faculty not found" });
      }

      // Update faculty details based on the request data
      faculty.name = name;
      faculty.email = email;
      faculty.qualification = qualification;
      faculty.post = post;
      faculty.experience = experience;

      // Handle the optional photo upload and save the URL to the faculty document
      if (req.files && req.files.photo) {
        const photoFile = req.files.photo;
        const result = await uploadPhotoToCloudinary(photoFile);

        if (result && result.secure_url) {
          faculty.photo = result.secure_url;
        }
      }

      // Save the updated faculty data
      await faculty.save();

      res.status(200).send({ success: true, updatedFaculty: faculty });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// uploading photo to cloudinary
async function uploadPhotoToCloudinary(photoFile) {
  try {
    const result = await cloudinary.uploader.upload(photoFile.tempFilePath);
    return result;
  } catch (error) {
    console.error("Error uploading photo to Cloudinary:", error);
    return null;
  }
}

//delete faculty record
router.delete("/delete-faculty/:id", async (req, res) => {
  const facultyId = req.params.id;

  try {
    // Find the faculty record by ID and remove it
    const deletedFaculty = await facultyModel.findByIdAndRemove(facultyId);

    if (!deletedFaculty) {
      return res
        .status(404)
        .send({ success: false, message: "Faculty not found" });
    }

    res.send({ success: true, message: "Faculty deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Create Semester
router.post("/create-sem", async (req, res) => {
  try {
    const { name } = req.body;

    const sem = new semesterModel({ name: name });
    await sem.save();

    return res.status(200).send({
      success: true,
      message: "Semester created successfully",
      sem,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "An error ",
    });
  }
});
// Create Subjects
router.post("/create-subject", async (req, res) => {
  const { name, courseCode, semester } = req.body;
  const subject = new subjectModel({
    name: name,
    courseCode: courseCode,
    semester: semester,
  });
  await subject.save();
  return res.json({ subject });
});
// Create Shift
router.post("/create-shift", async (req, res) => {
  const { name, sem } = req.body;
  const shift = new shiftModel({ name: name, semester: sem });
  await shift.save();
  return res.json({ shift });
});

// Get Semester
router.get("/get-semesters", async (req, res) => {
  try {
    const semesters = await semesterModel.find();
    res.send({ success: true, semesters });
  } catch (error) {
    console.error("Error fetching faculty details:", error);
    res
      .status(500)
      .send({ success: false, error: "Failed to fetch faculty details" });
  }
});
// Get all Shifts by Semester
router.get("/shifts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const shifts = await shiftModel
      .find({ semester: id })
      .populate("name", "semester");

    return res.status(200).send({ success: true, shifts }); // Changed 'shift' to 'shifts'
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: error,
      message: "An error occurred while retrieving shifts",
    });
  }
});
// Get ALl subjects by semester
router.get("/subjects/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const subjects = await subjectModel
      .find({ semester: id })
      .populate("name", "semester");

    return res.status(200).send({ success: true, subjects }); // Changed 'shift' to 'shifts'
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: error,
      message: "An error occurred while retrieving shifts",
    });
  }
});

// Add new Time Table
router.post("/addTT", async (req, res) => {
  const { name, shift } = req.body;
  try {
    const file = req.files.photo;
    cloudinary.uploader.upload(file.tempFilePath, async (err, result) => {
      // console.log(result.url);
      const newTimeTable = new timeTableModel({
        name,
        photo: result.url,
        shift,
      });

      await newTimeTable.save();
    });
    return res.status(200).send({
      success: true,
      message: "done",
    });
  } catch (err) {
    res.send({
      success: false,
      message: err,
    });
  }
});
// Add new notes
router.post("/add-notes", async (req, res) => {
  const { name, link, subject, semester } = req.body;
  try {
    const newNotes = new notesModel({
      name,
      link,
      subject,
      semester,
    });
    const noteExist = await notesModel.findOne({ name: name });
    // console.log(facultyExist._id ,facultyId);
    if (noteExist && note.name !== name) {
      return res.status(200).send({
        data: { success: false, message: "Note Already Exist" },
      });
    } else {
      await newNotes.save();

      return res.status(200).send({
        success: true,
        message: "Notes Added Successfully",
      });
    }
  } catch (err) {
    res.send({
      success: false,
      message: err,
    });
  }
});
// Add new Question paper
router.post("/add-qp", async (req, res) => {
  const { name, link, subject } = req.body;
  try {
    const newQP = new qPModel({
      name,
      link,
      subject,
    });
    await newQP.save();

    return res.status(200).send({
      success: true,
      message: "Question paper Added Successfully",
    });
  } catch (err) {
    res.send({
      success: false,
      message: err,
    });
  }
});
// Add new Notice
router.post("/add-notice", async (req, res) => {
  const { title, link, description } = req.body;
  try {
    const newNotice = new noticeModel({
      title,
      link,
      description,
    });
    await newNotice.save();

    return res.status(200).send({
      success: true,
      message: "Notice Added Successfully",
    });
  } catch (err) {
    res.send({
      success: false,
      message: err,
    });
  }
});
//Get All time tables
router.get("/get-timetables", async (req, res) => {
  try {
    const timeTable = await timeTableModel.find();
    res.send({ success: true, timeTable });
  } catch (error) {
    console.error("Error fetching faculty details:", error);
    res
      .status(500)
      .send({ success: false, error: "Failed to fetch faculty details" });
  }
});
//Get shift by id
router.get("/get-shift/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const shift = await shiftModel.find({ _id: id });

    return res.status(200).send({ success: true, shift }); // Changed 'shift' to 'shifts'
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: error,
      message: "An error occurred while retrieving shifts",
    });
  }
});
//Get semester by id
router.get("/get-semester/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const semester = await semesterModel.find({ _id: id });

    return res.status(200).send({ success: true, semester }); // Changed 'shift' to 'shifts'
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: error,
      message: "An error occurred while retrieving shifts",
    });
  }
});
// --> Manage All notes <-- //
// Get ALl notes
router.get("/get-notes", async (req, res) => {
  try {
    const notes = await notesModel
      .find()
      .populate("subject")
      .populate("semester");
    res.send({ success: true, notes });
  } catch (error) {
    console.error("Error fetching faculty details:", error);
    res
      .status(500)
      .send({ success: false, error: "Failed to fetch faculty details" });
  }
});
//  Updates Notes
router.put("/update-note/:id", async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await notesModel.findById(noteId);

    const { name, link, semester, subject } = req.body;
    const noteExist = await notesModel.findOne({ name: name });
    
    if (noteExist && note.name !== name) {
      return res.status(200).send({
        data: { success: false, message: "Note Already Exist" },
      });
    } else {
      
      const note = await notesModel.findById(noteId);
      if (!note) {
        return res
          .status(404)
          .send({ success: false, message: "Note not found" });
      }
      note.name = name;
      note.link = link;
      note.semester = semester;
      note.subject = subject;
      await note.save();
      res.status(200).send({ success: true, updatedNote: note });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});
// Delete Note
router.delete("/delete-note/:id", async (req, res) => {
  const noteId = req.params.id;

  try {
    // Find the faculty record by ID and remove it
    const isNote = await notesModel.findByIdAndRemove(noteId);

    if (!isNote) {
      return res
        .status(404)
        .send({ success: false, message: "Note not found" });
    }

    res.send({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Get subject by id
router.get("/get-subject/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const subject = await subjectModel.find({ _id: id });

    return res.status(200).send({ success: true, subject }); // Changed 'shift' to 'shifts'
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: error,
      message: "An error occurred while retrieving shifts",
    });
  }
});

module.exports = router;
