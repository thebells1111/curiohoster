import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const REGION = process.env.BUNNY_REGION;
const BASE_HOSTNAME = 'storage.bunnycdn.com';
const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE;
const ACCESS_KEY = process.env.BUNNY_API_KEY;

export default async function uploadChapters({ chaptersFile, clientSocket, guid, FILES_URL }) {
	try {
		const data = Buffer.from(JSON.stringify(chaptersFile), 'utf-8');

		const uploadResult = await uploadToBunny(data, guid, clientSocket);
		return {
			success: true,
			url: `${FILES_URL}chapters/${guid}.json`
		};
	} catch (err) {
		console.log(err);
		throw err;
	}
}

async function uploadToBunny(data, fileName, clientSocket) {
	return new Promise((resolve, reject) => {
		const options = {
			method: 'PUT',
			host: HOSTNAME,
			path: `/${STORAGE_ZONE_NAME}/chapters/${fileName}.json`,
			headers: {
				AccessKey: ACCESS_KEY,
				'Content-Type': 'application/json+chapters'
			}
		};

		let uploaded = 0;
		const totalLength = data.byteLength;
		const chunkSize = 524288;

		const req = https.request(options, (res) => {
			let result = '';
			res.on('data', (chunk) => {
				result += chunk.toString('utf8');
			});
			res.on('end', () => {
				clientSocket.emit('chapterSaving', { saving: false });
				resolve(result);
			});
		});

		req.on('error', (error) => reject(error));
		for (let offset = 0; offset < totalLength; offset += chunkSize) {
			const chunk = data.slice(offset, offset + chunkSize);
			req.write(chunk);
			uploaded += chunk.byteLength;
			const percentage = (uploaded / totalLength) * 100;
			clientSocket.emit('uploadProgress', { file: fileName, percentage });
		}

		req.end();
		clientSocket.emit('chapterSaving', { saving: true });
	});
}
