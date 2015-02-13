using System;

namespace Utils.TypeScript
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum | AttributeTargets.Interface)]
    public class TypeScriptModuleAttribute : Attribute
    {
        private readonly string _moduleName;

        public TypeScriptModuleAttribute(string moduleName)
        {
            _moduleName = moduleName;
        }
    }
}
