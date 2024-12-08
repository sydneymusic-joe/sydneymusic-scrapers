const axios = require('axios');
const cheerio = require('cheerio');
const ObjectsToCsv = require('objects-to-csv');
const urlencode = require('urlencode');

const venues = 
[
	"Brass Monkey",
	"Crowbar Sydney",
	"The Chippo Hotel",
	"The Great Club",
	"Waywards (The Bank Hotel)",
	"The House of Music & Booze",
	"Bootleggers",
	"Manning Bar",
	"Marrickville Bowling Club",
	"The Factory Theatre",
	"Golden Age Cinema & Bar",
	"Paddo Lounge (Paddington RSL)",
	"AVALON RSL",
	"Manly Leagues Club",
	"Max Watt's Sydney",
	"The Bridge Hotel, Rozelle",
	"Oxford Art Factory",
	"The Vanguard",
	"UNSW Roundhouse",
	"Upstairs Beresford",
	"Vic on The Park Hotel",
	"The Royal Bondi",
	"Low 302",
	"The Midnight Special",
	"Dee Why RSL Club",
	"Museum of Contemporary Art Australia",
	"The Ivy POOL",
	"Mary's Underground",
	"Penrith Paceway",
	"Terrey Hills Tavern",
	"The Ivy CLUB",
	"The Lord Gladstone Hotel",
	"The Metro Theatre",
	"Botany View Hotel",
	"The Lady Hampshire",
	"Hermanns Bar- Sydney Uni",
	"Selina's - Coogee Bay Hotel",
	"Paddo RSL",
	"Miranda Hotel",
	"Norfolk Hotel",
	"MoshPit",
	"Henson Park",
	"Highfield Caringbah",
	"Huxley's",
	"The Duke of Enmore",
	"Yia Yia's Dive Bar & Kitchen",
	"LABEL.",
	"Simo's Dive - King St Wharf 3",
	"Centennial Park Sydney",
	"Hotel Steyne",
	"Beach Road Hotel, Bondi",
	"Ettamogah Hotel",
	"Lansdowne Hotel",
	"New Brighton Hotel",
	"Red Rattler Theatre",
	"Darling Nikki's"
];

async function searchAndExport() {
	let results = [];

	for (const venue in venues) {
		let page = 0;
		let resultCount = 20;

		while (resultCount > 0) {
			console.log (venues[venue] + ' page ' + page);
			let response = await axios.post(
				"https://icgfyqwgtd-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.11.0)%3B%20Browser%20(lite)%3B%20instantsearch.js%20(4.33.2)%3B%20Vue%20(3.2.22)%3B%20Vue%20InstantSearch%20(4.1.1)%3B%20JS%20Helper%20(3.6.2)&x-algolia-api-key=bc11adffff267d354ad0a04aedebb5b5&x-algolia-application-id=ICGFYQWGTD",
				`{
					"requests":
					[
						{
							"indexName":"prod_oztix_eventguide",
							"params":"maxValuesPerFacet=20&highlightPreTag=__ais-highlight__&highlightPostTag=__%2Fais-highlight__&page=${page}&query=&facets=%5B%22Venue.State%22%2C%22Categories%22%2C%22Bands%22%2C%22Venue.Name%22%5D&tagFilters=&facetFilters=%5B%5B%22Venue.Name%3A${urlencode.encode(venues[venue])}%22%5D%5D"
						}
					]
				}`,
				{
				"headers": {
					"accept": "*/*",
					"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
					"content-type": "application/x-www-form-urlencoded",
					"sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": "\"macOS\"",
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "cross-site",
					"Referer": "https://www.oztix.com.au/",
					"Referrer-Policy": "strict-origin-when-cross-origin"
				},
				"method": "POST"
				}
			);

			let data = response.data.results[0];
			resultCount = data.hits.length;
			console.log(resultCount);

			data.hits.forEach((element, i) => {
				let src = element;
				let result = {};
				result['Date'] = src['DateStart'];
				result['Venue'] = venues[venue];
				result['Performers'] = src['EventName'] + ' + ' + src['SpecialGuests'];
				result['URL'] = src['EventUrl'].replace('utm_medium=Website', 'utm_medium=EventFeed').replace('utm_source=Oztix', 'utm_source=SydneyMusic');
				result['IsFree'] = src['PriceFrom'] == 0;
				results.push(result);
			});

			page++;
		}
	}

	// Export the results to a CSV file
	const csv = new ObjectsToCsv(results);
	await csv.toDisk('./scrape-oztix.csv', { append: false });
}


searchAndExport().then(() => {
	console.log('Search results exported to CSV file!');
}).catch((error) => {
	console.error(error);
});