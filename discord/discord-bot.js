require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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
        { name: '/record', type: 0 } // type 0 = Playing
      ],
      status: 'online', // 온라인 상태
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
      await interaction.reply(`${nickname}님의 기록을 불러왔습니다!`);
    }
});

module.exports = client;
