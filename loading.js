export const _showLoadingScreen = () => {
  // Check if loading screen exists
  let loadingScreen = document.getElementById("loading-screen");

  if (!loadingScreen) {
    loadingScreen = document.createElement("div");
    loadingScreen.id = "loading-screen";
    loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Arial', sans-serif;
        color: #ffffff;
        gap: 2rem;
        overflow: hidden;
      `;

    // Animated loading container
    const loadingContainer = document.createElement("div");
    loadingContainer.style.cssText = `
        width: 80%;
        max-width: 500px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 2rem;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        border: 1px solid rgba(255, 255, 255, 0.18);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      `;

    // Loading bar
    const loadingBar = document.createElement("div");
    loadingBar.id = "loading-bar";
    loadingBar.style.cssText = `
        width: 0;
        height: 6px;
        background: linear-gradient(90deg, #00f5d4, #5b16d4);
        transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;

    // Loading text
    const loadingText = document.createElement("div");
    loadingText.id = "loading-text";
    loadingText.style.cssText = `
        font-size: 18px;
        font-weight: 300;
        margin-bottom: 10px;
        opacity: 0.7;
      `;
    loadingText.textContent = "Loading resources...";

    // Percentage text
    const percentText = document.createElement("div");
    percentText.id = "percent-text";
    percentText.style.cssText = `
        font-size: 24px;
        font-weight: bold;
        margin-top: 10px;
        color: #00f5d4;
      `;
    percentText.textContent = "0%";

    // Spinning loader
    const spinner = document.createElement("div");
    spinner.style.cssText = `
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255,255,255,0.1);
        border-top: 4px solid #00f5d4;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      `;

    // Add spinning animation
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
    document.head.appendChild(styleSheet);

    // Assemble the loading screen
    loadingContainer.appendChild(loadingText);
    loadingContainer.appendChild(loadingBar);
    loadingContainer.appendChild(percentText);

    loadingScreen.appendChild(spinner);
    loadingScreen.appendChild(loadingContainer);
    document.body.appendChild(loadingScreen);
  }

  return loadingScreen;
};

export const _updateLoadingProgress = (progress) => {
  const loadingBar = document.getElementById("loading-bar");
  const percentText = document.getElementById("percent-text");

  if (loadingBar) {
    loadingBar.style.width = `${progress}%`;
  }

  if (percentText) {
    percentText.textContent = `${progress}%`;
  }
};

export const _hideLoadingScreen = () => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    // Optional: Add a fade-out animation
    loadingScreen.style.opacity = "0";
    loadingScreen.style.transition = "opacity 0.5s ease-out";

    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
};
