using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using NUnit.Framework;
using Utils;

namespace PinewoodDerby.Dto.Tests
{
    [TestFixture]
    public class TestPartialPerfectN
    {
        [Test]
        public void TestBuild13x4x1()
        {
            BuildAndWrite(13, 1);
        }

        [Test]
        public void TestBuild14x4x1()
        {
            BuildAndWrite(16, 2);
        }

        [Test]
        public void TestBuild24x4x2_Optimize()
        {
            Optimize(24, 2, new []{5, 6, 8});
        }

        [Test]
        public void TestBuild24x4x2()
        {
            BuildAndWrite(24, 2);
        }

        [Test]
        public void TestBuild25x4x2_Optimize()
        {
            Optimize(25, 2, new []{2, 5, 10});
        }

        [Test]
        public void TestBuild25x4x2()
        {
            BuildAndWrite(25, 2);
        }

        [Test]
        public void TestBuild26x4x2_Optimize()
        {
            Optimize(26, 2, new[] {5, 6, 8});
        }

        [Test]
        public void TestBuild26x4x2()
        {
            BuildAndWrite(26, 2);
        }

        [Test]
        public void TestBuildAllAndCompare()
        {
            var minCars = 4;
            var maxCars = 50;
            var minRounds = 1;
            var maxRounds = 2;

            var builder = new PartialPerfectNGenerator();

            for (var rounds = minRounds; rounds <= maxRounds; rounds++)
            {
                for (var cars = minCars; cars <= maxCars; cars++)
                {
                    try
                    {
                        if (cars == 9 && rounds == 2)
                        {
                            Console.Write("");
                        }
                        var races = builder.Build(cars, rounds);
                        var raceList = GetRaceList(cars);
                        foreach (var race in races)
                        {
                            for (int i = 0; i < race.Length; i++)
                            {
                                for (int j = 0; j < race.Length; j++)
                                {
                                    if (i != j)
                                    {
                                        var key = Key(race[i], race[j]);
                                        raceList[key]++;
                                    }
                                }
                            }
                        }
                        var min = raceList.MinR(l => l.Value);
                        var max = raceList.MaxR(l => l.Value);
                        if (max.Value - min.Value > 1)
                        {
                            Console.WriteLine("Race {0}x{1} has a min|max of {2}|{3}", cars, rounds, string.Join("-", min.Key, min.Value), string.Join("-", max.Key, max.Value));
                        }
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine("Error building {0}x{1}\n{2}", cars, rounds, e);
                    }

                }
            }
        }

        private static Dictionary<string, int> GetRaceList(int cars)
        {
            var raceList = new Dictionary<string, int>();
            for (int i = 1; i <= cars; i++)
            {
                for (int j = 1; j <= cars; j++)
                {
                    if (i != j)
                    {
                        var key = Key(i, j);
                        raceList[key] = 0;
                    }
                }
            }
            return raceList;
        }

        private static string Key(int i, int j)
        {
            string key = string.Join("-", i, j);
            return key;
        }

        private void Optimize(int cars, int rounds, int[] seedA = null)
        {
            var bestXSquared = int.MaxValue;
            var test = new[] {0, 0, 0};
            var best = test;

            var builder = new PartialPerfectNGenerator();

            var testCases = BuildTestCases(test, cars);
            var total = Math.Pow(cars-1, test.Length).ToInt();
            var counter = 0;
            seedA = seedA ?? new[] { 2, 3, 4 };
            foreach (var testCase in testCases)
            {
                counter++;
                if (counter%100 == 0)
                {
                    Console.WriteLine("Running test {0} of {1}", counter.ToString("N0"), total.ToString("N0"));
                    Console.WriteLine("Current leader {0} with {1}", string.Join(",", best), bestXSquared);
                }
                var seedB = new[] {testCase[0], testCase[1], testCase[2]};
                var races = builder.GetRaces(cars, rounds, seedA, seedB);

                var ints = 1.To(cars);

                var xSquared = 0;
                foreach (var i in ints)
                {
                    var racesWithI = races.Where(r => r.Contains(i));
                    var counts = ints.Where(r1 => r1 != i).Select(r1 => racesWithI.Count(r => r.Contains(r1)));
                    foreach (var count in counts)
                    {
                        xSquared += Math.Pow(count-1, 2).ToInt();
                    }
                }
                if (xSquared < bestXSquared)
                {
                    bestXSquared = xSquared;
                    best = testCase;
                }
            }
            Console.WriteLine(JsonConvert.SerializeObject(best));
        }

        private IEnumerable<int[]> BuildTestCases(int[] x, int max)
        {
            return BuildTestCases(x, max, 0);
        }

        private IEnumerable<int[]> BuildTestCases(int[] x, int max, int index)
        {
            if (index == x.Length)
            {
                yield return x.Copy();
            }
            else
            {
                for (var i = 1; i < max; i++)
                {
                    x[index] = i;
                    var subCases = BuildTestCases(x, max, index + 1);
                    foreach (var sub in subCases)
                    {
                        yield return sub;
                    }
                }
            }
        }


        private void BuildAndWrite(int cars, int rounds)
        {
            var builder = new PartialPerfectNGenerator();
            var races = builder.Build(cars, rounds);

            var ints = 1.To(cars);

            foreach (var r in races)
            {
                Console.WriteLine(string.Join("\t", r));
            }
            Console.WriteLine("\t"+string.Join("\t", ints));
            foreach (var i in ints)
            {
                var racesWithI = races.Where(r => r.Contains(i));
                Console.WriteLine(i+"\t"+string.Join("\t", ints.Select(r1 => racesWithI.Count(r => r.Contains(r1)))));
            }
        }
    }
}