const defaults = {
  study: 2,
  skill: 1,
  exercise: 0.5,
  sleep: 7,
  screen: 3,
  days: 90
};

const ids = ["study", "skill", "exercise", "sleep", "screen"];

let state = { ...defaults };
let completedTasks = [];
let toastTimer;

const $ = id => document.getElementById(id);

function formatHours(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2400);
}

function saveState() {
  try {
    localStorage.setItem("futureMeState", JSON.stringify(state));
    localStorage.setItem("futureMeTasks", JSON.stringify(completedTasks));
  } catch (error) {
    console.warn("Could not save settings in this browser.", error);
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("futureMeState") || "null");
    if (saved) {
      ids.forEach(id => {
        const value = Number(saved[id]);
        const input = $(id);
        if (
          Number.isFinite(value) &&
          value >= Number(input.min) &&
          value <= Number(input.max)
        ) {
          state[id] = value;
        }
      });

      if ([30, 90, 365].includes(Number(saved.days))) {
        state.days = Number(saved.days);
      }
    }

    const savedTasks = JSON.parse(localStorage.getItem("futureMeTasks") || "[]");
    if (Array.isArray(savedTasks)) {
      completedTasks = savedTasks.filter(Number.isInteger);
    }
  } catch (error) {
    console.warn("Saved settings could not be loaded.", error);
  }
}

function getBalance(data) {
  // A simple illustrative score, not a validated health assessment.
  const studyScore = Math.min(data.study / 3, 1) * 25;
  const skillScore = Math.min(data.skill / 1.5, 1) * 20;
  const exerciseScore = Math.min(data.exercise / 0.5, 1) * 15;
  const sleepScore = Math.max(0, 1 - Math.abs(data.sleep - 8) / 5) * 25;
  const screenScore = Math.max(0, 1 - data.screen / 8) * 15;

  return Math.round(
    studyScore + skillScore + exerciseScore + sleepScore + screenScore
  );
}

function makeImprovedRoutine() {
  return {
    study: Math.min(state.study + 1, 12),
    skill: Math.min(state.skill + 1, 8),
    exercise: Math.min(state.exercise + 0.5, 4),
    sleep: Math.min(Math.max(state.sleep, 8), 12),
    screen: Math.max(state.screen - 1, 0)
  };
}

function setBar(id, percent) {
  $(id).style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function updateSlider(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const percent = ((value - min) / (max - min)) * 100;

  input.style.background =
    `linear-gradient(90deg, #a68bff ${percent}%, #30354a ${percent}%)`;

  $(input.id + "Value").textContent = formatHours(value) + " h";
}

function buildActionPlan() {
  const tasks = [];

  if (state.study < 3) {
    tasks.push("Add 30 minutes of focused study to your next day.");
  } else {
    tasks.push("Protect one distraction-free study session.");
  }

  if (state.skill < 1.5) {
    tasks.push("Practice one useful skill for 20–30 minutes.");
  } else {
    tasks.push("Complete one small project or practical exercise.");
  }

  if (state.sleep < 7) {
    tasks.push("Try to make your sleep schedule more consistent.");
  } else if (state.sleep > 9) {
    tasks.push("Review your sleep routine and how rested you feel.");
  } else {
    tasks.push("Keep a consistent sleep and wake-up schedule.");
  }

  if (state.screen > 2) {
    tasks.push("Reduce unplanned scrolling by 15 minutes.");
  } else {
    tasks.push("Keep your phone away during focused work.");
  }

  return tasks.slice(0, 3);
}

function renderActionPlan() {
  const tasks = buildActionPlan();

  // Keep only the checked positions that still exist.
  completedTasks = completedTasks.filter(
    index => index >= 0 && index < tasks.length
  );

  $("actionList").innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    const label = document.createElement("span");

    checkbox.type = "checkbox";
    checkbox.checked = completedTasks.includes(index);
    checkbox.setAttribute("aria-label", task);

    label.textContent = task;
    if (checkbox.checked) label.classList.add("done");

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (!completedTasks.includes(index)) completedTasks.push(index);
      } else {
        completedTasks = completedTasks.filter(n => n !== index);
      }

      renderActionPlan();
      saveState();
    });

    li.append(checkbox, label);
    $("actionList").appendChild(li);
  });

  $("planProgress").textContent =
    `${completedTasks.length} of ${tasks.length} completed`;

  $("planTitle").textContent =
    completedTasks.length === tasks.length
      ? "Great work — your plan is complete!"
      : "Start with one small win";

  $("planIntro").textContent =
    completedTasks.length === tasks.length
      ? "Keep the momentum going by choosing your next small goal."
      : "Choose realistic actions you can repeat consistently.";
}

function updateInsight() {
  if (state.study < 1) {
    $("insightTitle").textContent = "Make room for learning.";
    $("insightText").textContent =
      "Try beginning with a short, focused study session instead of aiming for a huge change.";
  } else if (state.screen >= 5) {
    $("insightTitle").textContent = "Reclaim a little time.";
    $("insightText").textContent =
      "Reducing unplanned scrolling by just 15 minutes a day adds up to " +
      formatHours(0.25 * state.days) + " hours over this simulation.";
  } else if (state.skill < 1) {
    $("insightTitle").textContent = "Build a skill, one step at a time.";
    $("insightText").textContent =
      "Consistent practice on a small project can help you develop skills over time.";
  } else {
    $("insightTitle").textContent = "Your time is your superpower.";
    $("insightText").textContent =
      "Your current routine adds up to " +
      formatHours((state.study + state.skill) * state.days) +
      " hours of study and skill practice over " + state.days + " days.";
  }
}

function updateDashboard() {
  const days = state.days;
  const studyHours = state.study * days;
  const skillHours = state.skill * days;
  const exerciseHours = state.exercise * days;
  const balance = getBalance(state);
  const improved = makeImprovedRoutine();

  $("totalTime").textContent =
    formatHours(ids.reduce((sum, id) => sum + state[id], 0)) + " h";

  $("horizonLabel").textContent = days + (days === 1 ? " day" : " days");

  $("studyTotal").textContent = formatHours(studyHours);
  $("skillTotal").textContent = formatHours(skillHours);
  $("exerciseTotal").textContent = formatHours(exerciseHours);

  $("balanceScore").textContent = balance;
  $("balanceCaption").textContent =
    balance >= 80 ? "Your routine looks well balanced" :
    balance >= 60 ? "A promising starting point" :
    "Room for small, sustainable improvements";

  $("studyCaption").textContent =
    `Focused learning over ${days} days`;

  // Relative visual scales: these bars are not scientific ratings.
  setBar("studyBar", studyHours / (days * 3) * 100);
  setBar("skillBar", skillHours / (days * 1.5) * 100);
  setBar("exerciseBar", exerciseHours / (days * 0.5) * 100);
  setBar("balanceBar", balance);

  const currentHours = (state.study + state.skill) * days;
  const improvedHours = (improved.study + improved.skill) * days;
  const maxHours = Math.max(currentHours, improvedHours, 1);

  $("currentHours").textContent = formatHours(currentHours) + " hrs";
  $("improvedHours").textContent = formatHours(improvedHours) + " hrs";

  setBar("currentPathBar", currentHours / maxHours * 100);
  setBar("improvedPathBar", improvedHours / maxHours * 100);

  const extraHours = improvedHours - currentHours;
  $("improvementText").textContent = extraHours > 0
    ? `This example routine creates ${formatHours(extraHours)} extra hours for study and skill practice over ${days} days.`
    : "Your current study and skill hours are already at the model's suggested ceiling. Focus on consistency and balance.";

  updateInsight();
  renderActionPlan();
}

function updateAll() {
  ids.forEach(id => {
    $(id).value = state[id];
    updateSlider($(id));
  });
  updateDashboard();
  saveState();
}

// Habit controls
ids.forEach(id => {
  $(id).addEventListener("input", event => {
    state[id] = Number(event.target.value);
    updateSlider(event.target);
    updateDashboard();
    saveState();
  });
});

// Choose simulation length
document.querySelectorAll(".horizon").forEach(button => {
  button.addEventListener("click", () => {
    state.days = Number(button.dataset.days);

    document.querySelectorAll(".horizon").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    updateDashboard();
    saveState();
  });
});

// Run simulation and scroll to the results
$("simulateBtn").addEventListener("click", () => {
  updateDashboard();
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Your simulation has been updated.");
});

// Fill in the suggested improved routine
$("improveBtn").addEventListener("click", () => {
  const improved = makeImprovedRoutine();

  ids.forEach(id => {
    state[id] = improved[id];
  });

  updateAll();
  showToast("Improved routine applied. Adjust it to suit your life.");
});

// Save current settings and checklist
$("savePlanBtn").addEventListener("click", () => {
  saveState();
  showToast("Your settings and checklist are saved on this browser.");
});

// Reset everything
$("resetBtn").addEventListener("click", () => {
  state = { ...defaults };
  completedTasks = [];

  document.querySelectorAll(".horizon").forEach(button => {
    button.classList.toggle(Number(button.dataset.days) === state.days ? "active" : "inactive", true);
    button.classList.toggle("active", Number(button.dataset.days) === state.days);
    button.classList.remove("inactive");
  });

  updateAll();
  showToast("Simulation reset to the starting routine.");
});

// Initialize app
loadState();

document.querySelectorAll(".horizon").forEach(button => {
  button.classList.toggle(
    "active",
    Number(button.dataset.days) === state.days
  );
});

updateAll();