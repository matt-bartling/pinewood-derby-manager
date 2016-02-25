using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;

namespace PinewoodDerby.Dto.Tests
{
    [TestFixture]
    public class TestPartialPerfectN
    {
        [Test]
        public void TestBuild24x4x2()
        {
            var seeds = new[] {4, 7, 10};
            var cars = 24;
            var races = new List<int[]>();

            for (int i = 1; i <= cars; i++)
            {
                var racers = new int[4];
                racers[0] = Mod(i, 24);
                racers[1] = Mod(racers[0] + seeds[0], 24);
                racers[2] = Mod(racers[1] + seeds[1], 24);
                racers[3] = Mod(racers[2] + seeds[2], 24);
                races.Add(racers);
            }

            var racesRun = new Dictionary<int, int>();
            for (int i = 1; i <= cars; i++)
            {
                racesRun[i] = 0;
            }

            var orderedRaces = new List<int[]>();
            int[] lastRace = null;

            for (int i = 1; i <= cars; i++)
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

            foreach (var ints in orderedRaces)
            {
                Console.WriteLine("{0} {1} {2} {3}", ints[0], ints[1], ints[2], ints[3]);
            }
        }

        private static bool IsThisRaceOk(int[] race, int[] lastRace, Dictionary<int, int> racesRun, int minRaces, int raceDiff)
        {
            if (lastRace != null && race.Any(lastRace.Contains))
            {
                return false;
            }
            var racersWithMoreThanMinRaces = race.Count(r => racesRun[r] > minRaces);
            return racersWithMoreThanMinRaces <= raceDiff;
        }

        private int Mod(int carNum, int numCars)
        {
            return ((carNum - 1)%numCars) + 1;
        }
    }
}