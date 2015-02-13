/// <reference path="../typings/knockout/knockout.d.ts"/> 
/// <reference path="../typings/moment/moment.d.ts"/>

export class DateHelper {
    constructor(date: Date) {
        this.Date = date;
    }

    PriorWeekday() {
        return moment(this.Date).day() == 1 ? moment().subtract('days', 3).toDate() : moment().subtract('days', 1).toDate();
    }

    Date: Date;
}

export class ApiResponse<T>
{
    Success: boolean;
    Error: string;
    Content: T;
}

export class OPXLReport<T>
{
    Key: string;
    Records: T[];
}

export class IsoOrder
{
    Exchange: string;
    OrderExchange: string;
    OrderMark: string;
    OrderTime: string;
    OrderPrice: number;
    OrderQuantity: number;
    BestQuoteExchange: string;
    BestQuoteTime: string;
    BestQuotePrice: number;
    BestQuoteQuantity: number;
}

export class Routes
{
    constructor(baseUrl: string)
    {   
        this.BaseUrl = baseUrl;
    }

    public Warnings(fromDate: Date, toDate: Date, exchange: string, reportName: string) {
        return this.BaseUrl + "api/dashboard/warnings?reportName=" + reportName + "&fromDate=" + moment(fromDate).format("M/D/YYYY") + "&toDate=" + moment(toDate).format("M/D/YYYY") + "&exchange=" + exchange;
    }

    BaseUrl: string;
}

export class ComplianceDbRow
{
    SourceApp: string;
    SystemTimeUtc: string;
    ExchangeTimeUtc: string;
    TradingDesk: string;
    EventType: string;
    Exchange: string;
    Symbol: string;
    SymbolType: string;
    Quantity: number;
    RemainingQuantity: number;
    Price: number;
    OrderType: string;
    TimeInForce: string;
    Mark: string;
    SystemOrderId: string;
    SystemOriginalOrderId: string;
    SystemSequenceNum: string;
    ExchangeOrderId: string;
    ExchangeSequenceNum: string;
    ExchangeUniqueEventId: string;
    ExchangeMatchId: string;
    ClearingFirm: string;
    ClearingAccount: string;
    TraderUsername: string;
    TraderTag50: string;
    ClientKnownPosition: number;
    ClientKnownWorkingSells: number;
    RawMessage: string;
}

export interface IEditable
{
    IsEditable: KnockoutObservable<boolean>;
    ShowEditIcon: KnockoutObservable<boolean>;
}

export class EditableField<T> implements IEditable
{
    constructor(value: T, isEditable: boolean = false)
    {
        this.Value = ko.observable(value);
        this.IsEditable = ko.observable(isEditable);
    }

    Value: KnockoutObservable<T>;
    IsEditable: KnockoutObservable<boolean>;
    ShowEditIcon = ko.observable(false);

    IsEmpty()
    {
        return this.Value() == null || this.Value() == undefined;
    }
}

export class EditableArrayField<T> implements IEditable
{
    constructor(value: T[], isEditable: boolean = false)
    {
        this.Value = ko.observableArray(value);
        this.IsEditable = ko.observable(isEditable);
    }

    Value: KnockoutObservableArray<T>;
    IsEditable: KnockoutObservable<boolean>;
    ShowEditIcon = ko.observable(false);

    IsEmpty()
    {
        return this.Value() == null || this.Value() == undefined || this.Value().filter((x: T) => x != null).length == 0;
    }

    private PrettyValue() {
        return this.Value().join('\n');
    }
}

export class CheckboxContext<T>
{
    constructor(value: T, isChecked: boolean = false, isSelectable: boolean = true)
    {
        this.Value = ko.observable(value);
        this.IsChecked = ko.observable(isChecked);
        this.IsSelectable = ko.observable(isSelectable);
    }

    Value: KnockoutObservable<T>;
    IsChecked: KnockoutObservable<boolean>;
    IsSelectable: KnockoutObservable<boolean>;
}

export class TradingDesk
{
    constructor(name: string, id: string)
    {
        this.Name = name;
        this.ID = id;
    }

    Name: string;
    ID: string;
}

export class PersonOnDesk {
    UserName: string;
    DeskName: string;
    DeskId : string;
}

export class Employee
{
    FirstName: string;
    LastName: string;
    JobTitle: string;
    Location: string;
    Status: string;
    ID: string;
    UserName: string;
    Supervisor: string;
    EmploymentStart: string;
    EmploymentEnd: string;
}

export class TraderInfo {
    ID: string;
    TraderId: string;
    UserName: string;
    Country: string;
    FirmIds: string[];
    ClearingFirmIds: string[];
    UserType: string;
    Acronym: string;
    EffectiveDate: string;
    TradeFirmName: string;
    IsAutomatedTradingSystem: string;
    Exchanges: string[];
    Platforms: string[];
    TeamTag = false;
    Notes: string;
    IsActive = false;
    IsReadOnly = false;
    DeskIds: string[];
    Identifier: string;
    FeeIndicator: string;
    WindowsId: string;
}

export class ClearingAccount {
    ID: string;
    Name: string;
    FirmName: string;
    FirmId: string;
    SubsidiaryName: string;
    SubsidiaryId: string;
    Status: string;
    AccountType: string;
    InterestType: string;
    TaxStatus: string;
    RegulatoryAuthority: string;
}

export class WashReportWatchListEntry {
   
    ID: string;
    Name: string;
    LeftTraderTags: string[];
    RightTraderTags: string[];
}

export class Constants
{
    public static Countries = ["USA", "GB", "CANADA"];
    public static Locations = ["USIL", "USNY", "USCT", "CAQU", "GB"];
    public static FirmIds = ["574", "560", "319", "708", "714"];

    public static ClearingFirmNames = [
        "ABN AMRO Clearing Chicago, LLC (Fortis)/574",
        "Bank of America/560",
        "BNP Paribas Securities Corp/319",
        "Goldman Sachs Execution & Clearing, L.P./708",
        "Goldman Sachs Execution & Clearing, L.P./741",
        "Newedge USA, LLC/714"
    ];

    public static UserTypes = [
        "Clearing Member Firm Trader",
        "Clerk for Member",
        "Permit Holder - CBOE",
        "Member - CME",
        "Member - CBOT",
        "Member - NYMEX",
        "Member - COMEX",
        "Member - ICE"
    ];

    public static TradeFirmNames = [
        "",
        "DRW Commodities, LLC",
        "DRW Commodities, LLC - RRO",
        "DRW EMM, LLC",
        "DRW Execution Services, LLC",
        "DRW Investments (UK), LTD",
        "DRW Investments, LLC",
        "DRW Investments, LLC -UK Branch",
        "DRW Securities, LLC",
        "DRW Strategies, LLC",
        "Vigilant Futures, LLC"
    ];

    public static Exchanges = [
        "AEX",
        "AMEX",
        "ARCA",
        "ARCX",
        "BALTEXe",
        "BATS",
        "BYX",
        "BZX",
        "BMF",
        "BOS",
        "C2",
        "CAES",
        "CBOE",
        "CBT",
        "CBOT",
        "CCFE",
        "CCX",
        "CDE",
        "CFE",
        "CHIX",
        "CHIXC",
        "CHX",
        "CME",
        "COMEX",
        "CSE",
        "DCE",
        "DME",
        "DMI",
        "EDGA",
        "EDGX",
        "ELX",
        "EMD",
        "ERIS",
        "EUREX",
        "HKFE",
        "ICE",
        "ICE_IPE",
        "ICE ED",
        "ICE US",
        "ICE Canada",
        "ICE Europe",
        "ICE OTC",
        "ISX",
        "KCBT",
        "KFE",
        "KRX",
        "LIFFE",
        "LIFFE Brussels",
        "LIFFE Lisbon",
        "LIFFE London",
        "LIFFE Paris",
        "LIS",
        "MATIF",
        "ME",
        "MEFF",
        "MGE",
        "MX",
        "NASDAQ",
        "NLX",
        "NYL",
        "NYMEX",
        "NYSE",
        "NYSE LIFFE US (ECBOT)",
        "OSE",
        "OSL",
        "PHL",
        "PHLX",
        "SAF",
        "SFE",
        "SGX",
        "STO",
        "TAIFEX",
        "TFEX",
        "TFX",
        "TSE",
        "TSX",
        "WAR",
        "WBAH"

    ];

    public static Platforms = [
        "ARSENAL",
        "ARSENAL COMMODITIES",
        "AUTOBAHN",
        "BARX",
        "BBG FX Go",
        "BEEFALO",
        "BEEFALO WEB",
        "BGC TRADER",
        "BLOOMBERG TRADEBOOK",
        "BNP PB DataDirect",
        "BONDS.COM",
        "BROKERTEC",
        "CBOE Market Replay",
        "CHELSEA",
        "CITI VELOCITY",
        "CLEARPORT",
        "Corsair",
        "Credit Suisse Crossfinder",
        "CREDIT SUISSE PRIME TRADE",
        "CS ONYX/PRIMETRADE",
        "CTS",
        "Domino",
        "DORQ (Day OrdeR Quoter)",
        "EMMETT",
        "EOS",
        "Eris Block Box Broker",
        "Eris Block Box GUI",
        "Eris Swap Book GUI",
        "ESPEED",
        "ESQUILEGS",
        "ESQUILEGS1",
        "ESQUILEGS2",
        "ESQUILEGS3",
        "FILLER",
        "FIRMSOFT",
        "FSH",
        "GARBAN",
        "GOLDMAN 360",
        "GS Marquee Trader",
        "GS REDI",
        "HMX",
        "Hotspot FX",
        "ICAP EM",
        "ICE Block",
        "IRIS",
        "ITM",
        "JPM MORGAN DIRECT",
        "KNIGHT BONDPOINT",
        "LYNX",
        "LYNX.IS",
        "MARKETAXESS",
        "MM2",
        "MORGAN STANLEY MATRIX",
        "MorQ",
        "NET ENERGY",
        "OBERON",
        "OCX.BETS",
        "OPTX",
        "ORC",
        "ORC enabled with LIQUIDATOR",
        "REDI",
        "RTS",
        "SHADOWFAX",
        "SNEAGLE",
        "SNEAGLE - QUOTER",
        "SNEAGLE - SNIPER",
        "SNEAGLE - WHAM",
        "SOC GEN - ALPHA FX",
        "SOC GEN ALPHA FX",
        "SONIC",
        "SPIDERROCK",
        "STELLAR",
        "STELLAR QUANTUM",
        "STERLING TRADER",
        "SWAPX QUOTER",
        "TETHYS",
        "TRADEWEB",
        "Tradeweb SEF",
        "TT",
        "TT.NET",
        "TT Algo Design Lab",
        "UBS PIN",
        "VIX TAS",
        "WebICE",
        "WEX",
        "YJ ENABLED W/ WEBICE"
    ];

    public static UsageFrequencies = [
        "Daily",
        "Sometimes",
        "Rarely",
        "Never"
    ];

    public static ContentTypes = [
        "TextFix",
        "TextCsv",
        "TextJson",
        "TextOther",
        "Binary"
    ];
}

export class UploadData
{
    constructor(data: string) {
        this.Data = data;
    }

    Data: string;
}
