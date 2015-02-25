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
		Car1: pinewoodderby.Car;
		Car2: pinewoodderby.Car;
		Car3: pinewoodderby.Car;
		Car4: pinewoodderby.Car;
		First: pinewoodderby.Car;
		Second: pinewoodderby.Car;
		Third: pinewoodderby.Car;
		Fourth: pinewoodderby.Car;
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
