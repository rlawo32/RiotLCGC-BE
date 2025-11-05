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