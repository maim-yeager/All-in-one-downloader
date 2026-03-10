module.exports = function sortFormats(formats) {

  const qualityRank = {
    "4320": 8,
    "2160": 7,
    "1440": 6,
    "1080": 5,
    "720": 4,
    "480": 3,
    "360": 2,
    "240": 1
  }

  return formats.sort((a, b) => {
    const qa = qualityRank[a.height] || 0
    const qb = qualityRank[b.height] || 0
    return qb - qa
  })

}
