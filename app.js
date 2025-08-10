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

const allowedOrigins = ['http://localhost:3001', 'https://rabbitgang.vercel.app'];
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
    console.log(`Test app listening on port ${port}`)
})

const supabase = require('./supabase.js');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const getLogData = async() => {
	const { data, error } = await supabase
		.from('lcg_match_log')
		.select('*')
		.eq("lcg_game_id", 7710221890);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getInfoData = async() => {
	const { data, error } = await supabase
		.from("lcg_match_info")
		.select("lcg_game_id, lcg_ver_main, lcg_game_duration, lcg_max_gold, lcg_max_crowd, lcg_max_dpm, lcg_max_gpm, lcg_max_dpg, lcg_max_damage_total, lcg_max_damage_taken")
		.eq("lcg_game_id", 7710221890);

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
		.select("lcg_cdn, lcg_lang, lcg_main_ver, lcg_main_image, lcg_sub_image, lcg_update_player, lcg_update_data")
		.order("lcg_update_date", { ascending: false })
		.limit(1);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getTeamData = async() => {
	const { data, error } = await supabase
		.from("lcg_match_team")
		.select("*")
		.eq("lcg_game_id", 7710221890);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getMainData = async() => {
	const { data, error } = await supabase
		.from("lcg_match_main")
		.select("*")
		.eq("lcg_game_id", 7710221890);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getSubData = async() => {
	const { data, error } = await supabase
		.from("lcg_match_sub")
		.select("*")
		.eq("lcg_game_id", 7710221890);

	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

const getPlayerData = async() => {
	const { data, error } = await supabase
		.from("lcg_player_data")
		.select("lcg_summoner_puuid, lcg_player, lcg_summoner_name, lcg_summoner_nickname, lcg_player_hide");

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

const sendToDiscord = async (type, file) => {
    try {
		const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');  // 0부터 시작하므로 +1
		const day = String(today.getDate()).padStart(2, '0');
		const date = `${year}-${month}-${day}`;

        const form = new FormData();

		if(type === "M") {
        	form.append('file', fs.createReadStream(file));
		} else if(type === "S") {
        	form.append('file', file, { filename: 'capture.png' });
		}
        form.append('content', `${date} 최신 전적 업데이트!`);

        await axios.post(webhookUrl, form, {
            headers: form.getHeaders()
        });

        console.log('Discord transfer complete!');
    } catch (error) {
        console.error('Discord transmission failed : ', error.message);
    }
};

// 최신 전적 이미지 캡쳐
const capture = async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
		await page.setViewport({ width: 850, height: 900 });
        await page.goto('http://localhost:8080/main', {
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

		await sendToDiscord("M", filename);
    } catch (err) {
        console.error('Capture Fail :', err.message);
    } finally {
        await browser.close();
    }
}

// 최신 전적 이미지 생성
app.get('/main', async (req, res) => {
	res.set('Content-Type', 'text/html; charset=utf-8');

	const logData = await getLogData();
	const infoData = await getInfoData();
	const etcData = await getEtcData();
	const teamData = await getTeamData();
	const mainData = await getMainData();
	const subData = await getSubData();
	const playerData = await getPlayerData();

	const lcgGameDate = logData[0].lcg_game_date.substring(0, 10);
	const lcgGameVer = logData[0].lcg_game_ver;
	const lcgGameDurationMin = getGameDurationMin(infoData[0].lcg_game_duration);
	const lcgGameDurationSec = String(infoData[0].lcg_game_duration % 60).padStart(2, '0');
    const imageUrl1 = etcData[0].lcg_main_image;
    const imageUrl2 = etcData[0].lcg_sub_image;
	const lcgMaxDamageTotal = infoData[0].lcg_max_damage_total;
	const lcgMaxDamageTaken = infoData[0].lcg_max_damage_taken;

	res.render("main", { lcgGameDate, lcgGameVer, lcgGameDurationMin, lcgGameDurationSec, imageUrl1, imageUrl2, lcgMaxDamageTotal, lcgMaxDamageTaken, teamData, mainData, subData, playerData });
});

// NextJS로 부터 Shuffle IAMGE 수신
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

		await sendToDiscord("S", file.buffer);

        res.status(200).json({ message: 'Image received successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

const realtime = () => {
    supabase
		.channel('schema-db-changes')
		.on(
			'postgres_changes',
			{
				event: 'INSERT', 
				schema: 'public',
				//table: 'lcg_match_info',
				table: 'test',
			},
			(payload) => {
				console.log(payload);
				capture();
			}
		)
		.subscribe()
}

realtime();