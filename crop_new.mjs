import sharp from 'sharp';

async function cropNewLogo() {
  try {
    console.log("Starting crop of new logo...");
    // Create the logo for the dashboard (with a bit of padding maybe, or just cropped)
    await sharp('public/new_logo.png')
      .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } }) // Trims white/transparent padding
      .toFile('public/logo.png');
    
    // Copy the same to favicon
    import('fs').then(fs => {
      fs.copyFileSync('public/logo.png', 'public/favicon.png');
      console.log("Successfully cropped logo and updated favicon!");
    });
  } catch (error) {
    console.error("Error cropping image:", error);
  }
}

cropNewLogo();
