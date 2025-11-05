const puppeteer = require('puppeteer');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const express = require('express');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.use(express.static('public'));

const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:8080', 'https://rabbitgang.vercel.app'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.listen(port, '0.0.0.0', () => {
    console.log(`LCGC-BE app listening on port ${port}`)
})

app.get('/ping', (req, res) => {
    console.log(`UptimeRobot ping request received`)
  	res.status(200).send('ok');
});

require('dotenv').config();
const { uploadToR2 } = require('./r2_upload');

const supabase = require('./supabase.js');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const getLogData = async() => {
	const { data, error } = await supabase
		.from('lcg_match_log')
		.select('lcg_game_id, lcg_game_ver, lcg_game_date')
		.order("lcg_game_id", { ascending: false })
		.limit(1);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getEtcData = async() => {
	const { data, error } = await supabase
		.from("lcg_match_etc")
		.select("lcg_main_image, lcg_sub_image, lcg_r2_image")
		.order("lcg_update_date", { ascending: false })
		.limit(1);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getTeamData = async(gameId) => {
	const { data, error } = await supabase
		.from("lcg_match_team")
		.select("*")
		.eq("lcg_game_id", gameId);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getMainData = async(gameId) => {
	const { data, error } = await supabase
		.rpc("match_history")
		.select("*")
		.eq("lcg_game_id", gameId);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getFearlessData = async(gameSet) => {
	const { data, error } = await supabase
		.from("lcg_match_main")
		.select("row_num, lcg_game_set, lcg_champion_name, lcg_line_order")
		.like("lcg_game_set", `%${gameSet}%`);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getLatestFearlessData = async(gameSet) => {
	const { data, error } = await supabase
		.from("lcg_match_main")
		.select("lcg_game_set, lcg_champion_name, lcg_line_order")
		.like("lcg_game_set", `%${gameSet}%`)
		.order("lcg_game_id", { ascending: false })
		.limit(1);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getGameDurationMin = (duration) => {
    let minute = Math.floor(duration / 60);
    const second = duration % 60;
    if(second > 30) {
        minute += 1;
    }
    return minute;
}

const getLatestGameSet = () => {
	const calcDay = new Date(new Date().getTime() - 4 * 60 * 60 * 1000);
	const gameSet = (calcDay.getMonth()+1) + "/" + String(calcDay.getDate()).padStart(2, "0");
    return gameSet;
}

const sendToDiscord = async (type, originPath, imageUrl) => {
    try {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');  // 0부터 시작하므로 +1
		const day = String(today.getDate()).padStart(2, '0');
		const date = `${year}-${month}-${day}`;

        const form = new FormData();
		let webhookUrl = '';

/*
		if(type === "M") {
        	form.append('file', fs.createReadStream(file));
		} else if(type === "S") {
        	form.append('file', file, { filename: 'capture.png' });
		}
*/
		if(type === "H") {
			form.append('content', `${date} 최신 전적 업데이트!\n사이트이동 -> https://rabbitgang.vercel.app\n${imageUrl}`);
			webhookUrl = process.env.DISCORD_WEBHOOK_URL_HISTORY;
		} else if(type === "F") {
			form.append('content', `${date} 피어리스 업데이트!\n${imageUrl}`);
			webhookUrl = process.env.DISCORD_WEBHOOK_URL_FEARLESS;
		} else if(type === "S") {
			form.append('content', `${date} 팀 셔플 결과\n${imageUrl}`);
			webhookUrl = process.env.DISCORD_WEBHOOK_URL_TEST;
		}
		webhookUrl = process.env.DISCORD_WEBHOOK_URL_TEST; // TEST

        await axios.post(webhookUrl, form, {
            headers: form.getHeaders()
        });
		if(type === "H" || type === "F") {
			fs.unlinkSync(originPath);
		} 

        console.log('Discord transfer complete!');
    } catch (error) {
        console.error('Discord transmission failed : ', error.message);
    }
};

// 최신 전적 이미지 캡쳐
const capture_history = async () => {
    const browser = await puppeteer.launch({
	    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
	    headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
		await page.setViewport({ width: 1500, height: 700 });
        await page.goto('http://localhost:8080/history', {
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

		await page.evaluate(() => {
			return Promise.all(
				Array.from(document.images).map(img => {
				if (img.complete) return Promise.resolve();
					return new Promise((resolve) => {
						img.onload = resolve;
						img.onerror = resolve;
					});
				})
			);
		});

        await page.waitForSelector('.match_history', { timeout: 10000 }); 

        const filename = `screenshots/screenshot-${Date.now()}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`Capture Success : ${filename}`);
		
        const imageUrl = await uploadToR2('H', filename);
        console.log(`Uploaded to R2: ${imageUrl}`);

		await sendToDiscord("H", filename, imageUrl);
    } catch (err) {
        console.error('Capture Fail :', err.message);
    } finally {
        await browser.close();
    }
}

// 피어리스 이미지 캡쳐
const capture_fearless = async () => {
	//const gameSet = getLatestGameSet();
	const gameSet = "10/02"; // TEST
	const mainData = await getLatestFearlessData(gameSet);
	console.log(gameSet);
	console.log(mainData);
	if(mainData.length > 0) {
		const setCount = Number(mainData[0].lcg_game_set.split("_")[1]);
		
		const heightAdd = 150;
		const heightCalc = 140 + (heightAdd * setCount);
		
		const browser = await puppeteer.launch({
	    	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
	    	headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});

		const page = await browser.newPage();

		try {
			await page.setViewport({ width: 850, height: heightCalc });
			await page.goto('http://localhost:8080/fearless', {
				waitUntil: 'networkidle2',
				timeout: 60000 
			});

			await page.evaluate(() => {
				return Promise.all(
					Array.from(document.images).map(img => {
					if (img.complete) return Promise.resolve();
						return new Promise((resolve) => {
							img.onload = resolve;
							img.onerror = resolve;
						});
					})
				);
			});

			await page.waitForSelector('.match_fearless', { timeout: 10000 }); 

			const filename = `screenshots/screenshot-${Date.now()}.png`;
			await page.screenshot({ path: filename, fullPage: true });
			console.log(`Capture Success : ${filename}`);
			
			const imageUrl = await uploadToR2('F', filename);
			console.log(`Uploaded to R2: ${imageUrl}`);

			await sendToDiscord("F", filename, imageUrl);
		} catch (err) {
			console.error('Capture Fail :', err.message);
		} finally {
			await browser.close();
		}
	} else {
		console.log(`Capture Fail : No Data`);
	}
}

// 최신 전적 이미지 생성
app.get('/history', async (req, res) => {
	res.set('Content-Type', 'text/html; charset=utf-8');

	const logData = await getLogData();
	const gameId = logData[0].lcg_game_id;
	const etcData = await getEtcData();
	const teamData = await getTeamData(gameId);
	const mainData = await getMainData(gameId);

	const lcgGameDate = logData[0].lcg_game_date.substring(0, 10);
	const lcgGameVer = logData[0].lcg_game_ver;
	const lcgGameDurationMin = getGameDurationMin(mainData[0].lcg_game_duration);
	const lcgGameDurationSec = String(mainData[0].lcg_game_duration % 60).padStart(2, '0');
	const imageUrl = etcData[0].lcg_r2_image;
    const imageUrl1 = etcData[0].lcg_main_image;
    const imageUrl2 = etcData[0].lcg_sub_image;

	res.render("history", { lcgGameDate, lcgGameVer, lcgGameDurationMin, lcgGameDurationSec, imageUrl, imageUrl1, imageUrl2, teamData, mainData });
});

// 피어리스 이미지 생성
app.get('/fearless', async (req, res) => {
	res.set('Content-Type', 'text/html; charset=utf-8');
	// const gameSet = getLatestGameSet();
	const gameSet = "10/02"; // TEST

	const logData = await getLogData();
	const gameId = logData[0].lcg_game_id;
	const etcData = await getEtcData();
	const mainData = await getFearlessData(gameSet);
	mainData.sort((a, b) => a.row_num - b.row_num);

	const lcgGameDate = logData[0].lcg_game_date.split("/")[0];
    const imageUrl1 = etcData[0].lcg_main_image;
    const imageUrl2 = etcData[0].lcg_sub_image;
	const dataLength = mainData.length;

	res.render("fearless", { lcgGameDate, imageUrl1, imageUrl2, mainData, dataLength });
});

// NextJS로부터 Shuffle IMAGE 수신
app.post('/send-image', upload.single('imageFile'), async (req, res) => {
    try {
        const message = req.body.message;  // formData의 message 필드
        const file = req.file;             // 업로드된 파일 정보

        if (!file) {
            return res.status(400).json({ message: 'Empty file' });
        }

        console.log('Message :', message);
        console.log('File name :', file.originalname);
        console.log('File size :', file.size);
		
        const imageUrl = await uploadToR2('S', file.buffer);
        console.log(`Uploaded to R2: ${imageUrl}`);

		await sendToDiscord("S", file.originalname, imageUrl);

        res.status(200).json({ message: 'Image received successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

let testChannel = null;
let testReconnectTimeout = null;
let realChannel = null;
let realReconnectTimeout = null;

const realtime_test = () => {
    if (testChannel) {
        console.log('Removing existing realtime channel before creating new one.');
        supabase.removeChannel(testChannel);
        testChannel = null;
    }
    
    testChannel = supabase
        .channel('test_channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'test',
            },
            (payload) => {
                console.log(payload);
                capture_history();
                capture_fearless();
            }
        )
        .on('error', (error) => {
            console.error('Realtime subscription error:', error);
            reconnect();
        })
        .on('close', () => {
            console.warn('Realtime subscription closed.');
            reconnect();
        })
        .subscribe(status => {
            console.log('Realtime subscription status:', status);
            if (status === 'SUBSCRIBED' && testReconnectTimeout) {
                clearTimeout(reconnectTtestReconnectTimeoutimeout);
                testReconnectTimeout = null;
            }
        });

    function reconnect() {
        if (testReconnectTimeout) return; // 이미 재접속 예약 중이면 무시
        
        console.log('Attempting to reconnect in 3 seconds...');
        testReconnectTimeout = setTimeout(() => {
            testReconnectTimeout = null;
            console.log('Reconnecting now...');
            realtime_test();
        }, 3000);
    }
};

const realtime_real = () => {
    if (realChannel) {
        console.log('Removing existing realtime channel before creating new one.');
        supabase.removeChannel(realChannel);
        realChannel = null;
    }
    
    realChannel = supabase
		.channel('real_channel')
		.on(
			'postgres_changes',
			{
				event: 'INSERT', 
				schema: 'public',
				table: 'lcg_match_info',
			},
			(payload) => {
				console.log(payload);
				capture_history();
				capture_fearless();
			}
		)
        .on('error', (error) => {
            console.error('Realtime subscription error:', error);
            reconnect();
        })
        .on('close', () => {
            console.warn('Realtime subscription closed.');
            reconnect();
        })
        .subscribe(status => {
            console.log('Realtime subscription status:', status);
            if (status === 'SUBSCRIBED' && realReconnectTimeout) {
                clearTimeout(realReconnectTimeout);
                realReconnectTimeout = null;
            }
        });

    function reconnect() {
        if (realReconnectTimeout) return; // 이미 재접속 예약 중이면 무시
        
        console.log('Attempting to reconnect in 3 seconds...');
        realReconnectTimeout = setTimeout(() => {
            realReconnectTimeout = null;
            console.log('Reconnecting now...');
            realtime_real();
        }, 3000);
    }
}

realtime_test();
realtime_real();
