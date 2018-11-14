
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let ArticleModel = new Schema({
  headline: String,
  url: String,
  stocks: [{symbol: String, text: String}],
  scrapeDate: { type: Date, default: Date.now }
});

export default mongoose.model('ArticleModel', ArticleModel);