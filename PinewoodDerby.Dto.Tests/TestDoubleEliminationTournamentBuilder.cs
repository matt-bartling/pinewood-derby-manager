using System;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using NUnit.Framework;

namespace PinewoodDerby.Dto.Tests
{
    [TestFixture]
    public class TestDoubleEliminationTournamentBuilder
    {
        [Test]
        public void TestBuild()
        {
        var numEntries = 16;
            var entries = new List<Participant>();
            for (int i = 1; i <= numEntries; i++)
            {
                entries.Add(new Participant
                {
                    EntryName = i.ToString(),
                    Name = i.ToString(),
                    Rank = "A"
                });
            }
            var builder = new DoubleEliminationTournamentBuilder("name").SetEntries(entries);
            var tournament = builder.Build();
            Directory.CreateDirectory(@"C:\tournaments\double-elimination");
            File.WriteAllText(@"C:\tournaments\double-elimination\example.json", JsonConvert.SerializeObject(tournament));
        }
    }
}
