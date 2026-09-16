const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./src/models/User");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API działa. Możesz teraz rejestrować użytkowników i logować się.",
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Wypełnij wszystkie pola" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Hasło musi mieć co najmniej 6 znaków" });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Użytkownik z tym adresem e-mail już istnieje" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Użytkownik zarejestrowany",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas rejestracji",
      error: error.message,
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Podaj email i hasło" });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Nieprawidłowy email lub hasło" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Nieprawidłowy email lub hasło" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Zalogowano pomyślnie",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas logowania",
      error: error.message,
    });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Brak tokenu" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Użytkownik nie znaleziony" });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(401).json({ message: "Nieprawidłowy token" });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Połączono z MongoDB");

    app.listen(PORT, () => {
      console.log(`Serwer działa na porcie ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Błąd połączenia z MongoDB:", error.message);
    process.exit(1);
  });
