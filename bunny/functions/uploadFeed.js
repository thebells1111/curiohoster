import dotenv from 'dotenv';
import https from 'https';
import * as fsSync from 'fs';
import fetch from 'node-fetch';

dotenv.config();

// Ensure all necessary environment variables are set
if (
	!process.env.BUNNY_REGION ||
	!process.env.FEED_ZONE ||
	!process.env.FEED_API_KEY ||
	!process.env.FEED_URL ||
	!process.env.FEED_FILE
) {
	throw new Error('Missing one or more required environment variables.');
}

const REGION = process.env.BUNNY_REGION;
const BASE_HOSTNAME = 'storage.bunnycdn.com';
const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
const STORAGE_ZONE_NAME = process.env.FEED_ZONE;
const ACCESS_KEY = process.env.FEED_API_KEY;
const BUNNY_API_ACCOUNT_KEY = process.env.BUNNY_API_ACCOUNT_KEY;
const FEED_URL = process.env.FEED_URL.endsWith('/')
	? process.env.FEED_URL
	: process.env.FEED_URL + '/';
const FEED_FILE = process.env.FEED_FILE.startsWith('/')
	? process.env.FEED_FILE.substring(1)
	: process.env.FEED_FILE;

export default async function uploadFeed({ clientSocket }) {
	try {
		const options = {
			method: 'PUT',
			host: HOSTNAME,
			path: `/${STORAGE_ZONE_NAME}/${FEED_FILE}`,
			headers: {
				AccessKey: ACCESS_KEY,
				'Content-Type': 'application/rss+xml'
			}
		};

		const fileStats = fsSync.statSync('./feed.xml');
		const totalSize = fileStats.size;
		let uploadedSize = 0;

		const readStream = fsSync.createReadStream('./feed.xml');

		readStream.on('data', (chunk) => {
			uploadedSize += chunk.length;
			const progress = (uploadedSize / totalSize) * 100;
			clientSocket.emit('feedUploadProgress', { progress, uploadedSize, totalSize });
		});

		await new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				let responseBody = '';

				res.on('data', (chunk) => {
					responseBody += chunk.toString('utf8');
				});

				res.on('end', async () => {
					if (res.statusCode === 200 || res.statusCode === 201) {
						let purgeData = await purgeCDN(FEED_URL + FEED_FILE);
						console.log('purgeData: ', purgeData);
						resolve(); // Resolve on successful completion
					} else {
						reject(new Error(`Request failed with status code: ${res.statusCode}`));
					}
				});
			});

			req.on('error', (error) => {
				console.error(error);
				clientSocket.emit('bunnySaving', { saving: false });
				reject(error);
			});

			readStream.on('error', (error) => {
				console.error('ReadStream error:', error);
				reject(error);
			});

			readStream.pipe(req);
		});
	} catch (error) {
		console.error('Upload error:', error);
		throw error; // Rethrow to handle externally if needed
	}
}

async function purgeCDN(url) {
	const _url = `https://api.bunny.net/purge?url=${encodeURIComponent(url)}`;
	const options = {
		method: 'GET',
		headers: { accept: 'application/json', AccessKey: BUNNY_API_ACCOUNT_KEY }
	};

	try {
		let res = await fetch(_url, options);
		console.log(_url);
		const data = res.status;
		console.log(data);
		return data;
	} catch (error) {
		throw error;
	}
}
