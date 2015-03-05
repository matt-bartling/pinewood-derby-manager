declare module pinewoodderby {
	interface Tournament {
		Name: string;
		Groups: pinewoodderby.Group[];
		Races: pinewoodderby.Race[];
	}
	interface Group {
		Name: string;
		Cars: pinewoodderby.Car[];
		ShowClassStandings: boolean;
	}
	interface Race {
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
	interface Car {
		Number: number;
		ID: string;
		Builder: string;
		Name: string;
		Class: string;
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
