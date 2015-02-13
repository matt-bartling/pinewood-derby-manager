using System.IO;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using AttributeRouting.Web.Http;
using Newtonsoft.Json;
using PinewoodDerby.Dto;
using Utils.Web.Api;

namespace PinewoodDerby.Controllers.API
{
    [RoutePrefix("/api/derbymanager")]
    public class DerbyManagerController : ApiController
    {
        [GET("gettournament")]
        public HttpResponseMessage GetTournament()
        {
            var tournament =
                JsonConvert.DeserializeObject<Tournament>(File.ReadAllText(@"C:\Tournaments\Pack 125 - 2015\tournament.json"));
            return ApiResponse.SuccessResponse(Request, tournament);
        }

        [POST("savetournament")]
        public HttpResponseMessage SaveTournament(Tournament tournament)
        {
            File.WriteAllText(@"C:\Tournaments\Pack 125 - 2015\tournament.json", JsonConvert.SerializeObject(tournament, Formatting.Indented));
            return ApiResponse.SuccessResponse(Request);
        }
    }
}