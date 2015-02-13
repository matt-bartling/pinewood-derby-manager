using System;
using System.Net;
using System.Net.Http;

namespace Utils.Web.Api
{
    public class ApiResponse
    {

        public ApiResponse(bool success, String errorMsg = null)
        {
            Success = success;
            Error = errorMsg;
        }

        public static ApiResponse Create(bool success, String errorMsg = null)
        {
            return new ApiResponse(success, errorMsg);
        }

        public static ApiResponse<T> Create<T>(bool success, T content, String errorMsg = null)
        {
            return new ApiResponse<T>(success, content, errorMsg);
        }

        public static HttpResponseMessage SuccessResponse(HttpRequestMessage request)
        {
            return request.CreateResponse(HttpStatusCode.OK, Create(true));
        }

        public static HttpResponseMessage SuccessResponse<T>(HttpRequestMessage request, T content)
        {
            return request.CreateResponse(HttpStatusCode.OK, Create(true, content));
        }

        public static HttpResponseMessage ErrorResponse(HttpRequestMessage request, HttpStatusCode statusCode, String error = null)
        {
            return request.CreateResponse(statusCode, Create(false, error));
        }

        public static HttpResponseMessage ErrorResponse<T>(HttpRequestMessage request, HttpStatusCode statusCode, String error, T content)
        {
            return request.CreateResponse(statusCode, Create(false, content, error));
        }

        public bool Success { get; private set; }

        public String Error { get; set; }

    }

    public class ApiResponse<T> : ApiResponse
    {

        public ApiResponse(bool success, T content, String error = null)
            : base(success, error)
        {
            Content = content;
        }

        public T Content { get; private set; }

    }
}
