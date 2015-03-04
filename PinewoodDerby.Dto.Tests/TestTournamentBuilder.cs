using System;
using System.IO;
using Newtonsoft.Json;
using NUnit.Framework;

namespace PinewoodDerby.Dto.Tests
{
    [TestFixture]
    public class TestTournamentBuilder
    {
        [Test]
        public void Build()
        {
            var tournamentName = "Pack 125 - 2015";
            var builder = new TournamentBuilder(tournamentName, @".\Races");
            builder.AddGroup("Scouts", true);
            builder.AddGroup("Siblings");
            builder.AddGroup("Heavyweight");
            var tournament = builder.Build();
            Directory.CreateDirectory(Path.Combine(@"C:/Tournaments", tournamentName));
            File.WriteAllText(Path.Combine(@"C:/Tournaments", tournamentName, "tournament.json"),
                JsonConvert.SerializeObject(tournament, Formatting.Indented));
            Console.WriteLine(JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }

        [Test]
        public void BuildFinals()
        {
            var tournamentName = "Finals - 2015";
            var builder = new TournamentBuilder(tournamentName, @".\Races");
            builder.AddGroup("Finals");
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
            builder.AddGroup("2CarPlayoff");
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
            builder.AddGroup("3CarPlayoff", "Tiger Playoff");
            var tournament = builder.Build();
            Directory.CreateDirectory(Path.Combine(@"C:/Tournaments", tournamentName));
            File.WriteAllText(Path.Combine(@"C:/Tournaments", tournamentName, "tournament.json"),
                JsonConvert.SerializeObject(tournament, Formatting.Indented));
            Console.WriteLine(JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }
    }
}
