const yauzl = require('yauzl');
const fs = require('fs');
const path = require('path');

yauzl.open('gga.zip', { lazyEntries: true }, (err, zipfile) => {
  if (err) {
    console.error('Error opening zip file:', err);
    return;
  }

  zipfile.readEntry();
  
  zipfile.on('entry', (entry) => {
    if (/\/$/.test(entry.fileName)) {
      // Directory entry
      const dirPath = entry.fileName;
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('Created directory:', dirPath);
      zipfile.readEntry();
    } else {
      // File entry
      zipfile.openReadStream(entry, (err, readStream) => {
        if (err) {
          console.error('Error reading entry:', err);
          return;
        }

        const filePath = entry.fileName;
        const dirPath = path.dirname(filePath);
        
        // Create directory if it doesn't exist
        fs.mkdirSync(dirPath, { recursive: true });
        
        const writeStream = fs.createWriteStream(filePath);
        readStream.pipe(writeStream);
        
        writeStream.on('close', () => {
          console.log('Extracted:', filePath);
          zipfile.readEntry();
        });
      });
    }
  });

  zipfile.on('end', () => {
    console.log('Extraction completed successfully!');
  });

  zipfile.on('error', (err) => {
    console.error('Error during extraction:', err);
  });
});