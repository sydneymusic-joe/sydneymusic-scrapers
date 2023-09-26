const axios = require('axios');
const cheerio = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');
const nlp = require('compromise');

const searchUrls = 
[
  '867',
  '26',
  '4775',
  '4865',
  '7619',
  '2247',
  '7848',
  '756',
  '4689',
  '8977',
  '12',
  '343',
  '17',
  '9268',
  '6422',
  '7278',
  '9407',
];

async function searchAndExport() {
  let results = [];

  for (var idx in searchUrls) {
    // Perform the initial search and retrieve the total number of pages
    let response = await axios.get('https://www.moshtix.com.au/v2/venues/venue/' + searchUrls[idx]);
    let $ = cheerio.load(response.data);

    $ = cheerio.load(response.data);
    $("script[type='application/ld+json']").each((i, element) => {
      let src = JSON.parse(element.children[0].data)[0];
      let result = {};
      result['Date'] = src.startDate;
      result['Venue'] = src.location.name;
      result['Performers'] = src.name;
      result['URL'] = src.url;
      result['IsFree'] = src.offers.length > 0 ? parseInt(src.offers[0].price) == 0 : false;
      results.push(result);
    });
  }

  // Export the results to a CSV file
  const csv = new ObjectsToCsv(results);
  await csv.toDisk('./search_results.csv', { append: false });
}

// Example usage:
searchAndExport().then(() => {
  console.log('Search results exported to CSV file!');
}).catch((error) => {
  console.error(error);
});