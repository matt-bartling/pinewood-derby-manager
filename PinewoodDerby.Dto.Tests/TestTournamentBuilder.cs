using System;
using System.IO;
using System.Linq;
using AttributeRouting.Helpers;
using Newtonsoft.Json;
using NUnit.Framework;
using Utils;

namespace PinewoodDerby.Dto.Tests
{
    [TestFixture]
    public class TestTournamentBuilder
    {
        [Test]
        public void BuildAndFillIn()
        {
            Build();
            FillInResults();
        }

        [Test]
        public void Build()
        {
            var tournamentName = "test-2016";
            var builder = new TournamentBuilder(tournamentName, @".\Races");
            builder.AddGroup("Scouts", 2, true);
            builder.AddGroup("Siblings", 1);
            builder.AddGroup("Adults", 1);
            var tournament = builder.Build();
            Directory.CreateDirectory(Path.Combine(@"C:/Tournaments", tournamentName));
            File.WriteAllText(Path.Combine(@"C:/Tournaments", tournamentName, "tournament.json"),
                JsonConvert.SerializeObject(tournament, Formatting.Indented));
//            Console.WriteLine(JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }

        [Test]
        public void FillInResults()
        {
            var tournamentName = "test-2016";
            var tournamentFile = @"C:\Tournaments\{0}\tournament.json".FormatWith(tournamentName);
            var tournament = JsonConvert.DeserializeObject<Tournament>(File.ReadAllText(tournamentFile));
            var places = new[] { 1, 2, 3, 4 };
            for (var i = 0; i < tournament.Races.Length - 3; i++)
            {
                var race = tournament.Races[i];
                if (!race.IsFinished())
                {
                    places = places.RandomOrder().ToArray();
                    Console.WriteLine(JsonConvert.SerializeObject(places));
                    race.Car1.SetPlace(places[0]);
                    race.Car2.SetPlace(places[1]);
                    race.Car3.SetPlace(places[2]);
                    race.Car4.SetPlace(places[3]);
                }
            }
            tournament.Save();
        }

        [Test]
        public void BuildFinals()
        {
            var tournamentName = "Finals - 2015";
            var builder = new TournamentBuilder(tournamentName, @".\Races");
            builder.AddGroup("Finals", 1);
            var tournament = builder.Build();
            Directory.CreateDirectory(Path.Combine(@"C:/Tournaments", tournamentName));
            File.WriteAllText(Path.Combine(@"C:/Tournaments", tournamentName, "tournament.json"),
                JsonConvert.SerializeObject(tournament, Formatting.Indented));
            Console.WriteLine(JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }

        [Test]
        public void BuildTwoCarPlayoff()
        {
            var tournamentName = "2 Car Playoff";
            var builder = new TournamentBuilder(tournamentName, @".\Races");
            builder.AddGroup("2CarPlayoff", 1);
            var tournament = builder.Build();
            Directory.CreateDirectory(Path.Combine(@"C:/Tournaments", tournamentName));
            File.WriteAllText(Path.Combine(@"C:/Tournaments", tournamentName, "tournament.json"),
                JsonConvert.SerializeObject(tournament, Formatting.Indented));
            Console.WriteLine(JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }

        [Test]
        public void BuildThreeCarPlayoff()
        {
            var tournamentName = "Tiger Playoff";
            var builder = new TournamentBuilder(tournamentName, @".\Races");
            builder.AddGroup("3CarPlayoff", "Tiger Playoff", 1);
            var tournament = builder.Build();
            Directory.CreateDirectory(Path.Combine(@"C:/Tournaments", tournamentName));
            File.WriteAllText(Path.Combine(@"C:/Tournaments", tournamentName, "tournament.json"),
                JsonConvert.SerializeObject(tournament, Formatting.Indented));
            Console.WriteLine(JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }


        [Test]
        public void BuildPlayoff()
        {
            var tournamentName = "Tiebreaker";
            var builder = new TournamentBuilder(tournamentName, @".\Races");
            builder.AddGroup("2CarPlayoff", "Sibling Playoff", 1);
            var tournament = builder.Build();
            Directory.CreateDirectory(Path.Combine(@"C:/Tournaments", tournamentName));
            File.WriteAllText(Path.Combine(@"C:/Tournaments", tournamentName, "tournament.json"),
                JsonConvert.SerializeObject(tournament, Formatting.Indented));
            Console.WriteLine(JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }

        public event Action events = () => { };
        [Test]
        public void TestIter()
        {
            for (int i = 0; i < 10; i++)
            {
                events += () => Console.WriteLine((++i).ToString());
            }

            events();
        }
    }

}
