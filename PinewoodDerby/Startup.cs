using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(PinewoodDerby.Startup))]

namespace PinewoodDerby
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
        }
    }
}