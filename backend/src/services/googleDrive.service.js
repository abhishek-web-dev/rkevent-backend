/**
 * Google Drive Backup Service
 * Optional utility to upload backup files directly to Google Drive.
 * Bypasses heavy SDK libraries by using standard HTTP fetch requests.
 */
const fs = require('fs');

/**
 * Request a fresh access token using OAuth refresh token.
 */
const getAccessToken = async () => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google OAuth token exchange failed: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
};

/**
 * Upload a backup file to Google Drive.
 * @param {string} filename - The name of the file
 * @param {string} filePath - Local absolute file path
 */
const uploadToGoogleDrive = async (filename, filePath) => {
  // Check if credentials exist in environment config
  if (
    !process.env.GOOGLE_DRIVE_CLIENT_ID ||
    !process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
    !process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  ) {
    console.log('Google Drive Backup skipped: Google credentials not configured in environment.');
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const accessToken = await getAccessToken();

    // 1. Create file metadata (specifically, name and parents folder if specified)
    const metadata = {
      name: filename,
      mimeType: 'application/json',
    };

    // Construct multipart form upload request body
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartRequestBody.length),
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive API response was not OK: ${response.statusText} - ${errText}`);
    }

    const resData = await response.json();
    console.log(`✔ Backup file successfully uploaded to Google Drive. File ID: ${resData.id}`);
    return resData.id;
  } catch (error) {
    console.error(`Google Drive Upload Error: ${error.message}`);
    return null;
  }
};

module.exports = {
  uploadToGoogleDrive,
};
