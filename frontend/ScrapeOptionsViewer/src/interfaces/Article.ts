export interface IArticle {
    headline : String;
    url : String;
    stocks : IStock[];
    scrapeDate : String;
    scrapeDateStandard: number;
}


export interface IStock{
    symbol: string;
    text : string;
}