export interface IArticle {
    headline : String;
    url : String;
    stocks : IStock[];
    scrapeDate : String;
}


export interface IStock{
    symbol: string;
    text : string;
}