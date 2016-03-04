using System;
using System.IO;
using System.Net.Http;
using System.Web.Http;
using AttributeRouting.Helpers;
using AttributeRouting.Web.Http;
using Newtonsoft.Json;
using PinewoodDerby.Dto;
using Utils.Web.Api;

namespace PinewoodDerby.Controllers.API
{
    [RoutePrefix("api/derbymanagertest")]
    public class DerbyManagerTestController : ApiController
    {
        [POST("savetournament")]
        public HttpResponseMessage SaveTournament(Tournament tournament)
        {
            tournament.Update();
            File.WriteAllText(@"C:\Tournaments\{0}\tournament.{1}.json".FormatWith(tournament.Name, DateTime.Now.ToString("yyyyMMdd-hhmmss")), JsonConvert.SerializeObject(tournament, Formatting.Indented));
            File.WriteAllText(@"C:\Tournaments\{0}\tournament.json".FormatWith(tournament.Name), JsonConvert.SerializeObject(tournament, Formatting.Indented));
            return ApiResponse.SuccessResponse(Request, tournament);
        }
    }
}