using System.IO;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json;
using PinewoodDerby.Dto;
using Utils.Web.Api;

namespace PinewoodDerby.Controllers.API
{
    [RoutePrefix("api/tournamentmanager")]
    public class TournamentManagerController : ApiController
    {
        [HttpGet]
        [Route("gettournament")]
        public HttpResponseMessage GetTournament()
        {
            var tournament =
                JsonConvert.DeserializeObject<DoubleElminiationTournament>(File.ReadAllText(@"C:\Tournaments\double-elimination\example.json"));
            return ApiResponse.SuccessResponse(Request, tournament);
        }
    }
}
