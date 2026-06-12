import sharp from 'sharp';

async function cropLogo() {
  try {
    console.log("Starting crop...");
    await sharp('public/favicon.png')
      .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } }) // Trims white/transparent padding
      .toFile('public/favicon_zoomed.png');
    
    // Replace the old one with the zoomed one
    import('fs').then(fs => {
      fs.renameSync('public/favicon_zoomed.png', 'public/favicon.png');
      console.log("Successfully cropped and zoomed the favicon!");
    });
  } catch (error) {
    console.error("Error cropping image:", error);
  }
}

cropLogo();
