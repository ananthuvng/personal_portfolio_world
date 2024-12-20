export function showAbout(windowStateManager) {
  // Create the popup container
  const popup = document.createElement("div");
  popup.id = "about-popup"; // Add an ID for easier debugging
  popup.style.position = "fixed";
  popup.style.top = "0";
  popup.style.left = "0";
  popup.style.width = "100%";
  popup.style.height = "100%";
  popup.style.backgroundColor = "rgba(0,0,0,0.7)";
  popup.style.zIndex = "9999";
  popup.style.display = "flex";
  popup.style.alignItems = "center";
  popup.style.justifyContent = "center";
  popup.style.opacity = "0";
  popup.style.transition = "opacity 0.3s ease-in-out"; // Transition for fade-in/out

  // Create image container
  const imageContainer = document.createElement("div");
  imageContainer.style.position = "relative";
  imageContainer.style.display = "flex";
  imageContainer.style.alignItems = "center";
  imageContainer.style.justifyContent = "center";
  imageContainer.style.overflow = "hidden"; // Ensure the image doesn't overflow the container
  imageContainer.style.maxWidth = "90%"; // Limit container width
  imageContainer.style.maxHeight = "90%"; // Limit container height

  // Create image
  const image = document.createElement("img");
  image.src = "./resources/about.png";
  image.style.display = "block";
  image.style.maxWidth = "100%";
  image.style.maxHeight = "100%";
  image.style.objectFit = "contain"; // Preserve aspect ratio

  // Wait for the image to load and set its natural dimensions
  image.onload = () => {
    // If the image's natural size is larger than the container, apply the limit
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;

    // Adjust container size based on image size while respecting the max limits
    const maxContainerWidth = window.innerWidth * 0.9;
    const maxContainerHeight = window.innerHeight * 0.9;

    if (imgWidth > maxContainerWidth || imgHeight > maxContainerHeight) {
      const scale = Math.min(
        maxContainerWidth / imgWidth,
        maxContainerHeight / imgHeight
      );
      image.style.width = `${imgWidth * scale}px`;
      image.style.height = `${imgHeight * scale}px`;
    } else {
      image.style.width = `${imgWidth}px`;
      image.style.height = `${imgHeight}px`;
    }

    // Now make the popup visible after image dimensions are set
    setTimeout(() => {
      popup.style.opacity = "1";
    }, 10);
  };

  // Create close button
  const closeButton = document.createElement("div");
  closeButton.innerHTML = "✕";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.color = "white";
  closeButton.style.fontSize = "28px"; // Slightly bigger font for better visibility
  closeButton.style.cursor = "pointer";
  closeButton.style.width = "40px";
  closeButton.style.height = "40px";
  closeButton.style.textAlign = "center";
  closeButton.style.borderRadius = "50%";
  closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  closeButton.style.display = "flex";
  closeButton.style.alignItems = "center";
  closeButton.style.justifyContent = "center";
  closeButton.style.transition =
    "background-color 0.3s ease, transform 0.3s ease";

  // Hover effect for close button
  closeButton.addEventListener("mouseenter", () => {
    closeButton.style.backgroundColor = "rgba(38, 255, 253, .5)";
    closeButton.style.transform = "scale(1.1)";
  });
  closeButton.addEventListener("mouseleave", () => {
    closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    closeButton.style.transform = "scale(1)";
  });

  // Close functionality
  const closePopup = () => {
    popup.style.opacity = "0"; // Fade out before removing
    if (windowStateManager) {
        windowStateManager._onaAnotherWindow = false;
      }
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 300); // Wait for the fade-out to complete
  };

  closeButton.addEventListener("click", closePopup);
  popup.addEventListener("click", (e) => {
    if (e.target === popup) closePopup();
  });

  // Assemble the popup
  imageContainer.appendChild(closeButton);
  imageContainer.appendChild(image);
  popup.appendChild(imageContainer);

  // Add to document
  document.body.appendChild(popup);

  // Wait for image load and apply transitions afterward
  setTimeout(() => {
    popup.style.opacity = "1";
  }, 10); // Slight delay to trigger transition
}
