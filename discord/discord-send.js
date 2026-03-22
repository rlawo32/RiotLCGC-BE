const FormData = require('form-data');
const fs = require('fs').promises;
const axios = require('axios');

const sendToDiscord = async (type, originPath, imageUrl) => {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');  // 0부터 시작하므로 +1
        const day = String(today.getDate()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;

        const form = new FormData();
        let embedData = {};
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
            //webhookUrl = process.env.DISCORD_WEBHOOK_URL_SHUFFLE;
        } else if(type === "R") {
            const [left, right] = imageUrl.split(" VS ");
            embedData = {
                embeds: [{
                    title: "",
                    color: 7855479, // Embed 왼쪽 테두리 색상 (푸른색 계열)
                    fields: [
                        {
                            name: "-------------------",
                            value: "```ansi\n\u001b[1;34m🔵BlueTeam\u001b[0m\n```" + `\`\`\`ansi\n\u001b[1;37m  ${left.split(' ').join('\n  ')}\u001b[0m\`\`\``,
                            inline: true
                        },
                        {
                            name: "-----",
                            value: "\u200b", // 공백 문자
                            inline: true
                        },
                        {
                            name: "-------------------",
                            value: "```ansi\n\u001b[1;31m 🔴RedTeam\u001b[0m\n```" + `\`\`\`ansi\n\u001b[1;37m  ${right.split(' ').join('\n  ')}\u001b[0m\`\`\``,
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                }]
            };
            webhookUrl = process.env.DISCORD_WEBHOOK_URL_TEST;
            // webhookUrl = process.env.DISCORD_WEBHOOK_URL_TEAMRESULT;
        }
        // webhookUrl = process.env.DISCORD_WEBHOOK_URL_TEST; // TEST

        if(type === "R") {
            await axios.post(webhookUrl, embedData);
        } else {
            await axios.post(webhookUrl, form, {
                headers: form.getHeaders()
            });
        }
        if(type === "H" || type === "F") {
            try {
                await fs.unlink(originPath); // 로컬 파일 제거
                console.log(`Cleanup Success: Removed local file ${originPath}`);
            } catch (error) {
                // 파일 제거 실패 시 (예: 파일이 존재하지 않거나 권한 문제)
                console.error(`Cleanup Error: Failed to remove local file ${originPath}`, error);
            }
        } 

        console.log('Discord transfer complete!');
    } catch (error) {
        console.error('Discord transmission failed : ', error.message);
    }
};

module.exports = { sendToDiscord };