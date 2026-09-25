import supabase from '../supabase.js';

export const getFearlessData = async(gameDay) => {
	const { data, error } = await supabase
		.rpc("match_gameset", {game_day: gameDay});
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};

export const getGameExists = async(gameDay) => {
	const { data, error } = await supabase
		.from("lcg_match_info")
		.select("lcg_game_id, lcg_game_set")
		.like("lcg_game_set", `%${gameDay}%`)
		.order("lcg_game_set", { ascending: false })
		.limit(1);
	if (error) {
		console.error('Error fetching data:', error);
	} else {
		//console.log('Data:', data);
	}
	return data; 
};