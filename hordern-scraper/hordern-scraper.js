const axios = require('axios');
const cheerio = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');

async function searchAndExport() {
	let results = [];

	let response = await axios.post(
		"https://fa8p3nc719-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.8.2)%3B%20Browser%3B%20instantsearch.js%20(4.8.7)%3B%20JS%20Helper%20(3.3.2)",
		'{"requests":[{"indexName":"wpprod_searchable_posts","params":"hitsPerPage=50&facetFilters=%5B%22post_type%3Aevent%22%5D&filters=timestamp%20%3E%201702179354&query=&maxValuesPerFacet=10&highlightPreTag=__ais-highlight__&highlightPostTag=__%2Fais-highlight__&facets=%5B%22taxonomies.eventcategory%22%5D&tagFilters="}]}',
		{
		"headers": {
			"accept": "*/*",
			"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
			"content-type": "application/x-www-form-urlencoded",
			"sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": "\"macOS\"",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "cross-site",
			"x-algolia-api-key": "5c63ce42283785b4c79f5d88cabaaf43",
			"x-algolia-application-id": "FA8P3NC719",
			"Referer": "https://thehordern.com.au/",
			"Referrer-Policy": "strict-origin-when-cross-origin"
		},
		"method": "POST"
		}
	);

	let data = response.data.results[0];

    data.hits.forEach((element, i) => {
      let src = element;
      let result = {};
      result['Date'] = new Date(src['timestamp']*1000).toLocaleDateString();
      result['Venue'] = 'Hordern Pavilion';
      result['Performers'] = src['post_title'] + ' ' + src['subtitle'];
      result['URL'] = src['ticket_link'].url;
      result['IsFree'] = false;
      results.push(result);
    });

	// Export the results to a CSV file
	const csv = new ObjectsToCsv(results);
	await csv.toDisk('./search_results.csv', { append: false });
}

searchAndExport().then(() => {
	console.log('Search results exported to CSV file!');
}).catch((error) => {
	console.error(error);
});