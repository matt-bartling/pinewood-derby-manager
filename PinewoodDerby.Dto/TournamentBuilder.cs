using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Utils.Csv;

namespace PinewoodDerby.Dto
{
    public class TournamentBuilder
    {
        public string TournamentName { get; private set; }
        private readonly string _baseGroupDirectory;
        private readonly List<Tuple<Group, GroupRacesDefinition[]>> _groups = new List<Tuple<Group, GroupRacesDefinition[]>>();

        public TournamentBuilder(string tournamentName, string baseGroupDirectory)
        {
            TournamentName = tournamentName;
            _baseGroupDirectory = baseGroupDirectory;
        }

        public void AddGroup(Group group, GroupRacesDefinition[] races)
        {
            _groups.Add(new Tuple<Group, GroupRacesDefinition[]>(group, races));
        }

        public void AddGroup(string folder, bool showClassStandings = false)
        {
            _AddGroup(folder, folder, false);
        }

        public void AddGroup(string folder, string groupName, bool showClassStandings = false)
        {
            _AddGroup(folder, groupName, showClassStandings);
        }

        private void _AddGroup(string folder, string groupName = null, bool showClassStandings = false)
        {
            groupName = groupName ?? folder;
            var cars = CsvParser.ParseArray<Car>(Path.Combine(_baseGroupDirectory, folder, "cars.csv"));
            var races = CsvParser.ParseArray<GroupRacesDefinition>(Path.Combine(_baseGroupDirectory, folder, "races.csv"));
            var group = new Group {Cars = cars.ToArray(), Name = groupName, ShowClassStandings = showClassStandings};
            _groups.Add(new Tuple<Group, GroupRacesDefinition[]>(group, races.ToArray()));
        }

        public Tournament Build()
        {
            var races = new SortedList<double, Race>();
            var groups = new List<Group>();
            for (var groupIndex = 0; groupIndex < _groups.Count; groupIndex++)
            {
                var group = _groups[groupIndex];
                groups.Add(group.Item1);
                var carsByNumber = group.Item1.Cars.ToDictionary(c => c.Number);
                var length = group.Item2.Length;
                for (var i = 0; i < length; i++)
                {
                    var offset = (groupIndex+1)/1000.0;
                    var pctDoneBefore = ((double) i)/length + offset;
                    var pctDoneAfter = ((double) i + 1)/length - offset;
                    var pctDone = pctDoneBefore >= 0.5 ? pctDoneBefore : pctDoneAfter;
                    var raceDef = group.Item2[i];
                    var race = new Race
                    {
                        Group = group.Item1.Name,
                        Car1 = carsByNumber[raceDef.Lane1],
                        Car2 = carsByNumber[raceDef.Lane2],
                        Car3 = carsByNumber[raceDef.Lane3],
                        Car4 = carsByNumber[raceDef.Lane4],
                    };
                    races.Add(pctDone, race);
                }
            }

            var raceList = races.Values.ToArray();
            for (var i = 0; i < raceList.Length; i++)
            {
                raceList[i].RaceNumber = i + 1;
            }

            var tournament = new Tournament {Groups = groups.ToArray(), Races = raceList.ToArray(), Name = TournamentName};
            return tournament;
        }
    }
}
