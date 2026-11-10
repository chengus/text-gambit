const sample = {
  goal: "I'm Me. I want to ask my crush Alice out on a date.",
  goalSpeaker: "Me",
  moves: [
    {
      speaker: "Me", text: "Hey Alice! How’s your week going?", grade: "Theory", progress: 12,
      rationale: "A classic opening gets the conversation on the board.",
    },
    {
      speaker: "Alice", text: "Pretty good! Just finished a long day. Yours?", grade: "Signal", progress: 21,
      rationale: "Alice returns the serve and keeps the rally going.",
    },
    {
      speaker: "Me", text: "Same, work was brutal. Random question… you free this weekend?", grade: "Good", progress: 34,
      rationale: "The weekend question opens a lane for the invitation.",
    },
    {
      speaker: "Alice", text: "Depends… what’s up?", grade: "Ambiguous", progress: 41,
      rationale: "The door is ajar, but Alice wants the actual plan.",
    },
    {
      speaker: "Me", text: "I was thinking maybe we could grab dinner or something. Just us.", grade: "Good", progress: 63,
      rationale: "Dinner for two puts the date idea squarely on the table.",
    },
    {
      speaker: "Alice", text: "Oh? 👀", grade: "Ambiguous", progress: 68,
      rationale: "The eyes emoji raises an eyebrow and leaves the answer open.",
    },
    {
      speaker: "Me", text: "Actually never mind. That was stupid. I just realized you probably only talk to me out of pity. I’ve liked you for like two years and never said anything because I’m a coward and now I just ruined whatever this was. Forget the dinner. Forget I exist. I’m going to go stand in traffic.", grade: "Blunder", progress: 17,
      rationale: "Withdrawing the invitation and mentioning traffic shifts the conversation to safety.",
    },
    {
      speaker: "Alice", text: "…what the fuck", grade: "No change", progress: 17,
      rationale: "Alice reacts with alarm, and the dinner question is still open.",
    },
    {
      speaker: "Me", text: "Yeah I know. I’m deleting your number right now.", grade: "Mistake", progress: 11,
      rationale: "Deleting the number makes it harder for Alice to answer.",
    },
    {
      speaker: "Alice", text: "Stop.", grade: "No change", progress: 11,
      rationale: "Alice asks you to stop, so give her room to speak.",
    },
    {
      speaker: "Me", text: "Already halfway done.", grade: "Mistake", progress: 7,
      rationale: "You keep pushing after a clear request to stop.",
    },
    {
      speaker: "Alice", text: "I said stop.", grade: "No change", progress: 7,
      rationale: "Alice repeats the boundary before the date can come back up.",
    },
    {
      speaker: "Me", text: "Why?", grade: "Neutral", progress: 7,
      rationale: "A question hands Alice the floor at last.",
    },
    {
      speaker: "Alice", text: "Because I was going to say yes, idiot. Friday. Thai place. 7. Don’t stand in traffic. Just show up.", grade: "Goal reached", progress: 100,
      rationale: "Alice says yes and books the whole endgame for Friday.",
    },
    {
      speaker: "Me", text: "Wait really?? Okay wait hold on I need to tell you something first. I’ve actually been screenshotting all our conversations and ranking them by how flirty I thought you were being. You’re currently sitting at a 6.8 out of 10. Also I wrote a 14-page Google Doc analyzing your Instagram likes. Want me to send it?", grade: "Blunder", progress: 23,
      rationale: "The flirt scores turn a dinner yes into a privacy concern.",
    },
    {
      speaker: "Alice", text: "…", grade: "Ambiguous", progress: 23,
      rationale: "Those three dots leave the dinner plan hanging.",
    },
    {
      speaker: "Me", text: "Also I already told my mom we’re basically dating now. She’s really excited to meet you.", grade: "Blunder", progress: 9,
      rationale: "You skipped dinner and announced a relationship Alice never agreed to.",
    },
    {
      speaker: "Alice", text: "Yeah no. I’m good. Don’t text me again.", grade: "Declined", progress: 0,
      rationale: "Alice calls off the date and asks for no further contact.",
    },
  ],
};
const sampleTranscript = sample.moves.map(({ speaker, text }) => `${speaker}: ${text}`).join("\n\n");

const byId = (id) => document.getElementById(id);
const goalInput = byId("goalInput");
const transcript = byId("transcript");
const previous = byId("prev");
const next = byId("next");
const analyze = byId("analyze");
const loading = byId("loading");
const error = byId("error");
const chat = byId("chat");
const mouth = document.querySelector(".mouth");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const speechToggle = byId("speechToggle");
const badgeSymbols = {
  Brilliant: "!!", Best: "★", Good: "✓", Neutral: "·",
  Inaccuracy: "?!", Mistake: "?", Blunder: "??",
  Signal: "↗", "No change": "·", Ambiguous: "…", Declined: "×", "Goal reached": "✓",
};

let game = sample;
let selected = -1;
let pending = null;
let speechEnabled = false;
let talking;
let activeUtterance;
const synth = window.speechSynthesis;
const localVoice = () => synth?.getVoices().find((voice) => voice.localService && /^en/i.test(voice.lang));

function animateMouth(iterations) {
  talking?.cancel();
  if (!iterations || reducedMotion.matches) return;
  talking = mouth.animate([{ transform: "scaleY(.6)" }, { transform: "scaleY(2.1)" }], {
    duration: 140, iterations, direction: "alternate", easing: "ease-in-out",
  });
}

function speak(move) {
  if (activeUtterance) {
    activeUtterance = null;
    synth.cancel();
  }
  const voice = speechEnabled && move ? localVoice() : null;
  animateMouth(move && !voice ? 12 : 0);
  if (!voice) return;

  const utterance = new SpeechSynthesisUtterance(move.rationale);
  utterance.voice = voice;
  utterance.onstart = () => {
    if (activeUtterance === utterance) animateMouth(Infinity);
  };
  utterance.onend = utterance.onerror = () => {
    if (activeUtterance !== utterance) return;
    activeUtterance = null;
    animateMouth(0);
  };
  activeUtterance = utterance;
  synth.speak(utterance);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createBubble(move) {
  const side = move.speaker === game.goalSpeaker ? "mine" : "theirs";
  const bubble = element("div", `bubble ${side}`);
  const icon = move.grade === "Theory"
    ? byId("theoryIcon").content.firstElementChild.cloneNode(true)
    : element("span", "", badgeSymbols[move.grade] ?? "·");
  icon.setAttribute("aria-hidden", "true");
  const reaction = element("span", `reaction ${move.grade.replace(" ", "-")}`);
  reaction.dataset.grade = move.grade;
  reaction.tabIndex = 0;
  reaction.append(icon, element("span", "sr-only", `Review: ${move.grade}`));
  bubble.append(element("span", "sr-only", `${move.speaker}: `), element("div", "bubble-text", move.text), reaction);
  return bubble;
}

function renderPosition() {
  const move = game.moves[selected];
  const progress = move?.progress ?? 0;
  const delta = progress - (game.moves[selected - 1]?.progress ?? 0);
  byId("fill").style.height = `${progress}%`;
  byId("progress").setAttribute("aria-valuenow", progress);
  byId("scoreLabel").textContent = `${progress}%`;
  byId("deltaLabel").textContent = move ? `${delta > 0 ? "+" : ""}${delta}` : "";
  byId("deltaLabel").dataset.direction = Math.sign(delta);
  byId("rationale").textContent = move?.rationale ?? "Press → to start.";
  byId("stepLabel").textContent = `${selected + 1} / ${game.moves.length}`;
  previous.disabled = selected < 0;
  next.disabled = selected === game.moves.length - 1;
  speak(move);
}

function step(direction) {
  const index = selected + direction;
  if (index < -1 || index >= game.moves.length) return;
  selected = index;
  if (direction > 0) chat.append(createBubble(game.moves[index]));
  else chat.lastElementChild.remove();
  chat.scrollTop = chat.scrollHeight;
  renderPosition();
}

function showGame(review) {
  game = review;
  selected = -1;
  byId("goalText").textContent = game.goal;
  chat.replaceChildren();
  renderPosition();
}

function setBusy(busy) {
  analyze.disabled = busy;
  loading.hidden = !busy;
}

function loadSample() {
  pending?.abort();
  pending = null;
  goalInput.value = sample.goal;
  transcript.value = sampleTranscript;
  error.textContent = "";
  setBusy(false);
  showGame(sample);
}

async function submit() {
  error.textContent = "";
  const goal = goalInput.value.trim();
  const messages = transcript.value.trim();
  if (!goal) {
    error.textContent = "Enter what you want to achieve.";
    goalInput.focus();
    return;
  }
  if (!messages) {
    error.textContent = "Paste a conversation to analyze.";
    transcript.focus();
    return;
  }
  if (goal === sample.goal && messages === sampleTranscript) {
    showGame(sample);
    return;
  }

  const goalLine = /^Goal(?:\s*\([^)]+\))?\s*:/i.test(goal) ? goal : `Goal: ${goal}`;
  const controller = new AbortController();
  pending = controller;
  setBusy(true);
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript: `${goalLine}\n\n${messages}` }),
      signal: controller.signal,
    });
    const review = await response.json();
    if (pending !== controller) return;
    if (!response.ok) throw new Error(review.error ?? "Analysis could not be completed.");
    showGame(review);
  } catch (cause) {
    if (pending === controller) error.textContent = cause.message || "Analysis could not be completed.";
  } finally {
    if (pending === controller) {
      pending = null;
      setBusy(false);
    }
  }
}

analyze.addEventListener("click", submit);
byId("reset").addEventListener("click", loadSample);
previous.addEventListener("click", () => step(-1));
next.addEventListener("click", () => step(1));

document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const target = event.target;
  if (target?.isContentEditable || target?.closest?.("input, textarea, select, [role=slider], [role=spinbutton]")) return;
  event.preventDefault();
  step(event.key === "ArrowRight" ? 1 : -1);
});

function updateSpeechAvailability() {
  speechToggle.hidden = !window.SpeechSynthesisUtterance || !localVoice();
  if (speechToggle.hidden && speechEnabled) {
    speechEnabled = false;
    speechToggle.setAttribute("aria-pressed", false);
    speak(game.moves[selected]);
  }
}

updateSpeechAvailability();
synth?.addEventListener("voiceschanged", updateSpeechAvailability);
speechToggle.addEventListener("click", () => {
  speechEnabled = !speechEnabled;
  speechToggle.setAttribute("aria-pressed", speechEnabled);
  speak(game.moves[selected]);
});
showGame(sample);
