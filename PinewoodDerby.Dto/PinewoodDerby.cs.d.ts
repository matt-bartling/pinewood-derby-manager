declare module pinewoodderby {
	interface Tournament {
		Name: string;
		Groups: pinewoodderby.Group[];
		Races: pinewoodderby.Race[];
		Standings: pinewoodderby.GroupStandings[];
		LaneStats: pinewoodderby.LaneStat[];
	}
	interface GroupStandings {
		Round: string;
		Group: string;
		StandingsRows: pinewoodderby.GroupStandingsRow[];
	}
	interface GroupStandingsRow {
		Car: pinewoodderby.Car;
		FirstPlaceFinishes: number;
		SecondPlaceFinishes: number;
		ThirdPlaceFinishes: number;
		FourthPlaceFinishes: number;
		RacesRemaining: number;
		TotalRaces: number;
		Points: number;
		Place: number;
	}
	interface Group {
		Name: string;
		Round: string;
		TiebreakGroup: string;
		Cars: pinewoodderby.Car[];
		ShowClassStandings: boolean;
	}
	interface Race {
		Round: string;
		Group: string;
		RaceNumber: number;
		Car1: pinewoodderby.RaceResult;
		Car2: pinewoodderby.RaceResult;
		Car3: pinewoodderby.RaceResult;
		Car4: pinewoodderby.RaceResult;
	}
	interface RaceResult {
		Car: pinewoodderby.Car;
		Place: number;
		Points: number;
	}
	interface FinalStandingsGroup {
		Group: string;
		Rows: pinewoodderby.FinalStandingRow[];
	}
	interface FinalStandingRow {
		Car: pinewoodderby.Car;
		Place: number;
		Points: number;
	}
	interface Car {
		Number: number;
		ID: string;
		Builder: string;
		Name: string;
		Class: string;
	}
	interface LaneStat {
		LaneNumber: number;
		FirstPlaceFinishes: number;
		SecondPlaceFinishes: number;
		ThirdPlaceFinishes: number;
		FourthPlaceFinishes: number;
		Points: number;
	}
	interface AvailableTournaments {
		Names: string[];
	}
}
declare module server {
	interface GroupRacesDefinition {
		RaceNumber: number;
		Lane1: number;
		Lane2: number;
		Lane3: number;
		Lane4: number;
	}
}
