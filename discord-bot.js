require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`로그인 완료: ${client.user.tag}`);
});

// /record name:버들보들
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith('/record ')) {
    const name = message.content.replace('/record ', '').trim();
    if (!name) return message.reply('이름을 입력해주세요.');
    await message.reply(`${name}님의 기록을 불러왔습니다!`);
  }
});

// /record 버들보들
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'record') {
    const name = interaction.options.getString('name');
    await interaction.reply(`${name}님의 기록을 불러왔습니다!`);
  }
});

client.login(process.env.DISCORD_TOKEN);
