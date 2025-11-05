## 🏆 Riot LCGC(League of Legends Custom Game Capture) - Back

리그오브레전드의 커스텀 게임 전적 캡쳐 및 DISCORD 전송 서비스

<br/>

## 📖 LCG 프로젝트 : LCGC-BE 소개

LCG 프로젝트는 기존 리그오브레전드 전적 사이트에서 커스텀 게임에 대한 기록 확인이 불가하기에 직접 내가 했던 커스텀 게임들을 기록으로 남기고 전적 사이트처럼 구성하고자 시작하게 되었습니다.

LCG 프로젝트 중 LCGC-BE는 커스텀 게임 결과를 이미지로 캡쳐하여 DISCORD 채팅 서버로 보내기 위해 제작하였습니다.
사이트에도 게임 종료 후 최근 결과 전적을 바로 업데이트를 하지만 사이트를 방문하여 보는 것 보다 DISCORD에서 간단하게 이미지로 결과를 보는 것이 접근성, 편의성 방면에서 좋다 생각하여 개발하게 되었습니다.

캡쳐를 할 화면은 LCGV-FE와 동일하게 SUPABASE의 데이터들을 가져와 EJS과 CSS로 구성해주고 Puppeteer 라이브러리를 통해 실제 브라우저처럼 렌더링을 하여 렌더링된 페이지를 캡쳐할 수 있게 했습니다. <br/>
캡쳐한 이미지를 바로 R2 이미지 서버로 올린 뒤 업로드된 이미지 URL을 가져와 DISCORD 채팅 서버로 전송하는 방식으로 프로세스를 구성하였습니다.

이외에도 LCGV-FE 사이트에서 제공되는 팀 생성 서비스의 결과 이미지를 DISCORD로 전송해주거나 Fearless 옵션으로 이전 게임에 플레이했던 챔피언들을 추출해 렌더링 후 캡쳐하여 DISCORD로 전송하는 등의 기능도 구현되어 있습니다.

<br/>

## 📅 개발 기간

+ `2025. 08. 11. ~ ing`

<br/>

## 📋 구현 목록

+ Oracle Cloud에 NodeJS Express 서버 구동(PM2) ❌ <br/>
+ Render 사이트에서 배포 진행(구동 서버 이동 및 통신 테스트) ✅ <br/>
+ Puppeteer Chrome 브라우지 이슈 해결 ✅ <br/>
+ SUPABASE 통신 및 데이터 추출 ✅ <br/>
+ EJS 구성 및 Puppeteer 렌더링, 페이지 캡쳐 설정 ✅ <br/>
+ DISCORD Webhook, R2 연동 ✅ <br/>
+ SUPABASE Realtime 적용 ✅ <br/>
+ 캡쳐 이미지 DISCORD 전송 체크 ✅ <br/>
+ 팀 짜기 결과 이미지 전송 기능 ✅ <br/>
+ Fearless 규칙, 게임 세트 별 챔피언 이미지 생성 후 전송 ✅ <br/>
+ Realtime 구독 오류 체크 및 이미지 전송 후 로컬 이미지 삭제 ✅ <br/>
+ Discord BOT 연동 - Command 등록(전적 검색) 🚧 <br/>
+ Discord BOT 연동 - Command 기능 동작 작업(통신 및 결과 출력) 🚧 <br/>
+ Discord Embed 생성 작업 🚧 <br/>
+ JS 코드 파일 분리 작업 🚧 <br/>

<br/>

## 🛠️ 사용 툴, 언어

+ Visual Studio Code
+ NodeJS
+ SUPABASE
+ R2
+ Discord
+ Render

<br/>

## 🔗 참고 사이트

+ DISCORD - [DISCORD WebHook](https://support.discord.com/hc/ko/articles/228383668-%EC%9B%B9%ED%9B%85%EC%9D%84-%EC%86%8C%EA%B0%9C%ED%95%A9%EB%8B%88%EB%8B%A4)
+ SUPABASE - [SUPABASE Docs](https://supabase.com/docs/reference/javascript/introduction)
+ RENDER - [Render Deploy](https://render.com)
