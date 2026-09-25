import supabase from '../supabase.js';

export const getPlayerChampionData = async(playerData) => {
	const { data, error } = await supabase
		.rpc("realtimeinfo_player_champion", {
			player_puuid_1: playerData[0].puuid, player_champion_1: playerData[0].championId, 
			player_puuid_2: playerData[1].puuid, player_champion_2: playerData[1].championId,
			player_puuid_3: playerData[2].puuid, player_champion_3: playerData[2].championId, 
			player_puuid_4: playerData[3].puuid, player_champion_4: playerData[3].championId,
			player_puuid_5: playerData[4].puuid, player_champion_5: playerData[4].championId, 
			player_puuid_6: playerData[5].puuid, player_champion_6: playerData[5].championId,
			player_puuid_7: playerData[6].puuid, player_champion_7: playerData[6].championId, 
			player_puuid_8: playerData[7].puuid, player_champion_8: playerData[7].championId,
			player_puuid_9: playerData[8].puuid, player_champion_9: playerData[8].championId, 
			player_puuid_10: playerData[9].puuid, player_champion_10: playerData[9].championId
		});
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

export const getPlayerRelativeData = async(playerData) => {
	const { data, error } = await supabase
		.from('lcg_player_relative')
		.select('lcg_person_puuid, lcg_match_line, lcg_win_count, lcg_fail_count')
		.or(
			`and(lcg_match_line.eq.${playerData[0].lane}, lcg_person_puuid.eq.${playerData[0].bluePuuid}, lcg_opponent_puuid.eq.${playerData[0].redPuuid}),` +
			`and(lcg_match_line.eq.${playerData[1].lane}, lcg_person_puuid.eq.${playerData[1].bluePuuid}, lcg_opponent_puuid.eq.${playerData[1].redPuuid}),` +
			`and(lcg_match_line.eq.${playerData[2].lane}, lcg_person_puuid.eq.${playerData[2].bluePuuid}, lcg_opponent_puuid.eq.${playerData[2].redPuuid}),` +
			`and(lcg_match_line.eq.${playerData[3].lane}, lcg_person_puuid.eq.${playerData[3].bluePuuid}, lcg_opponent_puuid.eq.${playerData[3].redPuuid}),` +
			`and(lcg_match_line.eq.${playerData[4].lane}, lcg_person_puuid.eq.${playerData[4].bluePuuid}, lcg_opponent_puuid.eq.${playerData[4].redPuuid})`
		);
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

export const getGameSetData = async(date) => {
	const { data, error } = await supabase
		.from('lcg_match_info')
		.select('lcg_game_id, lcg_game_set')
		.like('lcg_game_set', `%${date}%`)
		.order("lcg_game_id", { ascending: false })
		.limit(1);
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};