let timerElement = document.getElementById("timer");
let timesList = document.getElementById("times");
let scrambleElement = document.getElementById("scramble");
let startStopButton = document.getElementById("start-stop-btn");
let sessionList = document.getElementById("sessions-list");
let sessionNameInput = document.getElementById("session-name-input");
let sessionAddButton = document.getElementById("session-add-btn");

let startTime = null;
let elapsedTime = 0;
let running = false;
let timerInterval = null;
let holdStartTime = null;
let isReady = false;
let currentSession = "Default"; // Default session when no other session is selected
let times = JSON.parse(localStorage.getItem(currentSession)) || []; // Load times from current session

// Generates a random scramble
function generateScramble() {
  const moves = ["R", "L", "U", "D", "F", "B"];
  const suffixes = ["", "'", "2"];
  let scramble = [];
  let lastMove = "";

  for (let i = 0; i < 20; i++) {
    let move;
    do {
      move = moves[Math.floor(Math.random() * moves.length)];
    } while (move === lastMove);
    lastMove = move;
    scramble.push(move + suffixes[Math.floor(Math.random() * suffixes.length)]);
  }

  return scramble.join(" ");
}

function displayScramble() {
  scrambleElement.textContent = generateScramble();
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    elapsedTime = Date.now() - startTime;
    timerElement.textContent = (elapsedTime / 1000).toFixed(2);
  }, 10);
}

function stopTimer() {
  clearInterval(timerInterval);
  elapsedTime = Date.now() - startTime;
  const time = (elapsedTime / 1000).toFixed(2);
  saveTime(time);
}

function saveTime(time) {
  const scramble = scrambleElement.textContent;
  const solve = { time, scramble, status: "" };
  times.push(solve);
  localStorage.setItem(currentSession, JSON.stringify(times)); // Save to current session
  renderTimes();
}

function renderTimes() {
  timesList.innerHTML = "";
  times.forEach((solve, index) => {
    const li = document.createElement("li");
    li.textContent = `${solve.time} ${solve.status}`;
    li.addEventListener("click", () => editTime(index));
    timesList.appendChild(li);
  });
}

function editTime(index) {
  const solve = times[index];
  const action = prompt(
    `Time: ${solve.time}\nScramble: ${solve.scramble}\nStatus: ${solve.status || "None"}\n\nEnter:\n+2 to add 2 seconds\nDNF to mark as Did Not Finish\ndelete to remove`
  );

  if (action === "+2") {
    solve.time = (parseFloat(solve.time) + 2).toFixed(2);
    solve.status = "+2";
  } else if (action === "DNF") {
    solve.status = "DNF";
  } else if (action === "delete") {
    times.splice(index, 1);
  }

  localStorage.setItem(currentSession, JSON.stringify(times));
  renderTimes();
}

function renderSessions() {
  sessionList.innerHTML = "";
  const sessions = Object.keys(localStorage);
  sessions.forEach((session) => {
    if (session !== "times") {
      const li = document.createElement("li");
      li.textContent = session;

      // Add delete button for each session
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent the session click event from triggering
        deleteSession(session);
      });

      li.appendChild(deleteButton);
      li.addEventListener("click", () => loadSession(session));
      sessionList.appendChild(li);
    }
  });
}

function loadSession(session) {
  currentSession = session;
  times = JSON.parse(localStorage.getItem(currentSession)) || [];
  renderTimes();
}

function addSession() {
  const sessionName = sessionNameInput.value.trim();
  if (sessionName && !localStorage.getItem(sessionName)) {
    localStorage.setItem(sessionName, JSON.stringify([]));
    renderSessions();
    sessionNameInput.value = ""; // Clear input after adding session
  }
}

function deleteSession(session) {
  if (confirm(`Are you sure you want to delete the session "${session}"?`)) {
    localStorage.removeItem(session);
    renderSessions();
    if (session === currentSession) {
      // Load the default session if the current session is deleted
      currentSession = "Default";
      times = JSON.parse(localStorage.getItem(currentSession)) || [];
      renderTimes();
    }
  }
}

// Mobile specific logic (Start/Stop via touch)
let touchStartTime = null;
let touchHeld = false;

startStopButton.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent default mobile touch behavior

  if (!running && !touchHeld) {
    touchStartTime = Date.now();
    touchHeld = true; // Prevent multiple touchstart events in the same hold
    timerElement.style.color = "#00ff00"; // Green color when ready
  }
});

startStopButton.addEventListener("touchend", (e) => {
  e.preventDefault(); // Prevent default mobile touch behavior

  if (touchHeld) {
    const holdDuration = Date.now() - touchStartTime;

    if (holdDuration >= 150) {
      // If button was held for 0.15 seconds, start or stop the timer
      if (!running) {
        running = true;
        startTimer();
        startStopButton.textContent = "Stop"; // Change button text to "Stop"
        timerElement.style.color = "#ffffff"; // Reset color
      } else {
        // If the timer is running, stop it
        running = false;
        stopTimer();
        startStopButton.textContent = "Start"; // Change button text to "Start"
        displayScramble();
      }
    }
    touchHeld = false; // Reset the hold flag
  }
});

// Event listeners for Spacebar on PC for start/stop
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();

    if (!running && !holdStartTime) {
      // Start the timer if it's not running
      holdStartTime = Date.now();
      isReady = true;
      timerElement.style.color = "#00ff00"; // Green color when ready
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    e.preventDefault();

    if (isReady && !running) {
      // Start the timer when the spacebar is released after holding for 0.15 seconds
      const holdDuration = Date.now() - holdStartTime;
      if (holdDuration >= 150) {
        running = true;
        startTimer();
        timerElement.style.color = "#ffffff"; // Reset color when starting
      }
      holdStartTime = null;
    } else if (running) {
      // Stop the timer when spacebar is released
      running = false;
      stopTimer();
      displayScramble();
    }
  }
});

// Initialize
displayScramble();
renderSessions();
renderTimes();
