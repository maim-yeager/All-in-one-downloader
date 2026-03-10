require("dotenv").config()

const express = require("express")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const ytdlp = require("youtube-dl-exec")
const axios = require("axios")

const detectPlatform = require("./utils/detectPlatform")
const sortFormats = require("./utils/formatSorter")
const validateUrl = require("./utils/validateUrl")

const app = express()

app.use(express.json())

app.use(cors({
  origin: "*"
}))

/* ===========================
   API KEY AUTH
=========================== */

app.use((req,res,next)=>{

  const key = req.headers["x-api-key"]

  if(!key || key !== process.env.API_KEY){
    return res.status(401).json({
      success:false,
      error:"Invalid API Key"
    })
  }

  next()

})

/* ===========================
   RATE LIMIT
=========================== */

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX
})

app.use(limiter)

/* ===========================
   EXTRACT MEDIA
=========================== */

app.post("/api/extract", async (req,res)=>{

  try{

    const { url } = req.body

    if(!url){
      return res.json({
        success:false,
        error:"URL required"
      })
    }

    if(!validateUrl(url)){
      return res.json({
        success:false,
        error:"Invalid URL"
      })
    }

    const platform = detectPlatform(url)

    if(platform === "unknown"){
      return res.json({
        success:false,
        error:"Unsupported platform"
      })
    }

    const info = await ytdlp(url,{
      dumpSingleJson:true,
      noWarnings:true,
      noCallHome:true,
      preferFreeFormats:true
    })

    if(info.entries){

      const items = await Promise.all(info.entries.map(async item => {

        const formats = sortFormats(item.formats)

        const bestFormats = formats
          .filter(f=>f.vcodec !== "none")
          .slice(0,5)
          .map(f=>({
            quality: `${f.height}p`,
            type:"video",
            url:f.url
          }))

        return {
          title:item.title,
          thumbnail:item.thumbnail,
          duration:item.duration,
          formats:bestFormats
        }

      }))

      return res.json({
        success:true,
        platform,
        mediaItems:items
      })

    }

    const formats = sortFormats(info.formats)

    const videoFormats = formats
      .filter(f => f.vcodec !== "none")
      .slice(0,5)
      .map(f=>({
        quality:`${f.height}p`,
        type:"video",
        url:f.url
      }))

    const audioFormat = formats
      .find(f=>f.acodec !== "none")

    if(audioFormat){
      videoFormats.push({
        quality:"audio",
        type:"audio",
        url:audioFormat.url
      })
    }

    res.json({
      success:true,
      platform,
      title:info.title,
      thumbnail:info.thumbnail,
      duration:info.duration,
      formats:videoFormats
    })

  }catch(err){

    console.error(err)

    res.json({
      success:false,
      error:"Media extraction failed"
    })

  }

})

/* ===========================
   THUMBNAIL
=========================== */

app.get("/api/thumbnail", async (req,res)=>{

  try{

    const { url } = req.query

    if(!url){
      return res.json({
        success:false,
        error:"URL required"
      })
    }

    const info = await ytdlp(url,{
      dumpSingleJson:true
    })

    res.json({
      success:true,
      thumbnail:info.thumbnail
    })

  }catch(err){

    res.json({
      success:false,
      error:"Thumbnail fetch failed"
    })

  }

})

/* ===========================
   HEALTH CHECK
=========================== */

app.get("/health",(req,res)=>{

  res.json({
    status:"ok"
  })

})

/* ===========================
   START SERVER
=========================== */

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`)
})
