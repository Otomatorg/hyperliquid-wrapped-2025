const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const sharp = require("sharp");

/* ---------------------------------------------------------
   OPTIONAL — Load Manrope Medium (recommended for your UI)
   Place font file in ./fonts/Manrope-Medium.ttf

registerFont(path.join(__dirname, "fonts/Manrope-Medium.ttf"), {
  family: "Manrope",
  weight: "500",
});
--------------------------------------------------------- */

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

async function generateProfileImage(jsonPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const baseDir = path.dirname(path.resolve(jsonPath));

  // Canvas (same as screenshot)
  const width = 1920;
  const height = 1080;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  /* ---------------------------------------------------------
   Background 
  --------------------------------------------------------- */
  const background = await loadImageSafe(data.background, baseDir);
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
  const avatarBoxSize = 420;

  // Background behind avatar
  ctx.fillStyle = "#D4A574"; // golden-orange
  ctx.beginPath();
  ctx.roundRect(avatarBoxX, avatarBoxY, avatarBoxSize, avatarBoxSize, 20);
  ctx.fill();

  const avatar = await loadImageSafe(data.avatar, baseDir);
  ctx.drawImage(avatar, avatarBoxX, avatarBoxY, avatarBoxSize, avatarBoxSize);

  /* ---------------------------------------------------------
   Top Points
  --------------------------------------------------------- */
  let tpY = avatarBoxY + avatarBoxSize + 30;
  ctx.fillStyle = "white";
  ctx.font = "bold 35px Manrope";

  ctx.fillText("Top points", avatarBoxX, tpY);

  let tpX = avatarBoxX;
  const tpIconSize = 60;
  const tpSpacing = 250;

  for (const tp of data.topPoints) {
    const icon = await loadImageSafe(tp.icon, baseDir);
    ctx.drawImage(icon, tpX, tpY + 40, tpIconSize, tpIconSize);

    ctx.font = "28px Manrope";
    ctx.fillText(tp.label, tpX, tpY + 40 + tpIconSize + 25);

    tpX += tpSpacing;
  }

  /* ---------------------------------------------------------
   User Badge (shrimp) top-right
  --------------------------------------------------------- */
  const shrimp = await loadImageSafe(data.userBadge, baseDir);
  const shrimpSize = 120;
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
  const rightSectionX = avatarBoxX + avatarBoxSize + 60;
  let currentY = avatarBoxY + 20;

  ctx.fillStyle = "#A2BDC7";
  ctx.font = "32px Manrope";
  ctx.fillText("Overall Rank", rightSectionX, currentY);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 90px Manrope";
  ctx.fillText(`#${data.rank.toLocaleString()}`, rightSectionX, currentY + 100);

  /* ---------------------------------------------------------
   Badges Section
  --------------------------------------------------------- */
  ctx.fillStyle = "#A2BDC7";
  ctx.font = "32px Manrope";

  currentY += 210;
  ctx.fillText("Badges", rightSectionX, currentY);

  const badgeSize = 80;
  const badgeSpacing = 20;
  const badgesPerRow = 5;

  let badgeX = rightSectionX;
  let badgeY = currentY + 40;
  let badgeCount = 0;

  for (let badgePath of data.badges) {
    const badgeImg = await loadImageSafe(badgePath, baseDir);
    ctx.drawImage(badgeImg, badgeX, badgeY, badgeSize, badgeSize);

    badgeX += badgeSize + badgeSpacing;
    badgeCount++;

    // Line break
    if (badgeCount % badgesPerRow === 0) {
      badgeX = rightSectionX;
      badgeY += badgeSize + badgeSpacing;
    }
  }

  /* ---------------------------------------------------------
   General Stats
  --------------------------------------------------------- */
  if (data.general) {
    const stats = data.general;

    let gX = rightSectionX;
    let gY = badgeY + badgeSize + 60;

    ctx.font = "bold 32px Manrope";
    ctx.fillStyle = "white";
    ctx.fillText("General", gX, gY);

    gY += 50;
    ctx.font = "28px Manrope";

    const drawStat = (label, value, y) => {
      // Label
      ctx.fillStyle = "white";
      ctx.fillText(`${label}: `, gX, y);

      // Measure label width
      const labelWidth = ctx.measureText(`${label}: `).width;
      const valueX = gX + labelWidth;

      // Value box
      ctx.fillStyle = "#5B9BD5";
      const padding = 8;

      const valueWidth = ctx.measureText(value).width;
      const boxWidth = valueWidth + padding * 2;
      const boxHeight = 35;

      ctx.beginPath();
      ctx.roundRect(valueX - padding, y - boxHeight + 5, boxWidth, boxHeight, 6);
      ctx.fill();

      // Value text
      ctx.fillStyle = "white";
      ctx.fillText(value, valueX, y);
    };

    if (stats.transactions) {
      drawStat("Transactions", stats.transactions, gY);
      gY += 60;
    }
    if (stats.og) {
      drawStat("OG score", stats.og, gY);
      gY += 60;
    }
    if (stats.archetype) {
      drawStat("Archetype", stats.archetype, gY);
      gY += 60;
    }
    if (stats.gas) {
      drawStat("Gas burner", stats.gas, gY);
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