require('dotenv').config();

const multer = require('multer');
const cors = require('cors');
const express = require('express');
const supabase = require('./supabase.js');
const app = express();
const port = 8080;

const { getLogData, getEtcData, getMainData, getTeamData } = require('./queries/query-history.js');
const { getFearlessData, getGameExists  } = require('./queries/query-fearless.js');
const { getPlayerChampionData, getPlayerRelativeData, getGameSetData } = require('./queries/query-realTimeInfo.js');

const { uploadToR2 } = require('./capture/r2-upload.js');
const { sendToDiscord } = require('./discord/discord-send.js');
const { captureToView } = require('./capture/view-capture.js');
const client = require('./discord/discord-bot.js');
client.login(process.env.DISCORD_BOT_TOKEN);

const calcGameDurationMin = (duration) => {
    let minute = Math.floor(duration / 60);
    const second = duration % 60;
    if(second > 30) {
        minute += 1;
    }
    return minute;
}

const calcGameDay = () => {
    const calcDay = new Date(new Date().getTime() - 4 * 60 * 60 * 1000); // 현재 시간에서 -4시간
	const gameDay = String(calcDay.getFullYear()).substring(2) + "/" + (calcDay.getMonth()+1) + "/" + String(calcDay.getDate()).padStart(2, "0");
    return gameDay;
}

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:8080', 'https://rabbitgang.vercel.app'];
app.use(cors({
  	origin: function (origin, callback) {
    	if(!origin) return callback(null, true);
    	if(allowedOrigins.includes(origin)) {
      		return callback(null, true);
    	} else {
      		return callback(new Error('Not allowed by CORS'));
    	}
  	}
}));

app.listen(port, '0.0.0.0', () => {
    console.log(`LCGC-BE app listening on port ${port}`)
})

// Render health check
app.get('/health', (req, res) => {
  	res.status(200).send('ok');
});

// Render Sleep 방지
let uptimerobotCount = 0;
app.get('/ping1', (req, res) => {
  	res.status(200).send('ok');
	uptimerobotCount += 1;
    console.log(`UptimeRobot ping request received [5m]-(${uptimerobotCount})`)
});

app.get('/ping2', (req, res) => {
  	res.status(200).send('ok');
	uptimerobotCount += 1;
    console.log(`UptimeRobot ping request received [8m]-(${uptimerobotCount})`)
});

// Discord history screenshot 수동 동작 (gameId)
let passivityFlag = false;
let controlGameId = "";
app.get('/history-passivity', async (req, res) => {
	const gameId = req.query.gameid || 0;

	if(gameId !== 0) {
		console.log(`Passivity MatchHistroy screenshot send, GameID : ${gameId}`)

		passivityFlag = true;
		controlGameId = gameId;

		await captureToView('H', 0);

  		res.status(200).send('Passivity screenshot send ... ok');
	} else {
		console.log(`Missing GameID ...`)

  		res.status(400).send('Please insert gameid');
	}
});

// 최신 전적 이미지 생성
app.get('/history', async (req, res) => {
	res.set('Content-Type', 'text/html; charset=utf-8');

	const logData = await getLogData();
	let gameId;
	if(passivityFlag) {		
		gameId = controlGameId;
		passivityFlag = false;
	} else {
		gameId = logData[0].lcg_game_id;
	}
	const etcData = await getEtcData();
	const teamData = await getTeamData(gameId);
	const mainData = await getMainData(gameId);

	const lcgGameDate = logData[0].lcg_game_date.substring(0, 10);
	const lcgGameVer = logData[0].lcg_game_ver;
	const lcgGameDurationMin = calcGameDurationMin(mainData[0].lcg_game_duration);
	const lcgGameDurationSec = String(mainData[0].lcg_game_duration % 60).padStart(2, '0');
	const imageUrl = etcData[0].lcg_main_image;
    const imageUrl1 = etcData[0].lcg_main_image;
    const imageUrl2 = etcData[0].lcg_sub_image;

	res.render("history", { lcgGameDate, lcgGameVer, lcgGameDurationMin, lcgGameDurationSec, imageUrl, imageUrl1, imageUrl2, teamData, mainData });
});

// 피어리스 이미지 생성
app.get('/fearless', async (req, res) => {
	res.set('Content-Type', 'text/html; charset=utf-8');
	const gameDay = calcGameDay();
	// const gameDay = "25/10/02"; // TEST

	const logData = await getLogData();
	const gameId = logData[0].lcg_game_id;
	const etcData = await getEtcData();
	const mainData = await getFearlessData(gameDay);
	mainData.sort((a, b) => a.row_num - b.row_num);

	const lcgGameDate = logData[0].lcg_game_date.split("/")[0];
    const imageUrl1 = etcData[0].lcg_main_image;
    const imageUrl2 = etcData[0].lcg_sub_image;
	const dataLength = mainData.length;

	res.render("fearless", { lcgGameDate, imageUrl1, imageUrl2, mainData, dataLength });
});

// 실시간 게임 정보 생성
let realTimeInfo_req_data;
let result_champion;
let result_relative;
app.get('/realTimeInfo', async (req, res) => {
	res.set('Content-Type', 'text/html; charset=utf-8');

	const date = new Date();
	date.setHours(date.getHours() - 6);
	const targetDate = `${String(date.getFullYear()).slice(2)}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
	const gameSetData = await getGameSetData(targetDate);

	const currentDate = `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}.`;
	const currentSet = gameSetData.length > 0 ? Number(gameSetData[0].lcg_game_set.split("_")[1]) + 1 : 1;

	const kdaConversion = (kill, death, assist) => {
		return Number(((kill + assist) / death).toFixed(2));
	}

	const winningRate = (win, fail) => {
		return Number((win / (win + fail) * 100).toFixed(1));
	}

	const relativeRate = (type, win, fail) => {
		let resultRate;
		if(type === 'B') {
			resultRate = Number((win / (win + fail) * 100).toFixed(1));
		} else if(type === 'R') {
			resultRate = Number((fail / (win + fail) * 100).toFixed(1));
		}
		return resultRate;
	}

	const result = result_champion?.map(({ 
		lcg_summoner_puuid, lcg_summoner_nickname, lcg_champion_name,
		lcg_kill_count, lcg_death_count, lcg_assist_count,
		lcg_win_count, lcg_fail_count
	}) => {
		const bluePlayer = realTimeInfo_req_data.teamBlue.find(
			player => player.puuid === lcg_summoner_puuid
		);

		if (bluePlayer) {
			return {
				lane: bluePlayer.lane,
				team: 'BLUE',
				rate: winningRate(lcg_win_count, lcg_fail_count),
				kda: kdaConversion(lcg_kill_count, lcg_death_count, lcg_assist_count),
				lcg_summoner_puuid,
				lcg_summoner_nickname,
				lcg_champion_name,
				lcg_kill_count,
				lcg_death_count,
				lcg_assist_count,
				lcg_win_count,
				lcg_fail_count,
			};
		}

		const redPlayer = realTimeInfo_req_data.teamRed.find(
			player => player.puuid === lcg_summoner_puuid
		);

		if (redPlayer) {
			return {
				lane: redPlayer.lane,
				team: 'RED',
				rate: winningRate(lcg_win_count, lcg_fail_count),
				kda: kdaConversion(lcg_kill_count, lcg_death_count, lcg_assist_count),
				lcg_summoner_puuid,
				lcg_summoner_nickname,
				lcg_champion_name,
				lcg_kill_count,
				lcg_death_count,
				lcg_assist_count,
				lcg_win_count,
				lcg_fail_count,
			};
		}

		return {
			lcg_summoner_puuid,
			lane: null,
			team: null,
		};
	});

	const relative = result_relative?.map(({ 
		lcg_person_puuid, lcg_match_line, lcg_win_count, lcg_fail_count
	}) => {
		return {
			rateBlue: relativeRate('B', lcg_win_count, lcg_fail_count),
			rateRed: relativeRate('R', lcg_win_count, lcg_fail_count),
			lcg_person_puuid,
			lcg_match_line,
			lcg_win_count,
			lcg_fail_count,
		};
	});

	res.render("realTimeInfo", { currentDate, currentSet, result, relative });
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// LCGV로부터 Shuffle TeamResult 수신
app.post('/send-shuffle', async (req, res) => {
    try {
		const data = req.body;
		let result = "";
		for(let i=0; i<data.length; i++) {
			for(let j=0; j<data[i].list.length; j++) {
				result += data[i].list[j];
				if(data[i].list.length-1 !== j) {
					result += " ";
				}
			}
			if(data.length-1 !== i) {
				result += " VS ";
			}
		}

        console.log('Result :', result);

		await sendToDiscord("R", "", result);

        res.status(200).json({ message: 'TeamResult received successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// LCGS로부터 RealTimeInfo 수신
app.post('/send-realTimeInfo', async (req, res) => {
    try {
		const data = req.body;
		realTimeInfo_req_data = data;

		const playerData_champion = [
			...data.teamBlue, 
			...data.teamRed
		].map(({ puuid, championId }) => ({
			puuid,
			championId,
		}));

		const playerData_relative = data.teamBlue.map((bluePlayer) => {
			const redPlayer = data.teamRed.find(
				(redPlayer) => redPlayer.lane === bluePlayer.lane
			);

			return {
				lane: bluePlayer.lane,
				bluePuuid: bluePlayer.puuid,
				redPuuid: redPlayer?.puuid,
			};
		});

		result_champion = await getPlayerChampionData(playerData_champion);
		result_relative = await getPlayerRelativeData(playerData_relative);

        // await captureToView('I', 0);

        res.status(200).json({ message: 'RealTimeInfo received successfully' });
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
            async (payload) => {
                console.log(payload);
				await captureToView('H', 0);
				const gameDay = calcGameDay();
				// const gameDay = "25/10/02"; // TEST
				const mainData = await getGameExists(gameDay);
				console.log(gameDay);
				console.log(mainData);
				if(mainData.length > 0) {
					await captureToView('F', Number(mainData[0].lcg_game_set.split("_")[1]));
				} else {
					console.log(`${gameDay} 경기 내역이 없습니다.`);
				}
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
                clearTimeout(testReconnectTimeout);
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
            async (payload) => {
                console.log(payload);
				await captureToView('H', 0);
				const gameDay = calcGameDay();
				// const gameDay = "25/10/02"; // TEST
				const mainData = await getGameExists(gameDay);
				console.log(gameDay);
				console.log(mainData);
				if(mainData.length > 0) {
					await captureToView('F', Number(mainData[0].lcg_game_set.split("_")[1]));
				} else {
					console.log(`${gameDay} 경기 내역이 없습니다.`);
				}
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
