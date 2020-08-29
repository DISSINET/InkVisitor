/**
 ** most parts copied from https://developers.google.com/sheets/api/quickstart/nodejs
 */

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
var readlineSync = require("readline-sync");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const TOKEN_PATH = "import/util/token.json";
const CREDENTIALS_PATH = "import/util/credentials.json";

// Load client secrets from a local file.
module.exports.loadSheet = async ({ spread, sheet }) => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const auth = await authorize(credentials);

  const sheets = google.sheets({ version: "v4", auth });

  let res = false;
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId: spread,
      range: sheet + "!A:ZZ",
    });
  } catch (e) {
    console.error("error loading table", spread, sheet);
    console.error(e);
  }

  const data = res.data.values.filter(
    (row) => row.filter((value) => value && value !== "#N/A").length > 1
  );

  // divide data to rows and header
  const header = data[0];
  const rows = data.filter((r, ri) => ri !== 0);

  // change rows to objects
  const records = rows
    .map((row) => {
      const record = {};
      row.map((val, vi) => {
        record[header[vi]] = val;
      });
      return record;
    })
    /**
     * filter out "empty" rows
     * TODO: should be changed after tables will refactor
     */
    .filter((row) => row.id_action_or_relation || row.label);

  return records;
};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
const authorize = async (credentials) => {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  try {
    const tokenFile = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(tokenFile));
    return oAuth2Client;
  } catch (e) {
    const newToken = await getNewToken(oAuth2Client);
    return newToken;
  }
};

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
var getNewToken = async (oAuth2Client) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);

  var code = readlineSync.question("Enter the code from that page here: ", {
    hideEchoBack: true,
  });

  const { err, token } = await this.oAuth2Client.getToken(code);

  if (err)
    return console.error("Error while trying to retrieve access token", err);
  oAuth2Client.setCredentials(token);
  // Store the token to disk for later program executions
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) return console.error(err);
    console.log("Token stored to", TOKEN_PATH);
  });
  return oAuth2Client;
};
