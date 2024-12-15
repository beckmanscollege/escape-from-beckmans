import { GAME } from './GAME.js';

let currWorld, currLevel, playerName, gameStartTime, elapsedTime = 0;

const $level = document.querySelector('#level');
const LOCAL = false;
const LOCAL_URL = 'http://localhost:8080';
const PUBLIC_URL = 'https://beckmanscollege.github.io/escape-from-beckmans/';
const TRANSITION_TIME = 2000;

const urlParams = new URLSearchParams(window.location.search);
let worldIndex = urlParams.get('world');
let levelIndex = urlParams.get('level');

if (worldIndex > 0) worldIndex -= 1;
if (levelIndex > 0) levelIndex -= 1;

const pane = new Tweakpane.Pane();
if (levelIndex === null) {
	const nextLevelBtn = pane.addButton({ title: 'next level' });
	nextLevelBtn.on('click', nextLevel);
}
const restartLevelBtn = pane.addButton({ title: 'restart level' });
const authorBtn = pane.addButton({ title: 'author' });
restartLevelBtn.on('click', restartLevel);

function startGame() {
	playerName = prompt("Welcome! Please enter your name:") || "Player";
	gameStartTime = Date.now();
	elapsedTime = 0;

	init();
	setup();
	showLevel();
	startTimer(); // Start the in-game timer

	setTimeout(() => {
		document.body.classList.remove('transition');
	}, TRANSITION_TIME);
}

function startTimer() {
	setInterval(() => {
		elapsedTime++;
		const formattedTime = formatTime(elapsedTime);
		document.title = `${formattedTime} | ${currWorld.title} - ${currLevel.title}`;
	}, 1000); // Update every second
}

function formatTime(seconds) {
	const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
	const secs = (seconds % 60).toString().padStart(2, '0');
	return `${mins}:${secs}`;
}

function init() {
	if (worldIndex !== null) {
		GAME.worlds = [GAME.worlds[worldIndex]];
		if (levelIndex !== null)
			GAME.worlds[0].levels = [GAME.worlds[0].levels[levelIndex]];
	}

	if (GAME.order === 'random') {
		GAME.order = rarr(GAME.worlds.length);
	} else if (GAME.order === Array) {
		GAME.order = [];
		GAME.worlds.forEach((_, index) => {
			GAME.order[index] = index;
		});
	}

	for (let world of GAME.worlds) {
		world.order = [];
		world.levels.forEach((_, index) => {
			world.order[index] = index;
		});
	}
}

function setup() {
	currWorld = getWorld();
	let levelIndex = currWorld.order[0];
	currLevel = currWorld.levels[levelIndex];
}

function getWorld() {
	let index = GAME.order[0];
	return GAME.worlds[index];
}

function getLevel() {
	let i = currWorld.order[0];
	return currWorld.levels[i];
}

function nextLevel() {
	document.body.classList.add('transition');
	console.log(currWorld, GAME.order.length)
	setTimeout(() => {
		currWorld.order.shift();
		if (currWorld.order.length === 0 && GAME.order.length === 1) {
			gameOver();
		} else {
			if (currWorld.order.length === 0) {
				GAME.order.shift();
				currWorld = getWorld();
			}
			currLevel = getLevel();
			showLevel();
		}
	}, TRANSITION_TIME / 2);
}

function showLevel() {
	if (LOCAL) currLevel.url = currLevel.url.replace(PUBLIC_URL, LOCAL_URL);
	const path = currLevel.url;
	$level.src = new URL(path, window.location.href);
	document.body.className = currLevel.title.slugify();
	updateAuthor();

	setTimeout(() => {
		document.body.classList.remove('transition');
	}, TRANSITION_TIME);
}

function updateAuthor() {
	authorBtn.hidden = true;
	if (currLevel.author.name) {
		authorBtn.hidden = false;
		authorBtn.title = currLevel.author.name;
	}
	if (currLevel.author.link) {
		authorBtn.onclick = () => {
			window.open(currLevel.author.link, '_blank');
		};
	}
}

function restartLevel() {
	$level.src += '';
}

function gameOver() {
	const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
	const message = `Game Over, ${playerName}! You played for ${formatTime(playTime)}.`;
	alert(message);
	console.log(message);

	saveHighscore(playerName, playTime);
	displayHighscores();
}

function saveHighscore(name, time) {
	const highscores = JSON.parse(localStorage.getItem('highscores')) || [];
	highscores.push({ name, time });
	highscores.sort((a, b) => a.time - b.time); // Sort by playtime (ascending)
	localStorage.setItem('highscores', JSON.stringify(highscores.slice(0, 10))); // Keep top 10
}

function displayHighscores() {
	const highscores = JSON.parse(localStorage.getItem('highscores')) || [];
	console.log("Highscores:");
	highscores.forEach((score, index) => {
		console.log(`${index + 1}. ${score.name} - ${formatTime(score.time)}`);
	});
}

window.addEventListener('message', (event) => {
	if (event.data === 'nextLevel') nextLevel();
});

startGame();
