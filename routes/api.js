'use strict';

const bcrypt = require('bcrypt');
const axios = require('axios');
const mongoose = require('mongoose');

// Define constants
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt
const STOCK_API_URL = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock';
const COLLECTION_NAME = 'stock-price-checker';

// Define the schema and model for likes
const likeSchema = new mongoose.Schema({
  ipHash: { type: String, required: true },
  stock: { type: String, required: true }
}, { collection: COLLECTION_NAME });

const Like = mongoose.model('Like', likeSchema);

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const stocks = req.query.stock;
        const like = req.query.like === 'true';

        if (!stocks) {
          return res.status(400).json({ error: 'Stock symbol(s) are required' });
        }

        const stockSymbols = Array.isArray(stocks) ? stocks : [stocks];

        // Fetch stock prices
        const stockDataPromises = stockSymbols.map(symbol => 
          axios.get(`${STOCK_API_URL}/${symbol}/quote`)
        );

        const stockDataResponses = await Promise.all(stockDataPromises);
        const stockData = stockDataResponses.map(response => response.data);

        // Determine IP hash for current request
        const ip = req.ip;
        const ipHash = await bcrypt.hash(ip, SALT_ROUNDS);

        // Check existing likes for the IP
        const existingLikes = await Like.find({ stock: { $in: stockSymbols } });

        // Check if IP has already liked any of the stocks
        let isAlreadyLiked = false;
        for (let i = 0; i < existingLikes.length; i++) {
          const existingLike = existingLikes[i];
          const match = await bcrypt.compare(ip, existingLike.ipHash);
          if (match) {
            isAlreadyLiked = true;
            break;
          }
        }

        // Save new likes if not already liked
        if (like && !isAlreadyLiked) {
          const newLikes = stockSymbols.map(symbol => new Like({ ipHash, stock: symbol }));
          await Like.insertMany(newLikes);
        }

        // Retrieve the like counts
        const likeCountsPromises = stockSymbols.map(symbol =>
          Like.countDocuments({ stock: symbol })
        );
        const likeCounts = await Promise.all(likeCountsPromises);

        // Build response
        let response;
        if (stockSymbols.length === 1) {
          response = {
            stock: stockData[0].symbol,
            price: stockData[0].latestPrice,
            likes: likeCounts[0]
          };
        } else {
          response = stockData.map((data, index) => ({
            stock: data.symbol,
            price: data.latestPrice,
            rel_likes: likeCounts[index] - likeCounts[(index + 1) % 2]
          }));
        }

        res.json({ stockData: response });

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
};
