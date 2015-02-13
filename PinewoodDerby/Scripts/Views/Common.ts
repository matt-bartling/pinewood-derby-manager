/// <reference path="../typings/knockout/knockout.d.ts"/> 
/// <reference path="../typings/moment/moment.d.ts"/>

export class ApiResponse<T>
{
    Success: boolean;
    Error: string;
    Content: T;
}

export class UploadData {
    constructor(data: string) {
        this.Data = data;
    }

    Data: string;
}
 