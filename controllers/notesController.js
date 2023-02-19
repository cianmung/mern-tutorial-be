const Note = require("../models/Note");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean();
  if (!notes?.length) {
    return res.status(400).json({ message: "No notes found." });
  }

  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );
  res.json(notesWithUser);
});

const createNewNote = asyncHandler(async (req, res) => {
  const { title, text, user } = req.body;

  if (!title || !text || !user) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const noteAddedUser = await User.findOne({ _id: user }).lean().exec();

  if (!noteAddedUser) {
    return res.status(409).json({ message: "Author not found" });
  }

  const duplicate = await Note.findOne({ title }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  const noteObject = { title, text, user };

  const note = await Note.create(noteObject);

  if (note) {
    res.status(201).json({ message: "New note has been added." });
  } else {
    res.status(400).json({ message: "Invalid details." });
  }
});

const updateNote = asyncHandler(async (req, res) => {
  const { id, title, text, user, completed } = req.body;
  if (!id || !title || !text || !user || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required." });
  }

  const note = await Note.findById(id).exec();
  if (!note) {
    res.status(400).json({ message: "Note not found." });
  }

  const duplicate = await Note.findOne({ title }).lean().exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  note.title = title;
  note.text = text;
  note.user = user;
  note.completed = completed;

  const updatedNote = await note.save();
  res.json({
    message: `Note title ${updatedNote.title} has been updated.`,
  });
});

const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "Note ID is required." });
  }

  const note = await User.findById(id).exec();
  if (!note) {
    return res.status(400).json({ message: "Note not found." });
  }

  const result = await note.deleteOne();
  const reply = `Note ${result.title} has been deleted`;
  res.json(reply);
});

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote,
};
