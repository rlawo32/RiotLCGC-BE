require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const supabase = require('../supabase.js');

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

	  // 모스트 챔피언 출력
	  const mostJson = searchData.most_champions;
	  let mostData = ``;
	  for(let i=0; i<mostJson.length; i++) {
		mostData += `\`\`\`scss\\n**\`${mostJson[i].champion}\`** (플레이:${mostJson[i].play_count}회, 승률:${mostJson[i].win_rate}%, KDA:${mostJson[i].kda_rate})\`\`\``;
	  }
		
	  // 최근전적 출력
	  const matchJson = searchData.recent_matchs;
	  let matchData = ``;
	  for(let i=0; i<matchJson.length; i++) {{
		matchData += `\`\`\`scss\\n[${matchJson[i].win === 'Y' ? '승리' : '패배'}] **\`${matchJson[i].champion}\`**(${matchJson[i].mvp_rank}) | KDA ${matchJson[i].kill}/${matchJson[i].death}/${matchJson[i].assist} (${matchJson[i].kda_rate})\\nCS ${matchJson[i].cs} | Gold ${matchJson[i].gold} | Vision ${matchJson[i].vision_ward}\`\`\``;
	  }
		
      const embed = new EmbedBuilder()
          .setColor(0x4287f5)
          .setTitle(searchData.lcg_nickname)
          .setURL('https://rabbitgang.vercel.app')
          .setThumbnail(`${searchData.lcg_main_image}profileicon/${searchData.lcg_summoner_icon}`)
          .setAuthor({ name: 'TEST', url: 'https://discord.com', iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png' })
          .addFields(
            { name: '개인랭크', value: `**\`${searchData.lcg_present_tier} ${searchData.lcg_present_division}\`**`, inline: false },
            { name: '게임 횟수', value: `\`${searchData.lcg_count_play}회\``, inline: true },
            { name: 'MVP 횟수', value: `\`${searchData.lcg_count_mvp}회\` (**${searchData.rankavp}위**)`, inline: true },
            { name: 'ACE 횟수', value: `\`${searchData.lcg_count_ace}회\` (**${searchData.rankace}위**)`, inline: true },
			{ name: '모스트 챔피언', value:mostData, inline: false },
			{ name: streakMsg, value:matchData, inline: false },
			{ name: '--------------------------------------------------------------------------------', value:`last update : ${searchData.lcg_update_data}`, inline: false }
          )
          .setTimestamp();
        
      await interaction.reply({ embeds: [embed] });
    }
});

module.exports = client;
