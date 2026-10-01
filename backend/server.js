const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./src/models/User");

const Habit = require("./src/models/Habit");

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

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Brak tokenu",
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Użytkownik nie istnieje",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Nieprawidłowy lub wygasły token",
    });
  }
};

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

// Adding habits

app.post("/api/habits", authenticateToken, async (req, res) => {
  const { name, frequency, icon, color, weekdaysOnly } = req.body;
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedName || !frequency) {
    return res.status(400).json({
      message: "Nazwa i częstotliwość są wymagane",
    });
  }

  if (weekdaysOnly === true && Number(frequency) > 5) {
    return res.status(400).json({
      message: "Przy nawyku bez weekendów wybierz od 1 do 5 razy w tygodniu",
    });
  }

  try {
    const existingHabits = await Habit.find({ user: req.user._id }).select("name");
    const duplicateName = existingHabits.some(
      (habit) => habit.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicateName) {
      return res.status(409).json({
        message: "Nawyk o takiej nazwie już istnieje",
      });
    }

    const habit = await Habit.create({
      user: req.user._id,
      name: normalizedName,
      frequency,
      weekdaysOnly: weekdaysOnly === true,
      icon: icon || "",
      color: color || "#4f46e5",
      completedDates: [],
      skippedDays: [],
    });

    return res.status(201).json({
      message: "Nawyk został utworzony",
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas tworzenia nawyku",
      error: error.message,
    });
  }
});

const isEligibleHabitDate = (habit, date) =>
  !(habit.weekdaysOnly && [0, 6].includes(new Date(`${date}T00:00:00.000Z`).getUTCDay()));

const getAvailableSkips = (habit, date) => {
  const requestedDate = new Date(`${date}T00:00:00.000Z`);
  const weekStart = new Date(requestedDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekStartString = weekStart.toISOString().slice(0, 10);
  const weekEndString = weekEnd.toISOString().slice(0, 10);
  const createdDate = habit.createdAt.toISOString().slice(0, 10);
  const firstEligibleDate = createdDate > weekStartString ? createdDate : weekStartString;
  const completedDates = new Set(
    habit.completedDates.map((completedDate) => String(completedDate).slice(0, 10)),
  );
  const skippedDates = new Set(
    (habit.skippedDays || []).map((skippedDate) => String(skippedDate).slice(0, 10)),
  );
  let eligibleDaysThisWeek = 0;
  let completedDaysThisWeek = 0;
  let eligibleDaysRemaining = 0;

  for (
    let currentDate = new Date(`${firstEligibleDate}T00:00:00.000Z`);
    currentDate <= weekEnd;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  ) {
    const currentDateString = currentDate.toISOString().slice(0, 10);
    if (!isEligibleHabitDate(habit, currentDateString)) continue;

    eligibleDaysThisWeek++;
    if (completedDates.has(currentDateString)) completedDaysThisWeek++;
    if (currentDateString >= date && !skippedDates.has(currentDateString)) {
      eligibleDaysRemaining++;
    }
  }

  const weeklyTarget = Math.min(Number(habit.frequency), eligibleDaysThisWeek);
  const requiredCompletions = Math.max(0, weeklyTarget - completedDaysThisWeek);
  return Math.max(0, eligibleDaysRemaining - requiredCompletions);
};

const recordMissedDays = async (habits) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayUtc = new Date(`${today}T00:00:00.000Z`);

  await Promise.all(
    habits.map(async (habit) => {
      const createdDate = habit.createdAt.toISOString().slice(0, 10);
      const completedDates = new Set(
        habit.completedDates.map((date) => String(date).slice(0, 10)),
      );
      const skippedDates = new Set(
        (habit.skippedDays || []).map((date) => String(date).slice(0, 10)),
      );
      const missedDates = new Set(
        (habit.missedDays || [])
          .map((date) => String(date).slice(0, 10))
          .filter(
            (date) =>
              date >= createdDate &&
              date < today &&
              !completedDates.has(date) &&
              !skippedDates.has(date) &&
              isEligibleHabitDate(habit, date),
          ),
      );

      for (
        let date = new Date(`${createdDate}T00:00:00.000Z`);
        date < todayUtc;
        date.setUTCDate(date.getUTCDate() + 1)
      ) {
        const dateString = date.toISOString().slice(0, 10);
        const isWeekend = [0, 6].includes(date.getUTCDay());
        if (
          !completedDates.has(dateString) &&
          !skippedDates.has(dateString) &&
          !(habit.weekdaysOnly && isWeekend)
        ) {
          missedDates.add(dateString);
        }
      }

      const updatedMissedDays = [...missedDates].sort();
      if (
        updatedMissedDays.length !== habit.missedDays.length ||
        updatedMissedDays.some((date, index) => date !== habit.missedDays[index])
      ) {
        habit.missedDays = updatedMissedDays;
        await habit.save();
      }
    }),
  );
};

app.get("/api/habits", authenticateToken, async (req, res) => {
  try {
    const habits = await Habit.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    await recordMissedDays(habits);

    return res.json({
      habits,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania nawyków",
      error: error.message,
    });
  }
});

app.get("/api/habits/:id", authenticateToken, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Nawyk nie został znaleziony",
      });
    }

    await recordMissedDays([habit]);

    return res.json({
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pobierania nawyku",
      error: error.message,
    });
  }
});

//edit
app.put("/api/habits/:id", authenticateToken, async (req, res) => {
  const { name, frequency, icon, color } = req.body;

  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Nawyk nie został znaleziony",
      });
    }

    if (name !== undefined) {
      habit.name = name;
    }

    if (frequency !== undefined) {
      habit.frequency = frequency;
    }

    if (icon !== undefined) {
      habit.icon = icon;
    }

    if (color !== undefined) {
      habit.color = color;
    }

    await habit.save();

    return res.json({
      message: "Nawyk został zaktualizowany",
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas aktualizacji nawyku",
      error: error.message,
    });
  }
});

//delate
app.delete("/api/habits/:id", authenticateToken, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Nawyk nie został znaleziony",
      });
    }

    return res.json({
      message: "Nawyk został usunięty",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas usuwania nawyku",
      error: error.message,
    });
  }
});

//copletedDates
app.post("/api/habits/:id/complete", authenticateToken, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Nawyk nie został znaleziony",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyCompleted = habit.completedDates.some((date) => {
      const completedDate = new Date(date);
      completedDate.setHours(0, 0, 0, 0);

      return completedDate.getTime() === today.getTime();
    });

    if (alreadyCompleted) {
      return res.status(400).json({
        message: "Ten nawyk jest już wykonany dzisiaj",
      });
    }

    habit.completedDates.push(today);

    await habit.save();

    return res.json({
      message: "Nawyk oznaczony jako wykonany",
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas oznaczania nawyku",
      error: error.message,
    });
  }
});

app.patch("/api/habits/:id/complete", authenticateToken, async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({
      message: "Data jest wymagana",
    });
  }

  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Nie znaleziono nawyku",
      });
    }

    if ((habit.skippedDays || []).includes(date)) {
      return res.status(400).json({ message: "Ten nawyk jest już pominięty tego dnia" });
    }

    if (!habit.completedDates.includes(date)) {
      habit.completedDates.push(date);
      await habit.save();
    }

    return res.json({
      message: "Nawyk oznaczony jako wykonany",
      habit,
    });
  } catch (error) {
    res.status(500).json({
      message: "Błąd podczas oznaczania nawyku",
      error: error.message,
    });
  }
});

app.patch("/api/habits/:id/skip", authenticateToken, async (req, res) => {
  const { date } = req.body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Prawidłowa data jest wymagana" });
  }

  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Nie znaleziono nawyku" });
    }

    if (habit.completedDates.includes(date)) {
      return res.status(400).json({ message: "Ten nawyk jest już wykonany tego dnia" });
    }

    if (!(habit.skippedDays || []).includes(date)) {
      habit.skippedDays.push(date);
      await habit.save();
    }

    return res.json({
      message: "Nawyk oznaczony jako pominięty",
      habit,
      availableSkips: getAvailableSkips(habit, date),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas pomijania nawyku",
      error: error.message,
    });
  }
});

app.patch("/api/habits/:id/day-status", authenticateToken, async (req, res) => {
  const { date, status } = req.body;
  const validStatuses = ["completed", "skipped", "pending"];
  const parsedDate =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00.000Z`)
      : null;

  if (
    !parsedDate ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    !validStatuses.includes(status)
  ) {
    return res.status(400).json({ message: "Nieprawidłowa data lub status" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date(`${today}T00:00:00.000Z`);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  const weekStartString = weekStart.toISOString().slice(0, 10);

  if (date < weekStartString || date > today) {
    return res.status(400).json({ message: "Można edytować tylko dni bieżącego tygodnia do dzisiaj" });
  }

  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({ message: "Nie znaleziono nawyku" });
    }

    const createdDate = habit.createdAt.toISOString().slice(0, 10);
    if (date < createdDate || !isEligibleHabitDate(habit, date)) {
      return res.status(400).json({ message: "Ten dzień nie należy do harmonogramu nawyku" });
    }

    habit.completedDates = habit.completedDates.filter((entry) => entry !== date);
    habit.skippedDays = (habit.skippedDays || []).filter((entry) => entry !== date);
    habit.missedDays = (habit.missedDays || []).filter((entry) => entry !== date);

    if (status === "completed") habit.completedDates.push(date);
    if (status === "skipped") habit.skippedDays.push(date);

    await habit.save();
    await recordMissedDays([habit]);

    return res.json({
      message: "Status dnia został zaktualizowany",
      habit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Błąd podczas aktualizacji statusu dnia",
      error: error.message,
    });
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
