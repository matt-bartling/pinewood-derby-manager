using System.Web.Mvc;

namespace PinewoodDerby.Controllers.MVC
{
    public class TournamentManagerController : Controller
    {
        // GET: TournamentManager
        public ActionResult Index()
        {
            return View("TournamentView");
        }
    }
}