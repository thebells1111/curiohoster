import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import lockfile from 'proper-lockfile';
import uploadFeed from './uploadFeed.js';

let buildOptions = {
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	ignoreAttributes: false,
	format: true,
	indentBy: '  ',
	processEntities: false,
	supressEmptyNode: true,
	allowBooleanAttributes: true,
	suppressBooleanAttributes: false,
	attributeValueProcessor: (name, val, jPath) => escapeAttr(name, val, jPath),
	tagValueProcessor: (name, val, jPath) => escapeTag(name, val, jPath)
};

const escapeAttr = (name, val, jPath) => {
	return `${val}`.replace(
		/[&<>'"]/g,
		(tag) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				"'": '&#39;',
				'"': '&quot;'
			}[tag])
	);
};

const escapeTag = (name, val, jPath) => {
	let str = `${val}`;
	if (str.match(/[&<>'"]/g)) {
		return '<![CDATA[' + str + ']]>';
	}
	return str;
};

const options = {
	ignoreAttributes: false
};

export default async function createFeed({
	title,
	description,
	personValue,
	enclosure,
	chapters,
	vts,
	totalDuration,
	guid,
	clientSocket
}) {
	const filePath = './feed.xml';

	try {
		await lockfile.lock(filePath, { retries: { retries: 30, maxTimeout: 10000 } });
		let feedFile = fs.readFileSync(filePath, 'utf8'); // Read the current feed
		const parser = new XMLParser(options);
		let feed = parser.parse(feedFile);

		let item = {
			pubDate: new Date().toUTCString().split(' GMT')[0] + ' +0000',
			'podcast:season': 1,
			'podcast:episode': Array.isArray(feed.rss.channel.item)
				? feed.rss.channel.item.length + 1
				: feed.rss.channel.item
				? 2
				: 1,
			guid: {
				'#text': guid, // Make sure guid is defined
				'@_isPermaLink': 'false'
			},
			title,
			description,
			enclosure: {
				'@_url': enclosure.url,
				'@_type': 'audio/mpeg',
				'@_length': enclosure.filesize
			},
			'itunes:duration': totalDuration || 0,
			'itunes:explicit': vts.explicit || 'no',
			'podcast:value': {
				'podcast:valueTimeSplit': vts.vts || [],
				'podcast:valueRecipient': [
					{
						'@_type': 'node',
						'@_name': 'Songs For Young Lovers',
						'@_address': '030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3',
						'@_customKey': '696969',
						'@_customValue': 'eChoVKtO1KujpAA5HCoB',
						'@_split': '50'
					}
				],
				'@_type': 'lightning',
				'@_method': 'keysend'
			}
		};

		item['podcast:value']['podcast:valueRecipient'].push(personValue);
		item['podcast:chapters'] = { '@_url': chapters.url, '@_type': 'application/json' };
		feed.rss.channel.item = [item].concat(feed.rss.channel.item);

		const builder = new XMLBuilder(buildOptions);
		const xmlFile = builder.build(feed);

		fs.writeFileSync(filePath, xmlFile, 'utf8');
		await uploadFeed({ clientSocket });
		return feed;
	} catch (error) {
		console.error('Error while creating feed:', error);
	} finally {
		await lockfile.unlock(filePath);
	}
}
