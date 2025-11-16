const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const sharp = require("sharp");

// Helper function handling WebP via sharp
async function loadImageSafe(imagePath, baseDir = __dirname) {
  const fullPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(baseDir, imagePath);

  const ext = path.extname(fullPath).toLowerCase();

  if (ext === ".webp") {
    const buffer = await sharp(fullPath).png().toBuffer();
    return loadImage(buffer);
  }

  return loadImage(fullPath);
}

/* ---------------------------------------------------------
   Draw icon inside rounded padded background
--------------------------------------------------------- */
function drawRoundedIcon(ctx, img, x, y, size, padding = 40, circular = false) {
  const bgSize = size + padding * 2;
  const circleRadius = bgSize / 2;

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.arc(x + circleRadius, y + circleRadius, circleRadius, 0, Math.PI * 2);
  ctx.fill();

  // Icon (centered inside)
  const iconX = x + padding;
  const iconY = y + padding;
  
  if (circular) {
    // Clip to circle for rounded badge
    ctx.save();
    ctx.beginPath();
    ctx.arc(iconX + size / 2, iconY + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, iconX, iconY, size, size);
    ctx.restore();
  } else {
    ctx.drawImage(img, iconX, iconY, size, size);
  }
}

async function generateProfileImage(jsonPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const baseDir = path.dirname(path.resolve(jsonPath));

  // Canvas size (same as screenshot)
  const width = 1920;
  const height = 1080;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  /* ---------------------------------------------------------
   Background 
  --------------------------------------------------------- */
  const background = await loadImageSafe(`images/background.png`, baseDir);
  ctx.drawImage(background, 0, 0, width, height);

  /* ---------------------------------------------------------
   Main Card
  --------------------------------------------------------- */
  const cardX = 200;
  const cardY = 100;
  const cardW = 1520;
  const cardH = 820;

  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 40);
  ctx.fill();

  /* ---------------------------------------------------------
   Left Section — Avatar block
  --------------------------------------------------------- */
  const avatarBoxX = cardX + 40;
  const avatarBoxY = cardY + 40;
  const avatarHeight = 550;
  const avatarWidth = 440

  // Background behind avatar
  ctx.fillStyle = "#3F6279";
  ctx.beginPath();
  ctx.fill();

  const avatar = await loadImageSafe(`images/${data.avatar}.png`, baseDir);
  ctx.drawImage(avatar, avatarBoxX, avatarBoxY, avatarWidth, avatarHeight);

  /* ---------------------------------------------------------
   Top Points
  --------------------------------------------------------- */
  let tpY = avatarBoxY + avatarHeight + 40;
  ctx.fillStyle = "#A2BDC7";
  ctx.font = "32px Manrope";
  ctx.fillText("Top points", avatarBoxX, tpY);

  let tpX = avatarBoxX;
  const tpIconSize = 80;
  const tpSpacing = 150;

  for (const tp of data.topPoints) {
    const icon = await loadImageSafe(`badges/${tp.icon}.webp`, baseDir);

    // Rounded padded icon
    drawRoundedIcon(ctx, icon, tpX, tpY + 20, tpIconSize, 20, true);

    ctx.fillStyle = "#A2BDC7";
    ctx.font = "28px Manrope";
    ctx.fillText(tp.label, tpX + 12, tpY + 45 + tpIconSize + 45);

    tpX += tpSpacing;
  }

  /* ---------------------------------------------------------
   User Badge (shrimp) top-right
  --------------------------------------------------------- */
  const shrimp = await loadImageSafe(`images/${data.userBadge}.png`, baseDir);
  const shrimpSize = 170;
  const shrimpPadding = 40;

  ctx.drawImage(
    shrimp,
    cardX + cardW - shrimpSize - shrimpPadding,
    cardY + shrimpPadding,
    shrimpSize,
    shrimpSize
  );

  /* ---------------------------------------------------------
   Right Section — Rank
  --------------------------------------------------------- */
  const rightSectionX = avatarBoxX + avatarWidth + 60;
  let currentY = avatarBoxY + 20;

  ctx.fillStyle = "#A2BDC7";
  ctx.font = "32px Manrope";
  ctx.fillText("Overall Rank", rightSectionX, currentY);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 110px Outfit";
  ctx.fillText(`#${data.rank.toLocaleString()}`, rightSectionX, currentY + 100);

  /* ---------------------------------------------------------
   Badges Section
  --------------------------------------------------------- */
  ctx.fillStyle = "#A2BDC7";
  ctx.font = "32px Manrope";

  currentY += 170;
  ctx.fillText("Badges", rightSectionX, currentY);

  const badgeSize = 80;
  const badgeSpacing = 50;
  const badgesPerRow = 7;

  let badgeX = rightSectionX;
  let badgeY = currentY + 40;
  let badgeCount = 0;

  for (let badgePath of data.protocolBadges) {
    const badgeImg = await loadImageSafe(`badges/${badgePath}.webp`, baseDir);

    drawRoundedIcon(ctx, badgeImg, badgeX, badgeY, badgeSize, 20, true);

    badgeX += badgeSize + badgeSpacing + 8; // adjust spacing
    badgeCount++;

    if (badgeCount % badgesPerRow === 0) {
      badgeX = rightSectionX;
      badgeY += badgeSize + badgeSpacing + 8;
    }
  }

/* ---------------------------------------------------------
   General Stats — styled cards (like screenshot)
--------------------------------------------------------- */
if (data.general) {
  const stats = data.general;

  // Position under badges
  let gX = rightSectionX;
  let gY = badgeY + badgeSize + 90;

  // Title
  ctx.font = "32px Manrope";
  ctx.fillStyle = "#A2BDC7";
  ctx.fillText("General", gX, gY);

  gY += 40;

  // --- card styling ---
  const cardPaddingX = 20;
  const cardPaddingY = 20;
  const cardRadius = 22;
  const cardSpacingX = 20;

  // Function to draw a stat card
  const drawCard = (title, value, x, y) => {
    ctx.font = "24px Manrope";

    // Measure card width
    const titleWidth = ctx.measureText(title).width;
    const valueWidth = ctx.measureText(value).width;
    const maxWidth = Math.max(titleWidth, valueWidth);

    const cardWidth = maxWidth + cardPaddingX * 2;
    const cardHeight = 95;

    // Background
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, cardRadius);
    ctx.fill();

    // Title
    ctx.fillStyle = "#A6B9C5";
    ctx.font = "20px Manrope";
    ctx.fillText(title, x + cardPaddingX, y + 32);

    // Value
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "24px Manrope";
    ctx.fillText(
      value,
      x + cardPaddingX,
      y + 32 + 34
    );

    return cardWidth; // return width to chain cards horizontally
  };

  // Draw cards in order (max 4)
  let cx = rightSectionX;

  if (stats.transactions) {
    cx += drawCard("Transactions", stats.transactions, cx, gY) + cardSpacingX;
  }
  if (stats.og) {
    cx += drawCard("OG score", stats.og, cx, gY) + cardSpacingX;
  }
  if (stats.archetype) {
    cx += drawCard("Archetype", stats.archetype, cx, gY) + cardSpacingX;
  }
  if (stats.gas) {
    drawCard("Gas burner", stats.gas, rightSectionX, gY + 120);
  }
}
  /* ---------------------------------------------------------
   Export
  --------------------------------------------------------- */
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  console.log("✔ Image generated:", outputPath);
}

/* ---------------------------------------------------------
   Execute if run directly
--------------------------------------------------------- */
if (require.main === module) {
  generateProfileImage("./profile.json", "./output.png").catch((err) => {
    console.error("❌ Error generating image:", err);
    process.exit(1);
  });
}