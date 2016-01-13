using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Utils.TypeScript;

namespace PinewoodDerby.Dto
{
    [TypeScriptModule("de")]
    public class Participant
    {
        public static Participant Bye
        {
            get { return new Participant { EntryName = "Bye", Name = "Bye", Rank = "" }; }
        }

        public string Name { get; set; }
        public string EntryName { get; set; }
        public string Rank { get; set; }
    }

    [TypeScriptModule("de")]
    public class SeededParticipant
    {
        public int Seed { get; set; }
        public Participant Participant { get; set; }
    }

    [TypeScriptModule("de")]
    public class DoubleElminiationTournament
    {
        public List<Game> Games { get; set; }
    }

    [TypeScriptModule("de")]
    public class Game
    {
        public int Round { get; set; }
        public int GameNumber { get; set; }
        public SeededParticipant P1 { get; set; }
        public SeededParticipant P2 { get; set; }
        public Participant Winner { get; set; }
        public ParticipantSource P1Source { get; set; }
        public ParticipantSource P2Source { get; set; }
    }

    [TypeScriptModule("de")]
    public class ParticipantSource
    {
        public int GameNumber { get; set; }
        public WinnerOrLoser WinnerOrLoser { get; set; }
    }

    [TypeScriptModule("de")]
    public enum WinnerOrLoser
    {
        Winner = 1,
        Loser = 0
    }
}
