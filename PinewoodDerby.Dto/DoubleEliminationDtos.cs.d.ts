declare module de {
	interface Participant {
		Name: string;
		EntryName: string;
		Rank: string;
	}
	interface SeededParticipant {
		Seed: number;
		Participant: de.Participant;
	}
	interface DoubleElminiationTournament {
		Games: de.Game[];
	}
	interface Game {
		Round: number;
		GameNumber: number;
		P1: de.SeededParticipant;
		P2: de.SeededParticipant;
		Winner: de.Participant;
		P1Source: de.ParticipantSource;
		P2Source: de.ParticipantSource;
	}
	interface ParticipantSource {
		GameNumber: number;
		WinnerOrLoser: de.WinnerOrLoser;
	}
	enum WinnerOrLoser {
		Winner = 1,
		Loser = 0,
	}
}
