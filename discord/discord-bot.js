require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const supabase = require('../supabase.js');
const champion = require('./discord-champion.js');

const getMatchSearchData = async(target) => {
	const { data, error } = await supabase
		.rpc('match_search', {
          search_nickname: target
        });
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

// Ranking 출력
const convertMvpRank = (target) => {
	let result = '';
	if(target.includes('M')) {
		result = '\u001b[1;33mMVP\u001b[0m';
	} else if(target.includes('A')) {
		result = '\u001b[1;35mAce\u001b[0m';
	} else {
		result = target.substring(1) + 'th';
	}
	return result;
};

// 텍스트 강조
const highlightText = (type, target) => {
  if(type === 'V') return target;
  if(type === 'W') return target >= 50 ? `\u001b[1;36m${target}\u001b[0m` : target;
  if(target >= 100) {
    target = `\u001b[1;33mPerfect\u001b[0m`;
  } else if(target > 3) {
    target = `\u001b[1;36m${target.toFixed(2)}\u001b[0m`;
  } else {
    target = target.toFixed(2);
  }
  return target;
}

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, 
      GatewayIntentBits.GuildMessages, 
      GatewayIntentBits.MessageContent
    ],
});

client.once('ready', () => {
    console.log(`로그인 완료: ${client.user.tag}`);

    client.user.setPresence({
      activities: [
        { name: '/record', type: 0 }
      ],
      status: 'online',
    });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'record') {
      const nickname = interaction.options.getString('nickname');
      if (!nickname) return interaction.reply('닉네임을 입력해주세요.');

      const data = await getMatchSearchData(nickname);
      if (!data || data.length === 0) return interaction.reply('플레이어 정보가 존재하지 않습니다.');

      const searchData = data[0];
	    // 연승/연패 출력
	    const streakCnt = Math.abs(searchData.lcg_winning_streak);
	    const streakMsg = searchData.lcg_winning_streak > 1 ? `최근전적- \`${streakCnt}연승중\`` : searchData.lcg_winning_streak < -1 ? `최근전적- \`${streakCnt}연패중\`` : '최근전적';

      // 컬러 템플릿
      const TEXT_RESET = '\u001b[0m';
      const TEXT_BOLD = '\u001b[1m';
      const TEXT_BOLD_BLUE = '\u001b[1;34m';
      const TEXT_BOLD_RED = '\u001b[1;31m';
      const TEXT_BOLD_GREEN = '\u001b[1;32m';
      const TEXT_BOLD_PURPLE = '\u001b[1;35m';
      const TEXT_BOLD_SKY = '\u001b[1;36m';
      const TEXT_SKY = '\u001b[36m';
      const TEXT_YELLOW = '\u001b[33m';

	    // 모스트 챔피언 출력
	    const mostJson = searchData.most_champions;
	    let mostData = '';
	    for(let i=0; i<mostJson.length; i++) {
		    mostData += `\`\`\`ansi\n${TEXT_BOLD_GREEN}${i+1}.${TEXT_RESET}${TEXT_BOLD} ${champion[mostJson[i].champion]}${TEXT_RESET}${TEXT_BOLD_GREEN}-${TEXT_RESET}플레이:${TEXT_BOLD_SKY}${mostJson[i].play_count}${TEXT_RESET}회${TEXT_BOLD_GREEN}|${TEXT_RESET}승률:${highlightText('W', mostJson[i].win_rate)}%${TEXT_BOLD_GREEN}|${TEXT_RESET}KDA:${highlightText('K', mostJson[i].kda_rate)}\`\`\``;
	    }
		
	    // 최근전적 출력
	    const matchJson = searchData.recent_matchs;
	    let matchData1 = '';
      let matchData2 = '';
      if(matchJson.length > 5) {
        for(let i=0; i<2; i++) {
          const start = i * 5;
          const end = Math.min(start + 5, matchJson.length);
          for(let j=start; j<end; j++) {
            if(matchJson[j].win === 'Y') {
              if(i === 0) matchData1 += `\`\`\`ansi\n${TEXT_BOLD_BLUE}[승리]${TEXT_RESET} ${TEXT_BOLD}${champion[matchJson[j].champion]}${TEXT_RESET}(${convertMvpRank(matchJson[j].mvp_rank)}) | KDA ${matchJson[j].kill}/${matchJson[j].death}/${matchJson[j].assist}(${highlightText('K', matchJson[j].kda_rate)})\nCS ${matchJson[j].cs} | Gold ${matchJson[j].gold.toLocaleString()} | Vision ${highlightText('V', matchJson[j].vision_ward)}개\`\`\``;
              else matchData2 += `\`\`\`ansi\n${TEXT_BOLD_BLUE}[승리]${TEXT_RESET} ${TEXT_BOLD}${champion[matchJson[j].champion]}${TEXT_RESET}(${convertMvpRank(matchJson[j].mvp_rank)}) | KDA ${matchJson[j].kill}/${matchJson[j].death}/${matchJson[j].assist}(${highlightText('K', matchJson[j].kda_rate)})\nCS ${matchJson[j].cs} | Gold ${matchJson[j].gold.toLocaleString()} | Vision ${highlightText('V', matchJson[j].vision_ward)}개\`\`\``;
            } else {
              if(i === 0) matchData1 += `\`\`\`ansi\n${TEXT_BOLD_RED}[패배]${TEXT_RESET} ${TEXT_BOLD}${champion[matchJson[j].champion]}${TEXT_RESET}(${convertMvpRank(matchJson[j].mvp_rank)}) | KDA ${matchJson[j].kill}/${matchJson[j].death}/${matchJson[j].assist}(${highlightText('K', matchJson[j].kda_rate)})\nCS ${matchJson[j].cs} | Gold ${matchJson[j].gold.toLocaleString()} | Vision ${highlightText('V', matchJson[j].vision_ward)}개\`\`\``;
              else matchData2 += `\`\`\`ansi\n${TEXT_BOLD_RED}[패배]${TEXT_RESET} ${TEXT_BOLD}${champion[matchJson[j].champion]}${TEXT_RESET}(${convertMvpRank(matchJson[j].mvp_rank)}) | KDA ${matchJson[j].kill}/${matchJson[j].death}/${matchJson[j].assist}(${highlightText('K', matchJson[j].kda_rate)})\nCS ${matchJson[j].cs} | Gold ${matchJson[j].gold.toLocaleString()} | Vision ${highlightText('V', matchJson[j].vision_ward)}개\`\`\``;
            }
          }
        }
      } else {
        for(let i=0; i<matchJson.length; i++) {
          if(matchJson[i].win === 'Y') {
            matchData1 += `\`\`\`ansi\n${TEXT_BOLD_BLUE}[승리]${TEXT_RESET} ${TEXT_BOLD}${champion[matchJson[i].champion]}${TEXT_RESET}(${convertMvpRank(matchJson[i].mvp_rank)}) | KDA ${matchJson[i].kill}/${matchJson[i].death}/${matchJson[i].assist}(${highlightText('K', matchJson[i].kda_rate)})\nCS ${matchJson[i].cs} | Gold ${matchJson[i].gold.toLocaleString()} | Vision ${highlightText('V', matchJson[i].vision_ward)}개\`\`\``;
          } else {
            matchData1 += `\`\`\`ansi\n${TEXT_BOLD_RED}[패배]${TEXT_RESET} ${TEXT_BOLD}${champion[matchJson[i].champion]}${TEXT_RESET}(${convertMvpRank(matchJson[i].mvp_rank)}) | KDA ${matchJson[i].kill}/${matchJson[i].death}/${matchJson[i].assist}(${highlightText('K', matchJson[i].kda_rate)})\nCS ${matchJson[i].cs} | Gold ${matchJson[i].gold.toLocaleString()} | Vision ${highlightText('V', matchJson[i].vision_ward)}개\`\`\``;
          }
        }
      }
		
      const embed = new EmbedBuilder()
        .setColor(0x4287f5)
        .setTitle(searchData.lcg_nickname)
        .setURL(`https://www.op.gg/summoners/kr/${searchData.lcg_nickname.split('#')[0]}-${searchData.lcg_nickname.split('#')[1]}`)
        .setThumbnail(`${searchData.lcg_main_image}profileicon/${searchData.lcg_summoner_icon}.png`)
        .setAuthor({ name: '토끼파 내전 전적', url: 'https://rabbitgang.vercel.app', iconURL: 'https://pub-2e725a3fe396499cb0d0d2085e11509e.r2.dev/public/rabbitgang.png' })
        .addFields(
          { name: '개인랭크', value: `**${searchData.lcg_present_tier} ${searchData.lcg_present_division}**`, inline: false },
          { name: '게임 횟수', value: `${searchData.lcg_count_play}회 (${searchData.lcg_count_victory}W/${searchData.lcg_count_defeat}L/${(searchData.lcg_count_victory/searchData.lcg_count_play*100).toFixed(1)}%)`, inline: true },
          { name: 'MVP 횟수', value: `${searchData.lcg_count_mvp}회 (**${searchData.rankmvp}위**)`, inline: true },
          { name: 'ACE 횟수', value: `${searchData.lcg_count_ace}회 (**${searchData.rankace}위**)`, inline: true },
          { name: '모스트 챔피언', value: mostData, inline: false },
          { name: streakMsg, value: matchData1, inline: false },
          ...(matchJson.length > 5 ? [{ name: '\u200b', value: matchData2, inline: false }] : []),
          { name: '\u200b', value: `last update : ${searchData.lcg_update_data}`, inline: false }
        )
        .setTimestamp();
        
      await interaction.reply({ embeds: [embed] });
    }
});

module.exports = client;
