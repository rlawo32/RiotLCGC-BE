import supabase from '../supabase.js';

export const getLogData = async() => {
	const { data, error } = await supabase
		.from('lcg_match_log')
		.select('lcg_game_id, lcg_game_ver, lcg_game_date')
		.order("lcg_game_id", { ascending: false })
		.limit(1);
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

export const getEtcData = async() => {
	const { data, error } = await supabase
		.from("lcg_match_etc")
		.select("lcg_main_image, lcg_sub_image")
		.order("lcg_update_date", { ascending: false })
		.limit(1);
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

export const getTeamData = async(gameId) => {
	const { data, error } = await supabase
		.from("lcg_match_team")
		.select("*")
		.eq("lcg_game_id", gameId);
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

export const getMainData = async(gameId) => {
	const { data, error } = await supabase
		.rpc("match_history")
		.select("*")
		.eq("lcg_game_id", gameId);
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};