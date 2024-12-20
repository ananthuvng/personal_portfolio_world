export function startStreetFighterGame(windowStateManager) {
    // Prevent multiple game instances
    if (document.getElementById('game-container')) {
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
    canvas.width = Math.min(window.innerWidth * 0.8, 800);  // Max width of 800
    canvas.height = Math.min(window.innerHeight * 0.8, 600);  // Max height of 600
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
  
    // Create health bars and score display
    const player1HealthBar = document.createElement("div");
    player1HealthBar.id = "player1-health";
    player1HealthBar.style.position = "fixed";
    player1HealthBar.style.top = "20px";
    player1HealthBar.style.left = "20px";
    player1HealthBar.style.width = "200px";
    player1HealthBar.style.height = "20px";
    player1HealthBar.style.backgroundColor = "green";
  
    const player2HealthBar = document.createElement("div");
    player2HealthBar.id = "player2-health";
    player2HealthBar.style.position = "fixed";
    player2HealthBar.style.top = "20px";
    player2HealthBar.style.right = "20px";
    player2HealthBar.style.width = "200px";
    player2HealthBar.style.height = "20px";
    player2HealthBar.style.backgroundColor = "red";
  
    gameContainer.appendChild(player1HealthBar);
    gameContainer.appendChild(player2HealthBar);
  
    // Add the game container and the close button to the document
    document.body.appendChild(gameContainer);
    gameContainer.appendChild(closeBtn);
  
    // Load game images
    const images = {
      player1: new Image(),
      player2: new Image(),
      background: new Image()
    };
  
    // Set image sources (replace with your actual image paths)
    images.player1.src = './resources/shooter.png';
    images.player2.src = './resources/shooter.png';
    images.background.src = './resources/shooter.png';
  
    // Game state variables
    let gameOver = false;
    let animationFrameId = null;
  
    // Players
    const player1 = {
      x: canvas.width / 4,
      y: canvas.height - 200,
      width: 100,
      height: 200,
      health: 100,
      speed: 5,
      dx: 0,
      isAttacking: false,
      attackCooldown: 0
    };
  
    const player2 = {
      x: canvas.width * 3 / 4 - 100,
      y: canvas.height - 200,
      width: 100,
      height: 200,
      health: 100,
      speed: 5,
      dx: 0,
      isAttacking: false,
      attackCooldown: 0
    };
  
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
    Object.values(images).forEach(img => {
      img.addEventListener('load', checkImagesLoaded);
    });
  
    // Reset the game state
    function resetGame() {
      player1.x = canvas.width / 4;
      player1.y = canvas.height - 200;
      player1.health = 100;
      player1.dx = 0;
      player1.isAttacking = false;
      player1.attackCooldown = 0;
  
      player2.x = canvas.width * 3 / 4 - 100;
      player2.y = canvas.height - 200;
      player2.health = 100;
      player2.dx = 0;
      player2.isAttacking = false;
      player2.attackCooldown = 0;
  
      gameOver = false;
      player1HealthBar.style.width = "200px";
      player2HealthBar.style.width = "200px";
  
      // Clear any existing event listeners
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
  
      // Add event listeners for the new game
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
    }
  
    // Handle player movement and attacks
    function handleKeyDown(e) {
      // Player 1 controls (A/D move, W attack)
      if (e.key === "a") {
        player1.dx = -player1.speed;
      } else if (e.key === "d") {
        player1.dx = player1.speed;
      } else if (e.key === "w" && player1.attackCooldown <= 0) {
        player1.isAttacking = true;
        player1.attackCooldown = 30;
        checkAttackCollision(player1, player2);
      }
  
      // Player 2 controls (Left/Right arrow move, Up arrow attack)
      if (e.key === "ArrowLeft") {
        player2.dx = -player2.speed;
      } else if (e.key === "ArrowRight") {
        player2.dx = player2.speed;
      } else if (e.key === "ArrowUp" && player2.attackCooldown <= 0) {
        player2.isAttacking = true;
        player2.attackCooldown = 30;
        checkAttackCollision(player2, player1);
      }
    }
  
    function handleKeyUp(e) {
      // Stop movement when key is released
      if (e.key === "a" || e.key === "d") {
        player1.dx = 0;
      }
  
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        player2.dx = 0;
      }
    }
  
    // Check for attack collision
    function checkAttackCollision(attacker, defender) {
      if (
        attacker.isAttacking &&
        attacker.x + attacker.width > defender.x &&
        attacker.x < defender.x + defender.width
      ) {
        defender.health -= 20;
        if (defender === player1) {
          player1HealthBar.style.width = `${defender.health}px`;
        } else {
          player2HealthBar.style.width = `${defender.health}px`;
        }
      }
    }
  
    // Update player positions and states
    function updatePlayers() {
      // Player 1 movement and bounds
      player1.x += player1.dx;
      player1.x = Math.max(0, Math.min(canvas.width / 2 - player1.width, player1.x));
  
      // Player 2 movement and bounds
      player2.x += player2.dx;
      player2.x = Math.max(canvas.width / 2, Math.min(canvas.width - player2.width, player2.x));
  
      // Cooldown and attack state management
      if (player1.attackCooldown > 0) {
        player1.attackCooldown--;
        if (player1.attackCooldown <= 0) {
          player1.isAttacking = false;
        }
      }
  
      if (player2.attackCooldown > 0) {
        player2.attackCooldown--;
        if (player2.attackCooldown <= 0) {
          player2.isAttacking = false;
        }
      }
  
      // Check for game over
      if (player1.health <= 0 || player2.health <= 0) {
        gameOver = true;
      }
    }
  
    // Draw players
    function drawPlayers() {
      // Draw background
      ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
  
      // Draw players
      ctx.drawImage(images.player1, player1.x, player1.y, player1.width, player1.height);
      ctx.drawImage(images.player2, player2.x, player2.y, player2.width, player2.height);
  
      // Draw attack indicators if attacking
      if (player1.isAttacking) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(player1.x + player1.width, player1.y, 20, player1.height);
      }
  
      if (player2.isAttacking) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(player2.x, player2.y, 20, player2.height);
      }
    }
  
    // Game loop
    function gameLoop() {
      if (gameOver) {
        cancelAnimationFrame(animationFrameId);
  
        const winner = player1.health > 0 ? "Player 1" : "Player 2";
        const playAgain = confirm(`Game Over! ${winner} wins!\nDo you want to play again?`);
        
        if (playAgain) {
          resetGame();
          startGame();
        } else {
          closeGame();
        }
        return;
      }
  
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      updatePlayers();
      drawPlayers();
  
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  
    // Start the game
    function startGame() {
      resetGame();
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  
    // Close button functionality
    closeBtn.addEventListener("click", closeGame);
  
    function closeGame() {
      gameOver = true;
      
      // Remove event listeners
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      
      // Cancel animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
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