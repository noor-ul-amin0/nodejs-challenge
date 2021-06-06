const router = require("express").Router();
const $ = require("cheerio");
const fetch = require("node-fetch");
const async = require("async");
const RSVP = require("rsvp");
const e = require("express");

const isUrl = (string) => {
  try {
    return Boolean(new URL(string));
  } catch (e) {
    console.log(e);
    return false;
  }
};

router.get("/", async function (req, res) {
  const { address = [] } = req.query;
  const urls = Array.isArray(address) ? address : [address];
  //================================================================================
  // Check address is empty ?
  if (!urls.length) return res.render("index", { links: [] });
  //================================================================================
  // 1. using Node.js Callback Control flow.
  usingNodejsCallback(urls, (links) => res.render("index", { links }));
  //================================================================================
  //   2. using async.js Control flow.
  // usingAsyncLib(urls, (links) => res.render("index", { links }));
  //================================================================================

  // 3. using RSVP.js Control flow.
  // usingRSVPLib(urls).then((links) => {
  //   return res.render("index", { links });
  // });
  // ================================================================================
});

function usingNodejsCallback(urls, cb) {
  const result = [];
  let count = 0;
  urls.forEach((link) => {
    count++;
    if (!isUrl(link)) {
      result.push({ url: link, title: "NO RESPONSE" });
      if (count === result.length) {
        cb(result);
      }
    } else
      fetch(link, { method: "GET" })
        .then(function (response) {
          console.log(response);
          if (response.status === 404) {
            result.push({ url: link, title: "NO RESPONSE" });
            if (count === result.length) {
            }
            cb(result);
          }
          if (response.status === 200) {
            response
              .text()
              .then(function (text) {
                const html = $.load(text);
                const title = html("title").text();
                result.push({ url: link, title });
                if (count === result.length) {
                  cb(result);
                }
              })
              .catch((err) => console.log(err.message));
          }
        })
        .catch(function (err) {
          console.log(err);
          if (err.code === "ENOTFOUND") {
            result.push({ url: link, title: "NO RESPONSE" });
            if (urls.length === 1) {
              cb(result);
            }
          }
          // console.log("An error occurred: " + err);
        });
  });
}
function usingAsyncLib(urls, cb) {
  async.map(
    urls,
    function (url, callback) {
      fetch(url, { method: "GET" })
        .then(function (response) {
          if (response.status === 200) {
            response.text().then(function (text) {
              const html = $.load(text);
              const title = html("title").text();
              callback(null, { url, title });
            });
            // .catch((err) => console.log(err.message));
          }
        })
        .catch(function (err) {
          if (err.code === "ENOTFOUND") {
            callback(null, { url, title: "NO RESPONSE" });
          }
          // console.log("An error occurred: " + err);
        });
    },
    function (err, results) {
      if (err) {
        console.log("Final callback error: ", err);
      } else cb(results);
    }
  );
}
function usingRSVPLib(urls) {
  const responses = urls.map((url) => {
    return new RSVP.Promise(function (resolve, reject) {
      fetch(url, { method: "GET" })
        .then((response) => {
          if (response.status !== 200)
            resolve({ url: response.url, title: "NO RESPONSE" });
          response
            .text()
            .then((text) => {
              const html = $.load(text);
              const title = html("title").text();
              resolve({ url: response.url, title });
            })
            .catch((error) => {
              resolve({ url: response.url, title: "NO RESPONSE" });
            });
        })
        .catch((error) => {
          const message = error.message.split(" ");
          const url = message[message.length - 1];
          resolve({
            url,
            title: "NO RESPONSE",
          });
        });
    });
  });

  return RSVP.all(responses);
}
module.exports = router;
