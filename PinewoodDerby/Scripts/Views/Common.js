/// <reference path="../typings/knockout/knockout.d.ts"/>
/// <reference path="../typings/moment/moment.d.ts"/>
define(["require", "exports"], function(require, exports) {
    var ApiResponse = (function () {
        function ApiResponse() {
        }
        return ApiResponse;
    })();
    exports.ApiResponse = ApiResponse;

    var UploadData = (function () {
        function UploadData(data) {
            this.Data = data;
        }
        return UploadData;
    })();
    exports.UploadData = UploadData;
});
