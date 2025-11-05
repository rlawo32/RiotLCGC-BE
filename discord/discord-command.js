require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('record')
    .setDescription('사용자의 기록을 조회합니다.')
    .addStringOption(option =>
      option
        .setName('name') 
        .setDescription('조회할 사용자 이름을 입력하세요.')
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('슬래시 명령어 등록 중...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), // 특정 서버만 설정
      // Routes.applicationCommands(CLIENT_ID), // 전역 설정
      { body: commands },
    );
    console.log('/record 명령어 등록 완료!');
  } catch (error) {
    console.error(error);
  }
})();
