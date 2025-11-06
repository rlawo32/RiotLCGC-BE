require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const supabase = require('./supabase.js');

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

// /record name:버들보들
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith('/record ')) {      
      const nickname = message.content.replace('/record ', '').trim();
      if (!nickname) return message.reply('닉네임을 입력해주세요.');
      await message.reply(`${nickname}님의 기록을 불러왔습니다!!`);
    }
});

// /record 버들보들
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'record') {
      const nickname = interaction.options.getString('nickname');
      if (!nickname) return interaction.reply('닉네임을 입력해주세요.');

      const data = await getMatchSearchData(nickname);
      if (!data || data.length === 0) return interaction.reply('플레이어 정보가 존재하지 않습니다.');

      const searchData = data[0];
      const embed = new EmbedBuilder()
          .setColor(4321431)
          .setTitle(searchData.lcg_nickname)
          .setDescription('')
          .setUrl('https://rabbitgang.vercel.app')
          .setThumbnail(`${searchData.lcg_main_image}profileicon/${searchData.lcg_summoner_icon}`)
          .setAuthor({ name: 'TEST', url: 'https://discord.com', iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png' })
          .addFields(
            { name: '개인랭크', value: `**\`${searchData.lcg_present_tier} ${searchData.lcg_present_division}\`**`, inline: false },
            { name: '게임 횟수', value: `\`${searchData.lcg_count_play}회\``, inline: true },
            { name: 'MVP 횟수', value: `\`${searchData.lcg_count_mvp}\` (**${searchData.rankMvp}위**)`, inline: true },
            { name: 'ACE 횟수', value: `\`${searchData.lcg_count_ace}\` (**${searchData.rankAce}위**)`, inline: true },
          )
          .setFooter({ text: '' })
          .setTimestamp();
        
      await interaction.reply({ embeds: [embed] });
    }
});

module.exports = client;
