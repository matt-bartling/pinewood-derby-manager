using System;
using System.Collections.Generic;
using System.Linq;
using Utils.Csv;
using Utils.TypeScript;

namespace PinewoodDerby.Dto
{
    [TypeScriptModule("pinewoodderby")]
    public class Tournament
    {
        public string Name { get; set; }
        public Group[] Groups { get; set; }
        public Race[] Races { get; set; }
        public GroupStandings[] Standings { get; set; }
        public LaneStat[] LaneStats { get; set; }

        public Tournament()
        {
            Standings = new GroupStandings[0];
        }
    }

    [TypeScriptModule("pinewoodderby")]
    public class GroupStandings
    {
        public string Round { get; set; }
        public string Group { get; set; }
        public GroupStandingsRow[] StandingsRows { get; set; }
    }

    [TypeScriptModule("pinewoodderby")]
    public class GroupStandingsRow
    {
        public Car Car { get; set; }
        public int FirstPlaceFinishes { get; set; }
        public int SecondPlaceFinishes { get; set; }
        public int ThirdPlaceFinishes { get; set; }
        public int FourthPlaceFinishes { get; set; }
        public int RacesRemaining { get; set; }
        public int TotalRaces { get; set; }
        public int Points { get; set; }
        public int Place { get; set; }

        public GroupStandingsRow Copy()
        {
            return new GroupStandingsRow
            {
                Car = Car,
                FirstPlaceFinishes = FirstPlaceFinishes,
                SecondPlaceFinishes = SecondPlaceFinishes,
                ThirdPlaceFinishes = ThirdPlaceFinishes,
                FourthPlaceFinishes = FourthPlaceFinishes,
                TotalRaces = TotalRaces,
                RacesRemaining = RacesRemaining,
                Points = Points,
                Place = Place,
            };
        }
    }

    [TypeScriptModule("pinewoodderby")]
    public class Group
    {
        public string Name { get; set; }
        public string Round { get; set; }
        public string TiebreakGroup { get; set; }
        public Car[] Cars { get; set; }
        public bool ShowClassStandings { get; set; }
    }

    [TypeScriptModule("pinewoodderby")]
    public class Race
    {
        public string Round { get; set; }
        public string Group { get; set; }
        public int RaceNumber { get; set; }
        public RaceResult Car1 { get; set; }
        public RaceResult Car2 { get; set; }
        public RaceResult Car3 { get; set; }
        public RaceResult Car4 { get; set; }
    }

    [TypeScriptModule("pinewoodderby")]
    public class RaceResult
    {
        public Car Car { get; set; }
        public int Place { get; set; }
        public int Points { get; set; }
    }

    [TypeScriptModule("pinewoodderby")]
    public class FinalStandingsGroup
    {
        public string Group { get; set; }
        public FinalStandingRow[] Rows { get; set; }
    }

    [TypeScriptModule("pinewoodderby")]
    public class FinalStandingRow
    {
        public Car Car { get; set; }
        public int Place { get; set; }
        public int Points { get; set; }
    }

    [TypeScriptModule("pinewoodderby")]
    public class Car : IFromCsv
    {
        public int Number { get; set; }
        public string ID { get; set; }
        public string Builder { get; set; }
        public string Name { get; set; }
        public string Class { get; set; }

        public void Fill(string[] strings)
        {
            Number = int.Parse(strings[0]);
            ID = strings[1];
            Builder = strings[2];
            Name = strings[3];
            Class = strings.Length > 4 ? strings[4] : "";
        }

        public Car Copy()
        {
            return new Car
            {
                Number = Number,
                ID = ID,
                Builder = Builder,
                Name = Name,
                Class = Class
            };
        }
    }

    [TypeScriptModule("pinewoodderby")]
    public class LaneStat
    {
        public int LaneNumber { get; set; }
        public int FirstPlaceFinishes { get; set; }
        public int SecondPlaceFinishes { get; set; }
        public int ThirdPlaceFinishes { get; set; }
        public int FourthPlaceFinishes { get; set; }
        public int Points { get; set; }
    }

    [TypeScriptModule("pinewoodderby")]
    public class AvailableTournaments
    {
        public string[] Names { get; set; }
    }

    public class GroupRacesDefinition : IFromCsv
    {
        public int RaceNumber { get; set; }
        public int Lane1 { get; set; }
        public int Lane2 { get; set; }
        public int Lane3 { get; set; }
        public int Lane4 { get; set; }
        public void Fill(string[] strings)
        {
            RaceNumber = int.Parse(strings[0].Trim());
            Lane1 = int.Parse(strings[1].Trim());
            Lane2 = int.Parse(strings[2].Trim());
            Lane3 = int.Parse(strings[3].Trim());
            Lane4 = int.Parse(strings[4].Trim());
        }
    }
}
