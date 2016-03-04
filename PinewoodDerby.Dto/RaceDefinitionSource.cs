using System;
using System.Collections.Generic;
using System.IO;

namespace PinewoodDerby.Dto
{
    public static class RaceDefinitionSource
    {
        public const int Lanes = 4;

        public static GroupRacesDefinition[] RaceDefinitions(int cars, int rounds, LaneStat[] laneStats)
        {
            if (cars == 2) 
            {
                return new[]
                {
                    CreateGroupRaceDefinition(1, 1, 2, 3, 4),
                    CreateGroupRaceDefinition(2, 2, 1, 3, 4),
                };
            }
            if (cars == 3)
            {
                return new[]
                {
                    CreateGroupRaceDefinition(1, 1, 3, 2, 4),
                    CreateGroupRaceDefinition(2, 2, 1, 3, 4),
                    CreateGroupRaceDefinition(3, 3, 2, 1, 4),
                };
            }

            var raceDefPath = String.Format(@"C:\race-definitions\ppn-{0}x{1}x{2}.csv", cars, Lanes, rounds);
            var list = new List<GroupRacesDefinition>();
            if (File.Exists(raceDefPath))
            {
                var raceDefLines = File.ReadAllLines(raceDefPath);
                foreach (var raceDefLine in raceDefLines)
                {
                    var split = raceDefLine.Split('\t');
                    list.Add(CreateGroupRaceDefinition(int.Parse(split[0]), int.Parse(split[1]), int.Parse(split[2]),
                        int.Parse(split[3]), int.Parse(split[4])));
                }
                return list.ToArray();
            }
            var raceDefs = new PartialPerfectNGenerator().Build(cars, rounds);
            for (int i = 0; i < raceDefs.Length; i++)
            {
                list.Add(CreateGroupRaceDefinition(i+1, raceDefs[i][0], raceDefs[i][1], raceDefs[i][2], raceDefs[i][3]));
            }

            return list.ToArray();
        }

        public static GroupRacesDefinition CreateGroupRaceDefinition(int raceNumber, int lane1, int lane2, int lane3,
            int lane4)
        {
            return new GroupRacesDefinition
            {
                RaceNumber = raceNumber,
                Lane1 = lane1,
                Lane2 = lane2,
                Lane3 = lane3,
                Lane4 = lane4
            };
        }
    }
}