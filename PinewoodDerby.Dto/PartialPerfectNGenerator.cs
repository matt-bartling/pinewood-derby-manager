using System;
using System.Collections.Generic;
using System.Linq;

namespace PinewoodDerby.Dto
{
    public class PartialPerfectNGenerator
    {
        private readonly Dictionary<int, int[]> _generators = new Dictionary<int, int[]>
        {
            {4, new []{3, 3, 3}},
            {12, new []{2, 4, 5}},
            {13, new []{2, 4, 12}},
            {14, new []{2, 4, 13}},
            {20, new []{2, 14, 11}},
            {21, new []{4, 5, 10}},
            {22, new []{4, 5, 7}},
            {23, new []{4, 7, 10}},
            {26, new []{1, 3, 13}},
            {27, new []{4, 5, 6}},
            {28, new []{4, 5, 6}},
        };

        private readonly Dictionary<int, int[]> _inverseGenerators = new Dictionary<int, int[]>
        {
            {6, new []{3, 5, 5}},
            {8, new []{3, 4, 2}},
            {9, new []{3, 5, 3}},
            {10, new []{3, 3, 6}},
            {11, new []{3, 3, 4}},
            {12, new []{3, 2, 8}},
            {14, new []{3, 5, 2}},
            {15, new []{3, 2, 9}},
            {16, new []{3, 5, 10}},
            {17, new []{3, 2, 11}},
            {18, new []{3, 5, 9}},
            {19, new []{3, 5, 13}},
            {20, new []{12, 18, 3}},
            {21, new []{5, 13, 7}},
            {22, new []{8, 12, 21}},
            {23, new []{1, 23, 1}},
            {24, new []{1, 5, 8}},
            {25, new []{1, 5, 8}},
            {26, new []{5, 6, 8}},
            {27, new []{7, 19, 25}},
            {28, new []{7, 20, 26}},
        };

        public int[][] Build(int cars, int rounds)
        {
            var seeds = GetSeeds(cars);
            var inverseSeeds = GetInverseSeeds(cars, seeds);
            return GetRaces(cars, rounds, seeds, inverseSeeds);
        }

        public int[][] GetRaces(int cars, int rounds, int[] seeds, int[] inverseSeeds)
        {
            if (rounds < 0 || rounds > 2)
            {
                throw new Exception("Invalid number of rounds " + rounds);
            }
            var races = Races(cars, seeds);

            if (rounds == 2)
            {
                races.AddRange(Races(cars, inverseSeeds));
            }

            var racesRun = new Dictionary<int, int>();
            for (int i = 1; i <= cars; i++)
            {
                racesRun[i] = 0;
            }

            var orderedRaces = new List<int[]>();
            int[] lastRace = null;

            var totalRaces = races.Count;
            for (int i = 1; i <= totalRaces; i++)
            {
                var minRaces = racesRun.Min(e => e.Value);
                var maxRaces = racesRun.Max(e => e.Value);
                int[] nextRace = null;
                int raceDiff = 0;
                while (nextRace == null)
                {
                    for (int j = 0; j < races.Count; j++)
                    {
                        if (IsThisRaceOk(races[j], lastRace, racesRun, minRaces, raceDiff))
                        {
                            nextRace = races[j];
                            break;
                        }
                    }
                    raceDiff++;
                }
                orderedRaces.Add(nextRace);
                races.Remove(nextRace);
                lastRace = nextRace;
                foreach (var racer in nextRace)
                {
                    racesRun[racer]++;
                }
            }

            return orderedRaces.ToArray();
        }

        private int[] GetInverseSeeds(int cars, int[] seeds)
        {
            if (_inverseGenerators.ContainsKey(cars))
            {
                return _inverseGenerators[cars];
            }
            if (cars >= 29)
            {
                var middle = cars == 34
                    ? 13
                    : cars == 32 || cars == 33 ? 12 : 11;
                return new[] { 6, middle, cars - 1 };
            }
            var inverseSeeds = new int[seeds.Length];
            for (var i = 0; i < seeds.Length; i++)
            {
                inverseSeeds[i] = (cars - seeds[i])%cars;
            }
            return inverseSeeds;
        }

        private int[] GetSeeds(int cars)
        {
            if (_generators.ContainsKey(cars))
            {
                return _generators[cars];
            }
            if (5 <= cars && cars <= 7)
            {
                return new[] {2, 2, cars - 3};
            }
            if (8 <= cars && cars <= 11)
            {
                return new[] {2, 2, cars - 5};
            }
            if (15 <= cars && cars <= 19)
            {
                return new[] {2, 3, cars%2 == 0 ? 7 : 4};
            }
            if (24 <= cars && cars <= 26)
            {
                return new[] {2, 3, 4};
            }
            return DefaultGenerator(cars);
        }

        private static int[] DefaultGenerator(int cars)
        {
            return new[] {2, 3, 4};
        }

        private List<int[]> Races(int cars, int[] seeds)
        {
            var races = new List<int[]>();

            for (int i = 1; i <= cars; i++)
            {
                var racers = new int[4];
                racers[0] = Mod(i, cars);
                racers[1] = Mod(racers[0] + seeds[0], cars);
                racers[2] = Mod(racers[1] + seeds[1], cars);
                racers[3] = Mod(racers[2] + seeds[2], cars);
                races.Add(racers);
            }
            return races;
        }

        private static bool IsThisRaceOk(int[] race, int[] lastRace, Dictionary<int, int> racesRun, int minRaces,
            int raceDiff)
        {
//            if (lastRace != null && race.Any(lastRace.Contains))
//            {
//                return false;
//            }
            var racersWithMoreThanMinRaces = race.Count(r => racesRun[r] > minRaces);
            return racersWithMoreThanMinRaces <= raceDiff;
//            return true;
        }

        private int Mod(int carNum, int numCars)
        {
            return ((carNum - 1)%numCars) + 1;
        }
    }
}
