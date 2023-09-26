const axios = require('axios');
const cheerio = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');
const nlp = require('compromise');
const https = require('https');
const titleCase = require("title-case");
let results = [];
let reqs = 0;

function createCustomTimeout(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

const searchUrls = 
[
  'https://www.enmoretheatre.com.au/?s&key=upcoming',
  'https://www.factorytheatre.com.au/?s&key=upcoming',
  'https://www.metrotheatre.com.au/?s&key=upcoming'
];

async function searchAndExport() {

  const csv = new ObjectsToCsv(results);
  for (const url of searchUrls) {
    // Perform the initial search and retrieve the total number of pages
    let response = await axios.get(url)
    let $ = cheerio.load(response.data);

    for (const element in $(".evt-card")) {
      await createCustomTimeout(50);
      let src = $(".evt-card:eq(" + element + ")");
      let gigUrl = src.attr('href');

      if (!gigUrl) continue;

      let gigResponse = await axios.get(gigUrl)
      let $$ = cheerio.load(gigResponse.data);
      let dates = $$('.sessions.show-for-small-only .session-date');
      for (let idx = 0; idx<dates.length;idx++) {
        let result = {};
        result['Date'] = $$(dates[idx]).text();
        result['Venue'] = $$('aside h5.session-title:eq(0)').text();
        result['Performers'] = $$('h1.title').text() + ' + ' + $$('.subtitle.supporting-artist').text().replace("Supported by: ", "");
        result['URL'] = gigUrl;
        result['IsFree'] = false;
        results.push(result);
        console.log(JSON.stringify(result));
      }
    }
  }
  csv.toDisk('./search_results.csv', { append: false });
}

// Example usage:
searchAndExport().then(() => {
  console.log('Search results exported to CSV file!');
}).catch((error) => {
  console.error(error);
});