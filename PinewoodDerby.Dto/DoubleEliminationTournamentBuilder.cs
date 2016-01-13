using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Security;
using System.Text;
using System.Threading.Tasks;
using Utils;

namespace PinewoodDerby.Dto
{
    public class DoubleEliminationTournamentBuilder
    {
        private string _name;
        private int _gameCounter = 1;
        private int _round = 1;
        private IList<Participant> _entries = new List<Participant>();

        public DoubleEliminationTournamentBuilder(string name)
        {
            _name = name;
        }

        public DoubleEliminationTournamentBuilder SetEntries(IList<Participant> entries)
        {
            _entries = entries;
            return this;
        }

        public DoubleElminiationTournament Build()
        {
            var sortedEntries = _entries.RandomSort();
            var tourneySize = Convert.ToInt32(Math.Pow(Math.Ceiling(Math.Log(sortedEntries.Count, 2)), 2));
            var seededParticipants = new List<SeededParticipant>();
            for (int i = 0; i < sortedEntries.Count; i++)
            {
                seededParticipants.Add(new SeededParticipant {Seed = i + 1, Participant = sortedEntries[i]});
            }
            for (var i = sortedEntries.Count; i < tourneySize; i++)
            {
                seededParticipants.Add(new SeededParticipant {Seed = i + 1, Participant = Participant.Bye});
            }

            var games = new List<Game>();

            List<Game> loserGames = null;

            var nextRoundGames = BuildFirstRoundGames(seededParticipants);
            games.AddRange(nextRoundGames);

            while (true)
            {
                _round++;

                if (loserGames == null)
                {
                    loserGames = BuildLoserGames(nextRoundGames);
                    games.AddRange(loserGames);
                }
                else
                {
                    loserGames = BuildCrossoverGames(nextRoundGames, loserGames);
                    games.AddRange(loserGames);
                    if (loserGames.Count >= 2)
                    {
                        loserGames = BuildWinnerGames(loserGames);
                        games.AddRange(loserGames);
                    }
                }
                if (nextRoundGames.Count == 1)
                {
                    var firstFinal = BuildWinnerGames(new List<Game> { loserGames[0], nextRoundGames[0] });
                    games.AddRange(firstFinal);
                    _round++;
                    var secondFinal = BuildWinnerGames(new List<Game> {nextRoundGames[0], firstFinal[0]});
                    games.AddRange(secondFinal);
                    break;
                }
                nextRoundGames = BuildWinnerGames(nextRoundGames);
                games.AddRange(nextRoundGames);
            }

            return new DoubleElminiationTournament {Games = games};
        }

        private List<Game> BuildCrossoverGames(List<Game> winnersBracketLosers, List<Game> losersBracketWinners)
        {
            if (winnersBracketLosers.Count != losersBracketWinners.Count)
            {
                throw new Exception();
            }
            var games = new List<Game>();
            var rearrangedWBC = RearrangedWbc(winnersBracketLosers);
            for (int i = 0; i < winnersBracketLosers.Count; i++)
            {
                var p1 = new ParticipantSource
                {
                    GameNumber = losersBracketWinners[i].GameNumber,
                    WinnerOrLoser = WinnerOrLoser.Winner
                };
                var p2 = new ParticipantSource
                {
                    GameNumber = rearrangedWBC[i].GameNumber,
                    WinnerOrLoser = WinnerOrLoser.Loser
                };
                games.Add(BuildGame(p1, p2));
            }
            return games;
        }

        private List<Game> RearrangedWbc(List<Game> winnersBracketLosers)
        {
            var rotateIndicator = _round - 2;
            return Rearrange(winnersBracketLosers, rotateIndicator, 0);
        }

        private List<Game> Rearrange(List<Game> games, int rotateIndicator, int level)
        {
            var list = new List<Game>();
            if (games.Count == 1)
            {
                list.Add(games[0]);
                return list;
            }

            var halves = Halves(games);
            var bitIndicator = Convert.ToInt32(Math.Pow(2, level));
            var topHalf = Rearrange(halves.TopHalf, rotateIndicator, level + 1);
            var bottomHalf = Rearrange(halves.BottomHalf, rotateIndicator, level + 1);
            if ((rotateIndicator & bitIndicator) == bitIndicator)
            {
                list.AddRange(bottomHalf);
                list.AddRange(topHalf);
            }
            else
            {
                list.AddRange(topHalf);
                list.AddRange(bottomHalf);
            }
            return list;
        }

        private List<Game> BuildLoserGames(List<Game> prevRoundGames)
        {
            return BuildDependentGames(prevRoundGames, WinnerOrLoser.Loser);
        } 

        private List<Game> BuildWinnerGames(List<Game> prevRoundGames)
        {
            return BuildDependentGames(prevRoundGames, WinnerOrLoser.Winner);
        }

        private List<Game> BuildDependentGames(List<Game> prevRoundGames, WinnerOrLoser winnerOrLoser)
        {
            var games = new List<Game>();
            if (prevRoundGames.Count == 2)
            {
                var p1 = new ParticipantSource
                {
                    GameNumber = prevRoundGames[0].GameNumber,
                    WinnerOrLoser = winnerOrLoser
                };
                var p2 = new ParticipantSource
                {
                    GameNumber = prevRoundGames[1].GameNumber,
                    WinnerOrLoser = winnerOrLoser
                };
                games.Add(BuildGame(p1, p2));
                return games;
            }

            var halves = Halves(prevRoundGames);
            games.AddRange(BuildDependentGames(halves.TopHalf, winnerOrLoser));
            games.AddRange(BuildDependentGames(halves.BottomHalf, winnerOrLoser));
                
            return games;
        }

        private Game BuildGame(ParticipantSource p1, ParticipantSource p2)
        {
            var game = new Game
            {
                GameNumber = _gameCounter,
                P1Source = p1,
                P2Source = p2,
                Round = _round,
            };
            _gameCounter++;
            return game;
        }

        private List<Game> BuildFirstRoundGames(List<SeededParticipant> seededParticipants)
        {
            var games = new List<Game>();
            if (seededParticipants.Count == 2)
            {
                games.Add(BuildGame(seededParticipants[0], seededParticipants[1]));
                return games;
            }
            
            var halves = CrossHalves(seededParticipants);
            games.AddRange(BuildFirstRoundGames(halves.TopHalf));
            games.AddRange(BuildFirstRoundGames(halves.BottomHalf));
            return games;
        }

        private Game BuildGame(SeededParticipant p1, SeededParticipant p2)
        {
            var game = new Game
            {
                Round = _round,
                GameNumber = _gameCounter,
                P1 = p1,
                P2 = p2,
            };
            _gameCounter++;
            return game;
        }

        private static Halves<T> CrossHalves<T>(List<T> seededParticipants)
        {
            var halves = new Halves<T>();
            for (int i = 0; i < seededParticipants.Count; i += 2)
            {
                if (i % 4 == 0)
                {
                    halves.TopHalf.Add(seededParticipants[i]);
                    halves.BottomHalf.Add(seededParticipants[i + 1]);
                }
                else
                {
                    halves.BottomHalf.Add(seededParticipants[i]);
                    halves.TopHalf.Add(seededParticipants[i + 1]);
                }
            }
            return halves;
        } 

        private static Halves<T> Halves<T>(List<T> games)
        {
            var halves = new Halves<T>();
            halves.TopHalf.AddRange(games.GetRange(0, games.Count/2));
            halves.BottomHalf.AddRange(games.GetRange(games.Count/2, games.Count/2));
            return halves;
        }
    }

    public class Halves<T>
    {
        public List<T> TopHalf;
        public List<T> BottomHalf;

        public Halves()
        {
            TopHalf = new List<T>();
            BottomHalf = new List<T>();
        }
    }

}
