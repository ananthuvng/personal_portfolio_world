export function startSpaceShooterGame(windowStateManager) {
  // Prevent multiple game instances
  if (document.getElementById("game-container")) {
    return;
  }

  // Create the game container
  const gameContainer = document.createElement("div");
  gameContainer.id = "game-container";
  gameContainer.style.position = "fixed";
  gameContainer.style.top = "0";
  gameContainer.style.left = "0";
  gameContainer.style.width = "100%";
  gameContainer.style.height = "100%";
  gameContainer.style.backgroundColor = "black";
  gameContainer.style.zIndex = "9999";
  gameContainer.style.display = "flex";
  gameContainer.style.alignItems = "center";
  gameContainer.style.justifyContent = "center";
  gameContainer.style.opacity = "0";
  gameContainer.style.transition = "opacity 0.3s ease-in-out";

  // Create the canvas for the game
  const canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  const ctx = canvas.getContext("2d");
  canvas.width = Math.min(window.innerWidth * 0.8, 800); // Max width of 800
  canvas.height = Math.min(window.innerHeight * 0.8, 600); // Max height of 600
  gameContainer.appendChild(canvas);

  // Create the close button
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "✕";
  closeBtn.id = "close-btn";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "10px";
  closeBtn.style.color = "white";
  closeBtn.style.fontSize = "28px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.padding = "10px";
  closeBtn.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  closeBtn.style.borderRadius = "50%";
  closeBtn.style.transition = "background-color 0.3s, transform 0.3s";
  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.backgroundColor = "rgba(38, 255, 253, .5)";
    closeBtn.style.transform = "scale(1.1)";
  });
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    closeBtn.style.transform = "scale(1)";
  });

  // Create score display
  const scoreDisplay = document.createElement("div");
  scoreDisplay.className = "score";
  scoreDisplay.style.position = "fixed";
  scoreDisplay.style.top = "20px";
  scoreDisplay.style.left = "20px";
  scoreDisplay.style.color = "white";
  scoreDisplay.style.fontSize = "24px";
  scoreDisplay.innerText = "Score: 0";
  gameContainer.appendChild(scoreDisplay);

  // Add the game container and the close button to the document
  document.body.appendChild(gameContainer);
  gameContainer.appendChild(closeBtn);

  // Initialize game variables
  let score = 0;
  let gameOver = false;
  let animationFrameId = null;
  let spawnIntervalId = null;
  let lastBulletTime = 0;
  const BULLET_COOLDOWN = 250; // Milliseconds between bullets

  // Load game images
  const images = {
    player: new Image(),
    enemy: new Image(),
    bullet: new Image(),
  };

  // Set image sources (replace with your actual image paths)
  images.player.src = "./resources/shooter.png";
  images.enemy.src = "./resources/enemy.png";
  images.bullet.src = "./resources/bullet.png";

  // Player object
  const player = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    width: 100,
    height: 100,
    speed: 5,
    dx: 0,
  };

  const bullets = [];
  const enemies = [];
  const enemySpeed = 3;
  const enemySpawnRate = 1000; // Spawn an enemy every second

  // Wait for images to load
  let imagesLoaded = 0;
  const totalImages = Object.keys(images).length;

  function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      startGame();
    }
  }

  // Add load event listeners to images
  Object.values(images).forEach((img) => {
    img.addEventListener("load", checkImagesLoaded);
  });

  // Reset the game state
  function resetGame() {
    score = 0;
    gameOver = false;
    player.x = canvas.width / 2 - 50;
    player.y = canvas.height - 100;
    player.dx = 0;
    bullets.length = 0;
    enemies.length = 0;
    scoreDisplay.innerText = "Score: 0";

    // Clear any existing event listeners
    document.removeEventListener("keydown", movePlayer);
    document.removeEventListener("keyup", stopPlayerMovement);
    document.removeEventListener("click", handleShoot);

    // Add event listeners for the new game
    document.addEventListener("keydown", movePlayer);
    document.addEventListener("keyup", stopPlayerMovement);
    document.addEventListener("click", handleShoot);
  }

  // Update the player's position based on user input
  function updatePlayer() {
    if (
      player.x + player.dx >= 0 &&
      player.x + player.dx <= canvas.width - player.width
    ) {
      player.x += player.dx;
    }
  }

  // Draw the player's spaceship
  function drawPlayer() {
    ctx.drawImage(
      images.player,
      player.x,
      player.y,
      player.width,
      player.height
    );
  }

  // Handle keyboard input for moving the player
  function movePlayer(e) {
    if (e.key === "ArrowLeft" || e.key === "a") {
      player.dx = -player.speed;
    } else if (e.key === "ArrowRight" || e.key === "d") {
      player.dx = player.speed;
    }
  }

  function stopPlayerMovement(e) {
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "a" ||
      e.key === "d"
    ) {
      player.dx = 0;
    }
  }

  // Improved bullet creation with cooldown
  function handleShoot(e) {
    const currentTime = Date.now();
    if (currentTime - lastBulletTime > BULLET_COOLDOWN) {
      createBullet();
      lastBulletTime = currentTime;
    }
  }

  function createBullet() {
    bullets.push({
      x: player.x + player.width / 2 - 15,
      y: player.y,
      width: 50,
      height: 50,
      speed: 7,
    });
  }

  function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= bullets[i].speed;
      if (bullets[i].y < 0) {
        bullets.splice(i, 1);
      }
    }
  }

  function drawBullets() {
    bullets.forEach((bullet) => {
      ctx.drawImage(
        images.bullet,
        bullet.x,
        bullet.y,
        bullet.width,
        bullet.height
      );
    });
  }

  // Enemy object and functions
  function createEnemy() {
    const x = Math.random() * (canvas.width - 100);
    const enemy = {
      x: x,
      y: -100,
      width: 70,
      height: 70,
      speed: enemySpeed,
    };
    enemies.push(enemy);
  }

  function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.y += enemy.speed;

      // Remove enemy if it goes off screen
      if (enemy.y > canvas.height) {
        enemies.splice(i, 1);
        continue;
      }

      // Check for collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const bullet = bullets[j];
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          score += 10;
          scoreDisplay.innerText = `Score: ${score}`;
          break;
        }
      }

      // Check for collision with the player
      if (
        enemy.x < player.x + player.width &&
        enemy.x + enemy.width > player.x &&
        enemy.y < player.y + player.height &&
        enemy.y + enemy.height > player.y
      ) {
        gameOver = true;
      }
    }
  }

  function drawEnemies() {
    enemies.forEach((enemy) => {
      ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
    });
  }

  // Game loop
  function gameLoop() {
    // Clear the canvas with black background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
      cancelAnimationFrame(animationFrameId);
      clearInterval(spawnIntervalId);

      const playAgain = confirm(
        `Game Over! Final Score: ${score}\nDo you want to play again?`
      );
      if (playAgain) {
        resetGame();
        startGame();
      } else {
        closeGame();
      }
      return;
    }

    updatePlayer();
    updateBullets();
    updateEnemies();

    drawPlayer();
    drawBullets();
    drawEnemies();

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Start the game
  function startGame() {
    // Reset and set up event listeners
    resetGame();

    // Spawn enemies at intervals
    spawnIntervalId = setInterval(() => {
      if (!gameOver) {
        createEnemy();
      }
    }, enemySpawnRate);

    // Start the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Close button functionality
  closeBtn.addEventListener("click", closeGame);

  function closeGame() {
    gameOver = true;

    // Remove all event listeners
    document.removeEventListener("keydown", movePlayer);
    document.removeEventListener("keyup", stopPlayerMovement);
    document.removeEventListener("click", handleShoot);

    // Cancel animation and intervals
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
    }

    // Fade out and remove game container
    gameContainer.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(gameContainer);

      // Update window state if a state manager is provided
      if (windowStateManager) {
        windowStateManager._onaAnotherWindow = false;
      }
    }, 300);
  }

  // Show the game container with a slight delay
  setTimeout(() => {
    gameContainer.style.opacity = "1";
  }, 10);
}
