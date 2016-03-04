using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using AttributeRouting.Helpers;
using AttributeRouting.Web.Http;
using Newtonsoft.Json;
using PinewoodDerby.Dto;
using Utils.Web.Api;

namespace PinewoodDerby.Controllers.API
{
    [RoutePrefix("api/derbymanager")]
    public class DerbyManagerController : ApiController
    {
        [HttpGet]
        [Route("gettournament")]
        public HttpResponseMessage GetTournament(string name = "test-2016")
        {
            var tournament =
                JsonConvert.DeserializeObject<Tournament>(File.ReadAllText(@"C:\Tournaments\{0}\tournament.json".FormatWith(name)));
            tournament.Update();
            return ApiResponse.SuccessResponse(Request, tournament);
        }

        [POST("savetournament")]
        public HttpResponseMessage SaveTournament(Tournament tournament)
        {
            tournament.Update();
            tournament.Save();
            return ApiResponse.SuccessResponse(Request, tournament);
        }

        [HttpGet]
        [Route("getavailabletournaments")]
        public HttpResponseMessage GetAvailableTournaments()
        {
            var tournements = Directory.GetDirectories(@"C:\Tournaments").Select(d => new DirectoryInfo(d).Name);
            return ApiResponse.SuccessResponse(Request, new AvailableTournaments{Names = tournements.ToArray()});
        }
    }
}